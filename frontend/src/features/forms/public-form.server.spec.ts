import { beforeEach, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not-found");
  },
}));
vi.mock("@/lib/public/public-page.server", () => ({
  publicRequestContext: vi.fn(),
  publicFetch: vi.fn(),
}));
import {
  publicRequestContext,
  publicFetch,
} from "@/lib/public/public-page.server";
import { fetchPublicForm } from "./public-form.server";
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(publicRequestContext).mockResolvedValue({
    subdomain: "tenant",
    origin: "https://tenant.sponsor.krd",
    isPlatformRoot: false,
  } as Awaited<ReturnType<typeof publicRequestContext>>);
});
describe("public form server loading", () => {
  it("uses the verified host context and shared fetch boundary", async () => {
    const data = {
      form: { name: "Contact" },
      analytics: { pixelIds: [], actions: {} },
      privacyVersion: "2026-10-10",
    };
    vi.mocked(publicFetch).mockResolvedValue(Response.json({ data }));
    expect(await fetchPublicForm("contact")).toEqual({
      ...data,
      origin: "https://tenant.sponsor.krd",
    });
    expect(publicFetch).toHaveBeenCalledWith("/api/public/forms/contact");
  });
  it("rejects invalid paths without fetching", async () => {
    await expect(fetchPublicForm("../other")).rejects.toThrow("not-found");
    expect(publicFetch).not.toHaveBeenCalled();
  });
  it.each([403, 404, 410])(
    "treats an unavailable form (%s) as not found",
    async (status) => {
      vi.mocked(publicFetch).mockResolvedValue(new Response(null, { status }));
      await expect(fetchPublicForm("contact")).rejects.toThrow("not-found");
    },
  );
  it("does not expose upstream errors", async () => {
    vi.mocked(publicFetch).mockResolvedValue(
      new Response("private database details", { status: 500 }),
    );
    await expect(fetchPublicForm("contact")).rejects.toThrow(
      "Form temporarily unavailable",
    );
  });
});
