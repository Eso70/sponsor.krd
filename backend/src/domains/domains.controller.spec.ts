import { GUARDS_METADATA } from '@nestjs/common/constants';
import {
  BusinessDomainsController,
  PlatformBusinessDomainsController,
} from './domains.controller';
import { DomainsService } from './domains.service';
import { BusinessGuard } from '../auth/business.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { REQUIRED_CAPABILITIES } from '../auth/require-capabilities.decorator';
import { Capability } from '../auth/capabilities';
import type { SessionUser } from '../auth/session.service';
describe('domain management authorization', () => {
  it('binds business mutations to the authenticated business and actor', async () => {
    const add = jest.fn().mockResolvedValue({ domains: [] });
    const controller = new BusinessDomainsController({
      add,
    } as unknown as DomainsService);
    const user: SessionUser = {
      id: 'business-id',
      userId: 'owner-id',
      name: 'Owner',
      username: 'owner',
      role: 'business',
    };
    await controller.add(user, { hostname: 'wafaye.com' });
    expect(add).toHaveBeenCalledWith('business-id', 'wafaye.com', 'owner-id');
  });
  it('uses existing admin permissions and separate domain capabilities', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, BusinessDomainsController),
    ).toEqual([BusinessGuard, AuthorizationGuard]);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, PlatformBusinessDomainsController),
    ).toEqual([PlatformAdminGuard, AuthorizationGuard]);
    for (const method of ['add', 'verify', 'primary', 'remove'] as const) {
      expect(
        Reflect.getMetadata(
          REQUIRED_CAPABILITIES,
          BusinessDomainsController.prototype[method],
        ),
      ).toEqual([Capability.BusinessDomainsManage]);
      expect(
        Reflect.getMetadata(
          REQUIRED_CAPABILITIES,
          PlatformBusinessDomainsController.prototype[method],
        ),
      ).toEqual([Capability.PlatformBusinessesUpdate]);
    }
  });
});
