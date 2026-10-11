import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormBlockPreview } from "./FormBlockPreview";
import { FormComponentEditor } from "./FormComponentEditor";
import { FormImagePicker } from "./FormImagePicker";
import { formsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import { readFormImage } from "../form-media";
import { FormMediaPreview } from "./FormMediaPreview";

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
    <div
      role="region"
      aria-label={props.copy.title}
      data-aspect={props.aspect}
      data-src={props.src}
    >
      <button onClick={props.onClose}>{props.cancelLabel}</button>
      <button
        onClick={() =>
          void props.onConfirm(
            new File(["crop"], "crop.png", { type: "image/png" }),
          )
        }
      >
        {props.copy.confirm}
      </button>
    </div>
  ),
}));
const image = "data:image/png;base64,YQ==";
const replacement = "data:image/png;base64,Yg==";
const copy = formsCopy("en");
const labels = formEditorCopy("en");

describe("compact banner image picker", () => {
  it("crops one carousel image without changing its neighbors", async () => {
    const change = vi.fn();
    vi.mocked(readFormImage).mockResolvedValue(replacement);
    render(
      <FormImagePicker
        variant="banner"
        labels={labels}
        multiple
        images={[image, replacement, image]}
        label="Banner"
        onChange={change}
        copy={copy}
        hint=""
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: `${copy.imageCrop.title}: Banner 2` }),
    );
    const dialog = await screen.findByRole("region", {
      name: copy.imageCrop.title,
    });
    expect(dialog).toHaveAttribute("data-aspect", "free");
    expect(dialog).toHaveAttribute("data-src", replacement);
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: copy.cancel }));
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: `${copy.imageCrop.title}: Banner 1` }),
    );
    const reopened = await screen.findByRole("region", {
      name: copy.imageCrop.title,
    });
    fireEvent.click(
      within(reopened).getByRole("button", { name: copy.imageCrop.confirm }),
    );
    await waitFor(() =>
      expect(change).toHaveBeenCalledWith([replacement, replacement, image]),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
  it("shows an image-only component with a full thumbnail and Update action", async () => {
    const change = vi.fn();
    vi.mocked(readFormImage).mockResolvedValue(replacement);
    render(
      <FormComponentEditor
        block={{
          id: "image",
          type: "image",
          title: "",
          text: "",
          images: [image],
        }}
        onChange={change}
        copy={copy}
        labels={labels}
      />,
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Preview:/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Crop/ })).toBeEnabled();
    expect(screen.getByText(labels.componentImageHint)).toBeInTheDocument();
    expect(document.querySelector("img")).toHaveClass("object-contain");
    const upload = screen.getByLabelText("Image", { selector: "input" });
    const click = vi.spyOn(upload, "click");
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(click).toHaveBeenCalledOnce();
    fireEvent.change(upload, {
      target: {
        files: [new File(["image"], "image.png", { type: "image/png" })],
      },
    });
    await waitFor(() =>
      expect(change).toHaveBeenCalledWith({ images: [replacement] }),
    );
  });
  it("uses the image thumbnail style for multiple carousel images", async () => {
    const change = vi.fn();
    vi.mocked(readFormImage).mockResolvedValue(replacement);
    render(
      <FormComponentEditor
        block={{
          id: "carousel",
          type: "carousel",
          title: "",
          text: "",
          images: [image, image],
        }}
        onChange={change}
        copy={copy}
        labels={labels}
      />,
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Preview:/ }),
    ).not.toBeInTheDocument();
    const input = screen.getByLabelText("Carousel", { selector: "input" });
    expect(input).toHaveAttribute("multiple");
    expect(document.querySelectorAll("img")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Carousel 3" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Carousel 4" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Update Carousel 2" }));
    fireEvent.change(input, {
      target: {
        files: [new File(["image"], "image.png", { type: "image/png" })],
      },
    });
    await waitFor(() =>
      expect(change).toHaveBeenCalledWith({ images: [image, replacement] }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete Carousel 1" }));
    expect(change).toHaveBeenLastCalledWith({ images: [image] });
  });
  it.each([false, true])(
    "opens the selected full image from the form preview (carousel: %s)",
    async (multiple) => {
      render(
        <FormBlockPreview
          block={{
            id: "image",
            type: multiple ? "carousel" : "image",
            title: "Image",
            text: "",
            images: multiple ? [image, replacement] : [image],
          }}
          copy={copy}
          labels={labels}
          placeholders={false}
        />,
      );
      if (multiple)
        fireEvent.click(screen.getByRole("button", { name: copy.next }));
      fireEvent.click(
        screen.getByRole("button", { name: `${copy.preview}: Image` }),
      );
      const dialog = await screen.findByRole("dialog", { name: "Image" });
      expect(within(dialog).getByRole("img")).toHaveAttribute(
        "src",
        multiple ? replacement : image,
      );
      fireEvent.click(within(dialog).getByRole("button", { name: copy.close }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    },
  );
  it("uses side arrows and opens the selected banner image without cropping", async () => {
    render(
      <FormMediaPreview
        images={[image, replacement]}
        carousel
        banner
        copy={copy}
      />,
    );
    expect(screen.queryByText("1 / 2")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: copy.next }));
    fireEvent.click(
      screen.getByRole("button", { name: `${copy.preview}: ${copy.banner}` }),
    );
    const dialog = await screen.findByRole("dialog", { name: copy.banner });
    expect(within(dialog).getByRole("img")).toHaveAttribute("src", replacement);
    fireEvent.click(within(dialog).getByRole("button", { name: copy.close }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("shows the first image when switching from a later carousel slide to single image", () => {
    const { rerender } = render(
      <FormMediaPreview images={[image, replacement]} carousel copy={copy} />,
    );
    fireEvent.click(screen.getByRole("button", { name: copy.next }));
    expect(document.querySelector("img")).toHaveAttribute("src", replacement);
    rerender(<FormMediaPreview images={[image, replacement]} copy={copy} />);
    expect(document.querySelector("img")).toHaveAttribute("src", image);
  });
  it("shows a single banner upload tile without crop or side actions", () => {
    render(
      <FormImagePicker
        variant="banner"
        labels={labels}
        images={[]}
        label="Banner image"
        onChange={vi.fn()}
        copy={copy}
        hint="Choose a banner"
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Crop/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Update" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Banner image 1" }),
    ).toBeEnabled();
  });
  it("shows the introduction logo thumbnail with an update action", () => {
    render(
      <FormImagePicker
        variant="logo"
        labels={labels}
        images={[image]}
        label="Logo"
        onChange={vi.fn()}
        copy={copy}
        hint="Choose your business logo"
      />,
    );
    expect(screen.getByRole("button", { name: "Update" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Update Logo 1" })).toBeEnabled();
    expect(screen.getByText("Choose your business logo")).toBeInTheDocument();
  });
  it("replaces one image in a full carousel without appending or rejecting it", async () => {
    const change = vi.fn();
    vi.mocked(readFormImage).mockResolvedValue(replacement);
    render(
      <FormImagePicker
        variant="banner"
        labels={labels}
        multiple
        images={Array(5).fill(image)}
        label="Banner image"
        onChange={change}
        copy={copy}
        hint="Choose a banner"
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Update Banner image 3" }),
    );
    fireEvent.change(
      screen.getByLabelText("Banner image", { selector: "input" }),
      {
        target: {
          files: [new File(["image"], "image.png", { type: "image/png" })],
        },
      },
    );
    await waitFor(() =>
      expect(change).toHaveBeenCalledWith([
        image,
        image,
        replacement,
        image,
        image,
      ]),
    );
  });
  it("offers one add slot and preserves the other images on removal", () => {
    const change = vi.fn();
    render(
      <FormImagePicker
        variant="banner"
        labels={labels}
        multiple
        images={[image]}
        label="Banner image"
        onChange={change}
        copy={copy}
        hint="Choose a banner"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Banner image 2" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Banner image 3" }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: `${copy.remove} Banner image 1` }),
    );
    expect(change).toHaveBeenCalledWith([]);
    expect(screen.getByRole("button", { name: /Crop/ })).toBeEnabled();
  });
});
