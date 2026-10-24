"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, ClipboardList, LayoutTemplate, Link2, Search } from "lucide-react";
import { useTemplateAccess } from "@/hooks/useTemplateAccess";
import { RequestErrorNotice } from "@/components/shared/RequestErrorNotice";
import { StatCard } from "@/components/shared/StatCard";
import { TEMPLATE_OPTIONS } from "@/lib/templates/config";
import { PageManagementSection } from "@/components/shared/PageManagementSection";
import { ManagementSearchModal } from "@/components/shared/ManagementSearchModal";
import { ManagementSearchTrigger } from "@/components/shared/ManagementSearchTrigger";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTemplatePage } from "@/components/shared/Skeleton";
import { useRegisterDashboardRefresh } from "@/components/shared/dashboard-refresh";
import { TemplateCatalog } from "./TemplateCatalog";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { DASHBOARD_PAGE_LABELS } from "@/components/shared/dashboard-page-labels";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import type { FormLanguage } from "@/features/forms/types";
export interface TemplatesPageCopy {
  totalTemplates: string; available: string; linktreeTemplates: string;
  formTemplates: string; pagesTab: string; formsTab: string; defaultFormTemplate: string;
  title: string; description: string; clearSearch: string; searchTooltip: string;
  searchLabel: string; search: string; noTemplates: string; tryAnother: string;
  searchPlaceholder: string; searchPrompt: string; noResults: string; view: string;
  locked: string; mobilePreview: string; previewDescription: string;
  previewWhatsapp: string; previewViber: string; previewPhone: string;
  previewSubtitle: string;
  applySearch: string;
  loadingLabel?: string;
  accessFailed?: string;
}

const KURDISH_COPY: TemplatesPageCopy = {
  totalTemplates: "کۆی قالبەکان", available: "بەردەستەکان",
  linktreeTemplates: "قالبی لینک تری", title: DASHBOARD_PAGE_LABELS.templates,
  formTemplates: "قالبەکانی فۆرم", pagesTab: "پەڕەکان", formsTab: "فۆرمەکان", defaultFormTemplate: "بنەڕەتی",
  description: "قالبەکانی پەڕە و فۆرم ببینە و دیزاینەکان پێشبینی بکە.",
  clearSearch: "پاککردنەوەی گەڕان", searchTooltip: "گەڕان لە قالبەکان (Ctrl+K)",
  searchLabel: "گەڕان (Ctrl+K)", search: "گەڕان...",
  noTemplates: "هیچ قالبێک نەدۆزرایەوە", tryAnother: "دووبارە گەڕان بکەرەوە بە وشەیەکی تر",
  searchPlaceholder: "ناوی قالب بنووسە...",
  searchPrompt: "گەڕان بۆ قالبەکان بکە...", noResults: "هیچ ئەنجامێک نەدۆزرایەوە بۆ",
  view: "پیشاندان ←", locked: "ئەم قالبە لە پلانی ئێستاتدا بەردەست نییە",
  mobilePreview: "mobile preview", previewDescription: "بۆ پەیوەندی کردن، کلیک لەم لینکانی خوارەوە بکە",
  previewWhatsapp: "واتساپ", previewViber: "ڤایبەر", previewPhone: "ژمارەی مۆبایل",
  previewSubtitle: "Digital Presence Platform",
  applySearch: "جێبەجێکردن و داخستن",
};

export interface TemplatesPageProps {
  accessMode?: "all" | "entitlement";
  copy?: Partial<TemplatesPageCopy>;
  locale?: FormLanguage;
  platformTheme?: boolean;
}

