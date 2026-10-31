import { inspectLinktreeSponsor, readLinktreeSponsor, type LinktreeSponsor } from "@linktree/types";
import { isFormImage } from "@/features/forms/form-media";
import { uploadLinktreeDraftImage } from "./banner-upload";

/** Retain unfinished text while authoring; public readers stay fail-closed. */
export function sponsorEditorDraft(value: unknown, ownerName = ""): LinktreeSponsor {
  const raw = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  const saved = readLinktreeSponsor(value, isFormImage);
  return {
    ...saved,
    enabled: raw.enabled === true,
    ...(typeof raw.intro === "string" ? { intro: raw.intro } : {}),
    name: raw.style === "wordmark" ? "" : typeof raw.name === "string" ? raw.name : ownerName.slice(0, 100),
    url: typeof raw.url === "string" ? raw.url : raw.url === null ? null : "/",
  };
}

/** Persist local wordmark drafts through the existing owner-scoped upload API. */
export async function persistSponsorDraft(
  value: LinktreeSponsor,
  upload: (file: File) => Promise<string | null>,
): Promise<LinktreeSponsor> {
  const inspected = inspectLinktreeSponsor(value, isFormImage);
  if (Object.keys(inspected.errors).length) throw new Error("Invalid sponsor settings");
  return {
    ...inspected.value,
    logo: inspected.value.logo ? await uploadLinktreeDraftImage(inspected.value.logo, upload) : null,
  };
}

export const sponsorIntroCopy = { en: "Sponsored by", ar: "برعاية", ckb: "سپۆنسەرکراوە لەلایەن" } as const;

export const sponsorEditorCopy = {
  en: {
    title: "Sponsor", show: "Show sponsor", off: "Hidden", text: "Text name", wordmark: "Wordmark logo",
    intro: "Introductory text", introError: "Use up to 100 characters.", destination: "Destination", none: "No link", home: "Homepage", website: "Website", whatsapp: "WhatsApp", phone: "Phone call", number: "Phone number", country: "Country code", name: "Sponsor name", logo: "Sponsor wordmark",
    imageHint: "PNG / JPEG · 5 MB",
    invalid: "Check the sponsor name, wordmark and destination link.",
    nameError: "Enter a sponsor name, up to 100 characters.",
    logoError: "Choose a JPEG or PNG wordmark logo.",
    urlError: "Enter a valid website or phone number.",
  },
  ar: {
    title: "الجهة الراعية", show: "إظهار الجهة الراعية", off: "مخفي", text: "الاسم النصي", wordmark: "شعار كتابي",
    intro: "النص التمهيدي", introError: "استخدم 100 حرف كحد أقصى.", destination: "الوجهة", none: "دون رابط", home: "الصفحة الرئيسية", website: "موقع إلكتروني", whatsapp: "واتساب", phone: "اتصال هاتفي", number: "رقم الهاتف", country: "رمز الدولة", name: "اسم الجهة الراعية", logo: "شعار الجهة الراعية",
    imageHint: "PNG / JPEG · 5 MB",
    invalid: "تحقّق من اسم الجهة الراعية والشعار ورابط الوجهة.",
    nameError: "أدخل اسم الجهة الراعية بما لا يزيد عن 100 حرف.",
    logoError: "اختر شعارًا كتابيًا بصيغة JPEG أو PNG.",
    urlError: "أدخل موقعًا أو رقم هاتف صالحًا.",
  },
  ckb: {
    title: "سپۆنسەر", show: "پیشاندانی سپۆنسەر", off: "شاراوە", text: "ناوی نووسراو", wordmark: "لۆگۆی نووسراو",
    intro: "دەقی پێشەکی", introError: "تا ١٠٠ پیت بەکاربهێنە.", destination: "مەبەست", none: "بەبێ بەستەر", home: "پەڕەی سەرەکی", website: "ماڵپەڕ", whatsapp: "واتساپ", phone: "پەیوەندی تەلەفۆنی", number: "ژمارەی تەلەفۆن", country: "کۆدی وڵات", name: "ناوی سپۆنسەر", logo: "لۆگۆی نووسراوی سپۆنسەر",
    imageHint: "PNG / JPEG · 5 MB",
    invalid: "ناوی سپۆنسەر، لۆگۆ و بەستەری مەبەست بپشکنە.",
    nameError: "ناوی سپۆنسەر بنووسە، تا ١٠٠ پیت.",
    logoError: "لۆگۆیەکی نووسراو بە شێوەی JPEG یان PNG هەڵبژێرە.",
    urlError: "ماڵپەڕ یان ژمارەیەکی دروست بنووسە.",
  },
} as const;
