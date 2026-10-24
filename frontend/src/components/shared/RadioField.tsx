"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./RadioField.module.css";

/** Styled native radio: keeps browser grouping, arrow keys and form validation. */
export function RadioField({ label, media, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children" | "className"> & {
  label: string;
  media?: ReactNode;
}) {
  return <div className={styles.option}>
    {media}
    <label className={styles.label}>
      <input {...props} type="radio" className={styles.radio} />
      <span className="min-w-0 break-words">{label}</span>
    </label>
  </div>;
}
