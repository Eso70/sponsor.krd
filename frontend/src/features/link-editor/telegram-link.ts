/**
 * Telegram destinations may be public usernames or private invite hashes.
 * Keep an already-valid URL unchanged so editing a page does not replace its
 * stored link (and the analytics identity attached to it).
 */
const USERNAME = /^[a-zA-Z0-9_]{5,32}$/;
const INVITE_HASH = /^\+[a-zA-Z0-9_-]{5,128}$/;
const TELEGRAM_URL_PREFIX = /^(?:https?:\/\/|(?:www\.)?(?:t\.me|telegram\.me)\/)/i;
const TELEGRAM_HOSTS = new Set(["t.me", "www.t.me", "telegram.me", "www.telegram.me"]);

export function normalizeTelegramLink(input: string): string | null {
  const trimmed = input.trim();
  if (INVITE_HASH.test(trimmed)) return `https://t.me/${trimmed}`;

  if (TELEGRAM_URL_PREFIX.test(trimmed)) {
    const hasProtocol = /^https?:\/\//i.test(trimmed);
    try {
      const parsed = new URL(hasProtocol ? trimmed : `https://${trimmed}`);
      const segment = parsed.pathname.slice(1).replace(/\/$/, "");
      if (
        !TELEGRAM_HOSTS.has(parsed.hostname.toLowerCase()) ||
        parsed.username || parsed.password || parsed.port || parsed.hash ||
        !(USERNAME.test(segment) || INVITE_HASH.test(segment))
      ) {
        return null;
      }
      return hasProtocol ? trimmed : `https://${trimmed}`;
    } catch {
      return null;
    }
  }

  const username = trimmed.replace(/^@/, "");
  return USERNAME.test(username) ? `https://t.me/${username}` : null;
}
