import { MapPin, Tag } from "lucide-react";
import { linktreeCategoryLabel, type LinktreeSeo } from "@linktree/types/linktree-seo.cjs";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import styles from "./PublicLinktreeBusinessDetails.module.css";

/** The essential business context stays visible above contact actions. */
export function PublicLinktreeBusinessSummary({ seo, locale, color }: { seo?: LinktreeSeo; locale: BusinessLocale; color: string }) {
  if (!seo) return null;
  const category = linktreeCategoryLabel(seo, locale);
  const address = [seo.business?.country, seo.business?.city, seo.business?.street].filter(Boolean).join(", ");
  if (!category && !address) return null;
  return <div data-business-summary className={styles.overview} style={{color}} dir={locale === "en" ? "ltr" : "rtl"}>
    {category && <span className={styles.fact}><Tag aria-hidden className={styles.icon} /><span>{category}</span></span>}
    {address && <span className={styles.fact}><MapPin aria-hidden className={styles.icon} /><span dir="auto">{address}</span></span>}
  </div>;
}
