export const settingsSectionFields = {
  profile: ['name', 'username', 'phone', 'logo', 'favicon', 'default_avatar', 'website_color'],
  defaults: ['default_template', 'default_background_color', 'default_background_pattern', 'default_whatsapp_enabled', 'homepage_linktree'],
  messages: [],
} as const;

/** Apply a saved section without discarding another tab or newer edits. */
export function mergeSavedSection<T extends object>(current: T, submitted: T, saved: T, fields: readonly (keyof T)[]): T {
  const next = { ...current };
  for (const field of fields) if (current[field] === submitted[field]) next[field] = saved[field];
  return next;
}
