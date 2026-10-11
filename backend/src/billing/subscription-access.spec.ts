import {
  subscriptionAccessSql,
  subscriptionWindowOpen,
} from './subscription-access';

describe('subscription access window', () => {
  const now = Date.parse('2026-10-09T12:00:00Z');
  it('allows an open period and an indefinite grant', () => {
    expect(subscriptionWindowOpen(null, null, null, now)).toBe(true);
    expect(subscriptionWindowOpen('2026-11-01', '2026-10-01', null, now)).toBe(
      true,
    );
  });
  it('denies the exact expiry or cancellation boundary and future starts', () => {
    expect(subscriptionWindowOpen(new Date(now), null, null, now)).toBe(false);
    expect(subscriptionWindowOpen(null, null, new Date(now), now)).toBe(false);
    expect(subscriptionWindowOpen(null, new Date(now + 1), null, now)).toBe(
      false,
    );
    expect(subscriptionWindowOpen('invalid', null, null, now)).toBe(false);
  });
  it('uses the same status and date boundaries in public SQL', () => {
    expect(subscriptionAccessSql('s')).toContain(
      "s.status IN ('trialing','active','grace_period')",
    );
    expect(subscriptionAccessSql('s')).toContain('s.cancels_at > NOW()');
    expect(() => subscriptionAccessSql('s; DROP TABLE users')).toThrow();
  });
});
