import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PlatformBusinessDomainsController } from './domains.controller';
import { DomainsService } from './domains.service';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { REQUIRED_CAPABILITIES } from '../auth/require-capabilities.decorator';
import { Capability } from '../auth/capabilities';
import type { SessionUser } from '../auth/session.service';

describe('platform-only domain management authorization', () => {
  it('scopes assignment to the selected business and administrator actor', async () => {
    const add = jest.fn().mockResolvedValue({ domains: [] });
    const controller = new PlatformBusinessDomainsController({
      add,
    } as unknown as DomainsService);
    const user: SessionUser = {
      id: 'admin-id',
      name: 'Admin',
      username: 'admin',
      role: 'platform-admin',
    };
    await controller.add('business-id', user, { hostname: 'wafaye.com' });
    expect(add).toHaveBeenCalledWith('business-id', 'wafaye.com', 'admin-id');
  });
  it('requires administrator authentication and existing business capabilities', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, PlatformBusinessDomainsController),
    ).toEqual([PlatformAdminGuard, AuthorizationGuard]);
    expect(
      Reflect.getMetadata(
        REQUIRED_CAPABILITIES,
        PlatformBusinessDomainsController.prototype.list,
      ),
    ).toEqual([Capability.PlatformBusinessesRead]);
    for (const method of ['add', 'verify', 'primary', 'remove'] as const) {
      expect(
        Reflect.getMetadata(
          REQUIRED_CAPABILITIES,
          PlatformBusinessDomainsController.prototype[method],
        ),
      ).toEqual([Capability.PlatformBusinessesUpdate]);
    }
    expect(Capability).not.toHaveProperty('BusinessDomainsRead');
    expect(Capability).not.toHaveProperty('BusinessDomainsManage');
  });
});
