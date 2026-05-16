import { useEffect, useState } from "react";

export type ColorTheme = "light" | "dark";

const colorThemeStorageKey = "trip-planner-color-theme";
const themeColor = {
  light: "#f5f6f8",
  dark: "#111318"
} satisfies Record<ColorTheme, string>;

function preferredTheme(): ColorTheme {
  const stored = window.localStorage.getItem(colorThemeStorageKey);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ColorTheme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", themeColor[theme]);
}

export function useColorTheme() {
  const [theme, setTheme] = useState<ColorTheme>(() => preferredTheme());

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(colorThemeStorageKey, theme);
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark"))
  };
}
