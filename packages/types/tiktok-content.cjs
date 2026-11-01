"use strict";

/** Canonical public action names, shared by Pixel metadata and Events API. */
function tiktokContentName(pageName, actionName, platform) {
  if (typeof platform === "string" && platform.trim()) {
    const key = platform.trim().toLowerCase();
    const names = {
      whatsapp: "WhatsApp", phone: "Phone", tel: "Phone", email: "Email", mailto: "Email",
      telegram: "Telegram", viber: "Viber", messenger: "Messenger", signal: "Signal", line: "Line",
      facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube",
      snapchat: "Snapchat", x: "X", twitter: "X", linkedin: "LinkedIn", spotify: "Spotify",
      appstore: "App Store", playstore: "Google Play", location: "Location", website: "Website", link: "Website",
    };
    return names[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }
  return actionName || pageName;
}

/** Only public content metadata; never form answers or customer identity. */
function tiktokContentProperties({ pageId, pageName, actionId, actionName, platform, description }) {
  const id = actionId || pageId;
  const name = tiktokContentName(pageName, actionName, platform);
  return {
    content_id: id,
    content_ids: [id],
    content_name: name,
    contents: [{ content_id: id, content_name: name }],
    ...(description ? { description } : {}),
  };
}

module.exports = { tiktokContentName, tiktokContentProperties };
