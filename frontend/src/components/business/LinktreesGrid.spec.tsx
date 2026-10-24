import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LinktreePill } from "@/components/business/LinktreeMeta";
import { LinktreesGrid } from "@/components/business/LinktreesGrid";
import { businessMessages } from "@/features/business/i18n/messages";
import type {
  LinktreeListItem,
} from "@linktree/types";

const item: LinktreeListItem = {
  id: "page-1",
  uid: "page-one",
  name: "Page one",
  subtitle: "Headline",
  description: "Description",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-02T00:00:00.000Z",
  analytics: { unique_views: 18, unique_clicks: 4 },
};


describe("LinktreesGrid shared public-page presentation", () => {
  it("shows Arabic Business pagination in the grid", () => {
    render(
      <LinktreesGrid
        data={Array.from({ length: 25 }, (_, index) => ({ ...item, id: `page-${index}`, uid: `page-${index}` }))}
        pagination={{ mode: "client" }}
        listCopy={businessMessages.ar.LinktreeList}
      />,
    );
    expect(screen.getByRole("button", { name: "الصفحة التالية" })).toBeInTheDocument();
    expect(screen.getByText(/من 25/)).toBeInTheDocument();
  });

  it("uses the Business loading announcement without changing the shared default", () => {
    const { rerender } = render(
      <LinktreesGrid isLoading listCopy={businessMessages.ar.LinktreeList} />,
    );
    expect(screen.getByRole("status", { name: "جارٍ تحميل بطاقات الصفحات" })).toBeInTheDocument();

    rerender(<LinktreesGrid isLoading />);
    expect(screen.getByRole("status", { name: "Loading page cards" })).toBeInTheDocument();
  });

  it("uses Arabic Business labels when supplied while leaving shared defaults untouched", () => {
    render(
      <LinktreesGrid
        data={[item]}
        showLinktreeMeta
        listCopy={businessMessages.ar.LinktreeList}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("تاريخ الإنشاء")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تعديل" })).toBeInTheDocument();
  });

  it("uses custom metadata and traffic wording without changing the card layout", () => {
    const DomainMeta = () => <LinktreePill label="بڵاوکراوە" />;

    render(
      <LinktreesGrid
        data={[item]}
        showPageMeta
        MetaBadgesComponent={DomainMeta}
        trafficLabels={{
          column: "ترافیک",
          views: "بینەری تاک",
          interactions: "کۆی کردار",
        }}
      />,
    );

    expect(screen.getByText("بڵاوکراوە")).toBeInTheDocument();
    expect(screen.getByText("دروستکراوە")).toBeInTheDocument();
    expect(screen.getByText("نوێکراوە")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("کۆی کردار")).toBeInTheDocument();
  });

  it("keeps management actions in the edit drawer rather than the grid", () => {
    render(<LinktreesGrid data={[item]} onViewAnalytics={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: "دەستکاری" })).toBeInTheDocument();
    for (const name of ["قازانج", "لەبەرگرتنەوە", "کردارە زیاترەکان"]) expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
  });

  it("uses available action-row space for primary labels on default pages", () => {
    render(
      <LinktreesGrid
        data={[{ ...item, is_default: true }]}
        onViewAnalytics={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    for (const label of ["ئامار", "دەستکاری"]) {
      const action = screen.getByRole("button", { name: label });
      expect(action).toHaveClass("flex-1");
      expect(action).toHaveTextContent(label);
    }

    expect(screen.getByRole("button", { name: "کردنەوە" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "کردارە زیاترەکان" })).not.toBeInTheDocument();
    for (const label of ["ئامار", "دەستکاری"]) {
      expect(screen.getByRole("button", { name: label })).toHaveTextContent(
        label,
      );
    }
    expect(screen.getByRole("button", { name: "کردنەوە" })).toBeInTheDocument();
  });
});
