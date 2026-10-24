import { GUARDS_METADATA } from '@nestjs/common/constants';
import { BusinessFormsController } from './business-forms.controller';
import { PlatformFormsController } from './platform-forms.controller';
import { BusinessGuard } from '../auth/business.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { REQUIRED_CAPABILITIES } from '../auth/require-capabilities.decorator';
import { Capability } from '../auth/capabilities';
import { FormsService } from './forms.service';
import { StorageService } from '../storage/storage.service';
import { SessionUser } from '../auth/session.service';
import { FormsListDto } from './forms-list.dto';
describe('form management authorization boundaries', () => {
  it.each([
    [
      BusinessFormsController,
      BusinessGuard,
      Capability.BusinessFormsRead,
      Capability.BusinessFormsCreate,
      Capability.BusinessFormsUpdate,
      Capability.BusinessFormsDelete,
    ],
    [
      PlatformFormsController,
      PlatformAdminGuard,
      Capability.PlatformFormsRead,
      Capability.PlatformFormsCreate,
      Capability.PlatformFormsUpdate,
      Capability.PlatformFormsDelete,
    ],
  ])(
    'guards every protected form operation',
    (controller, guard, read, create, update, remove) => {
      expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toEqual([
        guard,
        AuthorizationGuard,
      ]);
      for (const [operation, capability] of [
        ['list', read],
        ['selectionIds', read],
        ['get', read],
        ['stats', read],
        ['titleAvailability', read],
        ['submissions', read],
        ['getAnalytics', read],
        ['create', create],
        ['duplicate', create],
        ['duplicateOptions', create],
        ['update', update],
        ['status', update],
        ['archive', update],
        ['pin', update],
        ['remove', remove],
        ['deleteSubmissions', remove],
        ['clearAnalytics', remove],
      ] as const) {
        const handler: unknown = Object.getOwnPropertyDescriptor(
          controller.prototype,
          operation,
        )?.value;
        if (typeof handler !== 'function')
          throw new Error('Missing controller handler');
        expect(Reflect.getMetadata(REQUIRED_CAPABILITIES, handler)).toEqual([
          capability,
        ]);
      }
    },
  );
  it('uses the authenticated business and resolved platform owner for search and pagination', async () => {
    const service = {
      list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      platformOwner: jest.fn().mockResolvedValue('platform-owner'),
    } as unknown as FormsService;
    const storage = {} as StorageService;
    const query = Object.assign(new FormsListDto(), {
      page: '2',
      q: 'literal%',
      filter: 'archived',
    });
    await new BusinessFormsController(service, storage).list(
      { id: 'business-owner' } as SessionUser,
      query,
    );
    expect(service.list).toHaveBeenCalledWith(
      'business-owner',
      2,
      'literal%',
      true,
    );
    await new PlatformFormsController(service, storage).list(query);
    expect(service.list).toHaveBeenCalledWith(
      'platform-owner',
      2,
      'literal%',
      true,
    );
  });
  it('scopes form analytics to the authenticated business and platform workspace', async () => {
    const service = {
      getAnalytics: jest.fn().mockResolvedValue({ total_views: 4 }),
      platformOwner: jest.fn().mockResolvedValue('platform-owner'),
    } as unknown as FormsService;
    const storage = {} as StorageService;
    await new BusinessFormsController(service, storage).getAnalytics(
      { id: 'business-owner' } as SessionUser,
      'form-id',
    );
    expect(service.getAnalytics).toHaveBeenCalledWith(
      'business-owner',
      'form-id',
    );
    await new PlatformFormsController(service, storage).getAnalytics('form-id');
    expect(service.getAnalytics).toHaveBeenCalledWith(
      'platform-owner',
      'form-id',
    );
  });
  it('scopes archive changes to the authenticated business or platform workspace', async () => {
    const service = {
      archive: jest
        .fn()
        .mockResolvedValue({ status: 'active', isArchived: true }),
      platformOwner: jest.fn().mockResolvedValue('platform-owner'),
    } as unknown as FormsService;
    const storage = {} as StorageService;
    await new BusinessFormsController(service, storage).archive(
      { id: 'business-owner' } as SessionUser,
      'form-id',
      true,
    );
    expect(service.archive).toHaveBeenCalledWith(
      'business-owner',
      'form-id',
      true,
    );
    await new PlatformFormsController(service, storage).archive(
      'form-id',
      false,
    );
    expect(service.archive).toHaveBeenCalledWith(
      'platform-owner',
      'form-id',
      false,
    );
  });
  it('scopes response deletion to the authenticated owner in both controllers', async () => {
    const service = {
      deleteSubmissions: jest.fn().mockResolvedValue({ deleted: 3 }),
      platformOwner: jest.fn().mockResolvedValue('platform-owner'),
    } as unknown as FormsService;
    const storage = {} as StorageService;
    await new BusinessFormsController(service, storage).deleteSubmissions(
      { id: 'business-owner' } as SessionUser,
      'form-id',
    );
    expect(service.deleteSubmissions).toHaveBeenLastCalledWith(
      'business-owner',
      'form-id',
    );
    await new PlatformFormsController(service, storage).deleteSubmissions(
      'form-id',
    );
    expect(service.deleteSubmissions).toHaveBeenLastCalledWith(
      'platform-owner',
      'form-id',
    );
  });
  it('scopes selection and analytics-only deletion to each authenticated owner', async () => {
    const service = {
      selectionIds: jest.fn().mockResolvedValue(['form-id']),
      clearAnalytics: jest.fn().mockResolvedValue(undefined),
      platformOwner: jest.fn().mockResolvedValue('platform-owner'),
    } as unknown as FormsService;
    const query = Object.assign(new FormsListDto(), {
      q: 'contact',
      filter: 'archived',
    });
    const storage = {} as StorageService;
    const business = new BusinessFormsController(service, storage);
    const platform = new PlatformFormsController(service, storage);
    await business.selectionIds({ id: 'business-owner' } as SessionUser, query);
    expect(service.selectionIds).toHaveBeenLastCalledWith(
      'business-owner',
      'contact',
      true,
    );
    await platform.selectionIds(query);
    expect(service.selectionIds).toHaveBeenLastCalledWith(
      'platform-owner',
      'contact',
      true,
    );
    await business.clearAnalytics(
      { id: 'business-owner' } as SessionUser,
      'form-id',
    );
    expect(service.clearAnalytics).toHaveBeenLastCalledWith(
      'business-owner',
      'form-id',
    );
    await platform.clearAnalytics('form-id');
    expect(service.clearAnalytics).toHaveBeenLastCalledWith(
      'platform-owner',
      'form-id',
    );
  });
});
