import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { apiRequest } from "@/lib/api/request";
import { formsApi } from "./api";
import { createForm } from "./forms-model";
vi.mock("@/lib/api/request", () => ({ apiRequest: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());
describe("forms API adapters", () => {
  it.each(["business", "platform"] as const)(
    "%s loads insights and responses through owner-scoped endpoints",
    async (scope) => {
      const signal = new AbortController().signal;
      const base = scope === "platform" ? "/api/platform/forms" : "/api/forms";
      await formsApi.analytics(scope, "form-id", signal);
      expect(apiRequest).toHaveBeenLastCalledWith(`${base}/form-id/analytics`, {
        signal,
      });
      await formsApi.submissions(scope, "form-id", 0, signal);
      expect(apiRequest).toHaveBeenLastCalledWith(
        `${base}/form-id/submissions?page=0`,
        { signal },
      );
    },
  );
  for (const scope of ["business", "platform"] as const)
    it(`${scope} sends archive independently from status`, async () => {
      await formsApi.archive(scope, "form-id", true);
      expect(apiRequest).toHaveBeenCalledWith(
        `${scope === "platform" ? "/api/platform/forms" : "/api/forms"}/form-id/archive`,
        { method: "PATCH", json: { isArchived: true } },
      );
    });
  for (const scope of ["business", "platform"] as const)
    it(`${scope} uploads shared media once and writes the persistent definition to its own endpoint`, async () => {
      const data = "data:image/png;base64,aGVsbG8=";
      const form = {
        ...createForm("en"),
        headline: "Contact",
        banner: data,
        logo: data,
        description: data,
      };
      const route = scope === "platform" ? "/api/platform/forms" : "/api/forms";
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("CSP blocked local data fetch")),
      );
      vi.mocked(apiRequest)
        .mockResolvedValueOnce({ url: "/images/upload/form.png" })
        .mockResolvedValueOnce({
          ...form,
          banner: "/images/upload/form.png",
          logo: "/images/upload/form.png",
        });
      await formsApi.save(scope, form, true);
      expect(fetch).not.toHaveBeenCalled();
      const payload = vi.mocked(apiRequest).mock.calls[0][1]?.body as FormData;
      const file = payload.get("file") as File;
      expect(file.type).toBe("image/png");
      expect(await file.text()).toBe("hello");
      expect(apiRequest).toHaveBeenCalledTimes(2);
      expect(apiRequest).toHaveBeenNthCalledWith(
        1,
        route + "/upload",
        expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
      );
      expect(apiRequest).toHaveBeenNthCalledWith(
        2,
        route,
        expect.objectContaining({
          method: "POST",
          json: expect.objectContaining({
            banner: "/images/upload/form.png",
            logo: "/images/upload/form.png",
            description: data,
          }),
        }),
      );
      expect(form.banner).toBe(data);
    });
  it("does not save a broken media definition after an upload failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        blob: async () => new Blob(["raster"], { type: "image/png" }),
      }),
    );
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error("upload failed"));
    await expect(
      formsApi.save(
        "business",
        { ...createForm("en"), banner: "data:image/png;base64,aGVsbG8=" },
        true,
      ),
    ).rejects.toThrow("upload failed");
    expect(apiRequest).toHaveBeenCalledTimes(1);
  });
  it("encodes a literal search and page for server pagination", async () => {
    await formsApi.list("business", 2, "100%_sale", "archived");
    expect(apiRequest).toHaveBeenCalledWith(
      "/api/forms?page=2&q=100%25_sale&filter=archived",
      expect.any(Object),
    );
  });
});
