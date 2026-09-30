import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { BasicInfoStep } from "./BasicInfoStep";

const noop = vi.fn();
const props: ComponentProps<typeof BasicInfoStep> = {
  profileImagePreview: null, fileInputRef: { current: null },
  name: "Page", subtitle: "", description: "", slug: "my-page",
  backgroundColor: "#ffffff", templateKey: "", footerText: "",
  footerPhone: "", footerHidden: false, whatsappModalEnabled: false,
  whatsappModalTitle: "", whatsappModalSubtitle: "", whatsappQuestions: [],
  errors: {}, touched: {}, hideImageUploads: true, hideFooterSection: true,
  hideWhatsappQuestions: true,
  onWhatsappModalEnabledChange: noop, onImageChange: noop, onRemoveImage: noop,
  onNameChange: noop, onNameBlur: noop, onSubtitleChange: noop,
  onDescriptionChange: noop, onSlugChange: noop, onBackgroundColorChange: noop,
  onBackgroundColorBlur: noop, onTemplateKeyChange: noop,
  onFooterTextChange: noop, onFooterPhoneChange: noop, onFooterHiddenChange: noop,
  onWhatsappModalTitleChange: noop, onWhatsappModalSubtitleChange: noop,
  onWhatsappQuestionsChange: noop,
};

describe("shared Linktree slug field", () => {
  it("allows an existing page slug to be edited", () => {
    const onSlugChange = vi.fn();
    render(<BasicInfoStep {...props} isEditMode onSlugChange={onSlugChange} />);
    const input = screen.getByDisplayValue("my-page");
    expect(input).toBeEnabled();
    fireEvent.change(input, { target: { value: "new-page" } });
    expect(onSlugChange).toHaveBeenCalledWith("new-page");
  });

  it("shows an accessible inline conflict in the shared editor", () => {
    render(<BasicInfoStep {...props} isEditMode touched={{ slug: true }}
      errors={{ slug: "This slug is already in use" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("This slug is already in use");
    expect(screen.getByDisplayValue("my-page")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByDisplayValue("my-page")).toHaveAccessibleDescription("This slug is already in use");
  });

  it("clears conflict feedback when a replacement is being checked", () => {
    const { rerender } = render(<BasicInfoStep {...props} touched={{ slug: true }}
      errors={{ slug: "This slug is already in use" }} />);
    rerender(<BasicInfoStep {...props} slug="new-page" checkingSlug />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
