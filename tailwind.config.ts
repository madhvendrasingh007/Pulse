import type { Config } from "tailwindcss";
const config: Config = { content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: { colors: { ink: "var(--background)", panel: "var(--surface)", accent: "var(--accent)" } } }, plugins: [] };
export default config;
