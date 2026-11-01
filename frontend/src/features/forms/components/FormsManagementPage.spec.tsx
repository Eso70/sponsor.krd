import { DashboardRefreshTestShell } from "@/test-utils/DashboardRefreshTestShell";
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
import { formWhatsAppSettingsCopy } from "../form-whatsapp-settings-copy";

import { formsApi } from "../api";
import { apiRequest } from "@/lib/api/request";
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api/request", async (original) => ({
  ...(await original<typeof import("@/lib/api/request")>()),
  apiRequest: vi.fn(async (url: string) => ({
    slug: new URL(url, "http://localhost").searchParams.get("slug") ?? "copy",
    available: true,
  })),
}));
vi.mock("../api", () => ({
  formsApi: {
    list: vi.fn(),
    selection: vi.fn(),
    titleAvailability: vi.fn(),
    get: vi.fn(),
    stats: vi.fn(),
    analytics: vi.fn(),
    save: vi.fn(),
    status: vi.fn(),
    archive: vi.fn(),
    duplicate: vi.fn(),
    duplicateOptions: vi.fn(),
    remove: vi.fn(),
    submissions: vi.fn(),
    whatsappTemplates: vi.fn(),
    saveWhatsAppTemplate: vi.fn(),
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(formsApi.whatsappTemplates).mockResolvedValue({});
  vi.mocked(formsApi.saveWhatsAppTemplate).mockResolvedValue({ en: "Saved {{name}}" });
  vi.mocked(formsApi.titleAvailability).mockResolvedValue({
    slug: "contact",
    available: true,
  });
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
  fireEvent.click(screen.getByRole("button", { name: "Create" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
}

describe("Forms frontend workspace", () => {
  it.each(["business", "platform"] as const)("keeps shared WhatsApp defaults out of the %s Forms page", async scope => {
    render(<FormsManagementPage scope={scope} locale="en" accentColor="#0f766e"/>);
    expect(screen.queryByRole("button", { name: formWhatsAppSettingsCopy("en").title })).not.toBeInTheDocument();
    expect(formsApi.whatsappTemplates).not.toHaveBeenCalled();
  });
  for (const scope of ["business", "platform"] as const)
    it.each(["grid", "table"] as const)(
      `paginates ${scope} forms in %s view at fifteen items`,
      async (view) => {
        const items = Array.from({ length: 16 }, (_, index) => ({
          ...createForm("en"),
          id: `form-${index}`,
          name: `Form ${index}`,
          slug: `form-${index}`,
        }));
        vi.mocked(formsApi.list).mockImplementation(
          async (_scope, page = 0) => ({
            items: items.slice(page * 15, (page + 1) * 15),
            total: 16,
          }),
        );
        render(<FormsManagementPage scope={scope} locale="en" />);
        const grid = screen.getByRole("button", { name: "Grid" });
        expect(grid).toHaveAttribute("aria-pressed", "true");
        expect(grid.querySelector("[data-navigation-highlight]")).toBeInTheDocument();
        expect(await screen.findByText("1–15 of 16")).toBeInTheDocument();
        if (view === "table")
          fireEvent.click(screen.getByRole("button", { name: "Table" }));
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(await screen.findByText("16–16 of 16")).toBeInTheDocument();
        expect(formsApi.list).toHaveBeenLastCalledWith(
          scope,
          1,
          "",
          "active",
          expect.any(AbortSignal),
        );
      },
    );
  it.each(["business", "platform"] as const)(
    "refreshes %s Forms from the header without resetting the current view, archive filter or page",
    async (scope) => {
      const forms = Array.from({ length: 16 }, (_, index) => ({
        ...createForm("en"),
        id: `saved-${index}`,
        name: `Saved ${index}`,
        slug: `saved-${index}`,
      }));
      vi.mocked(formsApi.list).mockImplementation(async (_scope, page = 0) => ({
        items: forms.slice(page * 15, (page + 1) * 15),
        total: 16,
      }));
      const shared = vi.fn();
      const { container } = render(
        <DashboardRefreshTestShell onSharedRefresh={shared}>
          <FormsManagementPage scope={scope} locale="en" />
        </DashboardRefreshTestShell>,
      );
      await screen.findByText("1–15 of 16");
      fireEvent.click(screen.getByRole("button", { name: "Table" }));
      fireEvent.click(screen.getByRole("button", { name: "Archived" }));
      await waitFor(() =>
        expect(formsApi.list).toHaveBeenLastCalledWith(
          scope,
          0,
          "",
          "archived",
          expect.any(AbortSignal),
        ),
      );
      await screen.findByText("1–15 of 16");
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      await screen.findByText("16–16 of 16");
      vi.mocked(formsApi.list).mockClear();
      expect(
        within(
          container.querySelector(
            "[data-page-management-toolbar]",
          ) as HTMLElement,
        ).queryByRole("button", { name: "Refresh" }),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
      await waitFor(() =>
        expect(formsApi.list).toHaveBeenCalledWith(
          scope,
          1,
          "",
          "archived",
          expect.any(AbortSignal),
        ),
      );
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled(),
      );
      expect(shared).toHaveBeenCalledOnce();
      expect(
        screen.getByRole("button", { name: "Table" }),
      ).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Archived" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByText("2 / 2")).toBeInTheDocument();
    },
  );
  it("returns a pinned form from a later server page to the first page", async () => {
    const first = {
      ...createForm("en"),
      id: "first",
      name: "First form",
      slug: "first",
    };
    const later = {
      ...createForm("en"),
      id: "later",
      name: "Later form",
      slug: "later",
    };
    let pinned = false;
    vi.mocked(formsApi.list).mockImplementation(async (_scope, page) => ({
      items:
        page === 0
          ? pinned
            ? [{ ...later, isPinned: true }, first]
            : [first]
          : [later],
      total: 21,
    }));
    render(<FormsManagementPage locale="en" />);
    await screen.findByText("First form");
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Later form");
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    pinned = true;
    fireEvent.click(screen.getByRole("button", { name: "Pin" }));
    await screen.findByRole("button", { name: "Unpin" });
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(formsApi.list).toHaveBeenLastCalledWith(
      "business",
      0,
      "",
      "active",
      expect.any(AbortSignal),
    );
  });

  it.each(["business", "platform"] as const)(
    "persists and reloads pins in the %s collection",
    async (scope) => {
      const saved = { ...createForm("en"), slug: "saved", isPinned: false };
      vi.mocked(formsApi.list).mockResolvedValue({ items: [saved], total: 1 });
      render(<FormsManagementPage locale="en" scope={scope} />);
      const button = await screen.findByRole("button", { name: "Pin" });
      vi.mocked(formsApi.list).mockResolvedValue({
        items: [{ ...saved, isPinned: true }],
        total: 1,
      });
      fireEvent.click(button);
      await screen.findByRole("button", { name: "Unpin" });
      expect(apiRequest).toHaveBeenCalledWith(
        `${scope === "platform" ? "/api/platform/forms" : "/api/forms"}/${saved.id}/pin`,
        { method: "PATCH", json: { isPinned: true } },
      );
    },
  );

  it.each(["business", "platform"] as const)(
    "customizes a saved copy inside the %s drawer and restores the source draft",
    async (scope) => {
      const saved = {
        ...createForm("en"),
        name: "Saved source",
        slug: "saved-source",
        headline: "Saved headline",
        banner: "/images/upload/banner.png",
        logo: "/images/upload/logo.png",
      };
      vi.mocked(formsApi.list).mockResolvedValue({ items: [saved], total: 1 });
      vi.mocked(formsApi.get).mockResolvedValue(saved);
      vi.mocked(formsApi.duplicateOptions).mockResolvedValue({
        form: saved,
        name: "Saved source (copy)",
        slug: "saved-source-copy",
        available: true,
      });
      vi.mocked(formsApi.duplicate).mockResolvedValue({
        ...saved,
        id: "duplicate",
        name: "Different copy",
      });
      render(<FormsManagementPage locale="en" scope={scope} />);
      fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
      const drawer = await screen.findByRole("dialog");
      fireEvent.change(screen.getByRole("textbox", { name: "Form title" }), {
        target: { value: "Unsaved source" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
      await screen.findByRole("dialog", { name: "Duplicate page" });
      expect(screen.getByRole("dialog")).toBe(drawer);
      expect(screen.getByRole("textbox", { name: "Form title" })).toHaveValue(
        "Saved source (copy)",
      );
      expect(screen.getByText("/form/saved-source-copy")).toBeInTheDocument();
      expect(screen.getAllByText("Saved headline").length).toBeGreaterThan(0);
      expect(formsApi.duplicate).not.toHaveBeenCalled();
      fireEvent.change(screen.getByRole("textbox", { name: "Link slug" }), {
        target: { value: "custom-copy" },
      });
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Duplicate" })).toBeEnabled(),
      );
      fireEvent.change(screen.getByRole("textbox", { name: "Form title" }), {
        target: { value: "Different copy" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
      await waitFor(() =>
        expect(formsApi.duplicate).toHaveBeenCalledWith(
          scope,
          saved.id,
          expect.objectContaining({
            name: "Different copy",
            headline: "Saved headline",
            banner: saved.banner,
            logo: saved.logo,
            status: "paused",
            submissionCount: 0,
          }),
          "custom-copy",
        ),
      );
      await waitFor(() =>
        expect(screen.getByRole("textbox", { name: "Form title" })).toHaveValue(
          "Unsaved source",
        ),
      );
      expect(formsApi.save).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
      await screen.findByRole("dialog", { name: "Duplicate page" });
      fireEvent.change(screen.getByRole("textbox", { name: "Form title" }), {
        target: { value: "Discard copy" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(screen.getByRole("textbox", { name: "Form title" })).toHaveValue(
        "Unsaved source",
      );
      expect(formsApi.duplicate).toHaveBeenCalledTimes(1);
      expect(saved.name).toBe("Saved source");
    },
  );
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
        vi.mocked(formsApi.get).mockImplementation(async () => form);
        render(<FormsManagementPage locale="en" scope={scope} />);
        await screen.findByRole("heading", { name: form.name });
        if (currentStatus === "paused") fireEvent.click(button("Table"));
        fireEvent.click(button("Edit"));
        await screen.findByRole("button", { name: "Duplicate" });
        fireEvent.click(button("Archive"));
        await waitFor(() =>
          expect(formsApi.archive).toHaveBeenCalledWith(scope, form.id, true),
        );
        fireEvent.click(button("Restore"));
        await waitFor(() =>
          expect(formsApi.archive).toHaveBeenCalledWith(scope, form.id, false),
        );
        expect(formsApi.status).not.toHaveBeenCalled();
        expect(form.status).toBe(currentStatus);
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
      ).toHaveLength(7);
      expect(
        container.querySelectorAll("[data-skeleton]").length,
      ).toBeGreaterThan(20);
      expect(screen.queryByText("0%")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Table" }));
      expect(container.querySelectorAll("[data-skeleton-table-row]")).toHaveLength(6);
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
      vi.mocked(formsApi.get).mockResolvedValue(saved);
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
        within(surface).getByRole("button", { name: "Save" }),
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
      vi.mocked(formsApi.get).mockResolvedValue(saved);
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
      fireEvent.click(screen.getByRole("button", { name: "Edit" }));
      fireEvent.click(await screen.findByRole("button", { name: "Pause" }));
      await waitFor(() =>
        expect(formsApi.status).toHaveBeenCalledWith(scope, saved.id, "paused"),
      );
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
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
    for (const label of ["Create", "Edit", "Delete"])
      expect(screen.getByRole("button", { name: label })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Preview" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Duplicate" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analytics" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: formWhatsAppSettingsCopy("en").title })).not.toBeInTheDocument();
  });
  it("explains incomplete drafts when publishing fails instead of losing the saved form", async () => {
    const saved = {
      ...createForm("en"),
      name: "Incomplete draft",
      slug: "incomplete-draft",
    };
    vi.mocked(formsApi.list).mockResolvedValue({ items: [saved], total: 1 });
    vi.mocked(formsApi.status).mockRejectedValueOnce(new Error("incomplete"));
    vi.mocked(formsApi.get).mockResolvedValue(saved);
    render(<FormsManagementPage locale="en" />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    fireEvent.click(await screen.findByRole("button", { name: "Activate" }));
    expect((await screen.findAllByRole("alert"))[0]).toHaveTextContent(
      "Complete the questions and final-page button links",
    );
    expect(
      screen.getByRole("heading", { name: "Incomplete draft" }),
    ).toBeInTheDocument();
  });
  it("opens the card builder with compact Back/Create controls and no Cancel", async () => {
    render(<FormsManagementPage locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
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
    expect(controls.getByRole("button", { name: "Create" })).toBeEnabled();
    fireEvent.click(controls.getByRole("button", { name: "Create" }));
    expect(
      controls.getByRole("textbox", { name: "Form title" }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(formsApi.save).not.toHaveBeenCalled();
    fireEvent.change(controls.getByRole("textbox", { name: "Headline" }), {
      target: { value: "Contact" },
    });
    expect(controls.getByRole("button", { name: "Create" })).toBeEnabled();
    fireEvent.click(controls.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("radio", { name: "Card layout" })).toBeChecked();
  });
  it("saves a title-named form with an optional introduction and reloads the list", async () => {
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
    fireEvent.change(screen.getByRole("textbox", { name: "Form title" }), {
      target: { value: "Contact" },
    });
    vi.mocked(formsApi.list).mockResolvedValue({ items: [saved], total: 1 });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Create",
      }),
    );
    await waitFor(() =>
      expect(formsApi.save).toHaveBeenCalledWith(
        "business",
        expect.objectContaining({ headline: "", name: "Contact" }),
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
  it("retains six stats and shared controls with refresh only in the header", async () => {
    render(
      <DashboardRefreshTestShell>
        <FormsManagementPage locale="en" />
      </DashboardRefreshTestShell>,
    );
    for (const label of [
      "Total forms",
      "Views",
      "Unique visitors",
      "Form starts",
      "Submissions",
      "Completion rate",
    ])
      await waitFor(() => expect(screen.getByText(label)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(screen.getByRole("button", { name: "Table" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Archived" }));
    expect(await screen.findByText("No archived forms")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    const search = within(
      await screen.findByRole("dialog", { name: "Search" }),
    );
    fireEvent.change(search.getByRole("searchbox"), {
      target: { value: "test" },
    });
    await waitFor(() =>
      expect(search.getByText(/No matching forms/)).toBeInTheDocument(),
    );
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
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Contact",
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


describe.each(["business", "platform"] as const)("Form analytics selection in %s", (scope) => {
  it.each(["grid", "table"] as const)("deletes only selected analytics from %s while retaining forms", async (view) => {
    const saved = [0, 1].map((index) => ({ ...createForm("en"), id: `select-${index}`, name: `Selected form ${index}`, slug: `select-${index}` }));
    vi.mocked(formsApi.list).mockResolvedValue({ items: saved, total: 2 });
    render(<FormsManagementPage scope={scope} locale="en" />);
    await screen.findByText(saved[0].name);
    if (view === "table") fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(screen.queryByRole("button", { name: "Delete analytics" })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("checkbox", { name: `Select form: ${saved[0].name}` })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Delete analytics" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/submitted answers and contact details will remain/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete analytics" }));
    const base = scope === "platform" ? "/api/platform/forms" : "/api/forms";
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(`${base}/${saved[0].id}/analytics`, { method: "DELETE" }));
    expect(apiRequest).not.toHaveBeenCalledWith(`${base}/${saved[1].id}/analytics`, expect.anything());
    expect(apiRequest).not.toHaveBeenCalledWith(expect.stringContaining('/submissions'), expect.anything());
    await waitFor(() => expect(screen.queryByRole("button", { name: "Delete analytics" })).not.toBeInTheDocument());
    expect(formsApi.stats).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText(saved[0].name).length).toBeGreaterThan(0);
  });

  it("selects all matching forms beyond the current server page and preserves selection while paging", async () => {
    const saved = Array.from({ length: 16 }, (_, index) => ({ ...createForm("en"), id: `all-${index}`, name: `All form ${index}`, slug: `all-${index}` }));
    vi.mocked(formsApi.list).mockImplementation(async (_scope, page = 0) => ({ items: saved.slice(page * 15, (page + 1) * 15), total: 16 }));
    vi.mocked(formsApi.selection).mockResolvedValue(saved.map((form) => form.id));
    render(<FormsManagementPage scope={scope} locale="en" />);
    await screen.findByText("1–15 of 16");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select form: All form 0" }));
    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    await screen.findByRole("group", { name: "16 selected" });
    expect(formsApi.selection).toHaveBeenCalledWith(scope, "", "active", expect.any(AbortSignal));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("checkbox", { name: "Select form: All form 15" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Deselect all" }));
    expect(screen.queryByRole("button", { name: "Delete analytics" })).not.toBeInTheDocument();
  });

  it("does not expose selection without the delete capability", async () => {
    vi.mocked(formsApi.list).mockResolvedValue({ items: [{ ...createForm("en"), id: "read-only", name: "Read only" }], total: 1 });
    render(<FormsManagementPage scope={scope} locale="en" capabilities={{ create: false, update: false, remove: false }} />);
    await screen.findByText("Read only");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});


it("ignores a stale select-all result after the form archive filter changes", async () => {
  let resolveSelection!: (ids: string[]) => void;
  const selected = new Promise<string[]>((resolve) => { resolveSelection = resolve; });
  vi.mocked(formsApi.selection).mockReturnValue(selected);
  const form = { ...createForm("en"), id: "stale", name: "Stale form" };
  vi.mocked(formsApi.list).mockResolvedValue({ items: [form], total: 1 });
  render(<FormsManagementPage scope="business" locale="en" />);
  await screen.findByText("Stale form");
  fireEvent.click(screen.getByRole("checkbox", { name: "Select form: Stale form" }));
  fireEvent.click(screen.getByRole("button", { name: "Select all" }));
  fireEvent.click(screen.getByRole("button", { name: "Archived" }));
  await act(async () => { resolveSelection(["stale"]); await selected; });
  expect(screen.queryByRole("button", { name: "Delete analytics" })).not.toBeInTheDocument();
  expect(formsApi.selection).toHaveBeenCalledWith("business", "", "active", expect.objectContaining({ aborted: true }));
});


it.each(["business", "platform"] as const)("keeps all six %s form stats pending until list and summary both arrive", async (scope) => {
  let resolveList!: (value: Awaited<ReturnType<typeof formsApi.list>>) => void;
  let resolveStats!: (value: Awaited<ReturnType<typeof formsApi.stats>>) => void;
  vi.mocked(formsApi.list).mockReturnValue(new Promise((resolve) => { resolveList = resolve; }));
  vi.mocked(formsApi.stats).mockReturnValue(new Promise((resolve) => { resolveStats = resolve; }));
  const { container } = render(<FormsManagementPage scope={scope} locale="en" />);
  expect(container.querySelectorAll('[data-stat-card][data-state="ready"]')).toHaveLength(0);
  await act(async () => { resolveList({ items: [], total: 7 }); });
  expect(container.querySelectorAll('[data-stat-card][data-state="ready"]')).toHaveLength(0);
  await act(async () => { resolveStats({ totalForms: 7, views: 15, visitors: 8, starts: 4, submissions: 2 }); });
  await waitFor(() => expect(container.querySelectorAll('[data-stat-card][data-state="ready"]')).toHaveLength(6));
});

it("shows unavailable form statistics after a failed fetch instead of invented zero counts", async () => {
  vi.mocked(formsApi.stats).mockRejectedValue(new Error("Offline"));
  render(<FormsManagementPage scope="business" locale="en" />);
  await waitFor(() => expect(screen.getAllByText("—")).toHaveLength(6));
});

describe.each(["business", "platform"] as const)("selected form deletion in %s", (scope) => {
  it.each(["grid", "table"] as const)("deletes only selected records from %s after confirmation", async (view) => {
    const saved = [0, 1].map((index) => ({ ...createForm("en"), id: `bulk-${index}`, name: `Bulk form ${index}`, slug: `bulk-${index}` }));
    vi.mocked(formsApi.list).mockResolvedValue({ items: saved, total: 2 });
    render(<FormsManagementPage scope={scope} locale="en" />);
    await screen.findByText(saved[0].name);
    if (view === "table") fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(screen.queryByRole("button", { name: "Delete forms" })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("checkbox", { name: `Select form: ${saved[0].name}` })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Delete forms" }));
    const base = scope === "platform" ? "/api/platform/forms" : "/api/forms";
    expect(apiRequest).not.toHaveBeenCalledWith(`${base}/${saved[0].id}`, expect.anything());
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("submitted answers and contact details");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete forms" }));
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(`${base}/${saved[0].id}`, { method: "DELETE" }));
    expect(apiRequest).not.toHaveBeenCalledWith(`${base}/${saved[1].id}`, expect.anything());
    expect(apiRequest).not.toHaveBeenCalledWith(expect.stringContaining("/analytics"), expect.anything());
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(formsApi.stats).toHaveBeenCalledTimes(2);
  });
});

it("moves to an available page after bulk deletion empties the final form page", async () => {
  let removed = false;
  const saved = Array.from({ length: 16 }, (_, index) => ({ ...createForm("en"), id: `last-${index}`, name: `Last form ${index}`, slug: `last-${index}` }));
  vi.mocked(formsApi.list).mockImplementation(async (_scope, page = 0) => {
    const items = removed ? saved.slice(0, 15) : saved;
    return { items: items.slice(page * 15, (page + 1) * 15), total: items.length };
  });
  vi.mocked(apiRequest).mockImplementationOnce(async () => { removed = true; return {} as never; });
  render(<FormsManagementPage locale="en" />);
  await screen.findByText("1–15 of 16");
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(await screen.findByRole("checkbox", { name: "Select form: Last form 15" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete forms" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete forms" }));
  await screen.findByRole("checkbox", { name: "Select form: Last form 0" });
  expect(screen.queryByRole("checkbox", { name: "Select form: Last form 15" })).not.toBeInTheDocument();
  expect(formsApi.list).toHaveBeenLastCalledWith("business", 0, "", "active", expect.any(AbortSignal));
});
