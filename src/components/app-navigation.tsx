"use client";
import type { Dispatch, SetStateAction } from "react";
import { Activity, ArrowRight, CalendarDays, Check, CircleHelp, Flame, Menu, Plus, TrendingUp, X } from "lucide-react";
import { nav, pulseThemes } from "@/lib/pulse/shared";
import type { Page, PulseTheme } from "@/lib/pulse/shared";

type NavigationProps = { page: Page; setPage: (page: Page) => void; mobileMenuOpen: boolean; setMobileMenuOpen: Dispatch<SetStateAction<boolean>> };

export function AppSidebar({ page, setPage, mobileMenuOpen, setMobileMenuOpen }: NavigationProps) {
  return <>
    <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
      <a className="brand" href="#home" onClick={event => { event.preventDefault(); setPage("Dashboard"); setMobileMenuOpen(false); }}><span className="brand-mark"><Activity size={18} strokeWidth={2.5}/></span><span>PULSE</span><span className="brand-dot"/><button className="drawer-close" aria-label="Close menu" onClick={event => { event.preventDefault(); setMobileMenuOpen(false); }}><X size={18}/></button></a>
      <span className="nav-label">Your tracking</span><nav className="side-nav">{nav.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${page === name ? "selected" : ""}`} onClick={() => { setPage(name); setMobileMenuOpen(false); }}><Icon size={17}/><span>{name}</span>{name === "AI Coach" && <span className="new-dot"/>}{name === "Dashboard" && <span className="nav-indicator"/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="streak-mini"><span className="streak-icon"><Flame size={16}/></span><div><strong>Your personal dashboard</strong><small>Built around your routine</small></div><ArrowRight size={15}/></div><div className="side-user"><div className="avatar small">M</div><div><strong>Madhvendra Singh</strong><small>Personal space</small></div></div></div>
    </aside>
    {mobileMenuOpen && <button className="drawer-scrim" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)}/>}
  </>;
}

const themeNames: Record<PulseTheme, string> = { clay: "Clay", night: "Night", sage: "Sage", ocean: "Ocean", graphite: "Graphite" };

export function ThemePicker({ theme, setTheme }: { theme: PulseTheme; setTheme: (theme: PulseTheme) => void }) {
  return <div className="theme-picker" role="radiogroup" aria-label="Appearance theme">
    {pulseThemes.map(name => <button type="button" key={name} role="radio" aria-checked={theme === name} aria-label={`${themeNames[name]} theme`} title={themeNames[name]} className={`theme-choice ${theme === name ? "selected" : ""}`} data-theme-choice={name} onClick={() => setTheme(name)}>
      <span className="theme-choice-dot" aria-hidden="true"/>{theme === name && <Check size={13} aria-hidden="true"/>}<span className="theme-choice-name">{themeNames[name]}</span>
    </button>)}
  </div>;
}

export function AppTopbar({ page, theme, setTheme, setMobileMenuOpen }: Pick<NavigationProps, "page" | "setMobileMenuOpen"> & { theme: PulseTheme; setTheme: (theme: PulseTheme) => void }) {
  return <header className="topbar"><button aria-label="Open menu" className="mobile-menu" onClick={() => setMobileMenuOpen(true)}><Menu size={19}/></button><div className="crumb"><span>My PULSE</span><span className="slash">/</span><strong>{page}</strong></div><div className="top-actions"><span className="date-pill"><CalendarDays size={14}/> {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span><ThemePicker theme={theme} setTheme={setTheme}/><div className="top-avatar">M</div></div></header>;
}

export function AppMobileNav({ page, setPage, onQuickAdd }: { page: Page; setPage: (page: Page) => void; onQuickAdd: () => void }) {
  const items = [{ name: "Dashboard" as Page, icon: Activity }, { name: "Planner" as Page, icon: CalendarDays }, { name: "Insights" as Page, icon: TrendingUp }, { name: "Settings" as Page, icon: CircleHelp }];
  return <nav className="mobile-nav">{items.slice(0, 2).map(({ name, icon: Icon }) => <button key={name} className={page === name ? "active" : ""} onClick={() => setPage(name)}><Icon size={20}/><span>{name}</span></button>)}<button className="mobile-add" onClick={onQuickAdd} aria-label="Quick add"><Plus size={22}/></button>{items.slice(2).map(({ name, icon: Icon }) => <button key={name} className={page === name ? "active" : ""} onClick={() => setPage(name)}><Icon size={20}/><span>{name === "Settings" ? "Profile" : name}</span></button>)}</nav>;
}
