import {
  createUploadFailureError,
  inlineRequestErrorFromResponse,
  localizeInlineRequestError,
  validateUploadFile,
} from "./inline-request-error";

describe("inline request errors", () => {
  it.each([400, 409, 413, 415, 422] as const)(
    "maps HTTP %s to a safe standardized error",
    (status) => {
      const error = inlineRequestErrorFromResponse(
        new Response("sensitive backend detail", { status }),
      );

      expect(error.status).toBe(status);
      expect(error.message).not.toContain("sensitive");
    },
  );

  it("checks the size before the media type", () => {
    const file = new File([new Uint8Array(11)], "payload.txt", {
      type: "text/plain",
    });

    expect(
      validateUploadFile(file, {
        allowedMimeTypes: ["image/png"],
        maxBytes: 10,
      })?.status,
    ).toBe(413);
  });

  it("returns 415 for an unsupported file type", () => {
    const file = new File(["svg"], "image.svg", { type: "image/svg+xml" });

    expect(
      validateUploadFile(file, {
        allowedMimeTypes: ["image/png"],
        maxBytes: 100,
      })?.status,
    ).toBe(415);
  });

  it("uses a generic safe message for transport failures", () => {
    expect(createUploadFailureError()).toMatchObject({
      code: "UPLOAD_FAILED",
      status: null,
    });
  });

  it("localizes upload errors without changing the Kurdish default", () => {
    const error = createUploadFailureError();
    expect(localizeInlineRequestError(error, "ckb")).toBe(error);
    expect(localizeInlineRequestError(error, "ar")).toMatchObject({
      title: "تعذّر الرفع",
      message: "تحقق من اتصالك وحاول مجددًا.",
    });
  });
});
