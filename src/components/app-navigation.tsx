"use client";

import "./pulse-nav.css";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, Dispatch, MouseEvent as ReactMouseEvent, SetStateAction } from "react";
import { flushSync } from "react-dom";
import { Activity, Apple, ArrowRight, BarChart3, CalendarDays, Check, ChevronsLeft, Circle, Dumbbell, Flame, Flower2, History as HistoryIcon, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { nav } from "@/lib/pulse/shared";
import type { Page } from "@/lib/pulse/shared";
import { DEFAULT_THEME, isPulseTheme, PULSE_STYLES, PULSE_THEMES, themeForMode, themeMode, type PulseStyle, type PulseTheme, type ThemeMode } from "@/lib/pulse/themes";

type NavigationProps = { page: Page; setPage: (page: Page) => void; mobileMenuOpen: boolean; setMobileMenuOpen: Dispatch<SetStateAction<boolean>>; guestMode?: boolean };

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const OPEN_MENU_EVENT = "pulse:open-menu";
const styleIcons = { classic: LayoutDashboard, glass: Activity, neu: Circle, clay: Flower2, brutal: BarChart3 };

/* =====================================================================
   SIDEBAR  (desktop: collapsible rail · mobile: swipe drawer)
   ===================================================================== */
export function AppSidebar({ page, setPage, mobileMenuOpen, setMobileMenuOpen, guestMode = false }: NavigationProps) {
  const asideRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const drag = useRef({ x: 0, dx: 0, on: false });
  const [collapsed, setCollapsed] = useState(false);

  // remember the collapsed rail between visits
  useEffect(() => { try { if (localStorage.getItem("pulse-nav-collapsed") === "1") setCollapsed(true); } catch { /* optional */ } }, []);
  useEffect(() => {
    document.querySelector(".app-shell")?.classList.toggle("nav-collapsed", collapsed);
    try { localStorage.setItem("pulse-nav-collapsed", collapsed ? "1" : "0"); } catch { /* optional */ }
  }, [collapsed]);

  // one glider slides to whichever item is active
  useIsoLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const place = () => {
      const active = el.querySelector<HTMLElement>(".nav-item.selected");
      el.style.setProperty("--gh", active ? `${active.offsetHeight}px` : "0px");
      el.style.setProperty("--gy", active ? `${active.offsetTop}px` : "0px");
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(el);
    return () => observer.disconnect();
  }, [page, collapsed, mobileMenuOpen]);

  // Esc closes the drawer · body doesn't scroll behind it
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    if (window.matchMedia("(max-width: 900px)").matches) document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [mobileMenuOpen, setMobileMenuOpen]);

  // open the drawer from the bottom bar event, or by swiping in from the left edge
  useEffect(() => {
    const open = () => setMobileMenuOpen(true);
    let startX = 0, startY = 0, tracking = false;
    const start = (event: TouchEvent) => {
      const touch = event.touches[0];
      tracking = window.innerWidth <= 900 && touch.clientX < 22;
      startX = touch.clientX; startY = touch.clientY;
    };
    const end = (event: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const touch = event.changedTouches[0];
      if (touch.clientX - startX > 70 && Math.abs(touch.clientY - startY) < 60) setMobileMenuOpen(true);
    };
    window.addEventListener(OPEN_MENU_EVENT, open);
    document.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("touchend", end, { passive: true });
    return () => { window.removeEventListener(OPEN_MENU_EVENT, open); document.removeEventListener("touchstart", start); document.removeEventListener("touchend", end); };
  }, [setMobileMenuOpen]);

  // drag the drawer left to close it
  const dragStart = (x: number) => { if (!mobileMenuOpen) return; drag.current = { x, dx: 0, on: true }; asideRef.current?.style.setProperty("transition", "none"); };
  const dragMove = (x: number) => {
    if (!drag.current.on || !asideRef.current) return;
    drag.current.dx = Math.min(0, x - drag.current.x);
    asideRef.current.style.transform = `translateX(${drag.current.dx}px)`;
  };
  const dragEnd = () => {
    if (!drag.current.on) return;
    drag.current.on = false;
    asideRef.current?.style.removeProperty("transition");
    asideRef.current?.style.removeProperty("transform");
    if (drag.current.dx < -80) setMobileMenuOpen(false);
  };

  return <>
    <aside ref={asideRef} className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`} aria-label="Main navigation"
      onTouchStart={event => dragStart(event.touches[0].clientX)} onTouchMove={event => dragMove(event.touches[0].clientX)} onTouchEnd={dragEnd}>
      <div className="brand-row">
        <a className="brand" href="#home" onClick={event => { event.preventDefault(); setPage("Dashboard"); setMobileMenuOpen(false); }}>
          <span className="brand-mark"><Activity size={17} strokeWidth={2.5}/></span><span className="brand-word">PULSE</span>
        </a>
        <button type="button" className="collapse-btn" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={collapsed} onClick={() => setCollapsed(value => !value)}><ChevronsLeft size={16}/></button>
        <button type="button" className="drawer-close" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}><X size={18}/></button>
      </div>
      <span className="nav-label">Your tracking</span>
      <nav ref={navRef} className="side-nav">
        <span className="side-glider" aria-hidden="true"/>
        {nav.filter(({name})=>!guestMode||["Dashboard","Habits","Workouts","Nutrition","Calorie Burn"].includes(name)).map(({ name, icon: Icon }, index) =>
          <button key={name} type="button" data-tip={name} style={{ "--i": index } as CSSProperties} aria-current={page === name ? "page" : undefined}
            className={`nav-item ${page === name ? "selected" : ""}`}
            onPointerMove={event => { const box = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`); }}
            onClick={() => { setPage(name); setMobileMenuOpen(false); }}>
            <Icon size={18}/><span className="nav-text">{name}</span>{name === "AI Coach" && <span className="new-dot"/>}
          </button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="streak-mini"><span className="streak-icon"><Flame size={16}/></span><div><strong>Your personal dashboard</strong><small>Built around your routine</small></div><ArrowRight size={15}/></div>
        <div className="side-user"><div className="avatar small">{guestMode?"G":"M"}</div><div className="side-user-text"><strong>{guestMode?"Guest viewer":"Madhvendra Singh"}</strong><small>{guestMode?"Read-only access":"Personal space"}</small></div></div>
      </div>
    </aside>
    {mobileMenuOpen && <button type="button" className="drawer-scrim" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)}/>}
  </>;
}

