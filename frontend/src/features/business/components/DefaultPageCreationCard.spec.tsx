import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DefaultPageCreationCard } from "./DefaultPageCreationCard";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
const request = vi.fn();
const clearCache = vi.fn();
vi.mock("@/lib/api/request", () => ({ apiRequest: (...args: unknown[]) => request(...args) }));
vi.mock("@/lib/utils/cache", () => ({ clearCachedData: (...args: unknown[]) => clearCache(...args) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("DefaultPageCreationCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a missing default page without sending new-page starting settings", async () => {
    request.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "page-1", name: "Business", uid: "lt-page" });
    render(<DefaultPageCreationCard />);
    fireEvent.click(await screen.findByRole("button", { name: "createDefault" }));
    await screen.findByText("lt-page");
    expect(request).toHaveBeenCalledWith("/api/linktrees/default", { method: "POST" });
    expect(clearCache).toHaveBeenCalledWith("/api/linktrees");
    expect(screen.queryByRole("button", { name: "createDefault" })).not.toBeInTheDocument();
  });

  it("shows an existing default page instead of offering creation", async () => {
    request.mockResolvedValueOnce({ id: "page-1", name: "Business", uid: "lt-existing" });
    render(<DefaultPageCreationCard />);
    await screen.findByText("lt-existing");
    expect(screen.queryByRole("button", { name: "createDefault" })).not.toBeInTheDocument();
  });

  it("does not treat a failed lookup as a missing default page", async () => {
    request.mockRejectedValueOnce(new Error("Unavailable"));
    render(<DefaultPageCreationCard />);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("loadFailed"));
    expect(screen.queryByRole("button", { name: "createDefault" })).not.toBeInTheDocument();
  });
});
