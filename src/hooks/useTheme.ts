import { useEffect } from "react";
import type { ThemeMode } from "../types";

export function useTheme(theme: ThemeMode): void {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const resolvedTheme = theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = resolvedTheme;
      document.documentElement.style.colorScheme = resolvedTheme;

      const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      themeColor?.setAttribute("content", resolvedTheme === "dark" ? "#07111f" : "#f4f7fb");
    };

    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);

    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);
}