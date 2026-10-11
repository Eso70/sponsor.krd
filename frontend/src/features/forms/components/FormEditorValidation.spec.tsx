import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formEditorCopy } from "../form-editor-copy";
import { FormUploadError } from "../form-upload-error";
import { ApiRequestError } from "@/lib/api/request";
import { FormEditorDrawer } from "./FormEditorDrawer";
import { createForm, createQuestion } from "../forms-model";
import { formsCopy } from "../forms-copy";
import { formsApi } from "../api";
vi.mock("../api", () => ({
  formsApi: {
    titleAvailability: vi.fn(async () => ({
      slug: "contact",
      available: true,
    })),
  },
}));
beforeEach(() =>
  vi
    .mocked(formsApi.titleAvailability)
    .mockResolvedValue({ slug: "contact", available: true }),
);

it.each(["business", "platform"] as const)(
  "blocks an unavailable title inline during creation and editing in %s",
  async (scope) => {
    const copy = formsCopy("en");
    for (const isNew of [true, false]) {
      const save = vi.fn();
      vi.mocked(formsApi.titleAvailability).mockResolvedValue({
        slug: "taken",
        available: false,
      });
      const view = render(
        <FormEditorDrawer
          scope={scope}
          initialForm={{ ...createForm("en"), name: "Taken" }}
          isNew={isNew}
          copy={copy}
          onSave={save}
          onClose={vi.fn()}
        />,
      );
      if (isNew)
        fireEvent.click(screen.getByRole("button", { name: copy.next }));
      fireEvent.click(
        screen.getByRole("button", { name: isNew ? copy.create : copy.save }),
      );
      const field = screen.getByRole("textbox", { name: copy.name });
      await waitFor(() =>
        expect(field).toHaveAccessibleDescription(copy.titleTaken),
      );
      await waitFor(() => expect(field).toHaveFocus());
      expect(save).not.toHaveBeenCalled();
      fireEvent.change(field, { target: { value: "Available title" } });
      vi.mocked(formsApi.titleAvailability).mockResolvedValue({
        slug: "available-title",
        available: true,
      });
      fireEvent.click(
        screen.getByRole("button", { name: isNew ? copy.create : copy.save }),
      );
      await waitFor(() =>
        expect(save).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Available title", headline: "" }),
        ),
      );
      view.unmount();
    }
  },
);

for (const layout of ["form", "card"] as const) {
  describe(`${layout} inline creation validation`, () => {
    for (const locale of ["en", "ar", "ckb"] as const) {
      it(`reveals and focuses the missing title in ${locale} without saving`, async () => {
        const copy = formsCopy(locale),
          save = vi.fn();
        render(
          <FormEditorDrawer
            initialForm={{ ...createForm(locale), layout }}
            isNew
            copy={copy}
            onSave={save}
            onClose={vi.fn()}
          />,
        );
        fireEvent.click(screen.getByRole("button", { name: copy.next }));
        fireEvent.click(screen.getByRole("button", { name: copy.create }));
        const field = screen.getByRole("textbox", { name: copy.name });
        expect(field).toHaveFocus();
        expect(field).toHaveAttribute("aria-invalid", "true");
        expect(field).toHaveAccessibleDescription(copy.nameError);
        expect(save).not.toHaveBeenCalled();
        fireEvent.change(field, { target: { value: "Contact us" } });
        expect(field).not.toHaveAttribute("aria-invalid", "true");
        expect(screen.queryByText(copy.nameError)).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: copy.create }));
        await waitFor(() =>
          expect(save).toHaveBeenCalledWith(
            expect.objectContaining({
              name: "Contact us",
              headline: "",
              layout,
            }),
          ),
        );
      });
    }
  });
}

describe("editor error feedback", () => {
  for (const language of ["en", "ar", "ckb"] as const)
    for (const layout of ["form", "card"] as const)
      it(`${language} ${layout} names a failed logo and opens its editor`, async () => {
        const copy = formsCopy(language),
          labels = formEditorCopy(language),
          image = "data:image/png;base64,aGVsbG8=";
        const save = vi
          .fn()
          .mockRejectedValue(
            new FormUploadError(image, new Error("private storage failure")),
          );
        render(
          <FormEditorDrawer
            initialForm={{
              ...createForm(language),
              layout,
              name: "Images",
              headline: "Images",
              logo: image,
            }}
            copy={copy}
            onSave={save}
            onClose={vi.fn()}
          />,
        );
        fireEvent.click(screen.getByRole("button", { name: copy.save }));
        const section =
          layout === "card" ? labels.welcome : labels.introduction;
        expect(
          await screen.findByRole("button", {
            name: `${section} � ${copy.logo}`,
          }),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: section })).toHaveAttribute(
          "aria-expanded",
          "true",
        );
        expect(
          screen.getByLabelText(copy.logo, { selector: "input" }),
        ).toHaveAccessibleDescription(copy.saveImageError);
        fireEvent.click(screen.getByRole("button", { name: section }));
        fireEvent.click(
          screen.getByRole("button", { name: `${section} � ${copy.logo}` }),
        );
        expect(screen.getByRole("button", { name: section })).toHaveAttribute(
          "aria-expanded",
          "true",
        );
        expect(
          screen.queryByText("private storage failure"),
        ).not.toBeInTheDocument();
      });

  it("shows requirements when hovering the Create button", async () => {
    const copy = formsCopy("en");
    render(
      <FormEditorDrawer
        initialForm={createForm("en")}
        isNew
        copy={copy}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: copy.next }));
    fireEvent.mouseEnter(screen.getByRole("button", { name: copy.create }));
    await waitFor(() =>
      expect(
        screen
          .getAllByRole("tooltip")
          .some((tooltip) => tooltip.textContent?.includes(copy.nameError)),
      ).toBe(true),
    );
  });
  for (const [status, key] of [
    [400, "saveInvalid"],
    [401, "saveSessionError"],
    [403, "savePermissionError"],
    [409, "saveConflict"],
    [413, "saveImageError"],
    [429, "saveRateError"],
    [500, "saveError"],
  ] as const) {
    it(`uses a safe inline save message for status ${status} and allows retry`, async () => {
      const copy = formsCopy("en"),
        form = {
          ...createForm("en"),
          name: "Keep changes",
          headline: "Keep changes",
        };
      const save = vi
        .fn()
        .mockRejectedValueOnce(
          new ApiRequestError("Internal private details", {
            status,
            code: "ERROR",
          }),
        )
        .mockResolvedValue(undefined);
      render(
        <FormEditorDrawer
          initialForm={form}
          copy={copy}
          onSave={save}
          onClose={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: copy.save }));
      expect(await screen.findByRole("alert")).toHaveTextContent(copy[key]);
      expect(screen.queryByText(copy.loadError)).not.toBeInTheDocument();
      expect(
        screen.queryByText("Internal private details"),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: copy.save }));
      await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
      await waitFor(() =>
        expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
      );
    });
  }
  it("opens a published choice question and explains duplicate answers inline", () => {
    const copy = formsCopy("en"),
      question = {
        ...createQuestion("choice"),
        label: "Choose",
        options: ["Same", "same"],
      };
    const form = {
      ...createForm("en"),
      name: "Choices",
      headline: "Choices",
      status: "active" as const,
      actionsEnabled: false,
      questions: [question],
    };
    const save = vi.fn();
    render(
      <FormEditorDrawer
        initialForm={form}
        copy={copy}
        onSave={save}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: copy.save }));
    expect(screen.getByRole("textbox", { name: "Options 1" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(save).not.toHaveBeenCalled();
  });
});
