import { beforeEach, expect, it, vi } from "vitest";
import Page, { generateMetadata } from "@/app/analytics-share/[id]/page";
const mocks = vi.hoisted(() => ({
  branding: vi.fn(),
  context: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
vi.mock("./branding.server", () => ({
  fetchAnalyticsShareBranding: mocks.branding,
}));
vi.mock("@/lib/public/public-page.server", () => ({
  publicRequestContext: mocks.context,
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not-found");
  },
  redirect: mocks.redirect,
}));
const id = "11111111-1111-4111-8111-111111111111";
const branding = {
  name: "Acme",
  logo: "/logo.png",
  favicon: "/favicon.png",
  accentColor: "#14b8a6",
  origin: "https://acme.sponsor.krd",
  businessTenant: true,
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.branding.mockResolvedValue(branding);
  mocks.context.mockResolvedValue({ origin: branding.origin });
});
it("renders tenant branding and favicon on the owning domain", async () => {
  const page = await Page({
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve({ lang: "ar" }),
  });
  expect(page.props.branding).toEqual(branding);
  expect(page.props.initialLocale).toBe("ar");
  expect(mocks.redirect).not.toHaveBeenCalled();
  expect(
    await generateMetadata({ params: Promise.resolve({ id }) }),
  ).toMatchObject({
    title: { absolute: "Shared analytics | Acme" },
    icons: { icon: [{ url: "/favicon.png" }] },
    robots: { index: false, follow: false },
  });
});
it("redirects old root links to the canonical business domain and preserves language", async () => {
  mocks.context.mockResolvedValue({ origin: "https://sponsor.krd" });
  await expect(
    Page({
      params: Promise.resolve({ id }),
      searchParams: Promise.resolve({ lang: "ckb" }),
    }),
  ).rejects.toThrow(
    `redirect:https://acme.sponsor.krd/analytics-share/${id}?lang=ckb`,
  );
});
