import { ConflictException } from '@nestjs/common';
import { SubdomainPolicyService } from './subdomain-policy.service';
import { mockArg } from '../common/test-utils';

describe('SubdomainPolicyService', () => {
  const database = { query: jest.fn() };
  const service = new SubdomainPolicyService(database as never);
  beforeEach(() => jest.resetAllMocks());

  it('reports invalid and permanently blocked labels without database lookups', async () => {
    await expect(service.availability('-bad')).resolves.toMatchObject({
      available: false,
      reason: 'invalid',
    });
    await expect(service.availability('WWW')).resolves.toMatchObject({
      available: false,
      reason: 'blocked',
    });
    expect(database.query).not.toHaveBeenCalled();
  });

  it.each([
    [true, false, 'blocked'],
    [false, true, 'taken'],
    [false, false, 'available'],
  ])(
    'uses durable block and ownership data (%s, %s)',
    async (blocked, taken, reason) => {
      database.query.mockResolvedValue({ rows: [{ blocked, taken }] });
      await expect(
        service.availability(' Acme ', 'application-id'),
      ).resolves.toEqual({
        subdomain: 'acme',
        available: reason === 'available',
        reason,
      });
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('platform_blocked_subdomains'),
        ['acme', 'application-id'],
      );
      expect(mockArg(database.query, 0, 0)).toContain(
        "'draft', 'pending', 'changes_requested', 'approved'",
      );
    },
  );

  it('exposes the immutable system list and custom blocks separately', async () => {
    database.query.mockResolvedValue({ rows: [{ subdomain: 'support' }] });
    const list = await service.list();
    expect(list.system).toEqual(
      expect.arrayContaining(['www', 'api', 'admin']),
    );
    expect(list.custom).toEqual(['support']);
  });

  it('does not allow adding or removing permanent system reservations', async () => {
    await expect(service.add('api', 'admin-id')).rejects.toThrow(
      'Subdomain is reserved',
    );
    await expect(service.remove('www', 'admin-id')).rejects.toThrow(
      'Subdomain is reserved',
    );
    expect(database.query).not.toHaveBeenCalled();
  });
  it('does not expose duplicate removable entries for newly reserved service labels', async () => {
    database.query.mockResolvedValue({
      rows: [{ subdomain: 'extension' }, { subdomain: 'support' }],
    });
    const list = await service.list();
    expect(list.system).toContain('extension');
    expect(list.custom).toEqual(['support']);
    expect(await service.availability('extension')).toMatchObject({
      available: false,
      reason: 'blocked',
    });
    await expect(service.remove('extension', 'admin')).rejects.toThrow(
      'reserved',
    );
  });

  it('maps assignment races to a safe conflict', async () => {
    database.query.mockRejectedValue({
      code: '23514',
      constraint: 'blocked_subdomain_unassigned',
    });
    await expect(service.add('acme', 'admin-id')).rejects.toThrow(
      ConflictException,
    );
  });

  it('records the administrator in the same statement as a policy mutation', async () => {
    database.query.mockResolvedValue({ rows: [] });
    await service.add(' Support ', 'admin-id');
    expect(database.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('billing_policy_audit_events'),
      ['support', 'admin-id'],
    );
    await service.remove('support', 'admin-id');
    expect(database.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('subdomain.unblocked'),
      ['support', 'admin-id'],
    );
  });
});
