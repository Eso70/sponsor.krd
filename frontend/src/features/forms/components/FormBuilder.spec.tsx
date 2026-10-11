import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormEditorDrawer } from "./FormEditorDrawer";
import { FormPreview } from "./FormPreview";
import { createForm, createQuestion } from "../forms-model";
import { formsCopy } from "../forms-copy";
import { isFormImage, readFormImage } from "../form-media";
import { formEditorCopy } from "../form-editor-copy";

function namedForm() {
  return { ...createForm("en"), headline: "Contact" };
}

describe("Form layout builder", () => {
  it("keeps choice images attached on insert/remove and opens them without selecting an answer", async () => {
    const images = [
      "data:image/png;base64,YQ==",
      "data:image/png;base64,Yg==",
      "data:image/png;base64,Yw==",
    ];
    const save = vi.fn();
    render(
      <FormEditorDrawer
        initialForm={{
          ...namedForm(),
          questions: [
            {
              ...createQuestion("choice"),
              options: ["A", "B", "C"],
              optionImages: images,
            },
          ],
        }}
        copy={formsCopy("en")}
        onSave={save}
        onClose={vi.fn()}
      />,
    );
    const row = within(screen.getByText("Q1").closest("details")!);
    fireEvent.change(row.getByRole("textbox", { name: "Description" }), {
      target: { value: "Choose a product." },
    });
    const preview = within(
      screen.getByRole("complementary", { name: "Preview" }),
    );
    fireEvent.click(preview.getByRole("button", { name: "Preview: A" }));
    expect(
      await screen.findByRole("dialog", { name: "A" }),
    ).toBeInTheDocument();
    expect(preview.getByRole("radio", { name: "A" })).not.toBeChecked();
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "A" })).getByRole("button", {
        name: "Close",
      }),
    );
    fireEvent.click(row.getByRole("button", { name: "Delete Options 2" }));
    fireEvent.click(row.getByRole("button", { name: "Add option" }));
    fireEvent.click(screen.getByRole("button", { name: "Save form" }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: [
          expect.objectContaining({
            options: ["A", "C", ""],
            optionImages: [images[0], images[2], ""],
            description: "Choose a product.",
          }),
        ],
      }),
    );
  });
  it("edits and saves short-answer guidance and associates it with the preview input", () => {
    const save = vi.fn();
    render(
      <FormEditorDrawer
        initialForm={{ ...namedForm(), questions: [createQuestion()] }}
        copy={formsCopy("en")}
        onSave={save}
        onClose={vi.fn()}
      />,
    );
    const row = screen.getByText("Q1").closest("details")!;
    fireEvent.change(
      within(row).getByRole("textbox", { name: "Question label" }),
      { target: { value: "Your project" } },
    );
    fireEvent.change(
      within(row).getByRole("textbox", { name: "Description" }),
      { target: { value: "Tell us what you need." } },
    );
    const preview = within(
      screen.getByRole("complementary", { name: "Preview" }),
    );
    expect(
      preview.getByRole("textbox", { name: "Your project" }),
    ).toHaveAccessibleDescription("Tell us what you need.");
    fireEvent.click(screen.getByRole("button", { name: "Save form" }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: [
          expect.objectContaining({
            label: "Your project",
            description: "Tell us what you need.",
          }),
        ],
      }),
    );
  });
  it("uses matching Add popovers and excludes national ID from personal choices", () => {
    const save = vi.fn();
    render(
      <FormEditorDrawer
        initialForm={namedForm()}
        copy={formsCopy("en")}
        onSave={save}
        onClose={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole("button", { name: "+ Add question" });
    expect(buttons).toHaveLength(2);
    expect(buttons[0].className).toBe(buttons[1].className);
    fireEvent.click(buttons[1]);
    const menu = screen.getByRole("listbox", { name: "Personal information" });
    expect(
      within(menu).queryByText("National ID number"),
    ).not.toBeInTheDocument();
    expect(
      within(menu)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([
      "Phone number",
      "Email",
      "Address",
      "Country",
      "City",
      "Province/State",
      "ZIP code",
      "First name",
      "Last name",
      "Name",
      "Date of birth",
      "Age",
      "Company name",
      "Job title",
      "Work email",
      "Work phone number",
    ]);
    expect(within(menu).queryByText("Demographics")).not.toBeInTheDocument();
    fireEvent.click(within(menu).getByRole("option", { name: "Phone number" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save form" }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: expect.arrayContaining([
          expect.objectContaining({ labelKey: "phone", category: "contact" }),
        ]),
      }),
    );
  });
  it("adds and deletes collapsed custom rows while preserving personal questions without a logic switch", () => {
    const save = vi.fn();
    render(
      <FormEditorDrawer
        initialForm={namedForm()}
        copy={formsCopy("en")}
        onSave={save}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("textbox", { name: "Purpose statement" }).tagName,
    ).toBe("INPUT");
    expect(
      screen.queryByRole("switch", { name: "Logic settings" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("button", { name: "+ Add question" })[0],
    );
    fireEvent.click(screen.getByRole("option", { name: "Short answer" }));
    expect(screen.getByText("Q3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete Q3" }));
    expect(screen.queryByText("Q3")).not.toBeInTheDocument();
    expect(screen.getByText("Q1")).toBeInTheDocument();
    expect(screen.getByText("Q2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save form" }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: expect.arrayContaining([
          expect.objectContaining({ labelKey: "phone" }),
          expect.objectContaining({ labelKey: "personName" }),
        ]),
      }),
    );
  });
  it("keeps the introduction visible without an off switch", () => {
    render(
      <FormEditorDrawer
        initialForm={{ ...namedForm(), headline: "Welcome" }}
        copy={formsCopy("en")}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const preview = within(
      screen.getByRole("complementary", { name: "Preview" }),
    );
    expect(
      screen.queryByRole("switch", { name: "Introduction" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Introduction" }));
    fireEvent.click(screen.getByRole("button", { name: "Introduction" }));
    expect(preview.getByText("Welcome")).toBeInTheDocument();
  });
  it("keeps Send outside the scrolling body while preserving native answer and consent validation", () => {
    render(<FormPreview scrollable form={namedForm()} />);
    const send = screen.getByRole("button", {
      name: "Send",
    }) as HTMLButtonElement;
    const body = screen.getByRole("region", { name: "Preview" });
    expect(body).not.toContainElement(send);
    expect(send.closest("footer")).not.toBeNull();
    expect(send.form).toBe(body.querySelector("form"));
    const consent = screen.getByRole("checkbox", {
      name: "I agree to the privacy policy",
    }) as HTMLInputElement;
    expect(send.closest("footer")).toContainElement(consent);
    expect(body).not.toContainElement(consent);
    expect(consent.form).toBe(send.form);
    expect(consent).toBeChecked();
    fireEvent.click(consent);
    fireEvent.click(send);
    expect(
      screen.queryByText("Thank you for your response!"),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Phone number" }), {
      target: { value: "+9647501234567" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Person" },
    });
    fireEvent.click(send);
    expect(
      screen.queryByText("Thank you for your response!"),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("checkbox", { name: "I agree to the privacy policy" }),
    );
    fireEvent.click(send);
    expect(
      screen.getByText("Thank you for your response!"),
    ).toBeInTheDocument();
  });
  it("uses compact collapsible content sections, retains edits and saves only a local draft", () => {
    const save = vi.fn();
    render(
      <FormEditorDrawer
        initialForm={{ ...namedForm(), name: "Contact form" }}
        copy={formsCopy("en")}
        onSave={save}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("textbox", { name: "Form name" }),
    ).not.toBeInTheDocument();
    const banner = screen.getByRole("button", { name: "Banner" });
    expect(banner).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: "Questions (2)" }),
    ).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: "Introduction" }));
    expect(banner).toHaveAttribute("aria-expanded", "false");
    const headline = screen.getByRole("textbox", { name: "Headline" });
    expect(headline).toHaveAttribute("placeholder");
    fireEvent.change(headline, { target: { value: "سڵاو" } });
    fireEvent.click(screen.getByRole("button", { name: "Privacy" }));
    expect(
      screen.getByRole("button", { name: "Introduction" }),
    ).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByRole("button", { name: "Introduction" }));
    expect(screen.getByRole("textbox", { name: "Headline" })).toHaveValue(
      "سڵاو",
    );
    expect(
      within(screen.getByRole("tablist", { name: "Form editor" }))
        .getAllByRole("tab")
        .map((tab) => tab.textContent),
    ).toEqual(["Content", "Final page"]);
    fireEvent.click(screen.getByRole("button", { name: "Save form" }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "سڵاو",
        headline: "سڵاو",
        status: "paused",
      }),
    );
  });
  it("updates optional sections and final buttons while preview preferences preserve authored text", () => {
    const save = vi.fn();
    render(
      <FormEditorDrawer
        initialForm={{ ...namedForm(), name: "Contact", headline: "سڵاو" }}
        copy={formsCopy("en")}
        onSave={save}
        onClose={vi.fn()}
      />,
    );
    const preview = within(
      screen.getByRole("complementary", { name: "Preview" }),
    );
    expect(
      preview.queryByText(formsCopy("en").previewHint),
    ).not.toBeInTheDocument();
    expect(preview.queryByText("Preview language")).not.toBeInTheDocument();
    expect(preview.queryByText("Preview theme")).not.toBeInTheDocument();
    fireEvent.click(preview.getByRole("button", { name: "Theme" }));
    fireEvent.click(screen.getByRole("option", { name: "Dark" }));
    expect(preview.getByText("سڵاو")).toBeInTheDocument();
    fireEvent.click(preview.getByRole("button", { name: "Language" }));
    fireEvent.click(screen.getByRole("option", { name: "العربية" }));
    expect(preview.getByText("سڵاو")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "Banner" }));
    fireEvent.click(screen.getByRole("tab", { name: "Final page" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Website URL" }), {
      target: { value: "javascript:alert(1)" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save form" }));
    expect(
      screen.getByRole("textbox", { name: "Website URL" }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(save).not.toHaveBeenCalled();
    expect(preview.queryByRole("link")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Website URL" }), {
      target: { value: "https://example.com" },
    });
    expect(
      preview.getByRole("link", { name: formEditorCopy("ar").website }),
    ).toHaveAttribute("href", "https://example.com");
    fireEvent.click(screen.getByRole("button", { name: "Save form" }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        bannerEnabled: false,
        appearance: "dark",
        language: "en",
        headline: "سڵاو",
        actions: [expect.objectContaining({ url: "https://example.com" })],
      }),
    );
  });
  it("shows conditional questions only for the matching visible source answer", () => {
    const source = {
      ...createQuestion("choice"),
      label: "Interested?",
      options: ["Yes", "No"],
    };
    render(
      <FormPreview
        form={{
          ...namedForm(),

          questions: [
            source,
            {
              ...createQuestion(),
              label: "Details",
              condition: { questionId: source.id, equals: "Yes" },
            },
          ],
        }}
      />,
    );
    expect(
      screen.queryByRole("textbox", { name: "Details" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));
    expect(
      screen.getByRole("textbox", { name: "Details" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "No" }));
    expect(
      screen.queryByRole("textbox", { name: "Details" }),
    ).not.toBeInTheDocument();
  });
  it.each(["ckb", "ar", "en"] as const)(
    "localizes all built-in form text in %s without changing authored content",
    (language) => {
      const copy = formsCopy(language);
      const labels = formEditorCopy(language);
      const form = {
        ...namedForm(),
        headline: "Written headline",
        description: "Written description",
        actions: [
          {
            id: "action",
            type: "website" as const,
            text: "View website",
            textKey: "website" as const,
            url: "https://example.com",
          },
        ],
      };
      const { rerender } = render(
        <FormPreview form={form} language={language} placeholders />,
      );
      expect(screen.getByText("Written headline")).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: copy.phone })).toHaveAttribute(
        "placeholder",
        copy.phone,
      );
      expect(
        screen.getByRole("textbox", { name: labels.personName }),
      ).toHaveAttribute("placeholder", labels.enterAnswer);
      fireEvent.mouseEnter(
        screen.getByRole("button", { name: labels.privacyHelp }),
      );
      expect(
        screen.getByRole("link", { name: copy.policy }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", { name: copy.consentText }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: copy.submit }),
      ).toBeInTheDocument();
      rerender(
        <FormPreview form={form} language={language} placeholders finalPage />,
      );
      expect(screen.getByText(copy.thankYou)).toBeInTheDocument();
      expect(screen.getByText(labels.finalDefault)).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: labels.website }),
      ).toBeInTheDocument();
    },
  );
  it("treats an edited default label as authored text after switching preview language", () => {
    render(
      <FormEditorDrawer
        initialForm={namedForm()}
        copy={formsCopy("en")}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const question = screen.getByText("Q2").closest("details")!;
    fireEvent.click(question.querySelector("summary")!);
    const label = within(question).getByRole("textbox", {
      name: "Question label",
    });
    fireEvent.change(label, { target: { value: "My email" } });
    fireEvent.change(label, {
      target: { value: "Email" },
    });
    const preview = within(
      screen.getByRole("complementary", { name: "Preview" }),
    );
    fireEvent.click(preview.getByRole("button", { name: "Language" }));
    fireEvent.click(screen.getByRole("option", { name: "العربية" }));
    expect(preview.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
    expect(
      preview.getByRole("textbox", { name: formEditorCopy("ar").personName }),
    ).toBeInTheDocument();
    expect(
      preview.getByRole("button", { name: formEditorCopy("ar").language }),
    ).toBeInTheDocument();
    expect(
      preview.getByRole("button", { name: formEditorCopy("ar").theme }),
    ).toBeInTheDocument();
  });
  it("rejects SVG, remote images and oversized local uploads", async () => {
    expect(isFormImage("data:image/svg+xml;base64,AAA=")).toBe(false);
    expect(isFormImage("https://example.com/tracker.png")).toBe(false);
    await expect(
      readFormImage(new File(["svg"], "image.svg", { type: "image/svg+xml" })),
    ).rejects.toThrow();
    await expect(
      readFormImage(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
          type: "image/png",
        }),
      ),
    ).rejects.toThrow();
  });
  it("keeps the preview appearance and entered answers when the dashboard theme changes", () => {
    const form = namedForm();
    const { rerender } = render(
      <div className="light">
        <FormPreview form={form} appearance="light" scrollable />
      </div>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Phone number" }), {
      target: { value: "+9647501234567" },
    });
    rerender(
      <div className="dark">
        <FormPreview form={form} appearance="light" scrollable />
      </div>,
    );
    expect(
      screen
        .getByRole("region", { name: "Preview" })
        .closest("[data-appearance]"),
    ).toHaveAttribute("data-appearance", "light");
    expect(screen.getByRole("textbox", { name: "Phone number" })).toHaveValue(
      "+9647501234567",
    );
    rerender(
      <div className="light">
        <FormPreview form={form} appearance="dark" scrollable />
      </div>,
    );
    expect(
      screen
        .getByRole("region", { name: "Preview" })
        .closest("[data-appearance]"),
    ).toHaveAttribute("data-appearance", "dark");
  });
});
