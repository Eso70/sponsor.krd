import { readFileSync } from 'fs';
import { join } from 'path';

describe('data-preserving Linktree content migration', () => {
  const forward = readFileSync(
    join(__dirname, 'migrations/2026-10-13_linktree_form_content.sql'),
    'utf8',
  );
  const baseline = readFileSync(
    join(__dirname, 'migrations/baseline/96_linktree_form_content.sql'),
    'utf8',
  );
  it('uses the identical migration for fresh and existing databases', () =>
    expect(forward).toBe(baseline));
  it('renames fields without rewriting rows, IDs or routes', () => {
    for (const [oldName, newName] of [
      ['name', 'headline'],
      ['subtitle', 'slogan'],
      ['subtitle_color', 'slogan_color'],
      ['image', 'logo'],
    ]) {
      expect(forward).toContain(`RENAME COLUMN ${oldName} TO ${newName}`);
      expect(forward).toContain(
        `Conflicting Linktree columns ${oldName} and ${newName}`,
      );
    }
    expect(forward).not.toMatch(
      /(?:UPDATE|DELETE FROM|TRUNCATE|DROP TABLE) (?:public\.)?linktrees/i,
    );
    expect(forward).toContain('NEW.headline, NEW.seo_name');
    expect(forward).not.toContain('RENAME COLUMN seo_name');
    expect(forward).not.toContain('RENAME COLUMN uid');
  });
});
