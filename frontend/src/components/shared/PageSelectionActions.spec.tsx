import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageSelectionActions } from "./PageSelectionActions";
import { pageSelectionCopy } from "./page-selection-copy";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe.each(["en", "ar", "ckb"] as const)(
  "selected actions in %s",
  (locale) => {
    it.each(["page", "form"] as const)(
      "keeps %s deletion separate from analytics",
      async (resource) => {
        const copy = pageSelectionCopy(locale);
        const analytics = vi.fn().mockResolvedValue(undefined),
          remove = vi.fn().mockResolvedValue(undefined);
        const deselect = vi.fn();
        render(
          <PageSelectionActions
            resource={resource}
            ids={["protected", "selected"]}
            deletableIds={["selected"]}
            locale={locale}
            disabled={false}
            onDelete={analytics}
            onDeleteRecords={remove}
            onSelectAll={vi.fn()}
            onDeselect={deselect}
          />,
        );
        const label = resource === "form" ? copy.deleteForms : copy.deletePages;
        fireEvent.click(screen.getByRole("button", { name: label }));
        expect(remove).not.toHaveBeenCalled();
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveTextContent(
          resource === "form"
            ? copy.deleteFormsQuestion
            : copy.deletePagesQuestion,
        );
        fireEvent.click(within(dialog).getByRole("button", { name: label }));
        await waitFor(() => expect(remove).toHaveBeenCalledWith(["selected"]));
        expect(analytics).not.toHaveBeenCalled();
        await waitFor(() =>
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
        );
        fireEvent.click(screen.getByRole("button", { name: copy.remove }));
        fireEvent.click(
          within(screen.getByRole("dialog")).getByRole("button", {
            name: copy.remove,
          }),
        );
        await waitFor(() =>
          expect(analytics).toHaveBeenCalledWith(["protected", "selected"]),
        );
        expect(deselect).toHaveBeenCalledTimes(2);
      },
    );
  },
);

it("does not delete a stale selection after confirmation opens", async () => {
  const remove = vi.fn();
  const props = {
    locale: "en" as const,
    disabled: false,
    onSelectAll: vi.fn(),
    onDeselect: vi.fn(),
    onDeleteRecords: remove,
  };
  const { rerender } = render(
    <PageSelectionActions {...props} ids={["one"]} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete pages" }));
  rerender(<PageSelectionActions {...props} ids={["two"]} />);
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Delete pages",
    }),
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(remove).not.toHaveBeenCalled();
});
