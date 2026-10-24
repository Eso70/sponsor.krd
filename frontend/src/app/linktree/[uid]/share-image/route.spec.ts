import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => ({ page: vi.fn(), font: vi.fn(), bytes: vi.fn() }));
vi.mock("@/lib/public/public-page.server", () => ({ fetchPublicLinktree: mocks.page }));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, readFile: mocks.font, default: { ...actual, readFile: mocks.font } };
});
vi.mock("next/og", () => ({ ImageResponse: class {
  headers = new Headers({ "Content-Type": "image/png", "Cache-Control": "public, max-age=300", "X-Robots-Tag": "noindex" });
  arrayBuffer = mocks.bytes;
} }));

describe("share image failure handling", () => {
  it("returns bounded unavailable responses, retries a failed font, and completes rendering before headers", async () => {
    const { GET } = await import("./route");
    const parameters = { params: Promise.resolve({ uid: "page" }) };
    const request = new Request("https://tenant.sponsor.krd/linktree/page/share-image");
    mocks.page.mockResolvedValue(null);
    expect((await GET(request, parameters)).status).toBe(404);
    mocks.page.mockResolvedValue("service-unavailable");
    expect((await GET(request, parameters)).status).toBe(503);
    mocks.page.mockResolvedValue({ linktree: { name: "Real page" }, origin: "https://tenant.sponsor.krd" });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      mocks.font.mockRejectedValueOnce(new Error("Fixture missing font"));
      const unavailable = await GET(request, parameters);
      expect(unavailable.status).toBe(503);
      expect(unavailable.headers.get("cache-control")).toBe("no-store");
      mocks.font.mockResolvedValue(Buffer.from("fixture font"));
      mocks.bytes.mockRejectedValueOnce(new Error("Fixture renderer failure"));
      expect((await GET(request, parameters)).status).toBe(503);
      mocks.bytes.mockResolvedValue(new Uint8Array([137,80,78,71]).buffer);
      const image = await GET(request, parameters);
      expect(image.status).toBe(200);
      expect(image.headers.get("content-type")).toBe("image/png");
      expect(mocks.font).toHaveBeenCalledTimes(2);
      expect(error).toHaveBeenCalledTimes(2);
    } finally { error.mockRestore(); }
  });
});
