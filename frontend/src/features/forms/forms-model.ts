import { isProductConfigured } from "./product-selection";
import { createRuntimeId } from "@/lib/utils/random-id";
import { formContentOrder } from "./form-content-order";
import { formsCopy } from "./forms-copy";
import { formEditorCopy } from "./form-editor-copy";
import { isConditionalAnswers } from "./conditional-csv";
import { isFormImage } from "./form-media";
import type {
  FormDraft,
  FormAction,
  FormLanguage,
  FormQuestion,
  QuestionType,
} from "./types";

export function createQuestion(type: QuestionType = "short"): FormQuestion {
  return {
    id: createRuntimeId(),
    type,
    label: "",
    required: true,
    options: type === "choice" ? ["", ""] : [],
    ...(type === "product"
      ? {
          productSelection: {
            currency: "IQD" as const,
            items: [
              { id: createRuntimeId(), name: "", unit: "", unitPrice: null },
            ],
          },
        }
      : {}),
  };
}

/** The management title is independent of the optional public introduction. */
export function formDraftName(form: FormDraft): string {
  return form.name.trim().slice(0, 100);
}

export function createForm(language: FormLanguage = "ckb"): FormDraft {
  const copy = formsCopy(language);
  const editor = formEditorCopy(language);
  return {
    id: createRuntimeId(),
    name: "",
    status: "paused",
    isArchived: false,
    layout: "form",
    language,
    appearance: "dark",
    color: "#ef4444",
    headline: "",
    description: "",
    purpose: "",
    banner: "",
    logo: "",
    blocks: [],
    questions: [
      {
        ...createQuestion(),
        label: editor.personName,
        labelKey: "personName",
        category: "user",
        required: false,
      },
      {
        ...createQuestion("phone"),
        label: copy.phone,
        labelKey: "phone",
        category: "contact",
      },
    ],
    consentRequired: true,
    finalTitle: "",
    finalDescription: "",
    buttonText: "",
    buttonUrl: "",
    updatedAt: new Date().toISOString(),
    bannerEnabled: true,
    bannerMode: "image",
    bannerImages: [],
    logoEnabled: true,
    slogan: "",

    actionsEnabled: true,
    actions: [
      {
        id: createRuntimeId(),
        type: "website",
        text: editor.website,
        textKey: "website",
        url: "",
      },
    ],
    showHandCursor: true,
  };
}

export function duplicateForm(form: FormDraft): FormDraft {
  const questionIds = new Map(
    form.questions.map((question) => [question.id, createRuntimeId()]),
  );
  const blockIds = new Map(
    form.blocks.map((block) => [block.id, createRuntimeId()]),
  );
  return {
    ...form,
    contentOrder: formContentOrder(form).map((id) =>
      id === "questions" ? id : blockIds.get(id)!,
    ),
    id: createRuntimeId(),
    status: "paused",
    isArchived: false,
    archivedAt: null,
    updatedAt: new Date().toISOString(),
    questions: form.questions.map((question) => ({
      ...question,
      id: questionIds.get(question.id)!,
      options: [...question.options],
      productSelection: question.productSelection
        ? {
            ...question.productSelection,
            items: question.productSelection.items.map((item) => ({ ...item })),
          }
        : undefined,
      conditional: question.conditional
        ? {
            columns: [...question.conditional.columns],
            rows: question.conditional.rows.map((row) => [...row]),
          }
        : undefined,
      optionImages: question.optionImages
        ? [...question.optionImages]
        : undefined,
      condition: question.condition
        ? {
            ...question.condition,
            questionId: questionIds.get(question.condition.questionId) ?? "",
          }
        : undefined,
    })),
    bannerImages: form.bannerImages ? [...form.bannerImages] : undefined,
    actions: form.actions?.map((action) => ({
      ...action,
      id: createRuntimeId(),
    })),
    blocks: form.blocks.map((block) => ({
      ...block,
      id: blockIds.get(block.id)!,
      textStyle: block.textStyle ? { ...block.textStyle } : undefined,
      testimonials: block.testimonials?.map((entry) => ({
        ...entry,
        id: createRuntimeId(),
      })),
      products: block.products?.map((product) => ({
        ...product,
        id: createRuntimeId(),
      })),
      images: block.images ? [...block.images] : undefined,
      items: block.items?.map((item) => ({ ...item, id: createRuntimeId() })),
    })),
  };
}

