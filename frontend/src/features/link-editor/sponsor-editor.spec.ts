import { describe, expect, it, vi } from "vitest";
import { persistSponsorDraft, sponsorEditorDraft } from "./sponsor-editor";

const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==";

describe("sponsor editor draft persistence", () => {
  it("defaults off with the owner name and optional owner-homepage destination", () => {
    expect(sponsorEditorDraft(undefined, "Acme")).toEqual({ enabled: false, name: "Acme", style: "text", logo: null, url: "/" });
  });
  it("preserves unfinished author text without silently replacing invalid input", () => {
    expect(sponsorEditorDraft({ enabled: true, style: "text", name: "", url: "javascript:alert(1)" }, "Acme"))
      .toMatchObject({ enabled: true, name: "", url: "javascript:alert(1)" });
  });
  it.each(["/api/linktrees/upload", "/api/platform/linktrees/upload"])("uploads a local wordmark through the supplied %s adapter", async () => {
    const upload = vi.fn().mockResolvedValue("/images/upload/wordmark.png");
    const result = await persistSponsorDraft({ enabled: true, name: "Acme", style: "wordmark", logo: png, url: null }, upload);
    expect(upload).toHaveBeenCalledOnce();
    expect(upload.mock.calls[0][0]).toMatchObject({ type: "image/png" });
    expect(result).toMatchObject({ enabled: true, logo: "/images/upload/wordmark.png", url: null });
  });
  it("does not re-upload existing wordmarks", async () => {
    const upload = vi.fn();
    await persistSponsorDraft({ enabled: true, name: "Acme", style: "wordmark", logo: "/images/upload/wordmark.png", url: "/" }, upload);
    expect(upload).not.toHaveBeenCalled();
  });
  it("validates name, wordmark and link before starting an upload", async () => {
    const upload = vi.fn();
    await expect(persistSponsorDraft({ enabled: true, name: "", style: "wordmark", logo: png, url: "javascript:alert(1)" }, upload)).rejects.toThrow("Invalid sponsor settings");
    expect(upload).not.toHaveBeenCalled();
  });
});
