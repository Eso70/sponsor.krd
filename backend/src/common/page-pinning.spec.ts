import { NotFoundException } from '@nestjs/common';
import { FormsService } from '../forms/forms.service';
import { LinktreesService } from '../linktrees/linktrees.service';

describe('owner-scoped page pins', () => {
  const query = jest.fn();
  const forms = new FormsService(
    { query } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  const linktrees = new LinktreesService(
    { query } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  afterEach(() => query.mockReset());

  it.each([
    ['forms', forms],
    ['linktrees', linktrees],
  ] as const)(
    'updates only the requested owner in %s and refuses an unknown/cross-owner id',
    async (table, service) => {
      query
        .mockResolvedValueOnce({ rows: [{ id: 'page', isPinned: true }] })
        .mockResolvedValueOnce({ rows: [] });
      await expect(service.pin('owner', 'page', true)).resolves.toEqual({
        id: 'page',
        isPinned: true,
      });
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining(
          `UPDATE ${table} SET is_pinned=$3 WHERE business_id=$1 AND id=$2`,
        ),
        ['owner', 'page', true],
      );
      await expect(service.pin('other-owner', 'page', false)).rejects.toThrow(
        NotFoundException,
      );
    },
  );

  it('orders Forms by pins before applying the page limit', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] });
    await forms.list('owner', 2);
    const [sql, parameters] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain(
      'ORDER BY is_pinned DESC,updated_at DESC,id LIMIT 15 OFFSET $4',
    );
    expect(sql).toContain('ORDER BY form."isPinned" DESC');
    expect(parameters.slice(0, 4)).toEqual(['owner', false, '%%', 30]);
  });
});
