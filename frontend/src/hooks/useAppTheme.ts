"use client";

import { useSyncExternalStore } from "react";
import { readAppTheme, subscribeAppTheme } from "@/lib/app-theme";
import { toggleAppTheme } from "@/lib/app-theme-transition";

const serverTheme = () => "light" as const;

export function useAppTheme() {
  const theme = useSyncExternalStore(
    subscribeAppTheme,
    readAppTheme,
    serverTheme,
  );
  return { theme, toggleTheme: toggleAppTheme };
}
