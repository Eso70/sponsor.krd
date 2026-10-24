import { uploadLinktreeBanner } from "./banner-upload";

describe("Linktree banner uploads", () => {
  it("uploads duplicate draft sources once and retains stored/disabled images", async () => {
    const upload = vi.fn().mockResolvedValue("/images/upload/new.png");
    const image = "data:image/png;base64,YQ==";
    expect(await uploadLinktreeBanner({ enabled: false, mode: "carousel", images: [image, image, "/images/upload/existing.png"] }, upload))
      .toEqual({ enabled: false, mode: "carousel", images: ["/images/upload/new.png", "/images/upload/new.png", "/images/upload/existing.png"] });
    expect(upload).toHaveBeenCalledOnce();
    expect(upload.mock.calls[0][0]).toMatchObject({ type: "image/png" });
  });
  it("fails saving when an upload fails", async () => {
    await expect(uploadLinktreeBanner({ enabled: true, images: ["data:image/png;base64,YQ=="] }, async () => null)).rejects.toThrow("Image upload failed");
  });
});
