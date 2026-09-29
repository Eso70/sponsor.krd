import { fireEvent, render, screen } from "@testing-library/react";
import { AdvertisingSectionVisibilityToggle } from "./AdvertisingSectionVisibilityToggle";
import { translateAdvertisingEditorText } from "../editor-copy";

describe("AdvertisingSectionVisibilityToggle", () => {
  it("exposes the current state and requests the next state", () => {
    const onChange = vi.fn();
    render(
      <AdvertisingSectionVisibilityToggle checked onChange={onChange} />,
    );

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("shows Arabic labels when used by the Business Arabic editor", () => {
    render(
      <AdvertisingSectionVisibilityToggle
        checked
        onChange={vi.fn()}
        translate={(text) => translateAdvertisingEditorText(text, "ar")}
      />,
    );
    expect(screen.getByRole("switch", { name: "القسم ظاهر في الصفحة العامة" })).toHaveTextContent("ظاهر");
  });
});
