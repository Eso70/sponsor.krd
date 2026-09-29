import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { TikTokAdAccountCard } from "./TikTokAdAccountCard";

describe("TikTokAdAccountCard language", () => {
  it.each([
    ["ar", "ربط حساب إعلانات تيك توك", "غير متصل"],
    ["en", "Connect TikTok ad account", "Not connected"],
  ] as const)("shows %s labels", (locale, title, status) => {
    render(<PlatformLocaleProvider initialLocale={locale}><TikTokAdAccountCard account={null} onConnectClick={vi.fn()} onDisconnectClick={vi.fn()} onSyncClick={vi.fn()} /></PlatformLocaleProvider>);
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(status)).toBeInTheDocument();
  });
});
