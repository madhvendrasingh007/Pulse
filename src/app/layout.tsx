import type { Metadata, Viewport } from "next";
import "@/styles/theme.css";
import "@/components/pulse-nav.css";
import "@/styles/pages/dashboard.css";
import "@/styles/pages/habits.css";
import "@/styles/pages/nutrition.css";
import "@/styles/pages/face-care.css";
import "@/styles/pages/calorie-burn.css";
import "@/styles/pages/workouts.css";
import "@/styles/pages/weight.css";
import "@/styles/pages/planner.css";
import "@/styles/pages/history.css";
import "@/styles/pages/ai-coach.css";
import "@/styles/pages/settings.css";
import "@/styles/pages/responsive.css";
import "@/styles/pages/workout-mobile.css";
/* Load shared style recipes after page styles so they apply to every module. */
import "@/styles/pulse-themes.css";

export const metadata: Metadata = {
  title: "PULSE — Your personal life OS",
  description: "A calmer way to keep your day in rhythm.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = { themeColor: "#0c1117" };

const themeBootstrap = `try{var r=document.documentElement;var a=["obsidian","gold","midnight","emerald","plum","nord","dracula","catppuccin","ivory","cloud"];var t=localStorage.getItem("pulse-color-theme")||localStorage.getItem("pulse-theme");if(t==="dark")t="obsidian";if(t==="light")t="ivory";r.dataset.theme=a.indexOf(t)>=0?t:"obsidian";var s=localStorage.getItem("pulse-style");r.dataset.style=["classic","glass","neu","clay","brutal"].indexOf(s)>=0?s:"classic"}catch(e){document.documentElement.dataset.theme="obsidian";document.documentElement.dataset.style="classic"}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }}/></head><body>{children}</body></html>;
}
