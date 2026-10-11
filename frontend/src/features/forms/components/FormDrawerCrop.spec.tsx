import { createPortal } from "react-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormEditorDrawer } from "./FormEditorDrawer";
import { formsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import { createForm } from "../forms-model";
import { readFormImage } from "../form-media";

vi.mock("../api", () => ({
  formsApi: {
    titleAvailability: vi
      .fn()
      .mockResolvedValue({ available: true, slug: "campaign" }),
  },
}));
vi.mock("../form-media", async (original) => ({
  ...(await original<typeof import("../form-media")>()),
  readFormImage: vi.fn(),
}));
vi.mock("@/components/shared/ImageCropEditor", () => ({
  ImageCropEditor: (
    props: import("react").ComponentProps<
      typeof import("@/components/shared/ImageCropEditor").ImageCropEditor
    >,
  ) => (
    <>
      <section role="region" aria-label={props.copy.title} />
      {props.footerTarget &&
        createPortal(
          <div>
            <button type="button" onClick={props.onClose}>
              {props.cancelLabel}
            </button>
            <button
              type="button"
              onClick={() =>
                void props.onConfirm(
                  new File(["crop"], "crop.png", { type: "image/png" }),
                )
              }
            >
              {props.copy.confirm}
            </button>
          </div>,
          props.footerTarget,
        )}
    </>
  ),
}));
const logo = "data:image/png;base64,YQ==";
const cropped = "data:image/png;base64,Yg==";
const copy = formsCopy("en");
describe("crop workspace inside the shared form drawer", () => {
  it.each(["business", "platform"] as const)(
    "keeps one drawer and preserves edits when cropping in %s",
    async (scope) => {
      vi.clearAllMocks();
      const onSave = vi.fn();
      const onClose = vi.fn();
      vi.mocked(readFormImage).mockResolvedValue(cropped);
      render(
        <FormEditorDrawer
          initialForm={{ ...createForm("en"), name: "Campaign", logo }}
          copy={copy}
          scope={scope}
          onSave={onSave}
          onClose={onClose}
        />,
      );
      const title = screen.getByRole("textbox", { name: copy.name });
      fireEvent.change(title, { target: { value: "Unsaved campaign" } });
      fireEvent.click(
        screen.getByRole("button", { name: formEditorCopy("en").introduction }),
      );
      const crop = screen.getByRole("button", {
        name: `${copy.imageCrop.title}: ${copy.logo} 1`,
      });
      fireEvent.click(crop);
      const editor = await screen.findByRole("region", {
        name: copy.imageCrop.title,
      });
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expect(screen.getByRole("dialog")).toContainElement(editor);
      expect(
        screen
          .getByRole("button", { name: copy.imageCrop.confirm })
          .closest("footer"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: copy.save }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("textbox", { name: copy.name }),
      ).not.toBeInTheDocument();
      fireEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: copy.cancel,
        }),
      );
      expect(screen.getByRole("textbox", { name: copy.name })).toHaveValue(
        "Unsaved campaign",
      );
      expect(readFormImage).not.toHaveBeenCalled();
      fireEvent.click(
        screen.getByRole("button", {
          name: `${copy.imageCrop.title}: ${copy.logo} 1`,
        }),
      );
      await screen.findByRole("region", {
        name: copy.imageCrop.title,
      });
      fireEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: copy.imageCrop.confirm,
        }),
      );
      await waitFor(() =>
        expect(
          screen.queryByRole("region", { name: copy.imageCrop.title }),
        ).not.toBeInTheDocument(),
      );
      expect(screen.getByRole("textbox", { name: copy.name })).toHaveValue(
        "Unsaved campaign",
      );
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expect(
        document.querySelector(`img[src="${cropped}"]`),
      ).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    },
  );
});
