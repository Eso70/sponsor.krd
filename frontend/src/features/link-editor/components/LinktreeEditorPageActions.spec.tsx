import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LinktreeEditorPageActions } from "./LinktreeEditorPageActions";
import { businessMessages } from "@/features/business/i18n/messages";
const item = {
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  id: "saved",
  uid: "saved",
  name: "Saved page",
  status: "active" as const,
};
describe("shared Linktree editor lifecycle actions", () => {
  for (const platformTheme of [false, true])
    it.each(["en", "ar", "ckb"] as const)(
      `uses saved state and permissions in %s, platform=${platformTheme}`,
      async (locale) => {
        const onToggleStatus = vi.fn(),
          onToggleArchive = vi.fn(),
          onDuplicate = vi.fn(),
          onBusyChange = vi.fn();
        const copy = businessMessages[locale].LinktreeList;
        const props = {
          management: { item, onToggleStatus, onToggleArchive, onDuplicated: vi.fn() },
          onDuplicate,
          locale,
          platformTheme,
          disabled: false,
          onBusyChange,
        };
        const { rerender } = render(<LinktreeEditorPageActions {...props} />);
        fireEvent.click(screen.getByRole("button", { name: copy.deactivate }));
        await waitFor(() =>
          expect(onBusyChange).toHaveBeenLastCalledWith(false),
        );
        expect(onToggleStatus).toHaveBeenCalledWith(item.id, "inactive");
        fireEvent.click(screen.getByRole("button", { name: copy.archive }));
        await waitFor(() =>
          expect(onToggleArchive).toHaveBeenCalledWith(item.id, true),
        );
        fireEvent.click(screen.getByRole("button", { name: copy.duplicate }));
        expect(onDuplicate).toHaveBeenCalledOnce();
        rerender(<LinktreeEditorPageActions {...props} disabled />);
        for (const button of screen.getAllByRole("button"))
          expect(button).toBeDisabled();
        rerender(
          <LinktreeEditorPageActions
            {...props}
            management={{
              ...props.management,
              item: { ...item, is_default: true },
            }}
          />,
        );
        expect(
          screen.queryByRole("button", { name: copy.archive }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: copy.deactivate }),
        ).not.toBeInTheDocument();
      },
    );
});
