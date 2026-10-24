import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DynamicTemplate } from "./DynamicTemplate";
import { TEMPLATE_OPTIONS } from "@/lib/templates/config";
import { PublicLinktreeLocaleProvider } from "@/features/business/i18n/public-linktree";

const images = ["/images/upload/first.png", "/images/upload/second.png"];
function page(templateKey: string, enabled?: boolean) {
  return {
    id: "live-page", uid: "live-page", name: "My page", image: "/images/upload/logo.png",
    template_config: { templateKey, ...(enabled !== undefined ? { banner: { enabled, mode: "carousel", images } } : {}) },
  };
}

describe("shared Linktree banner", () => {
  it.each(TEMPLATE_OPTIONS)("shows supplied business details in $name", async ({ id }) => {
    const linktree = { ...page(id), template_config: { templateKey: id, seo: { version: 1, category: "food", businessType: "restaurant", business: { city: "Erbil", cuisine: "Authored cuisine" } } } };
    render(<PublicLinktreeLocaleProvider locale="en"><DynamicTemplate linktree={linktree} links={[]} theme={{ from: "#fff", via: "#fff", to: "#fff" }} onLinkClick={vi.fn()} /></PublicLinktreeLocaleProvider>);
    expect(await screen.findByText("Restaurant", {}, { timeout: 10000 })).toBeVisible();
    expect(screen.getByText("Erbil")).toBeVisible();
    const cuisine = screen.getByText(/Authored cuisine/);
    expect(cuisine).not.toBeVisible();
    const details = cuisine.closest("details");
    expect(details).not.toBeNull();
    fireEvent.click(details!.querySelector("summary")!);
    expect(cuisine).toBeVisible();
  });
  it.each(TEMPLATE_OPTIONS)("fits the banner, carousel and image viewer into $name", async ({ id }) => {
    const onMediaAction = vi.fn();
    const { container } = render(<PublicLinktreeLocaleProvider locale="en"><DynamicTemplate
      linktree={page(id, true)} links={[]} theme={{ from: "#161b22", via: "#161b22", to: "#161b22" }}
      onLinkClick={vi.fn()} onMediaAction={onMediaAction} /></PublicLinktreeLocaleProvider>);
    await waitFor(() => expect(container.querySelector("[data-linktree-banner]")).not.toBeNull(), { timeout: 10000 });
    const banner = container.querySelector("[data-linktree-banner]");
    expect(banner).not.toBeNull();
    expect(banner?.parentElement?.parentElement).toHaveAttribute("data-template-viewport-layout");
    expect(container.querySelector("[data-template-viewport-layout]")).toHaveClass("!px-0", "!pt-0");
    expect(container.querySelector("[data-template-banner-logo]")).toHaveStyle({ marginTop: "-56px" });
    expect(screen.getByRole("img", { name: "My page" }).parentElement).toHaveClass("h-28", "w-28");
    expect(banner?.querySelector("img")).toHaveAttribute("src", expect.stringContaining("first.png"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(banner?.querySelector("img")).toHaveAttribute("src", expect.stringContaining("second.png"));
    expect(onMediaAction).toHaveBeenCalledWith("banner-change", 1);
    fireEvent.click(screen.getByRole("button", { name: "Preview: Banner image" }));
    expect(await screen.findByRole("dialog", { name: "Banner image" })).toBeInTheDocument();
    expect(onMediaAction).toHaveBeenCalledWith("image-open", 1);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview: Logo" }));
    expect(await screen.findByRole("dialog", { name: "Logo" })).toBeInTheDocument();
    expect(onMediaAction).toHaveBeenCalledWith("image-open", -1);
  });

  it.each(TEMPLATE_OPTIONS)("preserves $name without a banner or with Banner off", async ({ id }) => {
    const props = { links: [], theme: { from: "#fff", via: "#fff", to: "#fff" }, onLinkClick: vi.fn() };
    const { container, rerender } = render(<DynamicTemplate {...props} linktree={page(id)} />);
    await screen.findByRole("heading", { name: "My page" });
    const original = container.innerHTML;
    rerender(<DynamicTemplate {...props} linktree={page(id, false)} />);
    expect(container.innerHTML).toBe(original);
    expect(container.querySelector("[data-linktree-banner]")).toBeNull();
  });
});
