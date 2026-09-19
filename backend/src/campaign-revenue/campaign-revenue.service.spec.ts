import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { CampaignRevenueInput } from '@linktree/types';
import { DatabaseService } from '../database/database.service';
import { CampaignRevenueService } from './campaign-revenue.service';

const input: CampaignRevenueInput = {
  advertisementPriceIqd: 25_000,
  startDate: '2026-09-19',
  endDate: '2026-09-27',
  campaignSpendUsd: 10,
  usdToIqdRate: 1_500,
};

const row = {
  id: '10000000-0000-4000-8000-000000000001',
  linktree_id: '20000000-0000-4000-8000-000000000002',
  advertisement_price_iqd: '25000',
  start_date: '2026-09-19',
  end_date: '2026-09-27',
  campaign_spend_usd: '10.00',
  usd_to_iqd_rate: '1500.0000',
  created_at: '2026-09-19T00:00:00.000Z',
  updated_at: '2026-09-19T00:00:00.000Z',
};

describe('CampaignRevenueService', () => {
  const query = jest.fn<
    Promise<{ rows: Record<string, unknown>[] }>,
    [string, unknown[]?]
  >();
  const service = new CampaignRevenueService({
    query,
  } as unknown as DatabaseService);

  beforeEach(() => query.mockReset());

  it('calculates duration, converted spend, and net revenue on the server', async () => {
    query.mockResolvedValue({ rows: [row] });

    await expect(
      service.create('business-1', row.linktree_id, input),
    ).resolves.toMatchObject({
      durationDays: 8,
      campaignSpendIqd: 15_000,
      netRevenueIqd: 10_000,
    });
    expect(query).toHaveBeenCalledWith(expect.any(String), [
      'business-1',
      row.linktree_id,
      25_000,
      '2026-09-19',
      '2026-09-27',
      10,
      1_500,
    ]);
  });

  it('scopes updates and deletes by business, Linktree, and record', async () => {
    query.mockResolvedValueOnce({ rows: [row] }).mockResolvedValueOnce({
      rows: [{ id: row.id }],
    });

    await service.update('business-1', row.linktree_id, row.id, input);
    await service.delete('business-1', row.linktree_id, row.id);

    expect(query).toHaveBeenNthCalledWith(1, expect.any(String), [
      'business-1',
      row.linktree_id,
      row.id,
      25_000,
      '2026-09-19',
      '2026-09-27',
      10,
      1_500,
    ]);
    expect(query).toHaveBeenNthCalledWith(2, expect.any(String), [
      'business-1',
      row.linktree_id,
      row.id,
    ]);
  });

  it('rejects impossible or reversed calendar dates before querying', async () => {
    await expect(
      service.create('business-1', row.linktree_id, {
        ...input,
        startDate: '2026-02-30',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create('business-1', row.linktree_id, {
        ...input,
        endDate: '2026-09-18',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });

  it('does not expose whether another tenant owns a revenue record', async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(
      service.update('business-1', row.linktree_id, row.id, input),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
