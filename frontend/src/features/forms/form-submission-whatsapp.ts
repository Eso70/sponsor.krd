import { normalizeInternationalPhoneNumber } from "@linktree/types/phone-number.cjs";
import {
  FORM_WHATSAPP_MESSAGE_LIMIT,
  renderFormWhatsAppTemplate,
  validFormWhatsAppTemplate,
} from "@linktree/types/form-whatsapp-template.cjs";
import { appendMessageToUrl } from "@/lib/utils/message-url";
import { formEditorCopy } from "./form-editor-copy";
import { formsCopy } from "./forms-copy";
import { formWhatsAppProductCopy } from "./form-whatsapp-product-copy";
import { closeWhatsAppCodeBlock } from "./form-whatsapp-text-table";
import { validFormWhatsAppDetails } from "@linktree/types/form-whatsapp-details.cjs";
import type { FormWhatsAppDetailsConfig } from "@linktree/types";
import { formatWhatsAppDetails } from "./form-whatsapp-details";
import type { FormLanguage, FormSubmission } from "./types";

export function formWhatsAppCopy(language: FormLanguage) {
  return language === "ckb"
    ? {
        open: "نامە لە واتساپ بکەرەوە",
        message: "نامە",
        customer: "کڕیار",
        unavailable: "ژمارەیەکی دروستی تەلەفۆن نییە",
        hello: "سڵاو",
        comma: "،",
        received:
          "داواکارییەکەت بە سەرکەوتوویی تۆمار کراو بەزووترین کات دەگاتە دەستت..",
        details: "وردەکارییەکانی داواکارییەکەت:",
        thanks: "سوپاس بۆ متمانەت.",
        remaining: "وردەکارییە زیاترەکان لە فۆڕمی نێردراودا هەن.",
      }
    : language === "ar"
      ? {
          open: "فتح رسالة واتساب",
          message: "الرسالة",
          customer: "العميل",
          unavailable: "لا يوجد رقم هاتف صالح",
          hello: "مرحبًا",
          comma: "،",
          received: "تم تسجيل طلبك بنجاح وسيصلك في أقرب وقت.",
          details: "تفاصيل طلبك:",
          thanks: "شكرًا لثقتك.",
          remaining: "تتوفر بقية التفاصيل في النموذج المرسل.",
        }
      : {
          open: "Open WhatsApp message",
          message: "Message",
          customer: "there",
          unavailable: "No valid phone number",
          hello: "Hello",
          comma: ",",
          received:
            "Your order has been registered successfully and will reach you as soon as possible.",
          details: "Your request details:",
          thanks: "Thank you for your trust.",
          remaining: "Additional details are available in your submitted form.",
        };
}

export function defaultFormWhatsAppTemplate(language: FormLanguage) {
  const copy = formWhatsAppCopy(language);
  return `${copy.hello} {{name}}${copy.comma}\n\n${copy.received}\n\n{{details}}\n\n${copy.thanks}`;
}
export function defaultFormWhatsAppDetails(
  language: FormLanguage,
): FormWhatsAppDetailsConfig {
  return {
    order: "products_first",
    style: "compact",
    heading: formWhatsAppCopy(language).details,
    namePrefix: language === "ckb" ? "بەڕێز" : language === "ar" ? "عزيزي" : "",
    totalLabel: formWhatsAppProductCopy(language).total,
    showLabels: true,
    productLayout: "columns",
  };
}

type Answer = FormSubmission["answers"][number];
const inline = (value: string) => value.replace(/\s+/g, " ").trim();
const labelIdentity = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
const nameKeys = ["personName", "firstName", "lastName"] as const;
const editors = (["en", "ckb", "ar"] as const).map(formEditorCopy);
const nameLabels = new Map(
  editors.flatMap((copy) =>
    nameKeys.map((key) => [labelIdentity(copy[key]), key] as const),
  ),
);
const legacyNames: Record<string, (typeof nameKeys)[number] | undefined> = {
  name: "personName",
  personname: "personName",
  firstname: "firstName",
  lastname: "lastName",
};
const privateLabels = new Set(
  [
    ...editors.flatMap((copy) => [
      copy.national,
      copy.birth,
      copy.age,
      copy.workEmail,
    ]),
    ...(["en", "ckb", "ar"] as const).map((locale) => formsCopy(locale).email),
  ].map(labelIdentity),
);
function nameKey(answer: Answer): (typeof nameKeys)[number] | undefined {
  const declared = nameKeys.find((key) => key === answer.labelKey);
  if (declared) return declared;
  if (answer.questionType && answer.questionType !== "short") return undefined;
  return (
    nameLabels.get(labelIdentity(answer.label)) ||
    legacyNames[answer.questionId.toLowerCase()]
  );
}

