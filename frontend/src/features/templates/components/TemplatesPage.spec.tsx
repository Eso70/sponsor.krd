import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TemplatesPage } from "./TemplatesPage";
import { businessMessages } from "@/features/business/i18n/messages";
import { TEMPLATE_OPTIONS } from "@/lib/templates/config";

const { mockUseTemplateAccess } = vi.hoisted(() => ({
  mockUseTemplateAccess: vi.fn(),
}));

vi.mock("@/hooks/useTemplateAccess", () => ({
  useTemplateAccess: mockUseTemplateAccess,
}));

vi.mock("@/components/shared/StatCard", () => ({
  StatCard: ({ label, value }: { label: string; value: number }) => (
    <div>
      {label}: {value}
    </div>
  ),
}));

vi.mock("@/components/shared/DashboardSurface", () => ({
  DashboardSurface: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/shared/PageHeader", () => ({
  PageHeader: ({ title, action }: { title: string; action: ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {action}
    </header>
  ),
}));


vi.mock("@/components/templates/DynamicTemplate", () => ({
  DynamicTemplate: () => <div>Linktree preview</div>,
}));

vi.mock("./TemplatePhonePreview", () => ({
  TemplatePhonePreview: ({
    name,
    children,
  }: {
    name: string;
    children: (isNear: boolean) => ReactNode;
  }) => (
    <div>
      <span>{name}</span>
      {children(true)}
    </div>
  ),
  TemplatePreviewSkeleton: () => <div>Loading</div>,
}));

vi.mock("./FormTemplatePreview", () => ({
  FormTemplatePreview: ({ name, locale }: { name: string; locale: string }) => <div data-testid="default-form-preview" lang={locale}>{name}</div>,
}));

describe("TemplatesPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseTemplateAccess.mockReturnValue({
      isLoading: false,
      isTemplateAllowed: () => true,
    });
  });

  it("uses Arabic copy for the Business catalogue", () => {
    render(<TemplatesPage copy={businessMessages.ar.TemplatesPage} />);

    expect(screen.getByRole("heading", { name: "القوالب" })).toBeInTheDocument();
    expect(screen.getByText(/إجمالي القوالب/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "بحث (Ctrl+K)" })).toBeInTheDocument();
  });

  it("shows the complete template-page skeleton while access is loading", () => {
    mockUseTemplateAccess.mockReturnValue({
      isLoading: true,
      isTemplateAllowed: () => false,
    });

    render(<TemplatesPage accessMode="entitlement" />);

    expect(
      screen.getByRole("status", { name: "Loading templates" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("offers Pages and Forms category tabs", () => {
    render(<TemplatesPage />);

    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "پەڕەکان" })).toHaveAttribute("aria-selected", "true");
  });

  it("supports a view-only catalogue without business entitlement loading", () => {
    render(<TemplatesPage accessMode="all" />);

    expect(mockUseTemplateAccess).toHaveBeenCalledWith(false);
  });

  it("keeps the platform catalogue inside its explicit SponsorKrd theme boundary", () => {
    const { container } = render(<TemplatesPage platformTheme />);

    expect(container.querySelector("[data-sponsor-krd-theme]")).not.toBeNull();
  });

  it("inherits business branding without forcing the platform palette", () => {
    const { container } = render(<TemplatesPage accessMode="entitlement" />);
    expect(container.querySelector("[data-sponsor-krd-theme]")).toBeNull();
    expect(screen.getByRole("tablist").style.getPropertyValue("--theme-primary")).toBe("");
    expect(screen.getByRole("tablist").style.getPropertyValue("--theme-css")).toBe("");
  });

  it("uses shared search to filter the catalogue and clear back to all previews", () => {
    const { container } = render(<TemplatesPage />);
    expect(container.querySelectorAll("article")).toHaveLength(TEMPLATE_OPTIONS.length);
    fireEvent.click(screen.getByRole("button", { name: "گەڕان (Ctrl+K)" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "spotlight" } });
    expect(container.querySelectorAll("article")).toHaveLength(1);
    expect(container.querySelector("#template-linktree-spotlight")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "پاککردنەوەی گەڕان" }));
    expect(container.querySelectorAll("article")).toHaveLength(TEMPLATE_OPTIONS.length);
  });

  it("shows the shared empty state for an unmatched search", () => {
    render(<TemplatesPage />);
    fireEvent.click(screen.getByRole("button", { name: "گەڕان (Ctrl+K)" }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "missing-template" } });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("heading", { name: "هیچ قالبێک نەدۆزرایەوە" })).toBeInTheDocument();
  });

  it.each(["en", "ar", "ckb"] as const)("shows one default form template with localized preview in %s", (locale) => {
    const copy = businessMessages[locale].TemplatesPage;
    const { container } = render(<TemplatesPage locale={locale} copy={copy} />);
    fireEvent.click(screen.getByRole("tab", { name: copy.formsTab }));
    expect(container.querySelectorAll("article")).toHaveLength(1);
    expect(container.querySelector("#template-form-default")).toBeInTheDocument();
    expect(screen.getByTestId("default-form-preview")).toHaveAttribute("lang", locale);
    expect(screen.getByTestId("default-form-preview")).toHaveTextContent(copy.defaultFormTemplate);
    expect(screen.getByText(`${copy.totalTemplates}: 1`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: copy.pagesTab }));
    expect(container.querySelectorAll("article")).toHaveLength(TEMPLATE_OPTIONS.length);
  });

  it("switches categories with arrow keys and clears the previous search", () => {
    render(<TemplatesPage />);
    fireEvent.click(screen.getByRole("button", { name: "گەڕان (Ctrl+K)" }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "spotlight" } });
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(screen.getByRole("tab", { name: "پەڕەکان" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "فۆرمەکان" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("default-form-preview")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "پاککردنەوەی گەڕان" })).not.toBeInTheDocument();
  });
});
