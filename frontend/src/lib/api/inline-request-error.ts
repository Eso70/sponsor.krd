export type InlineRequestErrorStatus = 400 | 409 | 413 | 415 | 422;

export interface InlineRequestErrorData {
  code: string;
  message: string;
  status: InlineRequestErrorStatus | null;
  title: string;
}

interface UploadValidationOptions {
  allowedMimeTypes: readonly string[];
  maxBytes: number;
}

const ERROR_COPY: Record<
  InlineRequestErrorStatus,
  Omit<InlineRequestErrorData, "status">
> = {
  400: {
    code: "BAD_REQUEST",
    title: "داواکارییەکە دروست نییە",
    message: "زانیارییەکان بپشکنە و دووبارە هەوڵ بدەوە.",
  },
  409: {
    code: "CONFLICT",
    title: "ناکۆکی لە زانیارییەکاندا هەیە",
    message: "زانیارییەکان تازە بکەرەوە و گۆڕانکارییەکەت دووبارە بنێرە.",
  },
  413: {
    code: "PAYLOAD_TOO_LARGE",
    title: "قەبارەی فایلەکە زۆرە",
    message: "فایلێکی بچووکتر هەڵبژێرە و دووبارە هەوڵ بدەوە.",
  },
  415: {
    code: "UNSUPPORTED_MEDIA_TYPE",
    title: "جۆری فایلەکە پشتگیری ناکرێت",
    message: "فایلێک بە جۆری ڕێگەپێدراو هەڵبژێرە.",
  },
  422: {
    code: "UNPROCESSABLE_ENTITY",
    title: "فایلەکە ناتوانرێت پرۆسە بکرێت",
    message: "ناوەڕۆکی فایلەکە بپشکنە و فایلێکی دروست هەڵبژێرە.",
  },
};

export function createInlineRequestError(
  status: InlineRequestErrorStatus,
  message?: string,
): InlineRequestErrorData {
  return {
    ...ERROR_COPY[status],
    status,
    ...(message ? { message } : {}),
  };
}

export function createUploadFailureError(): InlineRequestErrorData {
  return {
    code: "UPLOAD_FAILED",
    status: null,
    title: "بارکردن سەرکەوتوو نەبوو",
    message: "پەیوەندییەکەت بپشکنە و دووبارە هەوڵ بدەوە.",
  };
}

export function validateUploadFile(
  file: File,
  options: UploadValidationOptions,
): InlineRequestErrorData | null {
  if (file.size > options.maxBytes) {
    const maxMb = Math.max(1, Math.floor(options.maxBytes / (1024 * 1024)));
    return createInlineRequestError(
      413,
      `قەبارەی فایلەکە نابێت لە ${maxMb}MB زیاتر بێت.`,
    );
  }

  if (!options.allowedMimeTypes.includes(file.type.toLowerCase())) {
    return createInlineRequestError(415);
  }

  return null;
}

export function inlineRequestErrorFromResponse(
  response: Response,
): InlineRequestErrorData {
  const supportedStatuses: readonly number[] = [400, 409, 413, 415, 422];
  return supportedStatuses.includes(response.status)
    ? createInlineRequestError(response.status as InlineRequestErrorStatus)
    : createUploadFailureError();
}

const ARABIC_ERROR_COPY: Record<string, { title: string; message: string }> = {
  BAD_REQUEST: { title: "الطلب غير صالح", message: "تحقق من البيانات وحاول مجددًا." },
  CONFLICT: { title: "تعارض في البيانات", message: "حدّث البيانات ثم حاول مجددًا." },
  PAYLOAD_TOO_LARGE: { title: "حجم الملف كبير", message: "اختر ملفًا أصغر وحاول مجددًا." },
  UNSUPPORTED_MEDIA_TYPE: { title: "نوع الملف غير مدعوم", message: "اختر ملفًا من الأنواع المسموح بها." },
  UNPROCESSABLE_ENTITY: { title: "تعذّر معالجة الملف", message: "تحقق من الملف واختر ملفًا صالحًا." },
  UPLOAD_FAILED: { title: "تعذّر الرفع", message: "تحقق من اتصالك وحاول مجددًا." },
};

const ENGLISH_ERROR_COPY: Record<string, { title: string; message: string }> = {
  BAD_REQUEST: { title: "Invalid request", message: "Check your information and try again." },
  CONFLICT: { title: "Conflicting information", message: "Refresh the data and try again." },
  PAYLOAD_TOO_LARGE: { title: "File too large", message: "Choose a smaller file and try again." },
  UNSUPPORTED_MEDIA_TYPE: { title: "Unsupported file type", message: "Choose an allowed file type." },
  UNPROCESSABLE_ENTITY: { title: "Couldn't process file", message: "Check the file and choose a valid one." },
  UPLOAD_FAILED: { title: "Upload failed", message: "Check your connection and try again." },
};

export function localizeInlineRequestError(
  error: InlineRequestErrorData,
  locale: "ckb" | "ar" | "en",
): InlineRequestErrorData {
  if (locale === "ckb") return error;
  const translated = locale === "ar" ? ARABIC_ERROR_COPY[error.code] : ENGLISH_ERROR_COPY[error.code];
  if (!translated) return error;
  const maxMb = error.message.match(/(\d+)MB/);
  return {
    ...error,
    title: translated.title,
    message: maxMb && error.code === "PAYLOAD_TOO_LARGE"
      ? locale === "ar" ? `يجب ألا يتجاوز حجم الملف ${maxMb[1]}MB.` : `File size must not exceed ${maxMb[1]}MB.`
      : translated.message,
  };
}
