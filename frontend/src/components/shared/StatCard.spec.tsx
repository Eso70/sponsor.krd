import { fireEvent, render, screen } from "@testing-library/react";
import { Activity } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { StatCard } from "./StatCard";

const geometry = (container: HTMLElement) =>
  [
    "[data-stat-card]",
    "[data-stat-card-icon]",
    "[data-stat-card-value]",
    "[data-stat-card-caption]",
  ].map((selector) => container.querySelector(selector)?.className);

describe("StatCard", () => {
  it("renders the Linktree metric design with formatted values and one caption row", () => {
    const { container } = render(
      <StatCard
        color="blue"
        icon={Activity}
        label="Total activity"
        value={1250}
        subtitle="Last 14 days"
      />,
    );
    expect(screen.getByText("1,250")).toBeInTheDocument();
    expect(screen.getByText("Total activity")).toBeInTheDocument();
    expect(
      screen.getByText("Last 14 days").closest("[data-stat-card-caption]"),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("[data-stat-card-caption]")).toHaveLength(
      1,
    );
  });

  it.each([false, true])(
    "preserves the entire card footprint when compact=%s data resolves",
    (compact) => {
      const onAction = vi.fn();
      const props = {
        compact,
        color: "theme" as const,
        icon: Activity,
        label: "Total activity",
        value: "1,250",
        subtitle: "Last 14 days",
        action: <button onClick={onAction}>Details</button>,
      };
      const { container, rerender } = render(
        <StatCard {...props} loading loadingLabel="Loading activity" />,
      );
      const pendingGeometry = geometry(container);
      expect(
        screen.getByRole("status", { name: "Loading activity" }),
      ).toHaveAttribute("aria-busy", "true");
      expect(screen.queryByText("Total activity")).not.toBeInTheDocument();
      expect(screen.queryByText("Last 14 days")).not.toBeInTheDocument();
      expect(screen.queryByText("1,250")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      for (const slot of ["icon", "value", "caption"])
        expect(
          container.querySelector(`[data-stat-card-${slot}] [data-skeleton]`),
        ).toBeInTheDocument();
      rerender(<StatCard {...props} />);
      expect(geometry(container)).toEqual(pendingGeometry);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Details" }));
      expect(onAction).toHaveBeenCalledOnce();
    },
  );

  it("omits the same icon slot in pending and ready cards when no icon is supplied", () => {
    const { container, rerender } = render(
      <StatCard label="Balance" value={0} loading />,
    );
    expect(
      container.querySelector("[data-stat-card-icon]"),
    ).not.toBeInTheDocument();
    rerender(<StatCard label="Balance" value={0} />);
    expect(
      container.querySelector("[data-stat-card-icon]"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it.each([NaN, Infinity, -Infinity])("shows an unavailable value for invalid numeric data (%s)", (value) => {
    render(<StatCard label="Metric" value={value} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it.each(["en", "ar", "ckb"] as const)(
    "keeps long translated values bounded in %s",
    (locale) => {
      const text =
        locale === "en"
          ? "A very long business name"
          : locale === "ar"
            ? "اسم تجاري طويل جدًا"
            : "ناوی بزنسێکی زۆر درێژ";
      render(
        <div dir={locale === "en" ? "ltr" : "rtl"}>
          <StatCard label={text} value={text} />
        </div>,
      );
      const value = screen
        .getAllByText(text)
        .find((element) => element.hasAttribute("dir"));
      expect(value).toHaveAttribute("dir", "auto");
      expect(value?.parentElement).toHaveClass("truncate");
      expect(value?.parentElement).toHaveAttribute("tabindex", "0");
    },
  );

  it("uses the caller's language for its loading announcement", () => {
    render(
      <StatCard
        label="المشاهدات"
        loading
        loadingLabel="جارٍ التحميل"
        value={0}
      />,
    );
    expect(
      screen.getByRole("status", { name: "جارٍ التحميل" }),
    ).toBeInTheDocument();
  });
});
