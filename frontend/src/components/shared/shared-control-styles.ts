import styles from "./shared-control.module.css";
import chromeStyles from "./dashboard-chrome.module.css";

/** One field surface for inputs, textareas and dropdown triggers. */
export const SHARED_CONTROL_CLASS = `shared-control ${styles.surface}`;
export const SHARED_CONTROL_ERROR_CLASS = styles.error;
/** Slightly stronger neutral fill for a field nested inside another soft surface. */
export const SHARED_INSET_CONTROL_CLASS = styles.inset;
/** Soft, borderless secondary actions; primary actions retain theme-fill. */
export const SHARED_SOFT_BUTTON_CLASS = `${SHARED_CONTROL_CLASS} ${styles.button}`;

/** Uniform square size for standalone header actions. */
export const HEADER_ACTION_SIZE_CLASS = "!size-10 !p-0 shrink-0";

/** Shared by link and button header actions, including server-rendered shells. */
export const HEADER_ACTION_BUTTON_CLASS = `${chromeStyles.control} ${chromeStyles.headerAction} group relative`;
