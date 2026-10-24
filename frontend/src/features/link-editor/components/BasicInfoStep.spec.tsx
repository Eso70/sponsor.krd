import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { BasicInfoStep } from "./BasicInfoStep";
import { arabicEditorCopy, englishEditorCopy } from "../editor-copy";

const noop = vi.fn();
const props: ComponentProps<typeof BasicInfoStep> = {
  logoPreview: null, fileInputRef: { current: null },
  headline: "Page", slogan: "", sloganColor: "", description: "", verificationBadge: false, onVerificationBadgeChange: noop,
  errors: {}, touched: {}, hideImageUploads: true,
  onLogoChange: noop, onRemoveLogo: noop,
  onHeadlineChange: noop, onHeadlineBlur: noop, onSloganChange: noop,
  onDescriptionChange: noop, onSloganColorChange: noop,
};

describe("shared Linktree slug field", () => {
  it.each([undefined, arabicEditorCopy, englishEditorCopy])("offers an opt-in badge in each shared editor language", (copy) => {
    const onChange = vi.fn();
    const { rerender } = render(<BasicInfoStep {...props} copy={copy} onVerificationBadgeChange={onChange} />);
    const toggle = screen.getByRole("button", { name: copy?.verificationBadge ?? "پیشاندانی نیشانەی شینی پشتڕاستکردنەوە" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle.textContent).toBe("");
    expect(toggle.parentElement).toBe(screen.getByDisplayValue("Page").parentElement);
    expect(toggle.querySelector("path")).toHaveAttribute("fill", "#94A3B8");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
    rerender(<BasicInfoStep {...props} copy={copy} verificationBadge onVerificationBadgeChange={onChange} />);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle.querySelector("path")).toHaveAttribute("fill", "#00A3EE");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(false);
  });
  it("keeps URL generation out of the editor", () => {
    render(<BasicInfoStep {...props} copy={englishEditorCopy} />);
    expect(screen.queryByLabelText("Slug")).not.toBeInTheDocument();
    expect(document.getElementById("slug")).toBeNull();
    expect(screen.getByRole("textbox", { name: "Headline" })).toHaveValue("Page");
  });
});
