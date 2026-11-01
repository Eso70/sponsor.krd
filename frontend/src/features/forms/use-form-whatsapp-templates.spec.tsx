import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useFormWhatsAppTemplates } from "./use-form-whatsapp-templates";
import { formsApi } from "./api";
import type { FormWhatsAppTemplates } from "@linktree/types";

vi.mock("./api", () => ({
  formsApi: { whatsappTemplates: vi.fn(), saveWhatsAppTemplate: vi.fn() },
}));
function deferred() {
  let resolve!: (value: FormWhatsAppTemplates) => void;
  const promise = new Promise<FormWhatsAppTemplates>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(formsApi.whatsappTemplates).mockResolvedValue({
    en: "Old {{name}}",
  });
});

it("retains saved templates on failed writes and supports retry", async () => {
  const { result } = renderHook(() => useFormWhatsAppTemplates("business"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  vi.mocked(formsApi.saveWhatsAppTemplate).mockRejectedValueOnce(
    new Error("offline"),
  );
  await act(async () => {
    expect(await result.current.save("en", "New {{name}}")).toBe(false);
  });
  expect(result.current.templates.en).toBe("Old {{name}}");
  expect(result.current.saveFailed).toBe(true);
  vi.mocked(formsApi.saveWhatsAppTemplate).mockResolvedValue({
    en: "New {{name}}",
  });
  await act(async () => {
    expect(await result.current.save("en", "New {{name}}")).toBe(true);
  });
  expect(result.current.templates.en).toBe("New {{name}}");
  expect(result.current.saveFailed).toBe(false);
});
it("ignores late reads after a save and prevents duplicate writes", async () => {
  const read = deferred(),
    write = deferred();
  vi.mocked(formsApi.whatsappTemplates).mockReturnValue(read.promise);
  vi.mocked(formsApi.saveWhatsAppTemplate).mockReturnValue(write.promise);
  const { result } = renderHook(() => useFormWhatsAppTemplates("business"));
  let saving!: Promise<boolean>;
  act(() => {
    saving = result.current.save("en", "New {{name}}");
  });
  await act(async () => {
    expect(await result.current.save("en", "Duplicate")).toBe(false);
  });
  expect(formsApi.saveWhatsAppTemplate).toHaveBeenCalledOnce();
  await act(async () => {
    write.resolve({ en: "New {{name}}" });
    await saving;
    read.resolve({ en: "Old" });
    await read.promise;
  });
  expect(result.current.templates.en).toBe("New {{name}}");
});
it("aborts stale workspace writes and never applies their response to a new workspace", async () => {
  const write = deferred();
  vi.mocked(formsApi.saveWhatsAppTemplate).mockReturnValue(write.promise);
  vi.mocked(formsApi.whatsappTemplates).mockImplementation(async (scope) => ({
    en: scope,
  }));
  const { result, rerender } = renderHook(
    ({ scope }: { scope: "business" | "platform" }) =>
      useFormWhatsAppTemplates(scope),
    { initialProps: { scope: "business" } },
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  let saving!: Promise<boolean>;
  act(() => {
    saving = result.current.save("en", "Business edit");
  });
  rerender({ scope: "platform" });
  await waitFor(() => expect(result.current.templates.en).toBe("platform"));
  expect(
    vi.mocked(formsApi.saveWhatsAppTemplate).mock.calls[0][3]?.aborted,
  ).toBe(true);
  await act(async () => {
    write.resolve({ en: "Business edit" });
    expect(await saving).toBe(false);
  });
  expect(result.current.templates.en).toBe("platform");
  expect(result.current.saving).toBe(false);
});
