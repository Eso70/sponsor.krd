import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { execFileSync } from 'node:child_process';
import { AuthService } from './auth.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import {
  BACKGROUND_PATTERN_STYLES,
  resolveNewPagePattern,
} from '@linktree/types/linktree-defaults.cjs';

describe('new-page appearance settings', () => {
  it.each(BACKGROUND_PATTERN_STYLES)(
    'accepts the shared %s pattern',
    async (pattern) => {
      expect(
        await validate(
          plainToInstance(UpdateSettingsDto, {
            section: 'defaults',
            default_background_pattern: pattern,
          }),
        ),
      ).toHaveLength(0);
    },
  );
  it.each(['unknown', '', 5, {}])(
    'rejects invalid pattern %s',
    async (pattern) => {
      const errors = await validate(
        plainToInstance(UpdateSettingsDto, {
          section: 'defaults',
          default_background_pattern: pattern,
        }),
      );
      expect(
        errors.some((error) => error.property === 'default_background_pattern'),
      ).toBe(true);
    },
  );
  it('preserves explicit none and supplies a fallback for absent preferences', () => {
    expect(resolveNewPagePattern('none')).toBe('none');
    expect(resolveNewPagePattern(null)).toBe('grid45');
  });
  it('saves appearance within the authenticated owner and preserves omitted legacy settings', async () => {
    const query = jest
      .fn<Promise<{ rows: unknown[] }>, [string, unknown[]?]>()
      .mockResolvedValue({ rows: [] });
    const service = new AuthService({ query } as never, {} as never);
    jest.spyOn(service, 'getBusinessSettings').mockResolvedValue({});
    await service.updateBusinessSettings('owner-id', {
      section: 'defaults',
      default_background_color: '#abcdef',
      default_background_pattern: 'none',
    });
    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain('ON CONFLICT (business_id)');
    expect(sql).toContain('ELSE business_defaults.footer_hidden END');
    expect(sql).toContain('ELSE business_defaults.background_pattern END');
    expect(values).toEqual([
      'owner-id',
      null,
      null,
      'spectrum',
      '#abcdef',
      false,
      false,
      'none',
      false,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      false,
    ]);
  });
  it('loads defaults under plain Node without the TypeScript package root', () => {
    expect(
      execFileSync(
        process.execPath,
        [
          '-e',
          'process.stdout.write(require("@linktree/types/linktree-defaults.cjs").resolveNewPagePattern())',
        ],
        { encoding: 'utf8' },
      ),
    ).toBe('grid45');
  });
});
