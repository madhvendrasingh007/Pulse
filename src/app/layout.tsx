import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "@/styles/theme.css";
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

const fontHead = Newsreader({ subsets: ["latin"], variable: "--font-head", display: "swap" });
const fontBody = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "PULSE — Your personal life OS",
  description: "A calmer way to keep your day in rhythm.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#0c1117" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("pulse-theme");document.documentElement.dataset.theme=["clay","night","sage","ocean","graphite"].includes(t)?t:"clay"}catch(e){document.documentElement.dataset.theme="clay"}` }}/></head><body className={`${fontHead.variable} ${fontBody.variable}`}>{children}</body></html>;
}
