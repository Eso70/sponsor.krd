import { BusinessAdministrationService } from './business-administration.service';
import type { UpdateBusinessDto } from './dto/update-business.dto';

/** Business settings may invalidate public caches but must never rebuild a saved page. */
describe('business settings preserve authored default pages', () => {
  it.each<UpdateBusinessDto>([
    {},
    { name: 'New business name', phone: '+9647501112222' },
    {
      logo: '/images/upload/new-logo.png',
      default_avatar: '/images/upload/new-avatar.png',
      website_color: '#765432',
    },
    {
      default_template: 'serenity',
      default_background_color: '#abcdef',
      default_footer_text: 'New credit',
      default_footer_phone: '+9647501112222',
      default_footer_hidden: true,
      default_whatsapp_enabled: true,
    },
    { subscriptionPlanId: 'plan-id' },
  ])('does not write page content when updating %j', async (changes) => {
    const business = {
      id: 'business-1',
      username: 'business',
      name: 'Business',
      phone: '+9647501234567',
      subdomain: 'business',
      status: 'active',
      logo: '/images/upload/saved.png',
      default_avatar: '/images/upload/avatar.png',
      default_template: 'spectrum',
      default_background_color: '#ffffff',
    };
    const query = jest.fn(async (sql: string) =>
      sql.includes('FROM businesses a') || sql.includes('UPDATE businesses')
        ? { rows: [business] }
        : { rows: [] },
    );
    const transaction = jest.fn(
      async (work: (client: { query: typeof query }) => Promise<unknown>) =>
        work({ query }),
    );
    const service = new BusinessAdministrationService(
      { query, transaction } as never,
      {
        del: jest.fn().mockResolvedValue(undefined),
        clearBusinessSessions: jest.fn(),
      } as never,
      {
        claimBusinessAssets: jest.fn(),
        deleteUnreferencedFromValues: jest.fn(),
      } as never,
    );
    await service.updateBusiness(business.id, changes);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(
      query.mock.calls.some(([sql]) =>
        /(?:UPDATE|INSERT INTO|DELETE FROM) (?:linktrees|links|whatsapp_questions)/.test(
          sql,
        ),
      ),
    ).toBe(false);
    expect(
      query.mock.calls.some(([sql]) =>
        sql.includes('INSERT INTO business_defaults'),
      ),
    ).toBe(true);
  });
});
