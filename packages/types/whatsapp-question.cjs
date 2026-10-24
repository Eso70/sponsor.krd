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
  return url ? `${question.message.trim()}\n\n${url}` : question.message;
}
exports.normalizeQuestionVideoUrl = normalizeQuestionVideoUrl;
exports.whatsappQuestionMessage = whatsappQuestionMessage;
