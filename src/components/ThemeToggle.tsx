import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const storageKey = "sokol-theme";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme, persist: boolean) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.getElementById("theme-color")?.setAttribute("content", theme === "dark" ? "#0c0f14" : "#ffffff");

  if (persist) {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // The selected theme still applies for the current page when storage is unavailable.
    }
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemTheme = (event: MediaQueryListEvent) => {
      try {
        if (window.localStorage.getItem(storageKey)) return;
      } catch {
        // Follow the system preference when storage is unavailable.
      }

      const nextTheme = event.matches ? "dark" : "light";
      applyTheme(nextTheme, false);
      setTheme(nextTheme);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey || (event.newValue !== "light" && event.newValue !== "dark")) return;
      applyTheme(event.newValue, false);
      setTheme(event.newValue);
    };

    media.addEventListener("change", handleSystemTheme);
    window.addEventListener("storage", handleStorage);
    return () => {
      media.removeEventListener("change", handleSystemTheme);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const label = theme === "dark" ? "Přepnout na světlý režim" : "Přepnout na tmavý režim";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={label}
      aria-pressed={theme === "dark"}
      title={label}
      onClick={() => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme, true);
        setTheme(nextTheme);
      }}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
