export const PULSE_THEMES = [
  { id: "obsidian", name: "Obsidian", group: "Dark", bg: "#0c0d0f", accent: "#8fb9a8" },
  { id: "gold", name: "Noir Gold", group: "Dark", bg: "#121110", accent: "#b8a47a" },
  { id: "midnight", name: "Midnight", group: "Dark", bg: "#0a1020", accent: "#7aa2ff" },
  { id: "emerald", name: "Emerald", group: "Dark", bg: "#07130f", accent: "#4fd1a1" },
  { id: "plum", name: "Plum Dusk", group: "Dark", bg: "#130b16", accent: "#d58bff" },
  { id: "nord", name: "Nord", group: "Dark", bg: "#2e3440", accent: "#88c0d0" },
  { id: "dracula", name: "Dracula", group: "Dark", bg: "#282a36", accent: "#bd93f9" },
  { id: "catppuccin", name: "Catppuccin", group: "Dark", bg: "#1e1e2e", accent: "#cba6f7" },
  { id: "ivory", name: "Ivory Luxe", group: "Light", bg: "#f3eee4", accent: "#a67c37" },
  { id: "cloud", name: "Cloud", group: "Light", bg: "#eceff4", accent: "#4f6bed" },
] as const;

export type PulseTheme = (typeof PULSE_THEMES)[number]["id"];
export type ThemeMode = "dark" | "light";
export const DEFAULT_THEME: PulseTheme = "obsidian";

export const PULSE_STYLES = [
  { id: "classic", name: "Classic" },
  { id: "glass", name: "Liquid Glass" },
  { id: "neu", name: "Neumorphism" },
  { id: "clay", name: "Claymorphism" },
  { id: "brutal", name: "Neo-Brutalism" },
] as const;
export type PulseStyle = (typeof PULSE_STYLES)[number]["id"];

export function isPulseTheme(value: unknown): value is PulseTheme {
  return typeof value === "string" && PULSE_THEMES.some(theme => theme.id === value);
}

export function themeMode(theme: PulseTheme): ThemeMode {
  return PULSE_THEMES.find(item => item.id === theme)?.group === "Light" ? "light" : "dark";
}

export function themeForMode(mode: ThemeMode): PulseTheme {
  return mode === "light" ? "ivory" : DEFAULT_THEME;
}

export function isPulseStyle(value: unknown): value is PulseStyle {
  return typeof value === "string" && PULSE_STYLES.some(style => style.id === value);
}
