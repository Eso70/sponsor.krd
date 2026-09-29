import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BusinessLanguageSelector } from "@/features/business/components/BusinessLanguageSelector";
import { BusinessLanguageDropdown } from "@/features/business/components/BusinessLanguageDropdown";
import { BusinessLocaleProvider } from "./BusinessLocaleProvider";

const { apiRequest, toastError } = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock("@/lib/api/request", () => ({ apiRequest }));
vi.mock("sonner", () => ({ toast: { error: toastError } }));

function Content() {
  const t = useTranslations("Dashboard");
  return <span>{t("settings")}</span>;
}

describe("business language preference", () => {
  beforeEach(() => {
    apiRequest.mockReset();
    toastError.mockReset();
  });

  it("switches text to Arabic without changing the dashboard direction", async () => {
    apiRequest.mockResolvedValue({ locale: "ar" });
    const { container } = render(
      <BusinessLocaleProvider initialLocale="ckb">
        <BusinessLanguageSelector />
        <Content />
      </BusinessLocaleProvider>,
    );

    const toggle = screen.getByRole("button", {
      name: "گۆڕینی زمان بۆ عەرەبی",
    });
    expect(toggle).toHaveTextContent("AR");
    expect(toggle).not.toHaveTextContent("KU");
    fireEvent.click(toggle);

    expect(screen.getByText("الإعدادات")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "التبديل إلى الإنجليزية" }),
    ).toHaveTextContent("EN");
    expect(container.firstElementChild).toHaveAttribute("lang", "ar");
    expect(container.firstElementChild).toHaveAttribute("dir", "ltr");
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith("/api/auth/preferred-locale", {
        method: "PATCH",
        json: { locale: "ar" },
      }),
    );
  });

  it("restores Kurdish if saving fails", async () => {
    apiRequest.mockRejectedValue(new Error("network failure"));
    render(
      <BusinessLocaleProvider initialLocale="ckb">
        <BusinessLanguageSelector />
        <Content />
      </BusinessLocaleProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "گۆڕینی زمان بۆ عەرەبی" }),
    );

    await waitFor(() =>
      expect(screen.getByText("ڕێکخستنەکان")).toBeInTheDocument(),
    );
    expect(toastError).toHaveBeenCalledOnce();
  });

  it("switches from Arabic to English and then Kurdish", async () => {
    apiRequest.mockResolvedValue({ locale: "en" });
    render(
      <BusinessLocaleProvider initialLocale="ar">
        <BusinessLanguageSelector />
        <Content />
      </BusinessLocaleProvider>,
    );

    const toggle = screen.getByRole("button", {
      name: "التبديل إلى الإنجليزية",
    });
    expect(toggle).toHaveTextContent("EN");
    fireEvent.click(toggle);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to Kurdish" })).toHaveTextContent("KU");
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith("/api/auth/preferred-locale", {
        method: "PATCH",
        json: { locale: "en" },
      }),
    );
    apiRequest.mockResolvedValue({ locale: "ckb" });
    fireEvent.click(screen.getByRole("button", { name: "Switch to Kurdish" }));
    await waitFor(() => expect(screen.getByText("ڕێکخستنەکان")).toBeInTheDocument());
  });

  it("starts in the saved Arabic language and hides the control for borrowed sessions", () => {
    render(
      <BusinessLocaleProvider initialLocale="ar" canChangeLocale={false}>
        <BusinessLanguageSelector />
        <BusinessLanguageDropdown />
        <Content />
      </BusinessLocaleProvider>,
    );

    expect(screen.getByText("الإعدادات")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "التبديل إلى الإنجليزية" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("اللغة الافتراضية للوحة التحكم")).not.toBeInTheDocument();
  });

  it("keeps the setup and settings dropdowns synchronized with the header preference", async () => {
    apiRequest.mockResolvedValue({ locale: "ar" });
    render(
      <BusinessLocaleProvider initialLocale="ckb">
        <BusinessLanguageSelector />
        <BusinessLanguageDropdown />
        <BusinessLanguageDropdown />
      </BusinessLocaleProvider>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /کوردی/ })[0]);
    fireEvent.click(screen.getByRole("option", { name: "العربية" }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith("/api/auth/preferred-locale", {
        method: "PATCH",
        json: { locale: "ar" },
      }),
    );
    expect(screen.getAllByRole("button", { name: /العربية/ })).toHaveLength(2);

    apiRequest.mockResolvedValue({ locale: "en" });
    fireEvent.click(screen.getByRole("button", { name: "التبديل إلى الإنجليزية" }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith("/api/auth/preferred-locale", {
        method: "PATCH",
        json: { locale: "en" },
      }),
    );
    expect(screen.getAllByRole("button", { name: /English/ })).toHaveLength(2);
  });
});
