import { lazy, Suspense, type ComponentType } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LinktreesGrid } from "@/components/business/LinktreesGrid";
import { LinktreesTable } from "@/components/business/LinktreesTable";
import { FormsGrid } from "@/features/forms/components/FormsGrid";
import { FormsTable } from "@/features/forms/components/FormsTable";
import { createForm } from "@/features/forms/forms-model";
import { formsCopy } from "@/features/forms/forms-copy";

const request = vi.hoisted(() => vi.fn(async () => []));
vi.mock("@/lib/api/request", () => ({ apiRequest: request }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<unknown>) => {
    const Component = lazy(
      loader as () => Promise<{
        default: ComponentType<Record<string, unknown>>;
      }>,
    );
    return function Dynamic(props: Record<string, unknown>) {
      return (
        <Suspense fallback={null}>
          <Component {...props} />
        </Suspense>
      );
    };
  },
}));
beforeEach(() => request.mockClear());
describe.each(["business", "platform"] as const)(
  "shared actions in %s",
  (scope) => {
    it.each([
      "form-grid",
      "form-table",
      "linktree-grid",
      "linktree-table",
    ] as const)(
      "opens the owner-scoped sharing drawer for %s without visiting the page",
      async (surface) => {
        const kind = surface.startsWith("form") ? "forms" : "linktrees";
        const base = `/api/${scope === "platform" ? "platform/" : ""}${kind}`;
        const sharing = {
          apiBase: base,
          locale: "en" as const,
          accentColor: "#14b8a6",
          platformTheme: scope === "platform",
        };
        const onOpen = vi.fn();
        if (kind === "forms") {
          const Collection = surface.endsWith("grid") ? FormsGrid : FormsTable;
          render(
            <Collection
              forms={[{ ...createForm("en"), id: "page", slug: "page" }]}
              copy={formsCopy("en")}
              locale="en"
              filtered={false}
              archived={false}
              actions={{ onEdit: vi.fn(), onDelete: vi.fn(), onOpen, sharing }}
            />,
          );
        } else {
          const Collection = surface.endsWith("grid")
            ? LinktreesGrid
            : LinktreesTable;
          render(
            <Collection
              data={[
                {
                  id: "page",
                  uid: "page",
                  name: "Page",
                  created_at: "2026-10-20",
                  updated_at: "2026-10-20",
                },
              ]}
              sharing={sharing}
            />,
          );
        }
        expect(request).not.toHaveBeenCalled();
        fireEvent.click(
          screen.getAllByRole("button", { name: "Share analytics" })[0],
        );
        const dialog = await screen.findByRole(
          "dialog",
          { name: "Analytics sharing" },
          { timeout: 10000 },
        );
        const shell = dialog.parentElement!;
        if (scope === "business") {
          expect(shell.style.getPropertyValue("--theme-primary")).toBe(
            "#14b8a6",
          );
          expect(shell).not.toHaveAttribute("data-platform-admin-theme");
        } else {
          expect(shell).toHaveAttribute("data-platform-admin-theme", "true");
          expect(shell.style.getPropertyValue("--theme-primary")).toBe(
            "var(--sponsor-krd-accent)",
          );
        }
        await waitFor(() =>
          expect(request).toHaveBeenCalledWith(
            `${base}/page/analytics-shares`,
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
          ),
        );
        expect(onOpen).not.toHaveBeenCalled();
      },
    );
  },
);