export function TemplatesPage({ accessMode = "all", copy, locale = "ckb", platformTheme = false }: TemplatesPageProps) {
  const labels = { ...KURDISH_COPY, ...copy };
  const enforceTemplateAccess = accessMode === "entitlement";
  const {
    isLoading: isEntitlementLoading,
    unavailable: accessUnavailable,
    isTemplateAllowed: isEntitledToTemplate,
    refresh,
  } = useTemplateAccess(enforceTemplateAccess);
  const isTemplateAllowed = useCallback(
    (templateKey: string) => isEntitledToTemplate(templateKey),
    [isEntitledToTemplate],
  );
  const shouldShowLockedTemplates = accessMode !== "all";
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightedCard = useRef<HTMLElement | null>(null);
  useEffect(() => () => {
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightedCard.current?.classList.remove("ring-2", "ring-[var(--theme-primary)]/40");
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<"linktree" | "form">("linktree");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const refreshing = useRegisterDashboardRefresh("templates", () =>
    refresh({ rethrow: true }),
  );

  const activeTemplates = useMemo(() => category === "linktree" ? TEMPLATE_OPTIONS :
    [{ id: "default", name: labels.defaultFormTemplate }], [category, labels.defaultFormTemplate]);

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return activeTemplates;

    return activeTemplates.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        template.id.toLowerCase().includes(query),
    );
  }, [activeTemplates, searchQuery]);

  const availableTemplateCount = useMemo(
    () =>
      activeTemplates.filter((template) => category === "form" || isTemplateAllowed(template.id))
        .length,
    [activeTemplates, isTemplateAllowed, category],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      setIsSearchModalOpen((open) => !open);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectSearchResult = (templateId: string) => {
    const element = document.getElementById(`template-${category}-${templateId}`);
    if (element) {
      highlightedCard.current?.classList.remove("ring-2", "ring-[var(--theme-primary)]/40");
      highlightedCard.current = element;
      element.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
      element.classList.add("ring-2", "ring-[var(--theme-primary)]/40");
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(
        () => element.classList.remove("ring-2", "ring-[var(--theme-primary)]/40"),
        2000,
      );
    }
    setIsSearchModalOpen(false);
  };

  if (refreshing || (enforceTemplateAccess && isEntitlementLoading)) {
    return <SkeletonTemplatePage loadingLabel={labels.loadingLabel} previewCount={category === "form" ? 1 : 3} />;
  }

  return (
    <section data-sponsor-krd-theme={platformTheme ? true : undefined} className="w-full min-w-0 space-y-4 pb-8 sm:space-y-6 sm:pb-10" dir="ltr">
      <StatCardGrid columns={3}>
        <StatCard icon={LayoutTemplate} label={labels.totalTemplates} value={activeTemplates.length} color="blue" />
        <StatCard icon={CheckCircle} label={labels.available} value={accessUnavailable && category === "linktree" ? "—" : availableTemplateCount} color="green" />
        <StatCard icon={category === "form" ? ClipboardList : Link2} label={category === "form" ? labels.formTemplates : labels.linktreeTemplates} value={activeTemplates.length} color="purple" />
      </StatCardGrid>
      {accessUnavailable && category === "linktree" && <RequestErrorNotice message={labels.accessFailed ?? (locale === "en" ? "Couldn’t load template access" : locale === "ar" ? "تعذّر تحميل صلاحيات القوالب" : "نەتوانرا دەستگەیشتن بە قاڵبەکان بپشکنرێت")} />}
      <SegmentedTabs<"linktree" | "form">
        tabs={[{ id: "linktree", label: labels.pagesTab, icon: Link2 }, { id: "form", label: labels.formsTab, icon: ClipboardList }]}
        value={category} onChange={(value) => { setCategory(value); setSearchQuery(""); }} />
      <PageManagementSection title={labels.title} description={labels.description} icon={<LayoutTemplate className="size-5" />}
        toolbar={<ManagementSearchTrigger query={searchQuery} open={isSearchModalOpen}
          onClick={() => searchQuery.trim() ? setSearchQuery("") : setIsSearchModalOpen(true)}
          labels={{ clearSearch: labels.clearSearch, searchTooltip: labels.searchTooltip, search: labels.searchLabel, searchPlaceholder: labels.searchPlaceholder }} />
        }>
        <div data-template-category={category}>
          {filteredTemplates.length === 0 ? <EmptyState compact icon={Search} title={labels.noTemplates} description={labels.tryAnother} /> :
            <TemplateCatalog templates={filteredTemplates} category={category} locale={locale} copy={labels} isLocked={(id) => shouldShowLockedTemplates && !isTemplateAllowed(id)} />}
        </div>
      </PageManagementSection>
      <ManagementSearchModal platformTheme={platformTheme} isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)}
        searchQuery={searchQuery} onSearchQueryChange={setSearchQuery}
        items={activeTemplates.map((template) => ({ id: template.id, name: template.name, subtitle: template.id, searchTerms: [template.id], icon: Link2 }))}
        onSelect={(item) => selectSearchResult(item.id)}
        copy={{ placeholder: labels.searchPlaceholder, close: labels.applySearch, prompt: labels.searchPrompt, noResults: labels.noResults, action: labels.view }} />
    </section>
  );
}