function contactPhone(answer: Answer) {
  // Current snapshots declare their type; old validated responses stored E.164.
  // Never interpret an unprefixed order/reference number as a telephone number.
  if (answer.questionType && answer.questionType !== "phone") return null;
  return normalizeInternationalPhoneNumber(answer.value);
}

/** Shared message rendering for real responses and the mock settings preview. */
export function submissionWhatsAppMessage(
  response: FormSubmission,
  language: FormLanguage,
  template?: string,
  detailsConfig?: FormWhatsAppDetailsConfig,
) {
  const fullName = response.answers.find(
    (answer) => nameKey(answer) === "personName",
  );
  const name = inline(
    fullName?.value ||
      nameKeys
        .slice(1)
        .map(
          (key) =>
            response.answers.find((answer) => nameKey(answer) === key)?.value ||
            "",
        )
        .filter(Boolean)
        .join(" "),
  );
  const copy = formWhatsAppCopy(language);
  const config = validFormWhatsAppDetails(detailsConfig)
    ? detailsConfig
    : defaultFormWhatsAppDetails(language);
  const excluded = new Set([
    "email",
    "workEmail",
    "birth",
    "age",
    "national",
    "policy",
  ]);
  const answers = response.answers.filter(
    (answer) =>
      !nameKey(answer) &&
      !contactPhone(answer) &&
      answer.questionType !== "phone" &&
      answer.questionType !== "email" &&
      !excluded.has(answer.labelKey || "") &&
      !privateLabels.has(labelIdentity(answer.label)),
  );
  const details = formatWhatsAppDetails(answers, config, language);
  // Keep large response summaries practical for messaging links, visibly noting omissions.
  const summary =
    details.length > 5000
      ? `${closeWhatsAppCodeBlock(details.slice(0, 5000))}\n… ${copy.remaining}`
      : details;
  const rendered = renderFormWhatsAppTemplate(
    validFormWhatsAppTemplate(template)
      ? template
      : defaultFormWhatsAppTemplate(language),
    {
      name: [config.namePrefix.trim(), name || copy.customer]
        .filter(Boolean)
        .join(" "),
      details: summary
        ? [config.heading.trim(), summary]
            .filter(Boolean)
            .join(config.productLayout === "columns" ? "\n\n" : "\n")
        : "",
    },
  );
  const text = rendered.replace(/\n{3,}/g, "\n\n").trim();
  const message =
    rendered.length >= FORM_WHATSAPP_MESSAGE_LIMIT
      ? `${closeWhatsAppCodeBlock(text)}\n… ${copy.remaining}`
      : text;
  return message;
}

/** Owner-only convenience draft. No network call, analytics event or sent status. */
export function submissionWhatsAppDraft(
  response: FormSubmission,
  language: FormLanguage,
  template?: string,
  detailsConfig?: FormWhatsAppDetailsConfig,
) {
  const candidates = response.answers.filter((answer) => contactPhone(answer));
  const phoneAnswer =
    candidates.find((answer) => answer.labelKey === "phone") || candidates[0];
  const phone = phoneAnswer && contactPhone(phoneAnswer);
  if (!phone) return null;
  const message = submissionWhatsAppMessage(
    response,
    language,
    template,
    detailsConfig,
  );
  return {
    phone,
    message,
    href: appendMessageToUrl(
      `https://wa.me/${phone.slice(1)}`,
      "whatsapp",
      message,
    ),
  };
}
