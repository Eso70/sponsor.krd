import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { PageListUrl } from "./PageListUrl";

vi.mock("@/lib/utils/clipboard", () => ({ copyToClipboard: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
const labels = {
  copyLink: "Copy link",
  copied: "Copied",
  copyError: "Copy failed",
};
beforeEach(() => vi.resetAllMocks());
describe("shared public page URL", () => {
  it("copies the full canonical URL and preserves native modified link clicks", async () => {
    const onOpen = vi.fn();
    vi.mocked(copyToClipboard).mockResolvedValue(true);
    render(
      <PageListUrl
        url="https://business.sponsor.krd/form/contact"
        displayUrl="/form/contact"
        labels={labels}
        onOpen={onOpen}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: labels.copyLink }));
    await waitFor(() =>
      expect(copyToClipboard).toHaveBeenCalledWith(
        "https://business.sponsor.krd/form/contact",
      ),
    );
    fireEvent.click(screen.getByRole("link"), { ctrlKey: true });
    expect(onOpen).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("link"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
  it("reports clipboard failure without claiming success", async () => {
    vi.mocked(copyToClipboard).mockResolvedValue(false);
    render(
      <PageListUrl url="https://sponsor.krd/form/contact" labels={labels} />,
    );
    fireEvent.click(screen.getByRole("button", { name: labels.copyLink }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(labels.copyError),
    );
    expect(screen.queryByText(labels.copied)).not.toBeInTheDocument();
  });
});
