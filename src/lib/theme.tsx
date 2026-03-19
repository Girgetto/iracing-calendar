"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Apply theme class to html element
    document.documentElement.classList.remove("light-theme", "dark-theme");
    document.documentElement.classList.add(`${theme}-theme`);

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    const root = document.documentElement;

    // Disable transitions so the switch is instant, not a slow 300ms cascade
    root.classList.add("theme-switching");
    root.classList.remove("light-theme", "dark-theme");
    root.classList.add(`${newTheme}-theme`);
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);

    // Re-enable transitions on the next frame, after the repaint
    requestAnimationFrame(() => root.classList.remove("theme-switching"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
