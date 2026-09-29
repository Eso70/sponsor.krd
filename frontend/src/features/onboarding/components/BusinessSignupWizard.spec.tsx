import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BusinessSignupWizard } from "./BusinessSignupWizard";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";

const { apiRequest, toast } = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/lib/api/request", () => ({ apiRequest }));
vi.mock("sonner", () => ({ toast }));

describe("BusinessSignupWizard application status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refreshes a pending application and displays its approved state", async () => {
    apiRequest
      .mockResolvedValueOnce({
        status: "pending",
        ownerEmail: "owner@example.com",
        businessName: "Sponsor.krd",
        phone: "7501234567",
        requestedSubdomain: null,
      })
      .mockResolvedValueOnce({
        status: "approved",
        ownerEmail: "owner@example.com",
        businessName: "Sponsor.krd",
        phone: "7501234567",
        requestedSubdomain: "sponsor-krd",
      });

    render(<RootPublicLocaleProvider initialLocale="ckb"><BusinessSignupWizard /></RootPublicLocaleProvider>);

    const refresh = await screen.findByRole("button", {
      name: "نوێکردنەوەی دۆخی داواکاری",
    });
    fireEvent.click(refresh);

    await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", {
          name: "نوێکردنەوەی دۆخی داواکاری",
        }),
      ).not.toBeInTheDocument(),
    );
    expect(toast.success).toHaveBeenCalledWith("دۆخی داواکاری نوێکرایەوە.");
  });

  it("updates validation messages when switching the root visitor language", async () => {
    apiRequest.mockResolvedValueOnce({
      status: "draft",
      ownerEmail: "owner@example.com",
      businessName: "",
      phone: "",
      requestedSubdomain: null,
    });
    render(<RootPublicLocaleProvider initialLocale="ckb"><BusinessSignupWizard /></RootPublicLocaleProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "ناردنی داواکاری" }));
    expect(screen.getByText("ناوی بزنس دەبێت لە ٢ تا ١٥٠ پیت بێت")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "گۆڕینی زمان بۆ عەرەبی" }));
    expect(screen.getByText("يجب أن يتكون اسم النشاط التجاري من حرفين إلى 150 حرفًا")).toBeInTheDocument();
    expect(screen.queryByText("ناوی بزنس دەبێت لە ٢ تا ١٥٠ پیت بێت")).not.toBeInTheDocument();
  });
});
