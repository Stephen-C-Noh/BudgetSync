import { useAppActions, useAppState } from "@/context/AppContext";
import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";

// Chart series colors are visual-only and work on both dark and light backgrounds
const SHARED_CHART_COLORS = [
  "#21C8F6",
  "#7A6CFF",
  "#4CD6B8",
  "#F3C94D",
  "#FF7C7C",
  "#A37CFF",
  "#2BE38B",
];

export const darkColors = {
  background: "#0B1519",
  surface: "#1C252E",
  border: "#2A333D",
  textPrimary: "#FFFFFF",
  textSecondary: "#7A869A",
  textDisabled: "#3A4A5A",
  textPlaceholder: "#4A5568",
  accent: "#00D9FF",
  accentSubtle: "rgba(0,217,255,0.08)",
  accentLight: "rgba(0,217,255,0.12)",
  accentBg: "rgba(0,217,255,0.1)",
  onAccent: "#0B1519",
  income: "#00C853",
  incomeSubtle: "rgba(0,200,83,0.12)",
  expense: "#FF3B30",
  expenseSubtle: "rgba(255,59,48,0.12)",
  danger: "#FF4D4D",
  dangerSubtle: "rgba(255,77,77,0.1)",
  dangerBorder: "rgba(255,77,77,0.2)",
  tabBar: "#081826",
  tabBarInactive: "#A7B1C2",
  overlay: "rgba(0,0,0,0.6)",
  overlayDim: "rgba(0,0,0,0.55)",
  chartAssets: "#2AD300",
  assetSubtle: "rgba(42,211,0,0.1)",
  liabilitySubtle: "rgba(255,77,77,0.1)",
  tagBg: "rgba(255,255,255,0.4)",
  syncConnected: "#00C48C",
  syncBorder: "#1C252E",
  disconnectColor: "#FF6B6B",
  overBadgeBg: "rgba(255,59,48,0.15)",
  iconBank: "#5BA4FC",
  iconInvestment: "#A37CFF",
  iconCredit: "#FF7C7C",
  bgBank: "#1A2E44",
  bgInvestment: "#2A244D",
  bgCredit: "#3D242B",
  statsChip: "#122433",
  statsProgressTrack: "#163246",
  surfaceDisabled: "rgba(58, 74, 90, 0.3)",
  chartColors: SHARED_CHART_COLORS,
  chatHeader: "#0A1B28",
  chatBorder: "#143042",
  chatInputBorder: "#123650",
  chatInputBg: "#0B1830",
  chatBotIconBg: "#083243",
  chatBotBubble: "#202B46",
  chatUserIconBg: "#374760",
  chatCardBg: "#0E2030",
  chatCardBorder: "#1A3A50",
  accentRgb: "0, 217, 255",
};

export const lightColors: typeof darkColors = {
  background: "#FFFFFF",
  surface: "#F8FAFB",
  border: "#E1E2E4",
  textPrimary: "#1A1C1E",
  textSecondary: "#42474E",
  textDisabled: "#9AA0A8",
  textPlaceholder: "#9AA0A8",
  accent: "#00BCD4",
  accentSubtle: "rgba(0,188,212,0.08)",
  accentLight: "rgba(0,188,212,0.12)",
  accentBg: "rgba(0,188,212,0.1)",
  onAccent: "#1A1C1E",
  income: "#2E7D32",
  incomeSubtle: "rgba(46,125,50,0.12)",
  expense: "#D32F2F",
  expenseSubtle: "rgba(211,47,47,0.12)",
  danger: "#D32F2F",
  dangerSubtle: "rgba(211,47,47,0.1)",
  dangerBorder: "rgba(211,47,47,0.2)",
  tabBar: "#FFFFFF",
  tabBarInactive: "#42474E",
  overlay: "rgba(0,0,0,0.4)",
  overlayDim: "rgba(0,0,0,0.35)",
  chartAssets: "#2E7D32",
  assetSubtle: "rgba(46,125,50,0.12)",
  liabilitySubtle: "rgba(211,47,47,0.1)",
  tagBg: "rgba(255,255,255,0.4)",
  syncConnected: "#2E7D32",
  syncBorder: "#F8FAFB",
  disconnectColor: "#D32F2F",
  overBadgeBg: "rgba(211,47,47,0.12)",
  iconBank: "#5BA4FC",
  iconInvestment: "#A37CFF",
  iconCredit: "#FF7C7C",
  bgBank: "#E3F0FF",
  bgInvestment: "#EDE7FF",
  bgCredit: "#FFEBEE",
  statsChip: "#F0F4F8",
  statsProgressTrack: "#E1E2E4",
  surfaceDisabled: "rgba(154, 160, 168, 0.2)",
  chartColors: SHARED_CHART_COLORS,
  chatHeader: "#F0F4F8",
  chatBorder: "#E1E2E4",
  chatInputBorder: "#D0D7E0",
  chatInputBg: "#FFFFFF",
  chatBotIconBg: "#E0F2F7",
  chatBotBubble: "#F0F4F8",
  chatUserIconBg: "#CBD9E7",
  chatCardBg: "#FFFFFF",
  chatCardBorder: "#E1E2E4",
  accentRgb: "0, 188, 212",
};

export type Colors = typeof darkColors;
export type ThemeMode = "system" | "light" | "dark";

interface ThemeContextType {
  colors: Colors;
  themeMode: ThemeMode;
  colorScheme: "dark" | "light";
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: darkColors,
  themeMode: "system",
  colorScheme: "dark",
  setThemeMode: async () => {},
  toggleTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { settings } = useAppState();
  const { updateSetting } = useAppActions();

  const savedTheme = settings.find((s) => s.key === "theme")?.value;
  const themeMode: ThemeMode =
    savedTheme === "dark" || savedTheme === "light" || savedTheme === "system"
      ? savedTheme
      : "system";
  const colorScheme: "dark" | "light" =
    themeMode === "system"
      ? ((systemScheme as "dark" | "light") ?? "dark")
      : themeMode;

  const colors = colorScheme === "dark" ? darkColors : lightColors;

  const setThemeMode = async (mode: ThemeMode) => {
    await updateSetting("theme", mode);
  };

  const toggleTheme = async () => {
    await setThemeMode(colorScheme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider
      value={{ colors, themeMode, colorScheme, setThemeMode, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
