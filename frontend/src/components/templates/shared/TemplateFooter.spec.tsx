import { render, screen } from "@testing-library/react";
import { TemplateFooter } from "./TemplateFooter";

describe("footer button color", () => {
  it("uses the saved color independently of template overrides and keeps its action", () => {
    render(<TemplateFooter footerText="Business" footerPhone="+9647501234567"
      footerButtonColor="#ff6600" nameButtonStyle={{ color: "blue" }} />);
    const button = screen.getByRole("link", { name: "Business" });
    expect(button).toHaveStyle({ color: "#ff6600", borderColor: "#ff6600" });
    expect(button).toHaveAttribute("href", "https://wa.me/9647501234567");
    expect(button).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("ignores unsafe colors and restores the template style when cleared", () => {
    const { rerender } = render(<TemplateFooter footerText="Business"
      footerButtonColor="url(https://example.com)" nameButtonStyle={{ color: "blue" }} />);
    expect(screen.getByRole("link")).toHaveStyle({ color: "rgb(0, 0, 255)" });
    rerender(<TemplateFooter footerText="Business" footerButtonColor="" nameButtonStyle={{ color: "blue" }} />);
    expect(screen.getByRole("link")).toHaveStyle({ color: "rgb(0, 0, 255)" });
  });
});
