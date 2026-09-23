import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BusinessLanguageSelector } from "@/features/business/components/BusinessLanguageSelector";
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
      screen.getByRole("button", { name: "التبديل إلى الكردية" }),
    ).toHaveTextContent("KU");
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

  it("toggles back from Arabic to Kurdish", async () => {
    apiRequest.mockResolvedValue({ locale: "ckb" });
    render(
      <BusinessLocaleProvider initialLocale="ar">
        <BusinessLanguageSelector />
        <Content />
      </BusinessLocaleProvider>,
    );

    const toggle = screen.getByRole("button", {
      name: "التبديل إلى الكردية",
    });
    expect(toggle).toHaveTextContent("KU");
    fireEvent.click(toggle);

    expect(screen.getByText("ڕێکخستنەکان")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "گۆڕینی زمان بۆ عەرەبی" })).toHaveTextContent("AR");
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith("/api/auth/preferred-locale", {
        method: "PATCH",
        json: { locale: "ckb" },
      }),
    );
  });

  it("starts in the saved Arabic language and hides the control for borrowed sessions", () => {
    render(
      <BusinessLocaleProvider initialLocale="ar" canChangeLocale={false}>
        <BusinessLanguageSelector />
        <Content />
      </BusinessLocaleProvider>,
    );

    expect(screen.getByText("الإعدادات")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "التبديل إلى الكردية" }),
    ).not.toBeInTheDocument();
  });
});
