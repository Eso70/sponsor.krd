import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormRowActions } from "./FormRowActions";
import { createForm } from "../forms-model";
import { formsCopy } from "../forms-copy";
describe("form collection actions", () => {
  it.each(["grid", "table"] as const)("keeps lifecycle actions in the editor for %s", variant => {
    const copy = formsCopy("en"), form = { ...createForm("en"), slug: "contact" };
    const actions = { onEdit: vi.fn(), onDelete: vi.fn(), onArchive: vi.fn(), onAnalytics: vi.fn(), onOpen: vi.fn() };
    const { rerender } = render(<FormRowActions form={form} copy={copy} actions={actions} variant={variant} />);
    expect(screen.getAllByRole("button").map(button => button.getAttribute("aria-label"))).toEqual([copy.analytics, copy.edit, copy.remove, copy.open]);
    for (const name of [copy.pause, copy.archive, copy.duplicate, copy.moreActions]) expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: copy.edit }));
    expect(actions.onEdit).toHaveBeenCalledWith(form);
    rerender(<FormRowActions form={form} copy={copy} actions={{ ...actions, busy: true }} variant={variant} />);
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
  });
});
