// One runtime contract for server validation, editor drafts and public rendering.
const LINKTREE_SPONSOR_KEY = "sponsor";
const LINKTREE_SPONSOR_MAX_NAME = 100;

function isSponsorImage(value) {
  return typeof value === "string" &&
    /^\/images\/upload\/[A-Za-z0-9._/-]+\.(?:png|jpe?g)$/i.test(value) &&
    !/(^|\/)\.\.(\/|$)/.test(value);
}

function sponsorUrl(value) {
  if (value === "/") return "/";
  if (typeof value === "string" && /^tel:\+[1-9][0-9]{6,14}$/.test(value)) return value;
  if (typeof value !== "string" || value.length > 2048 || /[\u0000-\u0020\\]/.test(value)) return null;
  try {
    const parsed = new URL(value);
    if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password) return null;
    if (parsed.hostname === "wa.me" && (!/^\/[1-9][0-9]{6,14}$/.test(parsed.pathname) || parsed.search || parsed.hash)) return null;
    return parsed.href;
  } catch { return null; }
}

function readLinktreeSponsor(value, validImage = isSponsorImage) {
  const data = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const name = typeof data.name === "string" ? data.name.trim().slice(0, LINKTREE_SPONSOR_MAX_NAME) : "";
  const style = data.style === "wordmark" ? "wordmark" : "text";
  const logo = typeof data.logo === "string" && validImage(data.logo) ? data.logo : null;
  const url = typeof data.url === "string" ? sponsorUrl(data.url.trim()) : null;
  return { enabled: data.enabled === true && (style === "wordmark" ? !!logo : !!name), style, name, logo, url, ...(typeof data.intro === "string" ? { intro: data.intro.trim().slice(0, 100) } : {}) };
}

function inspectLinktreeSponsor(input, validImage = isSponsorImage) {
  const errors = {};
  const data = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  if (input == null || typeof input !== "object" || Array.isArray(input)) errors.sponsor = "Invalid sponsor settings";
  if (Object.keys(data).some((key) => !["enabled", "style", "name", "logo", "url", "intro"].includes(key))) errors.sponsor = "Unknown sponsor setting";
  if (data.enabled !== undefined && typeof data.enabled !== "boolean") errors.enabled = "Choose whether the sponsor is visible";
  if (data.style !== undefined && !["text", "wordmark"].includes(data.style)) errors.style = "Choose text or wordmark";
  if (data.name !== undefined && typeof data.name !== "string") errors.name = "Enter a sponsor name";
  if (typeof data.name === "string" && (data.name.trim().length > LINKTREE_SPONSOR_MAX_NAME || /[\u0000-\u001f\u007f]/.test(data.name))) errors.name = "Sponsor name must be at most 100 characters";
  if (data.enabled === true && data.style !== "wordmark" && !(typeof data.name === "string" && data.name.trim())) errors.name = "Enter a sponsor name";
  if (data.intro !== undefined && (typeof data.intro !== "string" || data.intro.trim().length > 100 || /[\u0000-\u001f\u007f]/.test(data.intro))) errors.intro = "Sponsor introduction must be plain text up to 100 characters";
  if (data.logo != null && data.logo !== "" && !(typeof data.logo === "string" && validImage(data.logo))) errors.logo = "Choose a managed JPEG or PNG image";
  if (data.enabled === true && data.style === "wordmark" && !data.logo) errors.logo = "Upload a wordmark logo";
  if (data.url != null && data.url !== "" && !(typeof data.url === "string" && sponsorUrl(data.url.trim()))) errors.url = "Use an HTTP(S) address, / for the owner homepage, or an international tel:+ number";
  return { value: readLinktreeSponsor(data, validImage), errors };
}

exports.LINKTREE_SPONSOR_KEY = LINKTREE_SPONSOR_KEY;
exports.LINKTREE_SPONSOR_MAX_NAME = LINKTREE_SPONSOR_MAX_NAME;
exports.readLinktreeSponsor = readLinktreeSponsor;
exports.inspectLinktreeSponsor = inspectLinktreeSponsor;
