import type { LinktreePresentationLink } from "@linktree/types";
import { COUNTRY_DIAL_CODES_SORTED } from "@/lib/constants/country-codes";

const PHONE_PLATFORMS = new Set(["whatsapp", "phone", "viber"]);
const HANDLE_PLATFORMS = new Set([
  "telegram",
  "instagram",
  "facebook",
  "twitter",
  "x",
  "tiktok",
  "youtube",
  "linkedin",
  "snapchat",
]);
const AT_HANDLE_PLATFORMS = new Set([
  "telegram",
  "instagram",
  "twitter",
  "x",
  "tiktok",
  "youtube",
  "snapchat",
]);

function metadataText(
  link: LinktreePresentationLink,
  key: "original_input" | "country_code",
) {
  const value = link.metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function phoneIdentity(link: LinktreePresentationLink): string | null {
  const original = metadataText(link, "original_input");
  const countryCode = metadataText(link, "country_code").replace(/\D/g, "");

  const asLocalNumber = (digits: string, code: string) => {
    let local = digits.replace(/^00/, "");
    if (code && local.startsWith(code)) local = local.slice(code.length);
    local = local.replace(/^0+/, "");
    return local ? `0${local}` : null;
  };

  if (original) {
    const digits = original.replace(/\D/g, "");
    if (!digits) return null;
    return asLocalNumber(digits, countryCode);
  }

  const match = link.url.match(/(?:wa\.me\/|tel:\+?|number=(?:%2B|\+)?)(\d+)/i);
  if (!match?.[1]) return null;
  const inferredCode = COUNTRY_DIAL_CODES_SORTED.find(({ code }) =>
    match[1].startsWith(code),
  )?.code;
  return asLocalNumber(match[1], inferredCode || "");
}

function asUrl(value: string): URL | null {
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
}

function handleFromUrl(platform: string, value: string): string | null {
  const url = asUrl(value);
  if (!url) return null;
  const parts = url.pathname
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
  let handle: string | undefined;

  switch (platform) {
    case "telegram":
      if (!parts[0]?.startsWith("+") && !["joinchat", "s"].includes(parts[0]?.toLowerCase())) {
        handle = parts[0];
      }
      break;
    case "instagram":
      if (
        !["p", "reel", "reels", "stories", "tv"].includes(
          parts[0]?.toLowerCase(),
        )
      ) {
        handle = parts.length === 1 ? parts[0] : undefined;
      }
      break;
    case "twitter":
    case "x":
      if (
        !["home", "explore", "search", "i"].includes(parts[0]?.toLowerCase())
      ) {
        handle = parts[0];
      }
      break;
    case "tiktok":
    case "youtube":
      handle = parts.find((part) => part.startsWith("@"));
      break;
    case "snapchat":
      handle = parts[0]?.toLowerCase() === "add" ? parts[1] : undefined;
      break;
    case "linkedin":
      handle = ["in", "company"].includes(parts[0]?.toLowerCase())
        ? parts[1]
        : undefined;
      break;
    case "facebook":
      if (
        parts.length === 1 &&
        !["watch", "groups", "events", "reel"].includes(parts[0]?.toLowerCase())
      ) {
        handle = parts[0];
      }
      break;
  }

  if (!handle) return null;
  const clean = handle.replace(/^@/, "").trim();
  if (!clean) return null;
  return AT_HANDLE_PLATFORMS.has(platform) ? `@${clean}` : clean;
}

function handleIdentity(link: LinktreePresentationLink): string | null {
  const platform = link.platform.toLowerCase();
  const original = metadataText(link, "original_input");
  const source = original || link.url;
  const looksLikeUrl =
    /^(?:https?:\/\/|www\.)/i.test(source) ||
    source.includes(".com/") ||
    source.includes("t.me/");

  if (looksLikeUrl) return handleFromUrl(platform, source);

  const clean = source.replace(/^@/, "").trim();
  if (platform === "telegram" && clean.startsWith("+")) return null;
  if (!clean || clean.includes("/")) return null;
  return AT_HANDLE_PLATFORMS.has(platform) ? `@${clean}` : clean;
}

/** The quiet third line shown under a public button's English platform name. */
export function getLinkIdentity(link: LinktreePresentationLink): string | null {
  const platform = link.platform.toLowerCase();
  if (PHONE_PLATFORMS.has(platform)) return phoneIdentity(link);
  if (HANDLE_PLATFORMS.has(platform)) return handleIdentity(link);
  if (platform === "email") {
    const value = metadataText(link, "original_input") || link.url;
    return (
      value
        .replace(/^mailto:/i, "")
        .split("?")[0]
        .trim() || null
    );
  }
  return null;
}
