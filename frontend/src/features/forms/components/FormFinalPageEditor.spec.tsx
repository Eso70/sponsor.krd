import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createForm } from "../forms-model";
import { formsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import { FormFinalPageEditor } from "./FormFinalPageEditor";
import { FormPreview } from "./FormPreview";

function Editor() {
  const [form, setForm] = useState(createForm("en"));
  return (
    <>
      <FormFinalPageEditor
        form={form}
        onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
        copy={formsCopy("en")}
        labels={formEditorCopy("en")}
      />
      <output data-testid="actions">
        {form.actions?.map((action) => action.type).join(",")}
      </output>
    </>
  );
}
const add = (type: string) => {
  fireEvent.click(screen.getByRole("button", { name: "+ Add button" }));
  fireEvent.click(screen.getByRole("option", { name: type }));
};
afterEach(() => vi.restoreAllMocks());

describe("final-page actions", () => {
  it("shows a decorative hand by default and removes it when disabled without changing the CTA", () => {
    const form = {
      ...createForm("en"),
      actionsEnabled: true,
      actions: [
        {
          id: "site",
          type: "website" as const,
          text: "Visit website",
          url: "https://example.com",
        },
      ],
    };
    const { rerender } = render(<FormPreview form={form} finalPage />);
    const link = screen.getByRole("link", { name: "Visit website" });
    expect(link.querySelector("[data-animated-tap-hint]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    rerender(
      <FormPreview form={{ ...form, showHandCursor: false }} finalPage />,
    );
    expect(screen.getByRole("link", { name: "Visit website" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
    expect(link.querySelector("[data-animated-tap-hint]")).toBeNull();
  });
  it("adds typed actions, keeps collapsed values, and reorders through the shared handle", () => {
    render(<Editor />);
    expect(screen.getByRole("switch", { name: "Call to action buttons" })).toHaveAttribute("aria-checked", "false");
    fireEvent.click(screen.getByRole("switch", { name: "Call to action buttons" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Website URL" }), {
      target: { value: "https://example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Add button" }));
    expect(screen.getByRole("option", { name: "View website" })).toBeDisabled();
    fireEvent.click(screen.getByRole("option", { name: "Install app" }));
    const play = screen.getByRole("textbox", { name: "Google Play" });
    fireEvent.change(play, {
      target: {
        value: "https://play.google.com/store/apps/details?id=example",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Install app" }));
    expect(
      screen.queryByRole("textbox", { name: "Google Play" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Install app" }));
    expect(screen.getByRole("textbox", { name: "Google Play" })).toHaveValue(
      "https://play.google.com/store/apps/details?id=example",
    );
    fireEvent.keyDown(
      screen.getByRole("button", {
        name: "Drag to reorder; use Up/Down keys Install app",
      }),
      { key: "ArrowUp" },
    );
    expect(screen.getByTestId("actions")).toHaveTextContent("app,website");
    add("View content");
    fireEvent.click(screen.getByRole("radio", { name: "View image" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Image URL" }), {
      target: { value: "https://example.com/image.png" },
    });
    expect(
      screen.getByRole("link", { name: "Preview: Image URL" }),
    ).toHaveAttribute("href", "https://example.com/image.png");
    expect(screen.getByRole("button", { name: "+ Add button" })).toBeDisabled();
    fireEvent.click(
      screen.getByRole("switch", { name: "Call to action buttons" }),
    );
    expect(
      screen.queryByRole("textbox", { name: "Image URL" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("switch", { name: "Call to action buttons" }),
    );
    expect(screen.getByRole("textbox", { name: "Image URL" })).toHaveValue(
      "https://example.com/image.png",
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: `${formsCopy("en").remove} View content 3`,
      }),
    );
    expect(screen.getByTestId("actions")).toHaveTextContent("app,website");
  });

  it("shows the final success message with app and content destinations in the footer", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Android");
    render(
      <FormPreview
        finalPage
        placeholders
        scrollable
        form={{
          ...createForm("en"),
          actionsEnabled: true,
          showHandCursor: false,
          actions: [
            {
              id: "app",
              type: "app",
              text: "Download",
              url: "",
              appStoreUrl: "https://apps.apple.com/app/example",
              googlePlayUrl:
                "https://play.google.com/store/apps/details?id=example",
            },
            {
              id: "pdf",
              type: "content",
              contentFormat: "pdf",
              text: "Read PDF",
              url: "https://example.com/file.pdf",
            },
          ],
        }}
      />,
    );
    expect(screen.getByText(formsCopy("en").thankYou)).toBeInTheDocument();
    expect(
      screen.getByText("Tap the button below to learn more"),
    ).toBeInTheDocument();
    const download = screen.getByRole("link", { name: "Download" });
    expect(download).toHaveAttribute(
      "href",
      "https://play.google.com/store/apps/details?id=example",
    );
    expect(download.querySelector("[data-animated-tap-hint]")).toBeNull();
    expect(
      within(download.closest("footer")!).getByRole("link", {
        name: "Read PDF",
      }),
    ).toHaveAttribute("rel", "noopener noreferrer");
  });
});
