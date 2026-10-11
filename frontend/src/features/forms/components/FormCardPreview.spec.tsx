import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormPreview } from "./FormPreview";
import { createForm, createQuestion } from "../forms-model";
import { formEditorCopy } from "../form-editor-copy";
import { formsCopy } from "../forms-copy";
import { formCardPages } from "../form-card-pages";
import { formText } from "../forms-localization";

describe("Card layout preview", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "groups personal fields, retains answers and respects consent in %s",
    (language) => {
      const form = {
        ...createForm(language),
        layout: "card" as const,
        headline: "Our business",
        displayTimeEstimate: true,
      };
      const copy = formsCopy(language),
        labels = formEditorCopy(language);
      render(<FormPreview form={form} appearance="light" scrollable />);
      const surface = document.querySelector("[data-card-preview]");
      expect(surface).toHaveAttribute("data-appearance", "light");
      expect(surface).toHaveAttribute("dir", language === "en" ? "ltr" : "rtl");
      expect(screen.getByText("Our business")).toBeInTheDocument();
      expect(screen.getByText(new RegExp(labels.minutes))).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: labels.start }));
      const name = formText(
        form.questions[0].label,
        form.questions[0].labelKey,
        language,
      );
      const phone = formText(
        form.questions[1].label,
        form.questions[1].labelKey,
        language,
      );
      expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-valuemax",
        "1",
      );
      expect(screen.getByRole("textbox", { name })).not.toBeRequired();
      expect(screen.getByRole("textbox", { name: phone })).toBeRequired();
      fireEvent.change(screen.getByRole("textbox", { name }), {
        target: { value: "Person" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: phone }), {
        target: { value: "07501234567" },
      });
      fireEvent.click(screen.getByRole("button", { name: copy.back }));
      fireEvent.click(screen.getByRole("button", { name: labels.start }));
      expect(screen.getByRole("textbox", { name })).toHaveValue("Person");
      const consent = screen.getByRole("checkbox", { name: copy.consentText });
      expect(consent).toBeChecked();
      fireEvent.click(consent);
      expect(consent).not.toBeChecked();
      expect(consent).toHaveAttribute(
        "form",
        document.querySelector("form")!.id,
      );
      fireEvent.click(screen.getByRole("button", { name: copy.submit }));
      expect(screen.queryByText(copy.thankYou)).not.toBeInTheDocument();
      fireEvent.click(consent);
      fireEvent.click(screen.getByRole("button", { name: copy.submit }));
      expect(screen.getByText(copy.thankYou)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", {
          name: /Start again|دەستپێکردنەوە|البدء مجددًا/,
        }),
      ).not.toBeInTheDocument();
    },
  );
  it("skips hidden question cards and keeps navigation valid when a condition changes", () => {
    const source = {
      ...createQuestion("choice"),
      id: "source",
      label: "Choose",
      options: ["Yes", "No"],
    };
    const dependent = {
      ...createQuestion(),
      id: "dependent",
      label: "Details",
      condition: { questionId: "source", equals: "Yes" },
    };
    const form = {
      ...createForm("en"),
      layout: "card" as const,

      questions: [source, dependent],
      consentRequired: false,
    };
    render(<FormPreview form={form} />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Details" }), {
      target: { value: "Saved" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("radio", { name: "No" }));
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuemax",
      "1",
    );
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText(formsCopy("en").thankYou)).toBeInTheDocument();
  });
  it("keeps footer buttons and preview arrows without numeric card counters", () => {
    const form = { ...createForm("en"), layout: "card" as const };
    render(<FormPreview form={form} placeholders />);
    expect(
      screen.getByRole("navigation", { name: "Preview pages" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.queryByText(/^\d+\s*\/\s*\d+$/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Phone number" }), {
      target: { value: "07501234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText(formsCopy("en").thankYou)).toBeInTheDocument();
  });
  it("keeps grouped fields in their authored order", () => {
    const form = createForm("en");
    const custom = { ...createQuestion(), id: "custom" };
    const pages = formCardPages([custom, ...form.questions]);
    expect(pages.map((page) => page.id)).toEqual(["custom", "personal"]);
    expect(pages[1].questions).toEqual(form.questions);
  });
});
