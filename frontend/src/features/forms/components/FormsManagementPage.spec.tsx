import {
  act,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormsManagementPage } from "./FormsManagementPage";
import { FormEditorDrawer } from "./FormEditorDrawer";
import { FormPreview } from "./FormPreview";
import { createForm, createQuestion } from "../forms-model";
import { formsCopy } from "../forms-copy";

import { formsApi } from "../api";
vi.mock("../api", () => ({
  formsApi: {
    list: vi.fn(),
    get: vi.fn(),
    stats: vi.fn(),
    analytics: vi.fn(),
    save: vi.fn(),
    status: vi.fn(),
    archive: vi.fn(),
    duplicate: vi.fn(),
    remove: vi.fn(),
    submissions: vi.fn(),
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(formsApi.list).mockResolvedValue({ items: [], total: 0 });
  vi.mocked(formsApi.analytics).mockResolvedValue({
    views: 10,
    visitors: 4,
    starts: 3,
    submissions: 2,
    clicks: 7,
  });
  vi.mocked(formsApi.stats).mockResolvedValue({
    views: 10,
    visitors: 4,
    starts: 3,
    submissions: 2,
  });
});
function startForm() {
  fireEvent.click(screen.getByRole("button", { name: "Create form" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
}

describe("Forms frontend workspace", () => {
  for (const scope of ["business", "platform"] as const)
    for (const currentStatus of ["active", "paused"] as const) {
      it(`${scope} archives and restores ${currentStatus} forms without changing their status`, async () => {
        const button = (name: string) =>
          screen.getAllByRole("button", { name })[0];
        let form = {
          ...createForm("en"),
          name: "Archive example",
          headline: "Archive example",
          slug: "archive-example",
          status: currentStatus,
          isArchived: false,
        };
        vi.mocked(formsApi.list).mockImplementation(
          async (_scope, _page, _query, filter) => ({
            items: form.isArchived === (filter === "archived") ? [form] : [],
            total: form.isArchived === (filter === "archived") ? 1 : 0,
          }),
        );
        vi.mocked(formsApi.archive).mockImplementation(
          async (_scope, _id, isArchived) => {
            form = { ...form, isArchived };
            return form;
          },
        );
        render(<FormsManagementPage locale="en" scope={scope} />);
        await screen.findByRole("heading", { name: form.name });
        if (currentStatus === "paused") fireEvent.click(button("Table view"));
        fireEvent.click(button("More actions"));
        fireEvent.click(button("Archive"));
        await waitFor(() =>
          expect(formsApi.archive).toHaveBeenCalledWith(scope, form.id, true),
        );
        await screen.findByText("No forms yet");
        fireEvent.click(button("Archived"));
        await screen.findAllByText(form.name);
        fireEvent.click(button("More actions"));
        await screen.findAllByRole("button", { name: "Restore" });
        expect(
          button(currentStatus === "active" ? "Pause" : "Activate"),
        ).toBeEnabled();
        expect(button("Edit")).toBeEnabled();
        fireEvent.click(button("Restore"));
        await waitFor(() =>
          expect(formsApi.archive).toHaveBeenCalledWith(scope, form.id, false),
        );
        expect(formsApi.status).not.toHaveBeenCalled();
        expect(form.status).toBe(currentStatus);
        await screen.findByText("No archived forms");
        fireEvent.click(button("Active"));
        await screen.findAllByText(form.name);
        fireEvent.click(button("More actions"));
        await screen.findAllByRole("button", {
          name: currentStatus === "active" ? "Pause" : "Activate",
        });
      });
    }

  for (const scope of ["business", "platform"] as const) {
    it(`${scope} shows skeletons for pending statistics and collections`, async () => {
      let finish!: (value: Awaited<ReturnType<typeof formsApi.list>>) => void;
      vi.mocked(formsApi.list).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      const { container } = render(
        <FormsManagementPage locale="en" scope={scope} />,
      );
      expect(
        screen.getAllByRole("status", { name: formsCopy("en").loading }),
      ).toHaveLength(2);
      expect(
        container.querySelectorAll("[data-skeleton]").length,
      ).toBeGreaterThan(20);
      expect(screen.queryByText("0%")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Table view" }));
      expect(
        container.querySelectorAll("[data-skeleton-table-row]"),
      ).toHaveLength(6);
      await act(async () => finish({ items: [], total: 0 }));
      expect(
        screen.queryByRole("status", { name: formsCopy("en").loading }),
      ).not.toBeInTheDocument();
    });
  }
  it.each(["business", "platform"] as const)(
    "%s keeps one drawer mounted while its edit data loads",
    async (scope) => {
      const saved = {
        ...createForm("en"),
        name: "Stable editor",
        headline: "Stable editor",
        slug: "stable-editor",
      };
      vi.mocked(formsApi.list).mockResolvedValue({ items: [saved], total: 1 });
      let finish!: (value: Awaited<ReturnType<typeof formsApi.get>>) => void;
      vi.mocked(formsApi.get).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      render(<FormsManagementPage locale="en" scope={scope} />);
      await screen.findByRole("heading", { name: saved.name });
      fireEvent.click(screen.getByRole("button", { name: "Edit" }));
      const surface = screen.getByRole("dialog", { name: "Form editor" });
      expect(
        within(surface).getByRole("status", { name: formsCopy("en").loading }),
      ).toBeInTheDocument();
      await act(async () => finish(saved));
      expect(screen.getByRole("dialog", { name: "Form editor" })).toBe(surface);
      expect(
        within(surface).queryByRole("status", {
          name: formsCopy("en").loading,
        }),
      ).not.toBeInTheDocument();
      expect(
        within(surface).getByRole("button", { name: "Save form" }),
      ).toBeEnabled();
    },
  );
  it("does not reopen an editor closed during loading", async () => {
    const saved = {
      ...createForm("en"),
      name: "Pending editor",
      slug: "pending-editor",
    };
    vi.mocked(formsApi.list).mockResolvedValue({ items: [saved], total: 1 });
    let finish!: (value: Awaited<ReturnType<typeof formsApi.get>>) => void;
    vi.mocked(formsApi.get).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<FormsManagementPage locale="en" />);
    await screen.findByRole("heading", { name: "Pending editor" });
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(
      screen.getByRole("status", { name: formsCopy("en").loading }),
    ).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }),
    );
    await act(async () => finish(saved));
    await waitFor(
      () => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      { timeout: 2000 },
    );
  });
  it("replaces a response skeleton with the loaded responses", async () => {
    const saved = {
      ...createForm("en"),
      name: "Response loading",
      slug: "response-loading",
    };
    vi.mocked(formsApi.list).mockResolvedValue({ items: [saved], total: 1 });
    let finish!: (
      value: Awaited<ReturnType<typeof formsApi.submissions>>,
    ) => void;
    vi.mocked(formsApi.submissions).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<FormsManagementPage locale="en" />);
    await screen.findByRole("heading", { name: "Response loading" });
    fireEvent.click(screen.getByRole("button", { name: "Analytics" }));
    expect(
      within(
        screen.getByRole("region", { name: formsCopy("en").submissions }),
      ).getByRole("status", {
        name: formsCopy("en").loading,
      }),
    ).toBeInTheDocument();
    await act(async () => finish({ items: [], total: 0 }));
    expect(await screen.findByText("No responses yet")).toBeInTheDocument();
  });

  for (const scope of ["business", "platform"] as const)
    it(`${scope} shares real lifecycle controls and protected response history`, async () => {
      const saved = {
        ...createForm("en"),
        name: "Saved contact",
        headline: "Saved contact",
        slug: "saved-contact",
        status: "active" as const,
      };
      vi.mocked(formsApi.list).mockResolvedValue({ items: [saved], total: 1 });
      vi.mocked(formsApi.status).mockResolvedValue({
        ...saved,
        status: "paused",
      });
      vi.mocked(formsApi.submissions).mockResolvedValue({
        items: [],
        total: 0,
      });
      render(<FormsManagementPage locale="en" scope={scope} />);
      expect(
        await screen.findByRole("heading", { name: "Saved contact" }),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "More actions" }));
      fireEvent.click(screen.getByRole("button", { name: "Pause" }));
      await waitFor(() =>
        expect(formsApi.status).toHaveBeenCalledWith(scope, saved.id, "paused"),
      );
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Analytics" })).toBeEnabled(),
      );
      fireEvent.click(screen.getByRole("button", { name: "Analytics" }));
      expect(await screen.findByText("No responses yet")).toBeInTheDocument();
      expect(formsApi.submissions).toHaveBeenCalledWith(
        scope,
        saved.id,
        0,
        expect.any(AbortSignal),
        expect.objectContaining({ pageSize: 20 }),
      );
    });
  it("keeps read-only accounts out of editing and mutation controls", async () => {
    const saved = { ...createForm("en"), name: "Read only", slug: "read-only" };
    vi.mocked(formsApi.list).mockResolvedValue({ items: [saved], total: 1 });
    render(
      <FormsManagementPage
        locale="en"
        capabilities={{ create: false, update: false, remove: false }}
      />,
    );
    await screen.findByRole("heading", { name: "Read only" });
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    for (const label of ["Create form", "Edit", "Archive", "Delete"])
      expect(screen.getByRole("button", { name: label })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Preview" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Duplicate" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analytics" })).toBeEnabled();
  });
  it("explains incomplete drafts when publishing fails instead of losing the saved form", async () => {
    const saved = {
      ...createForm("en"),
      name: "Incomplete draft",
      slug: "incomplete-draft",
    };
    vi.mocked(formsApi.list).mockResolvedValue({ items: [saved], total: 1 });
    vi.mocked(formsApi.status).mockRejectedValueOnce(new Error("incomplete"));
    render(<FormsManagementPage locale="en" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "More actions" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Activate" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Complete the questions and final-page button links",
    );
    expect(
      screen.getByRole("heading", { name: "Incomplete draft" }),
    ).toBeInTheDocument();
  });
  it("opens the card builder with compact Back/Create controls and no Cancel", async () => {
    render(<FormsManagementPage locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Create form" }));
    expect(screen.getByRole("radio", { name: "Form layout" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Card layout" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    const dialog = screen.getByRole("dialog", { name: "Form editor" });
    const controls = within(dialog);
    expect(
      controls.getByRole("textbox", { name: "Headline" }),
    ).toBeInTheDocument();
    expect(controls.getByRole("tab", { name: "Content" })).toBeInTheDocument();
    expect(
      controls.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
    expect(controls.getByRole("button", { name: "Create form" })).toBeEnabled();
    fireEvent.click(controls.getByRole("button", { name: "Create form" }));
    expect(controls.getByRole("textbox", { name: "Headline" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(formsApi.save).not.toHaveBeenCalled();
    fireEvent.change(controls.getByRole("textbox", { name: "Headline" }), {
      target: { value: "Contact" },
    });
    expect(controls.getByRole("button", { name: "Create form" })).toBeEnabled();
    fireEvent.click(controls.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("radio", { name: "Card layout" })).toBeChecked();
  });
  it("saves a headline-named form through the backend and reloads the list", async () => {
    const saved = {
      ...createForm("en"),
      name: "Contact",
      headline: "Contact",
      slug: "contact",
      revision: 1,
      status: "active" as const,
    };
    vi.mocked(formsApi.save).mockResolvedValue(saved);
    render(<FormsManagementPage locale="en" />);
    await waitFor(() => expect(formsApi.list).toHaveBeenCalled());
    startForm();
    fireEvent.click(screen.getByText("Introduction"));
    fireEvent.change(screen.getByRole("textbox", { name: "Headline" }), {
      target: { value: "Contact" },
    });
    vi.mocked(formsApi.list).mockResolvedValue({ items: [saved], total: 1 });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Create form",
      }),
    );
    await waitFor(() =>
      expect(formsApi.save).toHaveBeenCalledWith(
        "business",
        expect.objectContaining({ headline: "Contact", name: "Contact" }),
        true,
      ),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Form editor" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("heading", { name: "Contact" }),
    ).toBeInTheDocument();
  });
  it("retains six stats and shared active/archive, grid/table, search and refresh controls", async () => {
    render(<FormsManagementPage locale="en" />);
    for (const label of [
      "Total forms",
      "Views",
      "Unique visitors",
      "Form starts",
      "Submissions",
      "Completion rate",
    ])
      expect(await screen.findByText(label)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Table view" }));
    expect(screen.getByRole("button", { name: "Table view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Archived" }));
    expect(await screen.findByText("No archived forms")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh list" }));
    fireEvent.click(screen.getByRole("button", { name: "Search forms" }));
    const search = within(screen.getByRole("dialog", { name: "Search forms" }));
    fireEvent.change(search.getByRole("textbox"), {
      target: { value: "test" },
    });
    expect(search.getByText(/No matching forms/)).toBeInTheDocument();
  });
  it("preserves existing form data when returning to change layout and save", async () => {
    const save = vi.fn();
    const initialForm = {
      ...createForm("en"),
      name: "Contact",
      headline: "Keep this",
      questions: [{ ...createQuestion(), label: "Name" }],
    };
    render(
      <FormEditorDrawer
        initialForm={initialForm}
        onSave={save}
        onClose={vi.fn()}
        copy={formsCopy("en")}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("radio", { name: "Card layout" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Save form" }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Keep this",
          headline: "Keep this",
          questions: initialForm.questions,
          layout: "card",
        }),
      ),
    );
  });
});
describe("Form preview", () => {
  it("shows all questions together for form layout", () => {
    render(
      <FormPreview
        form={{
          ...createForm("en"),
          questions: [
            { ...createQuestion(), label: "Name" },
            { ...createQuestion("email"), label: "Email" },
          ],
        }}
      />,
    );
    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next" }),
    ).not.toBeInTheDocument();
  });
  it("walks through card questions to the final page without submitting to a server", () => {
    const form = {
      ...createForm("en"),
      name: "Contact",
      layout: "card" as const,
      consentRequired: false,
      questions: [
        { ...createQuestion(), label: "Name" },
        { ...createQuestion("email"), label: "Email" },
      ],
    };
    render(<FormPreview form={form} />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Person" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      screen.queryByRole("textbox", { name: "Name" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
      target: { value: "person@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(
      screen.getByText("Thank you for your response!"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Start again" }),
    ).not.toBeInTheDocument();
  });
  it("never renders unsafe action links", () => {
    render(
      <FormPreview
        finalPage
        form={{
          ...createForm("en"),
          buttonText: "Unsafe",
          buttonUrl: "javascript:alert(1)",
        }}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
