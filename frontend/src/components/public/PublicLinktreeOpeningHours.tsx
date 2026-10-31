import type { LinktreeSeo } from "@linktree/types/linktree-seo.cjs";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { LINKTREE_DISPLAY_WEEKDAYS, linktreeSeoCopy } from "@/features/link-editor/linktree-seo-copy";
import { formatTimeValue } from "@/lib/utils/time-of-day";
import styles from "./PublicLinktreeBusinessDetails.module.css";

export function PublicLinktreeOpeningHours({ hours, locale }: {
  hours: NonNullable<NonNullable<LinktreeSeo["business"]>["hours"]>;
  locale: BusinessLocale;
}) {
  const copy = linktreeSeoCopy(locale);
  return <div className={styles.hours}>
    <ul className={styles.weekdays}>
      {LINKTREE_DISPLAY_WEEKDAYS.filter(day => hours.days.includes(day)).map(day =>
        <li key={day}>{copy[day]}</li>)}
    </ul>
    <dl className={styles.times}>
      {(["opens", "closes"] as const).map(field => <div key={field}>
        <dt>{copy[field]}</dt>
        <dd><time dateTime={hours[field]} dir="ltr">{formatTimeValue(hours[field])}</time></dd>
      </div>)}
    </dl>
  </div>;
}
