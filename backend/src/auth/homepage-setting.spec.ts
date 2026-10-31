import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ApprovalService } from './approval.service';

describe('business homepage setting boundary', () => {
  it.each(['true', 1, {}])(
    'rejects a non-boolean preference: %s',
    async (value) => {
      const errors = await validate(
        plainToInstance(UpdateSettingsDto, {
          section: 'defaults',
          homepage_linktree: value,
        }),
      );
      expect(
        errors.some((error) => error.property === 'homepage_linktree'),
      ).toBe(true);
    },
  );

  it.each([true, false, undefined])(
    'preserves the preference through platform approval: %s',
    async (value) => {
      const changes =
        value === undefined
          ? { default_background_color: '#abcdef' }
          : { homepage_linktree: value };
      const query = jest
        .fn<Promise<{ rows: unknown[] }>, [string, unknown[]?]>()
        .mockImplementation(async (sql: string) => ({
          rows: sql.includes('FOR UPDATE')
            ? [
                {
                  business_id: 'owner',
                  permission_key: 'business:defaults:update',
                  resource_id: null,
                  resource_type: null,
                  requested_changes: changes,
                },
              ]
            : [],
        }));
      const authorize = jest.fn().mockResolvedValue({ outcome: 'approval' });
      const service = new ApprovalService(
        {
          transaction: async (
            work: (client: { query: typeof query }) => Promise<unknown>,
          ) => work({ query }),
        } as never,
        { authorize, invalidateBusinessPolicy: jest.fn() } as never,
        {} as never,
        {
          claimBusinessAssets: jest.fn(),
          deleteUnreferencedFromValues: jest.fn(),
        } as never,
        { del: jest.fn() } as never,
      );
      await service.review({
        id: 'approval',
        action: 'approve',
        actorId: 'admin',
      });
      const mutation = query.mock.calls.find(([sql]) =>
        sql.includes('INSERT INTO business_defaults'),
      );
      expect(mutation?.[0]).toContain(
        'ELSE business_defaults.homepage_linktree END',
      );
      const values = mutation?.[1] as unknown[];
      expect(values[0]).toBe('owner');
      expect(values.slice(-2)).toEqual([value ?? false, value !== undefined]);
      expect(authorize).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'owner',
          changedFields: Object.keys(changes),
        }),
      );
    },
  );
});
