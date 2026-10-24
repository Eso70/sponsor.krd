import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinktreesGrid } from "./LinktreesGrid";
import { LinktreesTable } from "./LinktreesTable";
import type { LinktreeListItem } from "@linktree/types";

const base: LinktreeListItem = {
  id: "page",
  uid: "page",
  name: "Page",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};
describe.each(["business", "platform"])(
  "Linktree badge in %s collections",
  (scope) => {
    it.each([LinktreesGrid, LinktreesTable])(
      "shows only explicitly enabled badges in %s",
      (Collection) => {
        const { rerender } = render(
          <Collection
            data={[{ ...base, template_config: { verification_badge: true } }]}
            publicPathPrefix={scope === "platform" ? "/p" : "/linktree"}
            listCopy={{ verificationBadge: "Verified badge" }}
          />,
        );
        const badges = screen.getAllByRole("img", { name: "Verified badge" });
        expect(badges.length).toBe(Collection === LinktreesTable ? 2 : 1);
        badges.forEach((badge) =>
          expect(badge.closest("h3, td")).toHaveTextContent("Page"),
        );
        rerender(
          <Collection
            data={[{ ...base, template_config: { verification_badge: false } }]}
            listCopy={{ verificationBadge: "Verified badge" }}
          />,
        );
        expect(
          screen.queryByRole("img", { name: "Verified badge" }),
        ).not.toBeInTheDocument();
        rerender(
          <Collection
            data={[base]}
            listCopy={{ verificationBadge: "Verified badge" }}
          />,
        );
        expect(
          screen.queryByRole("img", { name: "Verified badge" }),
        ).not.toBeInTheDocument();
      },
    );
  },
);
