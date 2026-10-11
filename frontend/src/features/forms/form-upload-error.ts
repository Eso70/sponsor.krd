import type { FormDraft } from "./types";
import type { FormsCopy } from "./forms-copy";
import { formEditorCopy } from "./form-editor-copy";
import type { FormEditorIssue } from "./form-editor-validation";

/** Identifies a failed asset without exposing server details in the interface. */
export class FormUploadError extends Error {
  constructor(
    readonly image: string,
    readonly cause: unknown,
  ) {
    super("Form image upload failed");
    this.name = "FormUploadError";
  }
}

/** Locate every use of a failed upload, including assets reused in several places. */
export function formUploadIssues(
  form: FormDraft,
  image: string,
  copy: FormsCopy,
): FormEditorIssue[] {
  const labels = formEditorCopy(form.language);
  const issues: FormEditorIssue[] = [];
  const add = (
    value: string | undefined,
    field: string,
    section: FormEditorIssue["section"],
    message: string,
    target: Pick<FormEditorIssue, "questionId" | "blockId"> = {},
  ) => {
    if (value === image) issues.push({ field, section, message, ...target });
  };
  add(
    form.logo,
    "logo",
    "introduction",
    `${form.layout === "card" ? labels.welcome : labels.introduction} � ${copy.logo}`,
  );
  add(form.banner, "banner", "banner", copy.banner);
  form.bannerImages?.forEach((value, index) =>
    add(
      value,
      `bannerImages.${index}`,
      "banner",
      `${copy.banner} ${index + 1}`,
    ),
  );
  form.questions.forEach((question, index) => {
    const title = `Q${index + 1}${question.label ? ` � ${question.label}` : ""}`;
    const target = { questionId: question.id };
    add(
      question.image,
      `questions.${question.id}.image`,
      "questions",
      `${title} � ${labels.image}`,
      target,
    );
    question.optionImages?.forEach((value, option) =>
      add(
        value,
        `questions.${question.id}.optionImages.${option}`,
        "questions",
        `${title} � ${copy.options} ${option + 1}${question.options[option] ? ` � ${question.options[option]}` : ""}`,
        target,
      ),
    );
  });
  form.blocks.forEach((block, index) => {
    const title = `${labels[block.type ?? "text"]} ${index + 1}${block.title ? ` � ${block.title}` : ""}`;
    const target = { blockId: block.id };
    block.images?.forEach((value, item) =>
      add(
        value,
        `blocks.${block.id}.images.${item}`,
        "component",
        `${title} � ${labels.image} ${item + 1}`,
        target,
      ),
    );
    for (const key of ["products", "testimonials"] as const)
      block[key]?.forEach((entry, item) =>
        add(
          entry.image,
          `blocks.${block.id}.${key}.${item}.image`,
          "component",
          `${title} � ${labels.image} ${item + 1}${entry.title ? ` � ${entry.title}` : ""}`,
          target,
        ),
      );
  });
  return issues;
}
