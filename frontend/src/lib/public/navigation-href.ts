import { appendMessageToUrl } from "@/lib/utils/message-url";

/** Progressive navigation keeps the same destination/message as the tracked click. */
export function navigationHref(url: string, platform?: string, message?: string | null): string | undefined {
  const value = platform && message ? appendMessageToUrl(url, platform, message) : url;
  return /^(https?:\/\/|tel:|mailto:|sms:|geo:|viber:|tg:)/i.test(value) ? value : undefined;
}