/* =====================================================================
   TOPBAR
   ===================================================================== */
type AppTopbarProps = Pick<NavigationProps, "page" | "mobileMenuOpen" | "setMobileMenuOpen"> & {
  theme: PulseTheme | ThemeMode;
  setTheme: ((theme: PulseTheme) => void) | ((mode: ThemeMode) => void);
  style?: PulseStyle;
  setStyle?: (style: PulseStyle) => void;
  guestMode?: boolean;
};

export function AppTopbar({ page, theme, setTheme, style, setStyle, setMobileMenuOpen, guestMode = false }: AppTopbarProps) {
  const barRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const paletteButtonRef = useRef<HTMLButtonElement>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [localTheme, setLocalTheme] = useState<PulseTheme>(DEFAULT_THEME);
  const [localStyle, setLocalStyle] = useState<PulseStyle>("classic");
  const activeThemeId = isPulseTheme(theme) ? theme : localTheme;
  const activeStyle = style ?? localStyle;

  useEffect(() => {
    const syncTheme = () => {
      const saved = localStorage.getItem("pulse-color-theme");
      const next = isPulseTheme(saved) ? saved : isPulseTheme(theme) ? theme : themeForMode(theme);
      setLocalTheme(next);
      document.documentElement.dataset.theme = next;
    };
    const savedStyle = localStorage.getItem("pulse-style");
    if (savedStyle === "classic" || savedStyle === "glass" || savedStyle === "neu" || savedStyle === "clay" || savedStyle === "brutal") {
      setLocalStyle(savedStyle);
      document.documentElement.dataset.style = savedStyle;
    }
    syncTheme();
    window.addEventListener("pulse-theme-change", syncTheme);
    return () => window.removeEventListener("pulse-theme-change", syncTheme);
  }, [theme]);

  useEffect(() => {
    let frame = 0;
    let lastY = window.scrollY;
    let direction = 0;
    let travel = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        barRef.current?.classList.toggle("is-scrolled", y > 8);
        if (window.innerWidth <= 760) {
          const delta = y - lastY;
          const nextDirection = Math.sign(delta);
          if (nextDirection && nextDirection !== direction) { direction = nextDirection; travel = 0; }
          travel += Math.abs(delta);
          const barHasFocus = barRef.current?.matches(":focus-within");
          if (y < 72 || barHasFocus) barRef.current?.classList.remove("is-hidden");
          else if (travel > 8) {
            barRef.current?.classList.toggle("is-hidden", direction > 0);
            travel = 0;
          }
        } else barRef.current?.classList.remove("is-hidden");
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${Math.min(1, y / max)})`;
        lastY = y;
        frame = 0;
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); if (frame) cancelAnimationFrame(frame); };
  }, [page]);

  useEffect(() => {
    if (!paletteOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setPaletteOpen(false); paletteButtonRef.current?.focus(); }
    };
    const onPointer = (event: PointerEvent) => {
      if (!paletteRef.current?.contains(event.target as Node)) setPaletteOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [paletteOpen]);

  const activeTheme = PULSE_THEMES.find(item => item.id === activeThemeId) ?? PULSE_THEMES[0];
  const applyTheme = (next: PulseTheme, event?: ReactMouseEvent<HTMLButtonElement>) => {
    if (next === activeThemeId) { setPaletteOpen(false); return; }
    if (event) {
      document.documentElement.style.setProperty("--theme-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--theme-y", `${event.clientY}px`);
    }
    const update = () => {
      document.documentElement.dataset.theme = next;
      localStorage.setItem("pulse-color-theme", next);
      setLocalTheme(next);
      window.dispatchEvent(new Event("pulse-theme-change"));
      if (isPulseTheme(theme)) (setTheme as (value: PulseTheme) => void)(next);
      else (setTheme as (mode: ThemeMode) => void)(themeMode(next));
    };
    const doc = document as Document & { startViewTransition?: (callback: () => void) => { finished?: Promise<void> } };
    if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doc.startViewTransition(() => flushSync(update));
    } else update();
    setPaletteOpen(false);
    paletteButtonRef.current?.focus();
  };

  const applyStyle = (next: PulseStyle) => {
    if (next === activeStyle) return;
    document.documentElement.dataset.style = next;
    localStorage.setItem("pulse-style", next);
    setLocalStyle(next);
    window.dispatchEvent(new Event("pulse-style-change"));
    setStyle?.(next);
    const shell = document.querySelector<HTMLElement>(".app-shell");
    shell?.classList.remove("style-morph");
    requestAnimationFrame(() => shell?.classList.add("style-morph"));
    window.setTimeout(() => shell?.classList.remove("style-morph"), 850);
  };

  const paletteGroup = (group: "Dark" | "Light") => PULSE_THEMES.filter(item => item.group === group).map(item => (
    <button key={item.id} type="button" className="theme-choice" aria-pressed={activeThemeId === item.id} onClick={event => applyTheme(item.id, event)}>
      <i aria-hidden="true" style={{ background: `linear-gradient(135deg,${item.bg} 50%,${item.accent} 50%)` }}/>
      <span>{item.name}</span>{theme === item.id && <Check size={14} aria-hidden="true"/>}
    </button>
  ));

  return <header ref={barRef} className="topbar">
    <button type="button" aria-label="Open menu" className="mobile-menu" onClick={() => setMobileMenuOpen(true)}><Menu size={19}/></button>
    <div className="crumb"><span className="crumb-root">My PULSE</span><span className="slash">/</span><strong key={page} className="crumb-page">{page}</strong></div>
    <div className="top-actions">
      {guestMode&&<button type="button" className="guest-exit" onClick={()=>{document.cookie="pulse-guest-mode=; Path=/; Max-Age=0; SameSite=Lax";window.location.assign("/login")}}><LogOut size={14}/><span>Exit guest</span></button>}
      <span className="date-pill" aria-label={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} title={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}>
        <CalendarDays size={15}/><span className="date-day">{new Date().getDate()}</span><span className="date-month">{new Date().toLocaleDateString("en-IN", { month: "short" })}</span>
      </span>
      <div className="nav-style-switch" role="group" aria-label="Site design style">
        {PULSE_STYLES.map(({ id, name }) => {
          const Icon = styleIcons[id];
          return <button key={id} type="button" className="nav-style-option" aria-label={name} title={name} aria-pressed={activeStyle === id} onClick={() => applyStyle(id)}>
            <Icon size={15}/>{style === id && <span>{name}</span>}
          </button>;
        })}
      </div>
      <div className="theme-palette" ref={paletteRef}>
        <button ref={paletteButtonRef} type="button" className="palette-trigger" aria-label={`Color theme: ${activeTheme.name}`} aria-haspopup="dialog" aria-expanded={paletteOpen} aria-controls="pulse-theme-menu" onClick={() => setPaletteOpen(open => !open)}>
          <span style={{ background: `linear-gradient(135deg,${activeTheme.bg} 50%,${activeTheme.accent} 50%)` }}/>
        </button>
        {paletteOpen && <div className="theme-menu" id="pulse-theme-menu" role="dialog" aria-label="Choose site color theme">
          <section className="theme-menu-group" aria-label="Dark themes"><h3>Dark</h3>{paletteGroup("Dark")}</section>
          <section className="theme-menu-group" aria-label="Light themes"><h3>Light</h3>{paletteGroup("Light")}</section>
        </div>}
      </div>
      <div className="top-avatar"><span>{guestMode?"G":"M"}</span></div>
    </div>
    <span ref={progressRef} className="topbar-progress" aria-hidden="true"/>
  </header>;
}

/* =====================================================================
   MOBILE BOTTOM BAR  (primary daily routes)
   ===================================================================== */
export function AppMobileNav({ page, setPage, guestMode = false }: { page: Page; setPage: (page: Page) => void; guestMode?: boolean }) {
  const navRef = useRef<HTMLElement>(null);
  const allTabs = [
    { name: "Dashboard" as Page, icon: LayoutDashboard, label: "Home" },
    { name: "Workouts" as Page, icon: Dumbbell, label: "Workout" },
    { name: "Nutrition" as Page, icon: Apple, label: "Nutrition" },
    { name: "Calorie Burn" as Page, icon: Flame, label: "Burn" },
    { name: "Planner" as Page, icon: CalendarDays, label: "Planner" },
    { name: "History" as Page, icon: HistoryIcon, label: "History" },
  ];
  const tabs=allTabs.filter(tab=>!guestMode||["Dashboard","Workouts","Nutrition","Calorie Burn"].includes(tab.name));
  const active = tabs.findIndex(tab => tab.name === page);
  useEffect(() => {
    const navElement = navRef.current;
    const activeTab = navElement?.querySelector<HTMLElement>(".mn-tab.active");
    if (!navElement || !activeTab) return;
    const left = activeTab.offsetLeft - (navElement.clientWidth - activeTab.offsetWidth) / 2;
    navElement.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [page]);
  const buzz = () => { try { navigator.vibrate?.(8); } catch { /* optional */ } };
  const tabButton = (tab: (typeof tabs)[number]) => {
    const Icon = tab.icon;
    return <button key={tab.name} type="button" aria-label={tab.label} aria-current={page === tab.name ? "page" : undefined}
      className={`mn-tab${page === tab.name ? " active" : ""}`} onClick={() => { buzz(); setPage(tab.name); }}>
      <Icon size={20} strokeWidth={page === tab.name ? 2.5 : 1.8}/><span>{tab.label}</span>
    </button>;
  };
  return <nav ref={navRef} className="mobile-nav" aria-label="Quick navigation" data-has-active={active >= 0} style={{ "--mi": active >= 0 ? active : 0 } as CSSProperties}>
    <span className="mn-glider" aria-hidden="true"><i/></span>
    {tabs.map(tabButton)}
  </nav>;
}

/** Optional helper if you ever want another part of the app to open the drawer. */
export const openPulseMenu = () => window.dispatchEvent(new Event(OPEN_MENU_EVENT));
