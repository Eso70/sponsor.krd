function normalizeQuestionVideoUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const input = value.trim();
  if (input.length > 2048 || /[\r\n\u0000-\u001f]/.test(input)) return null;
  try {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.')) return null;
    return url.href;
  } catch { return null; }
}
function whatsappQuestionMessage(question) {
  const url = normalizeQuestionVideoUrl(question.videoUrl);
  return url ? `${url}\n\n${question.message.trim()}` : question.message;
}
/** The question panel has its own solid surface, independent of the page. */
function readWhatsappQuestionColor(value) {
  if (typeof value !== 'string') return '#ffffff';
  const color = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(color)) return color;
  if (/^#[0-9a-f]{3}$/.test(color)) return '#' + [...color.slice(1)].map(c => c + c).join('');
  return '#ffffff';
}
exports.normalizeQuestionVideoUrl = normalizeQuestionVideoUrl;
exports.whatsappQuestionMessage = whatsappQuestionMessage;
exports.readWhatsappQuestionColor = readWhatsappQuestionColor;
