import { SegmentedControl } from "./SegmentedControl";
import styles from "./page-management.module.css";

/** Collection views reuse the same segmented control as status filters. */
export function ManagementViewToggle({
  value,
  onChange,
  gridLabel,
  tableLabel,
  accentMode = "tenant",
}: {
  value: "grid" | "table";
  onChange: (value: "grid" | "table") => void;
  gridLabel: string;
  tableLabel: string;
  accentMode?: "tenant" | "platform";
}) {
  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      accentMode={accentMode}
      className={styles.view}
      options={[
        { value: "grid", label: gridLabel },
        { value: "table", label: tableLabel },
      ]}
    />
  );
}
