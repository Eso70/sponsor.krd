/**
 * Shared utilities for linktree components
 * Prevents code duplication across components
 */

import { getAbsolutePublicUrl, getRootDomain } from "@/lib/utils/app-url";

/**
 * Format date to YYYY-MM-DD HH:MM format (used in business components)
 */
export function formatDate(date: Date | string): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return String(date);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch {
    return String(date);
  }
}

/**
 * Get absolute URL for a linktree UID
 */
export function getAbsoluteUrl(uid: string, pathPrefix = "/linktree"): string {
  return getAbsolutePublicUrl(pathPrefix, uid);
}

export { getRootDomain };

