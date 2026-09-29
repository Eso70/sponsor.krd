import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlatformLanguageSelector } from "@/features/platform-admin/components/PlatformLanguageSelector";
import { usePlatformCopy } from "./copy";
import { PlatformLocaleProvider } from "./PlatformLocaleProvider";

const { apiRequest, toastError } = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock("@/lib/api/request", () => ({ apiRequest }));
vi.mock("sonner", () => ({ toast: { error: toastError } }));

function Content() {
  const copy = usePlatformCopy();
  return <span>{copy.businessesManagement}</span>;
}

describe("platform administrator language", () => {
  beforeEach(() => {
    apiRequest.mockReset();
    toastError.mockReset();
  });

  it("switches the first-page copy to Arabic and persists the admin preference", async () => {
    apiRequest.mockResolvedValue({ locale: "ar" });
    render(
      <PlatformLocaleProvider initialLocale="ckb">
        <PlatformLanguageSelector />
        <Content />
      </PlatformLocaleProvider>,
    );
    const toggle = screen.getByRole("button", { name: "گۆڕین بۆ عەرەبی" });
    expect(toggle).toHaveTextContent("AR");
    fireEvent.click(toggle);
    expect(screen.getByText("إدارة الأعمال")).toBeInTheDocument();
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        "/api/platform/auth/preferred-locale",
        { method: "PATCH", json: { locale: "ar" } },
      ),
    );
    expect(
      screen.getByRole("button", { name: "التبديل إلى الإنجليزية" }),
    ).toHaveTextContent("EN");
  });

  it("switches from Arabic to English and saves the administrator preference", async () => {
    apiRequest.mockResolvedValue({ locale: "en" });
    render(
      <PlatformLocaleProvider initialLocale="ar">
        <PlatformLanguageSelector />
        <Content />
      </PlatformLocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "التبديل إلى الإنجليزية" }));
    expect(screen.getByText("Business management")).toBeInTheDocument();
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(
      "/api/platform/auth/preferred-locale", { method: "PATCH", json: { locale: "en" } },
    ));
    expect(screen.getByRole("button", { name: "Switch to Kurdish" })).toHaveTextContent("KU");
  });

  it("restores Kurdish if saving fails", async () => {
    apiRequest.mockRejectedValue(new Error("network"));
    render(
      <PlatformLocaleProvider initialLocale="ckb">
        <PlatformLanguageSelector />
        <Content />
      </PlatformLocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "گۆڕین بۆ عەرەبی" }));
    await waitFor(() =>
      expect(screen.getByText("بەڕێوەبردنی بزنسەکان")).toBeInTheDocument(),
    );
    expect(toastError).toHaveBeenCalledOnce();
  });
});
