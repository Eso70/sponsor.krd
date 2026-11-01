import { expect, it } from 'vitest';
import { mergeSavedSection } from './settings-draft';

it('preserves newer in-flight edits and unrelated section fields', () => {
  const submitted = { name: 'Submitted', homepage: false };
  expect(mergeSavedSection({ name: 'Newer edit', homepage: true }, submitted, { name: 'Saved', homepage: false }, ['name'])).toEqual({ name: 'Newer edit', homepage: true });
  expect(mergeSavedSection({ ...submitted, homepage: true }, submitted, { name: 'Saved', homepage: false }, ['name'])).toEqual({ name: 'Saved', homepage: true });
});
