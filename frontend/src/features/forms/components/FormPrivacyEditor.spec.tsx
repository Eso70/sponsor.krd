import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createForm } from "../forms-model";
import { formEditorCopy } from "../form-editor-copy";
import { formsCopy } from "../forms-copy";
import { FormPrivacyEditor } from "./FormPrivacyEditor";
import { FormPreview } from "./FormPreview";

afterEach(() => vi.unstubAllEnvs());

describe("automatic form privacy", () => {
  it("replaces manual inputs with platform documents and an acknowledgement switch", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sponsor.krd");
    const change = vi.fn();
    render(
      <FormPrivacyEditor
        form={createForm("en")}
        onChange={change}
        labels={formEditorCopy("en")}
      />,
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Privacy policy" }),
    ).toHaveAttribute("href", "https://sponsor.krd/legal/privacy?lang=en");
    fireEvent.click(
      screen.getByRole("switch", { name: "Show privacy acknowledgement" }),
    );
    expect(change).toHaveBeenCalledWith({ consentRequired: false });
  });

  it.each(["en", "ckb", "ar"] as const)(
    "keeps %s policy links accessible from the footer popup even with the checkbox hidden",
    (language) => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sponsor.krd");
      render(
        <FormPreview
          form={{ ...createForm("en"), consentRequired: false }}
          language={language}
          scrollable
        />,
      );
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      fireEvent.click(
        screen.getByRole("button", {
          name: formEditorCopy(language).privacyHelp,
        }),
      );
      const privacy = screen.getByRole("link", {
        name: formsCopy(language).policy,
      });
      expect(privacy.closest('[role="region"]')).not.toBeNull();
      expect(privacy).toHaveAttribute(
        "href",
        `https://sponsor.krd/legal/privacy?lang=${language}`,
      );
      expect(
        screen.getByRole("link", { name: formEditorCopy(language).terms }),
      ).toHaveAttribute(
        "href",
        `https://sponsor.krd/legal/terms?lang=${language}`,
      );
      expect(privacy).toHaveAttribute("rel", "noopener noreferrer");
    },
  );
});
