import { expect, it, vi } from "vitest";
import NotFound from "@/app/analytics-share/[id]/not-found";
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-share-locale": "ckb" }),
}));
vi.mock("@/lib/utils/business-error-theme.server", () => ({
  getBusinessSubdomainFromHeaders: async () => "acme",
  fetchBusinessSubdomainThemeFromHeaders: async () => ({
    name: "Acme",
    logo: null,
    favicon: null,
    websiteColor: { raw: "#14b8a6" },
  }),
}));
it("renders the scoped share error page with the host's tenant branding and requested language", async () => {
  const page = await NotFound();
  expect(page.props.locale).toBe("ckb");
  expect(page.props.branding).toMatchObject({
    name: "Acme",
    accentColor: "#14b8a6",
    businessTenant: true,
  });
});
