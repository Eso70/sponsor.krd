export const APP_THEME_STORAGE_KEY = "app-theme";
export const APP_THEME_COOKIE = "app-theme";

export type AppTheme = "light" | "dark";
const listeners = new Set<() => void>();

function notifyThemeChange() {
  listeners.forEach((listener) => listener());
}

export function readAppTheme(): AppTheme {
  if (typeof window === "undefined") return "light";
  const renderedTheme = document.documentElement.dataset.appTheme;
  if (renderedTheme === "dark" || renderedTheme === "light")
    return renderedTheme;
  try {
    const saved = window.localStorage.getItem(APP_THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // Fall back to the server-rendered theme when storage is blocked.
  }
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Keeps immediate client styling and the next server render in agreement. */
export function persistAppTheme(theme: AppTheme) {
  document.documentElement.dataset.appTheme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    if (window.localStorage.getItem(APP_THEME_STORAGE_KEY) !== theme) {
      window.localStorage.setItem(APP_THEME_STORAGE_KEY, theme);
    }
  } catch {
    // Cookies still preserve the theme when private storage is unavailable.
  }
  if (!document.cookie.split("; ").includes(`${APP_THEME_COOKIE}=${theme}`)) {
    document.cookie = `${APP_THEME_COOKIE}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  notifyThemeChange();
}

function syncStoredTheme(event: StorageEvent) {
  if (event.key !== APP_THEME_STORAGE_KEY && event.key !== null) return;
  if (event.newValue === "light" || event.newValue === "dark") {
    persistAppTheme(event.newValue);
  }
}

/** One subscription for every dashboard, drawer, and standalone theme control. */
export function subscribeAppTheme(listener: () => void) {
  if (listeners.size === 0) {
    persistAppTheme(readAppTheme());
    window.addEventListener("storage", syncStoredTheme);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0)
      window.removeEventListener("storage", syncStoredTheme);
  };
}
