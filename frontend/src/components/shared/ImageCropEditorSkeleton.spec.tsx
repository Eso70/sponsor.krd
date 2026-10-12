import { Suspense } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImageCropEditorSkeleton } from "./ImageCropEditorSkeleton";
import { imageCropCopy } from "./image-crop-copy";

const pending = new Promise<void>(() => undefined);
function PendingCrop(): never {
  throw pending;
}
describe("local crop loading", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "keeps the crop UI and cancellation inside its local boundary in %s",
    (locale) => {
      const copy = imageCropCopy(locale);
      const cancel = vi.fn();
      const footer = document.createElement("div");
      document.body.appendChild(footer);
      const result = render(
        <Suspense fallback={<p>Homepage loading</p>}>
          <Suspense
            fallback={
              <ImageCropEditorSkeleton
                copy={copy}
                cancelLabel="Cancel"
                onCancel={cancel}
                footerTarget={footer}
              />
            }
          >
            <PendingCrop />
          </Suspense>
        </Suspense>,
      );
      expect(screen.queryByText("Homepage loading")).not.toBeInTheDocument();
      expect(screen.getByText(copy.preview)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: copy.confirm })).toBeDisabled();
      expect(screen.getByRole("button", { name: copy.zoomIn })).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(cancel).toHaveBeenCalledOnce();
      result.unmount();
      footer.remove();
    },
  );
});
