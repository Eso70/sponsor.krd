import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/lib/api/request";
import { getCachedData, setCachedData } from "@/lib/utils/cache";
import type { LinktreeEditorSubmitData } from "./editor-types";
import { buildLinktreePayload, createLinktreeMutations } from "./linktree-mutations";

const draft: LinktreeEditorSubmitData = {
  headline: " Existing page ",
  slug: "page-address",
  description: "",
  slogan: "",
  logo: null,
  background_color: "#ffffff",
  templateKey: "spectrum",
  templateConfig: {},
  status: "inactive",
  platforms: ["website"],
  links: { website: ["https://example.com"] },
  linkMetadata: { website: [{ metadata: { custom_color: "#123456" } }] },
};

const fetchMock = vi.fn();
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe.each(["business", "platform"] as const)("%s Linktree mutations", (scope) => {
  const base = scope === "platform" ? "/api/platform/linktrees" : "/api/linktrees";

  it("saves metadata and links in one PATCH and explicitly clears descriptions", async () => {
    fetchMock.mockResolvedValue(respond({ success: true, data: { id: "page-id", description: "" } }));
    const result = await createLinktreeMutations(scope).save({ ...draft, is_default: true }, "page-id");

    expect(result).toEqual({ outcome: "saved", page: { id: "page-id", description: "" } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${base}/page-id`);
    expect(options.method).toBe("PATCH");
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      headline: "Existing page", description: "", logo: null, slogan: "",
      links: draft.links, platforms: draft.platforms, linkMetadata: draft.linkMetadata, status: "inactive",
    });
    expect(body).not.toHaveProperty("is_default");
    expect(body).not.toHaveProperty("templateConfig");
  });

  it("creates through its scoped endpoint and limits default-page flags to create", async () => {
    fetchMock.mockResolvedValue(respond({ success: true, data: { id: "new-page" } }));
    await createLinktreeMutations(scope).save({ ...draft, is_default: true });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(base);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body).is_default).toBe(scope === "business");
  });

  it("returns pending approval without a second write or invalidating applied-state caches", async () => {
    setCachedData(base, [{ id: "page-id", name: "Published name" }]);
    const approval = { id: "approval-id", status: "pending" };
    fetchMock.mockResolvedValue(respond({
      success: false, error: { code: "APPROVAL_REQUIRED", message: "Awaiting approval" }, approval,
    }, 202));

    expect(await createLinktreeMutations(scope).save(draft, "page-id")).toEqual({ outcome: "approval", approval });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getCachedData(base)).toEqual([{ id: "page-id", name: "Published name" }]);
  });

  it("invalidates all affected saved-page caches after an applied edit", async () => {
    const keys = [base, `${base}/page-id`, `${base}/page-id/links`, `${base}/page-id/analytics`];
    keys.forEach((key) => setCachedData(key, { old: true }));
    fetchMock.mockResolvedValue(respond({ success: true, data: { id: "page-id" } }));
    await createLinktreeMutations(scope).save(draft, "page-id");
    keys.forEach((key) => expect(getCachedData(key)).toBeNull());
  });

  it("preserves normalized errors and caches after a rejected mutation", async () => {
    setCachedData(base, [{ id: "page-id" }]);
    fetchMock.mockResolvedValue(respond({
      success: false, error: { code: "FORBIDDEN", message: "Asset belongs to another business", details: ["logo"] },
    }, 403));
    await expect(createLinktreeMutations(scope).save(draft, "page-id")).rejects.toMatchObject({
      name: "ApiRequestError", status: 403, code: "FORBIDDEN", details: ["logo"],
    });
    expect(getCachedData(base)).toEqual([{ id: "page-id" }]);
  });

  it("uses the same scoped flow for archive, status and delete", async () => {
    fetchMock.mockImplementation(async () => respond({ success: true, data: { id: "page-id" } }));
    const mutations = createLinktreeMutations(scope);
    await mutations.archive("page-id", true);
    await mutations.status("page-id", "inactive");
    await mutations.remove("page-id");
    expect(fetchMock.mock.calls.map(([url, options]) => [url, options.method])).toEqual([
      [`${base}/page-id/archive`, "PATCH"], [`${base}/page-id/status`, "PATCH"], [`${base}/page-id`, "DELETE"],
    ]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ is_archived: true });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ status: "inactive" });
  });

  it.each(["archive", "status", "remove"] as const)("keeps %s pending until approval is applied", async (operation) => {
    setCachedData(base, [{ id: "page-id", status: "active" }]);
    fetchMock.mockResolvedValue(respond({
      success: false, error: { code: "APPROVAL_REQUIRED", message: "Awaiting approval" },
    }, 202));
    const mutations = createLinktreeMutations(scope);
    const result = operation === "archive" ? await mutations.archive("page-id", true)
      : operation === "status" ? await mutations.status("page-id", "inactive")
        : await mutations.remove("page-id");
    expect(result.outcome).toBe("approval");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getCachedData(base)).toEqual([{ id: "page-id", status: "active" }]);
  });

  it("does not turn unrelated accepted failures into pending approvals", async () => {
    fetchMock.mockResolvedValue(respond({ success: false, error: { code: "OTHER", message: "Rejected" } }, 202));
    await expect(createLinktreeMutations(scope).save(draft)).rejects.toBeInstanceOf(ApiRequestError);
  });
});

it("serializes whitespace-only descriptions as an explicit clear", () => {
  const payload = buildLinktreePayload({ ...draft, description: "  " }, { scope: "platform", editing: true });
  expect(JSON.parse(JSON.stringify(payload)).description).toBe("");
});

