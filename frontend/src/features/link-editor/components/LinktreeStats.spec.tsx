import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LinktreeStats } from "./LinktreeStats";
import { linktreeStatsCopy } from "../linktree-stats-copy";

describe("essential Linktree overview cards", () => {
  it.each(["en", "ckb", "ar"] as const)(
    "shows six real totals without an extra description line in %s",
    (locale) => {
      const copy = linktreeStatsCopy(locale);
      const { container } = render(
        <LinktreeStats
          pages={8}
          views={151}
          visitors={37}
          clicks={202}
          clickers={13}
          contacts={19}
          loading={false}
          locale={locale}
        />,
      );
      expect(container.firstElementChild).toHaveClass(
        "lg:grid-cols-3",
        "grid-cols-2",
      );
      for (const label of [
        copy.pages,
        copy.views,
        copy.visitors,
        copy.clicks,
        copy.clickers,
        copy.contacts,
      ])
        expect(screen.getByText(label)).toBeInTheDocument();
      for (const value of ["8", "151", "37", "202", "13", "19"])
        expect(screen.getByText(value)).toBeInTheDocument();
      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
      expect(screen.queryByText(/conversion/i)).not.toBeInTheDocument();
      expect(container.querySelectorAll("article")).toHaveLength(6);
    },
  );
  it("renders six matching skeletons with one pending state for every card", () => {
    const props = {
      pages: 8,
      views: 151,
      visitors: 37,
      clicks: 202,
      clickers: 13,
      contacts: 19,
      locale: "en" as const,
    };
    const { rerender } = render(<LinktreeStats {...props} loading />);
    expect(screen.getAllByRole("status")).toHaveLength(6);
    rerender(<LinktreeStats {...props} loading={false} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    for (const value of ["8", "151", "37", "202", "13", "19"])
      expect(screen.getByText(value)).toBeInTheDocument();
  });
  it("distinguishes unavailable data from valid zero traffic", () => {
    const props = {
      pages: 1,
      views: 0,
      visitors: 0,
      clicks: 0,
      clickers: 0,
      contacts: 0,
      loading: false,
      locale: "en" as const,
    };
    const { rerender } = render(<LinktreeStats {...props} unavailable />);
    expect(screen.getAllByText("—")).toHaveLength(5);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    rerender(<LinktreeStats {...props} />);
    expect(screen.getAllByText("0")).toHaveLength(5);
    rerender(<LinktreeStats {...props} pagesUnavailable />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });
});
