import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createRef } from "react";
import { ColorGradientModal } from "./ColorGradientModal";
import { arabicColorGradientCopy } from "./color-gradient-arabic-copy";

describe("ColorGradientModal", () => {
  it("uses an Arabic accessible close label when Arabic copy is supplied", async () => {
    render(<ColorGradientModal isOpen value="#123456" onChange={vi.fn()} onClose={vi.fn()} copy={arabicColorGradientCopy} />);
    expect(await screen.findByRole("button", { name: "إغلاق" })).toBeInTheDocument();
  });
  it("retains the selected gradient and applies it through the primary action", async () => {
    const onChange = vi.fn();
    render(
      <ColorGradientModal
        isOpen
        value="gradient:to-r:#111111:#eeeeee"
        onChange={onChange}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector(".modal-ltr")).not.toBeNull();
    });

    const activeDirection = screen.getByTitle("چەپ بۆ ڕاست");
    expect(activeDirection).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "جێبەجێکردن" }));
    expect(onChange).toHaveBeenCalledWith("gradient:to-r:#111111:#eeeeee");
  });

  it.each(["light", "dark"])("inherits the anchor's %s appearance independently of the dashboard", async (appearance) => {
    const anchorRef = createRef<HTMLButtonElement>();
    render(<div className={appearance === "light" ? "dark" : "light"}>
      <div data-appearance={appearance}>
        <button ref={anchorRef}>Color</button>
        <ColorGradientModal anchorRef={anchorRef} isOpen value="#123456" onChange={vi.fn()} onClose={vi.fn()} />
      </div>
    </div>);
    const popup = await screen.findByRole("dialog");
    await waitFor(() => expect(popup).toHaveAttribute("data-appearance", appearance));
    expect(popup).toHaveAttribute("aria-modal", "false");
  });

  it("offers every supported linear and radial gradient direction", async () => {
    render(
      <ColorGradientModal
        isOpen
        value="gradient:to-r:#111111:#eeeeee"
        onChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector(".modal-ltr")).not.toBeNull();
    });

    [
      "چەپ بۆ ڕاست",
      "ڕاست بۆ چەپ",
      "سەرەوە بۆ خوارەوە",
      "خوارەوە بۆ سەرەوە",
      "لاتەنیشت",
      "لاتەنیشت پێچەوانە",
      "بۆ سەرەوەی ڕاست",
      "بۆ سەرەوەی چەپ",
      "بازنەیی",
    ].forEach((title) => {
      expect(screen.getByTitle(title)).toBeInTheDocument();
    });
  });
});

it("keeps the color popup in its phone preview document", async () => {
  const frame = document.createElement("iframe"); document.body.append(frame);
  const doc = frame.contentDocument!;
  const anchorRef = createRef<HTMLButtonElement>();
  const close = vi.fn();
  const { unmount } = render(<><button ref={anchorRef}>Color</button><ColorGradientModal anchorRef={anchorRef} isOpen value="#123456" onChange={vi.fn()} onClose={close} /></>, { container: doc.body });
  await within(doc.body).findByRole("dialog");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  fireEvent.keyDown(doc, { key: "Escape" });
  expect(close).toHaveBeenCalledOnce();
  unmount(); frame.remove();
});
