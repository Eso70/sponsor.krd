import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  type ExecutionContext,
} from '@nestjs/common';
import { AuthorizationGuard } from './authorization.guard';
import { ApprovalService } from './approval.service';

const owner = '373f02f3-0b8b-4e93-ad0b-5f16a640daf4';
const page = '17fdf0e8-d6b4-449a-b3cf-c760160c3f21';
const edit = {
  headline: 'Page',
  links: { website: ['https://example.com'] },
  platforms: ['website'],
  linkMetadata: {},
};
function setup(outcomes: string[], body: unknown = edit) {
  const authorize = jest.fn<
    Promise<unknown>,
    [{ permission: string; resource?: unknown; changedFields?: string[] }]
  >();
  for (const outcome of outcomes)
    authorize.mockResolvedValueOnce({
      outcome,
      reasonCode: 'POLICY',
      deniedFields: [],
      approvalFields: [],
      source: 'plan',
    });
  const create = jest
    .fn()
    .mockResolvedValue({ id: 'approval', status: 'pending' });
  const guard = new AuthorizationGuard(
    { getAllAndOverride: () => ['business:linktrees:update'] } as never,
    { authorize } as never,
    { create } as never,
  );
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'PATCH',
        url: `/api/linktrees/${page}`,
        user: { id: owner, role: 'business' },
        params: { id: page },
        body,
        headers: {},
      }),
    }),
  } as unknown as ExecutionContext;
  return { guard, context, authorize, create };
}
describe('complete Linktree editor authorization', () => {
  it('checks both capabilities against the same owning page without treating link data as page fields', async () => {
    const { guard, context, authorize } = setup(['allow', 'allow']);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(authorize.mock.calls.map(([input]) => input.permission)).toEqual([
      'business:linktrees:update',
      'business:links:sync',
    ]);
    for (const [input] of authorize.mock.calls)
      expect(input.resource).toMatchObject({
        type: 'linktree',
        id: page,
        ownerBusinessId: owner,
      });
    expect(authorize.mock.calls[0][0].changedFields).toEqual(['headline']);
  });
  it.each([
    ['approval', 'deny'],
    ['allow', 'deny'],
  ])(
    'a link denial wins before any approval is queued (%s/%s)',
    async (update, links) => {
      const { guard, context, create } = setup([update, links]);
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(create).not.toHaveBeenCalled();
    },
  );
  it.each([
    ['approval', 'allow'],
    ['allow', 'approval'],
    ['approval', 'approval'],
  ])(
    'queues one entire edit when either decision needs approval (%s/%s)',
    async (update, links) => {
      const { guard, context, create } = setup([update, links]);
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        HttpException,
      );
      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          permission: 'business:linktrees:update',
          changes: edit,
          resource: { type: 'linktree', id: page },
        }),
      );
    },
  );
  it('does not require link permissions for a metadata-only patch', async () => {
    const { guard, context, authorize } = setup(['allow'], { description: '' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(authorize).toHaveBeenCalledTimes(1);
  });
  it('rejects malformed link data before queueing a request', async () => {
    const { guard, context, create, authorize } = setup(['approval'], {
      links: { website: ['javascript:alert(1)'] },
    });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(authorize).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
describe('queued Linktree media boundary', () => {
  it.each([
    { logo: '/images/upload/foreign.png' },
    { image: '/images/upload/foreign.png' },
    { template_config: { background_image: '/images/upload/foreign.png' } },
  ])('refuses foreign media before writing an approval', async (changes) => {
    const query = jest.fn();
    const service = new ApprovalService(
      { query } as never,
      {} as never,
      {} as never,
      { areBusinessAssetsOwned: jest.fn().mockResolvedValue(false) } as never,
      {} as never,
    );
    await expect(
      service.create({
        businessId: owner,
        permission: 'business:linktrees:update',
        action: 'PATCH page',
        changes,
        decision: {} as never,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(query).not.toHaveBeenCalled();
  });
});
