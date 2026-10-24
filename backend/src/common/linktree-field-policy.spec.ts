import { resolveLinktreeFieldMode } from './linktree-field-policy';
describe('Linktree field policy aliases', () => {
  it.each([
    ['headline', 'name'],
    ['slogan', 'subtitle'],
    ['slogan_color', 'subtitle_color'],
    ['logo', 'image'],
  ])('preserves legacy denial and approval for %s', (canonical, legacy) => {
    expect(
      resolveLinktreeFieldMode(
        'business:linktrees:update',
        canonical,
        { [legacy]: 'deny' },
        'direct',
      ),
    ).toBe('deny');
    expect(
      resolveLinktreeFieldMode(
        'business:linktrees:update',
        canonical,
        { [legacy]: 'approval' },
        'direct',
      ),
    ).toBe('approval');
    expect(
      resolveLinktreeFieldMode(
        'business:linktrees:update',
        legacy,
        { [canonical]: 'deny' },
        'direct',
      ),
    ).toBe('deny');
  });
  it('keeps unrelated permissions separate and respects explicit canonical rules', () => {
    expect(
      resolveLinktreeFieldMode(
        'business:profile:update',
        'headline',
        { name: 'deny' },
        'direct',
      ),
    ).toBe('direct');
    expect(
      resolveLinktreeFieldMode(
        'business:linktrees:update',
        'name',
        { headline: 'approval', name: 'direct' },
        'direct',
      ),
    ).toBe('approval');
  });
});
