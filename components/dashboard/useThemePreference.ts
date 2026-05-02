"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type AppTheme = "light" | "dark";

const THEME_STORAGE_KEY = "brochify.theme.preference";

function readStoredTheme(): AppTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function useThemePreference() {
  const [theme, setTheme] = useState<AppTheme>("light");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(readStoredTheme());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const isDark = useMemo(() => theme === "dark", [theme]);

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };
}
