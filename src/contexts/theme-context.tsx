import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AccentColor = "blue" | "red" | "green" | "yellow" | "purple" | "pink" | "orange" | "cyan";

interface ThemeContextType {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Accent color presets in OKLCH format (adjusted for better visibility and less contrast)
const accentPresets: Record<AccentColor, {
  primary: string;
  primaryForeground: string;
  ring: string;
  border: string;
  input: string;
  sidebarPrimary: string;
  sidebarBorder: string;
}> = {
  blue: {
    primary: "oklch(0.65 0.18 264.376)", // Less saturated, slightly lighter
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.65 0.18 264.376)",
    border: "oklch(0.65 0.18 264.376 / 25%)", // Slightly more visible
    input: "oklch(0.65 0.18 264.376 / 18%)",
    sidebarPrimary: "oklch(0.65 0.18 264.376)",
    sidebarBorder: "oklch(0.65 0.18 264.376 / 20%)",
  },
  red: {
    primary: "oklch(0.66 0.19 27.325)", // Less saturated
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.66 0.19 27.325)",
    border: "oklch(0.66 0.19 27.325 / 25%)",
    input: "oklch(0.66 0.19 27.325 / 18%)",
    sidebarPrimary: "oklch(0.66 0.19 27.325)",
    sidebarBorder: "oklch(0.66 0.19 27.325 / 20%)",
  },
  green: {
    primary: "oklch(0.68 0.17 142.495)", // Less saturated, lighter
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.68 0.17 142.495)",
    border: "oklch(0.68 0.17 142.495 / 25%)",
    input: "oklch(0.68 0.17 142.495 / 18%)",
    sidebarPrimary: "oklch(0.68 0.17 142.495)",
    sidebarBorder: "oklch(0.68 0.17 142.495 / 20%)",
  },
  yellow: {
    primary: "oklch(0.78 0.15 95.285)", // Less saturated, darker for better contrast
    primaryForeground: "oklch(0.145 0 0)",
    ring: "oklch(0.78 0.15 95.285)",
    border: "oklch(0.78 0.15 95.285 / 25%)",
    input: "oklch(0.78 0.15 95.285 / 18%)",
    sidebarPrimary: "oklch(0.78 0.15 95.285)",
    sidebarBorder: "oklch(0.78 0.15 95.285 / 20%)",
  },
  purple: {
    primary: "oklch(0.67 0.20 303.9)", // Less saturated
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.67 0.20 303.9)",
    border: "oklch(0.67 0.20 303.9 / 25%)",
    input: "oklch(0.67 0.20 303.9 / 18%)",
    sidebarPrimary: "oklch(0.67 0.20 303.9)",
    sidebarBorder: "oklch(0.67 0.20 303.9 / 20%)",
  },
  pink: {
    primary: "oklch(0.72 0.17 3.179)", // Less saturated
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.72 0.17 3.179)",
    border: "oklch(0.72 0.17 3.179 / 25%)",
    input: "oklch(0.72 0.17 3.179 / 18%)",
    sidebarPrimary: "oklch(0.72 0.17 3.179)",
    sidebarBorder: "oklch(0.72 0.17 3.179 / 20%)",
  },
  orange: {
    primary: "oklch(0.72 0.16 49.78)", // Less saturated
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.72 0.16 49.78)",
    border: "oklch(0.72 0.16 49.78 / 25%)",
    input: "oklch(0.72 0.16 49.78 / 18%)",
    sidebarPrimary: "oklch(0.72 0.16 49.78)",
    sidebarBorder: "oklch(0.72 0.16 49.78 / 20%)",
  },
  cyan: {
    primary: "oklch(0.72 0.14 195.04)", // Less saturated, lighter
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.72 0.14 195.04)",
    border: "oklch(0.72 0.14 195.04 / 25%)",
    input: "oklch(0.72 0.14 195.04 / 18%)",
    sidebarPrimary: "oklch(0.72 0.14 195.04)",
    sidebarBorder: "oklch(0.72 0.14 195.04 / 20%)",
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem("accent-color");
    return (saved as AccentColor) || "blue";
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem("accent-color", accentColor);

    // Apply CSS variables
    const root = document.documentElement;
    const preset = accentPresets[accentColor];

    root.style.setProperty("--primary", preset.primary);
    root.style.setProperty("--primary-foreground", preset.primaryForeground);
    root.style.setProperty("--ring", preset.ring);
    root.style.setProperty("--border", preset.border);
    root.style.setProperty("--input", preset.input);
    root.style.setProperty("--sidebar-primary", preset.sidebarPrimary);
    root.style.setProperty("--sidebar-primary-foreground", preset.primaryForeground);
    root.style.setProperty("--sidebar-ring", preset.ring);
    root.style.setProperty("--sidebar-border", preset.sidebarBorder);
  }, [accentColor]);

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
  };

  return (
    <ThemeContext.Provider value={{ accentColor, setAccentColor }}>
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

