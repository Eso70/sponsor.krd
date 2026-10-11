import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormRowActions, type FormActions } from "./FormRowActions";
import { createForm } from "../forms-model";
import { formsCopy } from "../forms-copy";

describe("shared form collection actions", () => {
  for (const variant of ["grid", "table"] as const)
    for (const language of ["en", "ar", "ckb"] as const)
      it(`${variant} ${language} orders Analytics before Edit and removes Preview and Duplicate entirely`, () => {
        const copy = formsCopy(language),
          form = {
            ...createForm(language),
            status: "active" as const,
            slug: "contact",
          };
        const actions: FormActions = {
          onAnalytics: vi.fn(),
          onEdit: vi.fn(),
          onOpen: vi.fn(),
          onPause: vi.fn(),
          onArchive: vi.fn(),
          onDelete: vi.fn(),
        };
        render(
          <FormRowActions
            form={form}
            copy={copy}
            actions={actions}
            variant={variant}
          />,
        );
        expect(
          screen
            .getAllByRole("button")
            .map((button) => button.getAttribute("aria-label")),
        ).toEqual([
          copy.analytics,
          copy.edit,
          copy.remove,
          copy.open,
          copy.moreActions,
        ]);
        fireEvent.click(screen.getByRole("button", { name: copy.analytics }));
        expect(actions.onAnalytics).toHaveBeenCalledWith(form);
        expect(screen.getByRole("button", { name: copy.open })).toHaveClass(
          variant === "grid" ? "bg-slate-100/80" : "text-slate-700",
        );
        fireEvent.click(screen.getByRole("button", { name: copy.moreActions }));
        expect(
          screen.getByRole("button", { name: copy.moreActions }),
        ).toHaveAttribute("aria-expanded", "true");
        expect(
          screen.queryByRole("button", { name: copy.preview }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: copy.duplicate }),
        ).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: copy.open }));
        expect(actions.onOpen).toHaveBeenCalledWith(form);
        fireEvent.click(screen.getByRole("button", { name: copy.moreActions }));
        expect(
          screen.queryByRole("button", { name: copy.responses }),
        ).not.toBeInTheDocument();
      });
  it("keeps busy controls disabled and archived paused forms restorable", () => {
    const copy = formsCopy("en"),
      form = { ...createForm("en"), isArchived: true };
    const actions: FormActions = {
      onEdit: vi.fn(),
      onArchive: vi.fn(),
      onDelete: vi.fn(),
      onPause: vi.fn(),
    };
    const { rerender } = render(
      <FormRowActions form={form} copy={copy} actions={actions} />,
    );
    fireEvent.click(screen.getByRole("button", { name: copy.moreActions }));
    fireEvent.click(screen.getByRole("button", { name: copy.restore }));
    expect(actions.onArchive).toHaveBeenCalledWith(form);
    expect(screen.getByRole("button", { name: copy.resume })).toBeEnabled();
    rerender(
      <FormRowActions
        form={form}
        copy={copy}
        actions={{ ...actions, busy: true }}
      />,
    );
    for (const button of screen.getAllByRole("button"))
      expect(button).toBeDisabled();
  });
});
