import type {
  FormSubmissionsPage,
  FormAnalytics,
  FormSummary,
} from "./forms.types";
import type {
  PageAnalyticsTotals,
  PageAnalyticsAction,
} from "./analytics.types";
export interface AnalyticsShareBranding {
  name: string;
  logo: string | null;
  favicon: string | null;
  accentColor: string | null;
  origin: string;
  businessTenant: boolean;
}

export interface AnalyticsShareLink {
  canRevealCode?: boolean;
  includeSubmissions?: boolean;
  id: string;
  url: string;
  createdAt: string;
  expiresAt: string | null;
  disabled: boolean;
}

interface SharedAnalyticsReportBase {
  accentColor?: string | null;
  name: string;
  locale: "en" | "ar" | "ckb";
  expiresAt: string | null;
}

export type SharedPageAnalytics = SharedAnalyticsReportBase &
  (
    | {
        pageType: "linktree";
        linktreeAnalytics: {
          totals: PageAnalyticsTotals;
          actions: PageAnalyticsAction[];
        };
        formAnalytics?: never;
        responses?: never;
      }
    | {
        pageType: "form";
        formAnalytics: FormAnalytics;
        exportDefinition?: Pick<FormSummary, "id" | "name" | "slug">;
        responses?: FormSubmissionsPage;
        linktreeAnalytics?: never;
      }
  );
