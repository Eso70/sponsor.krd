import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HoverPopover } from "./HoverPopover";

describe("interactive hover help", () => {
  it("keeps links reachable after hovering and closes when leaving", () => {
    render(
      <HoverPopover label="Privacy help" trigger="?">
        <a href="https://sponsor.krd/legal/privacy">Privacy</a>
      </HoverPopover>,
    );
    const trigger = screen.getByRole("button", { name: "Privacy help" });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    fireEvent.mouseEnter(trigger);
    const link = screen.getByRole("link", { name: "Privacy" });
    fireEvent.mouseLeave(trigger, { relatedTarget: link });
    fireEvent.mouseEnter(link);
    expect(link).toBeInTheDocument();
    fireEvent.mouseLeave(trigger.parentElement!, {
      relatedTarget: document.body,
    });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders help outside clipping containers and keeps pointer interactions inside it open", () => {
    render(
      <div style={{ overflow: "hidden" }} data-testid="clip">
        <HoverPopover label="Help" trigger="?">
          <a href="https://sponsor.krd/legal/privacy">Privacy</a>
        </HoverPopover>
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Help" }));
    const panel = screen.getByRole("region", { name: "Help" });
    expect(screen.getByTestId("clip").contains(panel)).toBe(false);
    fireEvent.pointerDown(screen.getByRole("link"));
    expect(panel).toBeInTheDocument();
  });
  it("opens on tap, dismisses on outside press, and handles Escape within the editor", () => {
    render(
      <HoverPopover label="Privacy help" trigger="?">
        <a href="https://sponsor.krd/legal/privacy">Privacy</a>
      </HoverPopover>,
    );
    const trigger = screen.getByRole("button", { name: "Privacy help" });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerDown(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.focus(trigger);
    const link = screen.getByRole("link");
    link.focus();
    fireEvent.keyDown(link, { key: "Escape" });
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
