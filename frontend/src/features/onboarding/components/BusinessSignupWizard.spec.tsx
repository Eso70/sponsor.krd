import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BusinessSignupWizard } from "./BusinessSignupWizard";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import { getRootDomain } from "@/lib/utils/app-url";
import { ApiRequestError } from "@/lib/api/request";

const { apiRequest, toast } = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/lib/api/request", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/api/request")>(), apiRequest }));
vi.mock("sonner", () => ({ toast }));

describe("BusinessSignupWizard application status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("replaces an available result when saving loses a reservation race", async () => {
    apiRequest.mockImplementation((path: string, options?: { method?: string }) => {
      if (path.startsWith("/api/signup/subdomain-availability")) return Promise.resolve({ reason: "available", available: true });
      if (options?.method === "PATCH") return Promise.reject(new ApiRequestError("Subdomain is unavailable", { status: 409, code: "CONFLICT" }));
      return Promise.resolve({ status: "draft", ownerEmail: "owner@example.com", preferredLocale: "en" });
    });
    render(<RootPublicLocaleProvider initialLocale="en"><BusinessSignupWizard /></RootPublicLocaleProvider>);
    fireEvent.change(await screen.findByPlaceholderText("Enter business name"), { target: { value: "Acme Studio" } });
    fireEvent.change(screen.getByPlaceholderText("Enter mobile number"), { target: { value: "7501234567" } });
    fireEvent.change(screen.getByPlaceholderText("Enter subdomain"), { target: { value: "acme-studio" } });
    expect(await screen.findByRole("status")).toHaveTextContent("Checking availability");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Available"));
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("already taken or reserved"));
    expect(screen.getByPlaceholderText("Enter subdomain")).toHaveValue("acme-studio");
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

  it("requires a fresh invitation for a deleted business", async () => {
    apiRequest.mockResolvedValueOnce({
      status: "deleted",
      ownerEmail: "owner@example.com",
      businessName: "Old Business",
      phone: "7501234567",
      requestedSubdomain: null,
    });
    render(<RootPublicLocaleProvider initialLocale="en"><BusinessSignupWizard /></RootPublicLocaleProvider>);
    expect(await screen.findByText("Previous business deleted")).toBeInTheDocument();
    expect(screen.getByText("Request a new invitation from an administrator to create another business.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit application" })).not.toBeInTheDocument();
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

  it("starts with empty business fields even when an older application has values", async () => {
    apiRequest.mockResolvedValueOnce({
      status: "draft",
      ownerEmail: "owner@example.com",
      businessName: "Old Business",
      phone: "7501234567",
      requestedSubdomain: "old-business",
      preferredLocale: "ar",
    });
    render(<RootPublicLocaleProvider initialLocale="en"><BusinessSignupWizard /></RootPublicLocaleProvider>);

    expect(await screen.findByPlaceholderText("Enter business name")).toHaveValue("");
    expect(screen.getByPlaceholderText("Enter mobile number")).toHaveValue("");
    expect(screen.getByPlaceholderText("Enter subdomain")).toHaveValue("");
    expect(screen.getByRole("button", { name: "العربية" })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Enter business name"), { target: { value: "New Business" } });
    expect(screen.getByPlaceholderText("Enter subdomain")).toHaveValue("");
  });

  it("starts a new application in English and saves the form language", async () => {
    apiRequest.mockImplementation((path: string, options?: { method?: string }) => {
      if (path === "/api/signup/application" && !options?.method) {
        return Promise.resolve({ status: "draft", ownerEmail: "owner@example.com", businessName: "", phone: "", requestedSubdomain: null });
      }
      if (path.startsWith("/api/signup/subdomain-availability")) return Promise.resolve({ available: true, reason: "available" });
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
    fireEvent.change(screen.getByPlaceholderText("Enter subdomain"), { target: { value: "acme-studio" } });
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining("/api/signup/subdomain-availability"), expect.objectContaining({ signal: expect.any(AbortSignal) })));
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    fireEvent.click(screen.getByRole("option", { name: "العربية" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith("/api/signup/application", {
      method: "PATCH",
      json: expect.objectContaining({ requestedSubdomain: "acme-studio", preferredLocale: "ar" }),
    }));
  });
});