export function isFormUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function formActionUrl(action: FormAction, userAgent = ""): string {
  if (action.type !== "app") return action.url;
  return /Android/i.test(userAgent)
    ? action.googlePlayUrl || action.appStoreUrl || action.url
    : action.appStoreUrl || action.googlePlayUrl || action.url;
}

/** Drafts may be incomplete; only locally ready forms require complete questions. */
export function validateForm(
  form: FormDraft,
): "name" | "url" | "questions" | null {
  if (!form.name.trim()) return "name";
  if (
    (form.buttonUrl &&
      (!isFormUrl(form.buttonUrl) || !form.buttonText.trim())) ||
    form.actions?.some((action) =>
      [action.url, action.appStoreUrl, action.googlePlayUrl].some(
        (url) => url && (!isFormUrl(url) || !action.text.trim()),
      ),
    )
  )
    return "url";
  const media = [
    form.banner,
    form.logo,
    ...(form.bannerImages ?? []),
    ...form.blocks.flatMap((block) => [
      ...(block.images ?? []),
      ...(block.products?.map((product) => product.image).filter(Boolean) ??
        []),
      ...(block.testimonials?.map((entry) => entry.image).filter(Boolean) ??
        []),
    ]),
    ...form.questions.map((question) => question.image ?? ""),
    ...form.questions.flatMap((question) => question.optionImages ?? []),
  ].filter(Boolean);
  if (media.some((image) => !isFormImage(image))) return "url";
  if (
    form.questions.length > 50 ||
    form.questions.some(
      (question) =>
        (question.optionImages?.length ?? 0) > question.options.length ||
        (question.conditional && !isConditionalAnswers(question.conditional)),
    ) ||
    form.blocks.length > 20 ||
    form.blocks.some(
      (block) =>
        (block.type === "steps" || block.type === "faq") &&
        (block.items?.length ?? 0) > 5,
    ) ||
    form.blocks.some(
      (block) =>
        block.type === "testimonials" &&
        block.testimonials &&
        (block.testimonials.length < 2 || block.testimonials.length > 6),
    ) ||
    form.blocks.some(
      (block) =>
        block.type === "products" &&
        block.products &&
        (block.products.length < 2 || block.products.length > 5),
    ) ||
    (form.actions?.length ?? 0) > 5 ||
    (form.bannerImages?.length ?? 0) > 5
  )
    return "questions";
  if (
    form.questions.some(
      (question, index) =>
        question.condition &&
        !form.questions
          .slice(0, index)
          .some(
            (earlier) =>
              earlier.id === question.condition?.questionId &&
              earlier.type === "choice" &&
              earlier.options.includes(question.condition.equals),
          ),
    )
  )
    return "questions";
  if (form.status === "active") {
    if (
      form.actionsEnabled !== false &&
      form.actions?.some(
        (action) => !action.text.trim() || !isFormUrl(formActionUrl(action)),
      )
    )
      return "url";
    if (
      !form.questions.length ||
      form.questions.some(
        (question) =>
          (question.type === "conditional"
            ? !question.conditional
            : !question.label.trim()) ||
          (question.type === "product" &&
            (!question.productSelection?.items.length ||
              !question.productSelection.items.every(isProductConfigured))) ||
          (question.type === "choice" &&
            (question.options.length < 2 ||
              question.options.some((option) => !option.trim()) ||
              new Set(
                question.options.map((option) => option.trim().toLowerCase()),
              ).size !== question.options.length)),
      )
    )
      return "questions";
  }
  return null;
}

/** Move any question without deleting or invalidating conditional rules. */
export function reorderFormQuestions(
  questions: FormQuestion[],
  sourceId: string,
  targetId: string,
): FormQuestion[] {
  const source = questions.findIndex((question) => question.id === sourceId);
  const target = questions.findIndex((question) => question.id === targetId);
  if (source < 0 || target < 0 || source === target) return questions;
  const reordered = [...questions];
  const [question] = reordered.splice(source, 1);
  reordered.splice(target, 0, question);
  const positions = new Map(reordered.map((item, index) => [item.id, index]));
  if (
    reordered.some(
      (item, index) =>
        item.condition &&
        (positions.get(item.condition.questionId) ?? Infinity) >= index,
    )
  )
    return questions;
  return reordered;
}
