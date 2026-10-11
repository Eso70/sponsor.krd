import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormPreview } from "./FormPreview";
import { createForm, createQuestion } from "../forms-model";
import { formsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import { conditionalCopy } from "../conditional-copy";
import { formCardPages, visibleFormQuestions } from "../form-card-pages";
import {
  conditionalSelection,
  formPreviewAnswers,
} from "../form-preview-answers";

const image = "data:image/png;base64,YQ==";
describe("Shared form preview audit", () => {
  for (const layout of ["form", "card"] as const) {
    it(`${layout} keeps the internal name out of the public introduction`, () => {
      const form = {
        ...createForm("en"),
        layout,
        name: "Internal campaign name",
        headline: "",
        description: "A public description",
      };
      const view = render(
        <FormPreview form={form} placeholders={false} presentation="public" />,
      );
      expect(screen.queryByText(form.name)).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
      expect(screen.getByText(form.description)).toBeInTheDocument();
      view.rerender(
        <FormPreview
          form={{ ...form, headline: "An independent public headline" }}
          placeholders={false}
          presentation="public"
        />,
      );
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "An independent public headline",
      );
      expect(screen.queryByText(form.name)).not.toBeInTheDocument();
    });
    it.each(["en", "ar", "ckb"] as const)(
      `${layout} shares branding, banner viewer and isolated appearance in %s`,
      async (language) => {
        const form = {
          ...createForm(language),
          layout,
          headline: "Business",
          description: "Welcome",
          slogan: "Our offer",
          bannerImages: [image],
          logo: image,
        };
        const copy = formsCopy(language);
        const view = render(
          <div className="dark" data-business-dashboard>
            <FormPreview form={form} appearance="light" />
          </div>,
        );
        expect(document.querySelector("[data-form-preview]")).toHaveAttribute(
          "data-appearance",
          "light",
        );
        expect(screen.getByText("Business")).toBeInTheDocument();
        expect(screen.getByText("Our offer")).toBeInTheDocument();
        if (layout === "form") {
          fireEvent.click(
            screen.getByRole("button", {
              name: `${copy.preview}: ${copy.banner}`,
            }),
          );
          expect(
            await screen.findByRole("dialog", { name: copy.banner }),
          ).toBeInTheDocument();
          fireEvent.click(screen.getByRole("button", { name: copy.close }));
        } else {
          expect(
            document.querySelector("[data-form-preview-background] img"),
          ).toHaveAttribute("src", image);
          expect(
            screen.queryByRole("button", {
              name: `${copy.preview}: ${copy.banner}`,
            }),
          ).not.toBeInTheDocument();
        }
        if (layout === "card") {
          fireEvent.click(
            screen.getByRole("button", {
              name: formEditorCopy(language).start,
            }),
          );
          expect(
            document.querySelector("[data-form-preview-background] img"),
          ).toHaveAttribute("src", image);
          expect(screen.getByRole("progressbar")).toBeInTheDocument();
        }
        view.rerender(
          <div className="dark" data-business-dashboard>
            <FormPreview form={form} appearance="dark" finalPage />
          </div>,
        );
        expect(document.querySelector("[data-form-preview]")).toHaveAttribute(
          "data-appearance",
          "dark",
        );
        expect(screen.getByText(copy.thankYou)).toBeInTheDocument();
        if (layout === "form") {
          expect(
            screen.getByRole("button", {
              name: `${copy.preview}: ${copy.banner}`,
            }),
          ).toBeInTheDocument();
        } else {
          expect(
            document.querySelector("[data-form-preview-background] img"),
          ).toHaveAttribute("src", image);
        }
        expect(
          screen.queryByRole("button", {
            name: `${copy.preview}: ${copy.logo}`,
          }),
        ).not.toBeInTheDocument();
        view.rerender(
          <FormPreview form={{ ...form, bannerEnabled: false }} finalPage />,
        );
        expect(
          screen.queryByRole("button", {
            name: `${copy.preview}: ${copy.banner}`,
          }),
        ).not.toBeInTheDocument();
        expect(
          document.querySelector("[data-form-preview-background] img"),
        ).toBeNull();
      },
    );
    it(`${layout} blocks missing required CSV configuration and removes an empty final footer`, () => {
      const form = {
        ...createForm("en"),
        layout,
        questions: [{ ...createQuestion("conditional"), id: "csv" }],
        actions: [],
      };
      const view = render(<FormPreview form={form} />);
      if (layout === "card")
        fireEvent.click(
          screen.getByRole("button", { name: formEditorCopy("en").start }),
        );
      expect(screen.getByText(conditionalCopy("en").empty)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: formsCopy("en").submit }),
      ).toBeDisabled();
      view.rerender(<FormPreview form={form} finalPage />);
      expect(screen.getByText(formsCopy("en").thankYou)).toBeInTheDocument();
      expect(document.querySelector("[data-form-preview] footer")).toBeNull();
      expect(
        screen.queryByText(formEditorCopy("en").finalDefault),
      ).not.toBeInTheDocument();
    });
    it(`${layout} rejects whitespace-only required text and negative or fractional ages`, () => {
      const initial = createForm("en");
      const form = {
        ...initial,
        layout,
        questions: [
          { ...initial.questions[0], required: true },
          {
            ...createQuestion(),
            label: "Age",
            labelKey: "age" as const,
            category: "user",
          },
        ],
      };
      render(<FormPreview form={form} />);
      if (layout === "card")
        fireEvent.click(screen.getByRole("button", { name: "Start" }));
      const name = screen.getByRole("textbox", { name: "Name" });
      const age = screen.getByRole("spinbutton", { name: "Age" });
      fireEvent.change(name, { target: { value: "   " } });
      fireEvent.change(age, { target: { value: "22" } });
      expect(name).toBeInvalid();
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
      expect(
        screen.queryByText(formsCopy("en").thankYou),
      ).not.toBeInTheDocument();
      fireEvent.change(name, { target: { value: "Person" } });
      for (const value of ["-1", "1.5"]) {
        fireEvent.change(age, { target: { value } });
        expect(age).toBeInvalid();
        fireEvent.click(screen.getByRole("button", { name: "Send" }));
        expect(
          screen.queryByText(formsCopy("en").thankYou),
        ).not.toBeInTheDocument();
      }
      fireEvent.change(age, { target: { value: "22" } });
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
      expect(screen.getByText(formsCopy("en").thankYou)).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Preview" })).toHaveFocus();
    });
    it(`${layout} invalidates obsolete choice answers after an editor change`, () => {
      const source = {
        ...createQuestion("choice"),
        id: "choice",
        label: "Choose",
        options: ["A", "B"],
      };
      const dependent = {
        ...createQuestion(),
        id: "child",
        label: "Details",
        required: false,
        condition: { questionId: "choice", equals: "A" },
      };
      const form = {
        ...createForm("en"),
        layout,

        questions: [source, dependent],
      };
      const view = render(<FormPreview form={form} />);
      if (layout === "card")
        fireEvent.click(screen.getByRole("button", { name: "Start" }));
      fireEvent.click(screen.getByRole("radio", { name: "A" }));
      view.rerender(
        <FormPreview
          form={{
            ...form,
            questions: [{ ...source, options: ["C", "B"] }, dependent],
          }}
        />,
      );
      expect(screen.getByRole("radio", { name: "C" })).not.toBeChecked();
      expect(
        screen.queryByRole("textbox", { name: "Details" }),
      ).not.toBeInTheDocument();
      if (layout === "card")
        expect(screen.getByRole("progressbar")).toHaveAttribute(
          "aria-valuemax",
          "1",
        );
    });
  }
  it("keeps interleaved personal and custom questions in their authored order", () => {
    const form = createForm("en");
    const custom = {
      ...createQuestion("choice"),
      id: "source",
      label: "Source",
      options: ["A", "B"],
    };
    const personal = {
      ...form.questions[1],
      condition: { questionId: custom.id, equals: "A" },
    };
    const pages = formCardPages([form.questions[0], custom, personal]);
    expect(
      pages.flatMap((page) => page.questions.map((question) => question.id)),
    ).toEqual([form.questions[0].id, "source", personal.id]);
    expect(new Set(pages.map((page) => page.id)).size).toBe(3);
    expect(
      visibleFormQuestions(
        { ...form, questions: [custom, personal] },
        { source: "obsolete" },
      ),
    ).toEqual([custom]);
  });
  it("revalidates CSV paths after replacing a dataset, keeping only a valid prefix", () => {
    const data = {
      columns: ["Country", "City"],
      rows: [
        ["Iraq", "Baghdad"],
        ["Iran", "Tehran"],
      ],
    };
    expect(
      conditionalSelection(data, JSON.stringify(["Iraq", "Tehran"])),
    ).toEqual(["Iraq", ""]);
    expect(conditionalSelection(data, "invalid")).toEqual(["", ""]);
    const question = {
      ...createQuestion("conditional"),
      id: "csv",
      conditional: data,
    };
    expect(
      formPreviewAnswers(
        { ...createForm("en"), questions: [question] },
        { csv: JSON.stringify(["Removed", "Baghdad"]) },
      ),
    ).toEqual({ csv: '["",""]' });
  });
});
