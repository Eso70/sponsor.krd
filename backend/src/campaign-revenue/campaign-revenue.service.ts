import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CampaignRevenueInput,
  CampaignRevenueRecord,
} from '@linktree/types';
import type { QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';

type CampaignRevenueRow = QueryResultRow & {
  id: string | null;
  linktree_id: string;
  advertisement_price_iqd: string;
  start_date: string | Date;
  end_date: string | Date;
  campaign_spend_usd: string;
  usd_to_iqd_rate: string;
  created_at: string | Date;
  updated_at: string | Date;
};

const RETURNING_COLUMNS = `
  id, linktree_id, advertisement_price_iqd, start_date, end_date,
  campaign_spend_usd, usd_to_iqd_rate, created_at, updated_at
`;

function dateOnly(value: string | Date): string {
  return typeof value === 'string'
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
}

function timestamp(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function parseDateOnly(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const parsed = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  const date = new Date(parsed);
  return date.toISOString().slice(0, 10) === value ? parsed : null;
}

@Injectable()
export class CampaignRevenueService {
  constructor(private readonly database: DatabaseService) {}

  private validateDates(input: CampaignRevenueInput): number {
    const start = parseDateOnly(input.startDate);
    const end = parseDateOnly(input.endDate);
    if (start === null || end === null || end < start) {
      throw new BadRequestException('Campaign dates are invalid');
    }
    return Math.round((end - start) / 86_400_000);
  }

  private map(row: CampaignRevenueRow): CampaignRevenueRecord {
    const campaignSpendUsd = Number(row.campaign_spend_usd);
    const usdToIqdRate = Number(row.usd_to_iqd_rate);
    const campaignSpendIqd = Math.round(campaignSpendUsd * usdToIqdRate);
    const advertisementPriceIqd = Number(row.advertisement_price_iqd);
    const startDate = dateOnly(row.start_date);
    const endDate = dateOnly(row.end_date);
    return {
      id: row.id as string,
      linktreeId: row.linktree_id,
      advertisementPriceIqd,
      durationDays: this.validateDates({
        advertisementPriceIqd,
        startDate,
        endDate,
        campaignSpendUsd,
        usdToIqdRate,
      }),
      startDate,
      endDate,
      campaignSpendUsd,
      usdToIqdRate,
      campaignSpendIqd,
      netRevenueIqd: advertisementPriceIqd - campaignSpendIqd,
      createdAt: timestamp(row.created_at),
      updatedAt: timestamp(row.updated_at),
    };
  }

  async list(businessId: string, linktreeId: string) {
    const result = await this.database.query<CampaignRevenueRow>(
      `SELECT r.id, l.id AS linktree_id, r.advertisement_price_iqd,
              r.start_date, r.end_date, r.campaign_spend_usd,
              r.usd_to_iqd_rate, r.created_at, r.updated_at
         FROM linktrees l
         LEFT JOIN campaign_revenue_records r
           ON r.linktree_id = l.id AND r.business_id = l.business_id
        WHERE l.id = $1 AND l.business_id = $2
        ORDER BY r.start_date ASC NULLS LAST, r.created_at ASC NULLS LAST`,
      [linktreeId, businessId],
    );
    if (result.rows.length === 0)
      throw new NotFoundException('Linktree not found');
    return result.rows
      .filter((row) => row.id !== null)
      .map((row) => this.map(row));
  }

  async create(
    businessId: string,
    linktreeId: string,
    input: CampaignRevenueInput,
  ) {
    this.validateDates(input);
    const result = await this.database.query<CampaignRevenueRow>(
      `INSERT INTO campaign_revenue_records (
         business_id, linktree_id, advertisement_price_iqd, start_date,
         end_date, campaign_spend_usd, usd_to_iqd_rate
       )
       SELECT $1, l.id, $3, $4::date, $5::date, $6, $7
         FROM linktrees l
        WHERE l.id = $2 AND l.business_id = $1
       RETURNING ${RETURNING_COLUMNS}`,
      [
        businessId,
        linktreeId,
        input.advertisementPriceIqd,
        input.startDate,
        input.endDate,
        input.campaignSpendUsd,
        input.usdToIqdRate,
      ],
    );
    if (!result.rows[0]) throw new NotFoundException('Linktree not found');
    return this.map(result.rows[0]);
  }

  async update(
    businessId: string,
    linktreeId: string,
    recordId: string,
    input: CampaignRevenueInput,
  ) {
    this.validateDates(input);
    const result = await this.database.query<CampaignRevenueRow>(
      `UPDATE campaign_revenue_records
          SET advertisement_price_iqd = $4,
              start_date = $5::date,
              end_date = $6::date,
              campaign_spend_usd = $7,
              usd_to_iqd_rate = $8
        WHERE id = $3 AND linktree_id = $2 AND business_id = $1
       RETURNING ${RETURNING_COLUMNS}`,
      [
        businessId,
        linktreeId,
        recordId,
        input.advertisementPriceIqd,
        input.startDate,
        input.endDate,
        input.campaignSpendUsd,
        input.usdToIqdRate,
      ],
    );
    if (!result.rows[0])
      throw new NotFoundException('Revenue record not found');
    return this.map(result.rows[0]);
  }

  async delete(businessId: string, linktreeId: string, recordId: string) {
    const result = await this.database.query<{ id: string }>(
      `DELETE FROM campaign_revenue_records
        WHERE id = $3 AND linktree_id = $2 AND business_id = $1
       RETURNING id`,
      [businessId, linktreeId, recordId],
    );
    if (!result.rows[0])
      throw new NotFoundException('Revenue record not found');
  }
}
