import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { FormWhatsAppMessagePreview } from "./FormWhatsAppMessagePreview";
import {
  defaultFormWhatsAppDetails,
  defaultFormWhatsAppTemplate,
  formWhatsAppCopy,
  submissionWhatsAppDraft,
} from "../form-submission-whatsapp";
import { formWhatsAppMockSubmission } from "../form-whatsapp-example";
import { formWhatsAppSettingsCopy } from "../form-whatsapp-settings-copy";

it.each(["en", "ckb", "ar"] as const)(
  "shows a complete %s example without a recipient or send action",
  (language) => {
    render(
      <FormWhatsAppMessagePreview
        language={language}
        locale={language}
        template={defaultFormWhatsAppTemplate(language)}
        details={defaultFormWhatsAppDetails(language)}
      />,
    );
    const example = screen.getByRole("region", {
      name: formWhatsAppSettingsCopy(language).example,
    });
    expect(example).toHaveTextContent(formWhatsAppCopy(language).received);
    expect(example).toHaveTextContent("1,500");
    expect(example).toHaveTextContent("3,000");
    expect(example.textContent).not.toContain("{{name}}");
    expect(example.textContent).not.toContain("{{details}}");
    expect(within(example).queryByRole("button")).not.toBeInTheDocument();
    expect(within(example).queryByRole("link")).not.toBeInTheDocument();
    const sample = formWhatsAppMockSubmission(language);
    expect(submissionWhatsAppDraft(sample, language)).toBeNull();
    const realDraft = submissionWhatsAppDraft(
      {
        ...sample,
        answers: [
          ...sample.answers,
          {
            questionId: "phone",
            label: "Phone",
            questionType: "phone",
            value: "+9647501234567",
          },
        ],
      },
      language,
    )!;
    const document = within(example).getByRole("document");
    const table = within(document).getByRole("table");
    expect(table).toHaveClass("w-full", "table-fixed");
    expect(within(table).getAllByRole("columnheader")).toHaveLength(4);
    const product = sample.answers.find((answer) => answer.products)!.products!.items[0];
    expect(within(table).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      product.name, "2", "1,500 IQD", "3,000 IQD",
    ]);
    expect(document).toHaveAttribute("data-form-content");
    // Text surrounding the rich table still matches the actual outgoing draft.
    expect(Array.from(document.children)
      .filter((element) => element.tagName === "SPAN")
      .map((element) => element.textContent).join("")).toBe(
      realDraft.message.replace(/```[\s\S]*?```/g, ""),
    );
  },
);

it("requests valid settings instead of silently previewing default wording", () => {
  render(
    <FormWhatsAppMessagePreview
      language="en"
      locale="en"
      template="{{unknown}}"
      details={defaultFormWhatsAppDetails("en")}
    />,
  );
  expect(screen.getByRole("region")).toHaveTextContent(
    formWhatsAppSettingsCopy("en").previewIncomplete,
  );
  expect(screen.queryByText(/Ismail Dilshad/)).not.toBeInTheDocument();
});
