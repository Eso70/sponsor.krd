import { isProductConfigured, validProductPrice } from "./product-selection";
import { formDraftName, isFormUrl, validateForm } from "./forms-model";
import { isFormImage } from "./form-media";
import { isConditionalAnswers } from "./conditional-csv";
import type { FormDraft } from "./types";
import type { FormsCopy } from "./forms-copy";

export type FormEditorIssue = {
  field: string;
  section:
    "title" | "introduction" | "questions" | "final" | "banner" | "component";
  message: string;
  questionId?: string;
  actionId?: string;
  blockId?: string;
};

/** Preserve draft saving rules while giving each known failure a concrete target. */
export function formEditorIssues(
  form: FormDraft,
  copy: FormsCopy,
): FormEditorIssue[] {
  const issues: FormEditorIssue[] = [];
  if (!form.name.trim())
    issues.push({
      field: "name",
      section: "title",
      message: copy.nameError,
    });
  if (!form.questions.length)
    issues.push({
      field: "questions",
      section: "questions",
      message: copy.noQuestionsError,
    });
  const imageIssue = (
    image: string,
    field: string,
    section: FormEditorIssue["section"],
    blockId?: string,
    questionId?: string,
  ) => {
    if (image && !isFormImage(image))
      issues.push({
        field,
        section,
        blockId,
        questionId,
        message: copy.imageError,
      });
  };
  imageIssue(form.banner, "banner", "banner");
  imageIssue(form.logo, "logo", "introduction");
  form.bannerImages?.forEach((image, index) =>
    imageIssue(image, `bannerImages.${index}`, "banner"),
  );
  form.blocks.forEach((block) => {
    block.images?.forEach((image, index) =>
      imageIssue(
        image,
        `blocks.${block.id}.images.${index}`,
        "component",
        block.id,
      ),
    );
    block.products?.forEach((product, index) =>
      imageIssue(
        product.image,
        `blocks.${block.id}.products.${index}.image`,
        "component",
        block.id,
      ),
    );
    block.testimonials?.forEach((entry, index) =>
      imageIssue(
        entry.image,
        `blocks.${block.id}.testimonials.${index}.image`,
        "component",
        block.id,
      ),
    );
  });
  for (const action of form.actions ?? []) {
    const target = { section: "final" as const, actionId: action.id };
    const urls =
      action.type === "app"
        ? (["appStoreUrl", "googlePlayUrl", "url"] as const)
        : (["url"] as const);
    for (const key of urls) {
      const url = action[key];
      if (url && !isFormUrl(url))
        issues.push({
          ...target,
          field: `actions.${action.id}.${key}`,
          message: copy.invalidUrlError,
        });
    }
    const hasUrl = urls.some((key) => !!action[key]);
    if (
      (hasUrl || (form.status === "active" && form.actionsEnabled !== false)) &&
      !action.text.trim()
    )
      issues.push({
        ...target,
        field: `actions.${action.id}.text`,
        message: copy.requiredTextError,
      });
    if (!hasUrl && form.status === "active" && form.actionsEnabled !== false)
      issues.push({
        ...target,
        field: `actions.${action.id}.${action.type === "app" ? "appStoreUrl" : "url"}`,
        message: copy.invalidUrlError,
      });
  }
  form.questions.forEach((question, index) => {
    const target = { section: "questions" as const, questionId: question.id };
    const prefix = `Q${index + 1}: `;
    if (
      question.type === "product" &&
      ((form.status === "active" &&
        (!question.productSelection?.items.length ||
          !question.productSelection.items.every(isProductConfigured))) ||
        question.productSelection?.items.some(
          (item) =>
            item.unitPrice !== null && !validProductPrice(item.unitPrice),
        ))
    )
      issues.push({
        ...target,
        field: `questions.${question.id}.label`,
        message: prefix + copy.productSelectionError,
      });
    imageIssue(
      question.image ?? "",
      `questions.${question.id}.image`,
      "questions",
      undefined,
      question.id,
    );
    question.optionImages?.forEach((image, optionIndex) =>
      imageIssue(
        image,
        `questions.${question.id}.optionImages.${optionIndex}`,
        "questions",
        undefined,
        question.id,
      ),
    );
    if (
      question.type === "choice" &&
      form.status === "active" &&
      question.options.length < 2
    )
      issues.push({
        ...target,
        field: `questions.${question.id}.options`,
        message: prefix + copy.questionsError,
      });
    if (
      form.status === "active" &&
      !question.label.trim() &&
      question.type !== "conditional"
    )
      issues.push({
        ...target,
        field: `questions.${question.id}.label`,
        message: prefix + copy.requiredTextError,
      });
    if (question.type === "choice" && form.status === "active") {
      question.options.forEach((option, optionIndex) => {
        const duplicate = question.options.some(
          (other, otherIndex) =>
            otherIndex !== optionIndex &&
            other.trim().toLowerCase() === option.trim().toLowerCase(),
        );
        if (!option.trim() || duplicate)
          issues.push({
            ...target,
            field: `questions.${question.id}.options.${optionIndex}`,
            message:
              prefix +
              (!option.trim()
                ? copy.requiredTextError
                : copy.duplicateOptionError),
          });
      });
    }
    if (
      (question.conditional && !isConditionalAnswers(question.conditional)) ||
      (question.type === "conditional" &&
        form.status === "active" &&
        !question.conditional)
    )
      issues.push({
        ...target,
        field: `questions.${question.id}.conditional`,
        message: prefix + copy.conditionalError,
      });
    if (
      question.condition &&
      !form.questions
        .slice(0, index)
        .some(
          (earlier) =>
            earlier.id === question.condition?.questionId &&
            earlier.type === "choice" &&
            earlier.options.includes(question.condition.equals),
        )
    )
      issues.push({
        ...target,
        field: `questions.${question.id}.condition`,
        message: prefix + copy.conditionError,
      });
  });
  const validation = validateForm({ ...form, name: formDraftName(form) });
  if (
    validation &&
    !issues.some((issue) =>
      validation === "url"
        ? issue.section === "final" || issue.message === copy.imageError
        : validation === "questions"
          ? issue.section === "questions"
          : issue.field === "name",
    )
  )
    issues.push({
      field: validation,
      section: validation === "url" ? "final" : "questions",
      message: validation === "url" ? copy.urlError : copy.questionsError,
    });
  return issues;
}
