import { type LinktreeSeo } from "@linktree/types/linktree-seo.cjs";
import { ChevronDown, Clock3, Utensils, MapPin, BriefcaseBusiness } from "lucide-react";
import styles from "./PublicLinktreeBusinessDetails.module.css";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { LINKTREE_DISPLAY_WEEKDAYS, linktreeSeoCopy } from "@/features/link-editor/linktree-seo-copy";

/** Optional factual details sit below the primary links in a native disclosure. */
export function PublicLinktreeBusinessDetails({ seo, locale, color }: { seo?: LinktreeSeo; locale: BusinessLocale; color: string }) {
  if (!seo) return null;
  const details = seo.business, copy = linktreeSeoCopy(locale);
  if (!details?.cuisine && !details?.serviceArea && !details?.services && !details?.hours) return null;
  return <details className={styles.details} style={{ color }} dir={locale === "en" ? "ltr" : "rtl"}>
    <summary className={styles.summary}>
      <span>{copy.details}</span><ChevronDown aria-hidden className={styles.chevron} />
    </summary>
    <div className={styles.content}>
    <dl className={styles.rows}>
      {details?.cuisine && <div className={styles.row}><dt><Utensils aria-hidden className={styles.icon} />{copy.cuisine}</dt><dd dir="auto">{details.cuisine}</dd></div>}
      {details?.serviceArea && <div className={styles.row}><dt><MapPin aria-hidden className={styles.icon} />{copy.serviceArea}</dt><dd dir="auto">{details.serviceArea}</dd></div>}
      {details?.services && <div className={styles.row}><dt><BriefcaseBusiness aria-hidden className={styles.icon} />{copy.services}</dt><dd dir="auto">{details.services}</dd></div>}
      {details?.hours && <div className={styles.row}><dt><Clock3 aria-hidden className={styles.icon} />{copy.hours}</dt><dd><span>{LINKTREE_DISPLAY_WEEKDAYS.filter(day => details.hours!.days.includes(day)).map(day => copy[day]).join(", ")}</span><span dir="ltr" className="block">{details.hours.opens}–{details.hours.closes}</span></dd></div>}
    </dl>
    </div>
  </details>;
}
