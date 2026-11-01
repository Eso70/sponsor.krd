import { ApprovalService } from './approval.service';

describe('approved page pins', () => {
  it('uses the same owner-scoped operation and rejects mixed/invalid payloads', async () => {
    const query = jest
      .fn()
      .mockResolvedValue({ rows: [{ id: 'page', isPinned: true }] });
    const service = new ApprovalService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const execute = (
      service as unknown as {
        executeApprovedMutation: (
          client: unknown,
          input: unknown,
        ) => Promise<void>;
      }
    ).executeApprovedMutation.bind(service);
    const input = {
      businessId: 'owner',
      permission: 'business:linktrees:update',
      resourceId: 'page',
      changes: { isPinned: true },
    };
    await execute({ query }, input);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        'UPDATE linktrees SET is_pinned=$3 WHERE business_id=$1 AND id=$2',
      ),
      ['owner', 'page', true],
    );
    await expect(
      execute(
        { query },
        { ...input, changes: { isPinned: true, status: 'active' } },
      ),
    ).rejects.toThrow('Invalid page pin request');
    query.mockResolvedValueOnce({ rows: [] });
    await expect(execute({ query }, input)).rejects.toThrow(
      'Linktree page not found',
    );
  });
});
