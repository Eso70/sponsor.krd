import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BusinessSignupWizard } from "./BusinessSignupWizard";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import { getRootDomain } from "@/lib/utils/app-url";

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

  it("starts a new application in English and saves the form language", async () => {
    apiRequest.mockImplementation((path: string, options?: { method?: string }) => {
      if (path === "/api/signup/application" && !options?.method) {
        return Promise.resolve({ status: "draft", ownerEmail: "owner@example.com", businessName: "", phone: "", requestedSubdomain: null });
      }
      if (path.startsWith("/api/signup/subdomain-availability")) return Promise.resolve({ available: true });
      if (path === "/api/signup/application/submit") return Promise.resolve({ status: "pending", ownerEmail: "owner@example.com" });
      return Promise.resolve({});
    });

    render(<RootPublicLocaleProvider initialLocale="en"><BusinessSignupWizard /></RootPublicLocaleProvider>);
    expect(await screen.findByText("Default dashboard language")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByText(`.${getRootDomain().split(":")[0]}`)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter business name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter mobile number")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter subdomain")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Enter business name"), { target: { value: "Acme Studio" } });
    fireEvent.change(screen.getByPlaceholderText("Enter mobile number"), { target: { value: "7501234567" } });
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining("/api/signup/subdomain-availability")));
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    fireEvent.click(screen.getByRole("option", { name: "العربية" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith("/api/signup/application", {
      method: "PATCH",
      json: expect.objectContaining({ requestedSubdomain: "acme-studio", preferredLocale: "ar" }),
    }));
  });
});
