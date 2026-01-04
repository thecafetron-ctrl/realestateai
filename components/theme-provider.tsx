"use client";

import { createContext, useContext, useEffect, useMemo } from "react";

type Theme = "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (value: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const applyTheme = () => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light");
  root.classList.add("dark");
  root.style.setProperty("background-color", "#0A0A0F");
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme();
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: "dark",
      setTheme: () => {}, // No-op, always dark
      toggleTheme: () => {}, // No-op, always dark
    }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeProvider");
  }
  return context;
}

