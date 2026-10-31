import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { LinktreeSponsorEditor } from "./LinktreeSponsorEditor";
import { sponsorEditorCopy, sponsorEditorDraft } from "../sponsor-editor";
import type { BusinessLocale } from "@/features/business/i18n/messages";

function Editor({ locale = "en", platform = false }: { locale?: BusinessLocale; platform?: boolean }) {
  const [sponsor, setSponsor] = useState(sponsorEditorDraft(undefined, platform ? "Sponsor.krd" : "Acme"));
  const [open, setOpen] = useState(false);
  return <LinktreeSponsorEditor sponsor={sponsor} onChange={setSponsor} locale={locale} open={open}
    onToggle={() => setOpen((value) => !value)} requestCrop={vi.fn()} onBusyChange={vi.fn()} platformTheme={platform} />;
}

describe("shared Sponsor section", () => {
  it.each([false, true])("defaults hidden, seeds the owner, and allows text/wordmark selection (platform=%s)", (platform) => {
    render(<Editor platform={platform} />);
    const show = screen.getByRole("switch", { name: "Show sponsor" });
    expect(show).toHaveAttribute("aria-checked", "false");
    fireEvent.click(show);
    expect(show).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("textbox", { name: "Sponsor name" })).toHaveValue(platform ? "Sponsor.krd" : "Acme");
    fireEvent.click(screen.getByRole("button", { name: "Wordmark logo" }));
    expect(screen.queryByRole("textbox", { name: "Sponsor name" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Sponsor wordmark", { selector: "input" })).toHaveAttribute("accept", "image/png,image/jpeg");
    fireEvent.click(screen.getByRole("button", { name: "Text name" }));
    expect(screen.getByRole("button", { name: "Destination" })).toHaveTextContent("Homepage");
    fireEvent.click(screen.getByRole("button", { name: "Destination" }));
    fireEvent.click(screen.getByRole("option", { name: "No link" }));
    expect(screen.getByRole("button", { name: "Destination" })).toHaveTextContent("No link");
    fireEvent.click(show);
    expect(show).toHaveAttribute("aria-checked", "false");
  });
  it.each(["ckb", "ar"] as const)("localizes the same controls in %s", (locale) => {
    render(<Editor locale={locale} />);
    const copy = sponsorEditorCopy[locale];
    fireEvent.click(screen.getByRole("switch", { name: copy.show }));
    expect(screen.getByRole("textbox", { name: copy.name })).toBeVisible();
    expect(screen.getByRole("button", { name: copy.text })).toBeVisible();
  });
});

it("allows editing and clearing the introduction without extra help text", () => {
  render(<Editor />);
  fireEvent.click(screen.getByRole("switch", { name: "Show sponsor" }));
  const intro = screen.getByRole("textbox", { name: "Introductory text" });
  fireEvent.change(intro, { target: { value: "Supported by" } });
  expect(intro).toHaveValue("Supported by");
  fireEvent.change(intro, { target: { value: "" } });
  expect(intro).toHaveValue("");
  expect(screen.queryByText(/Shown above Terms|accessible name/)).not.toBeInTheDocument();
});
