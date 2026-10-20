"use client";

import "../styles/pages/dashboard.css";
import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Activity, Apple, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, CalendarDays,
  Check, Clock3, Dumbbell, Flame, Flower2, Plus, Sparkles, Sun, Weight,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { habitDoneOnDate, eventDay, fmt, faceRoutineSteps, habitIcons, dayNames } from "@/lib/pulse/shared";
import type { Food, Habit, WeightLog, WeeklyExercise, FaceRoutineState } from "@/lib/pulse/shared";
import type { EnergyProfile } from "@/lib/calculations/energy";
import type { PlannerEvent } from "@/components/planner-manager";

type NutritionTotals = { calories: number; protein: number; carbs: number; fats: number };
type EnergyTotals = { bmr: number; totalBurn: number; sedentaryTdee: number; exerciseBurn: number; deficit: number; fatLossGrams: number; weeklyFatLossKg: number };
type DashboardData = {
  today: string; todayNutrition: NutritionTotals; todayEnergy: EnergyTotals;
  todayHabits: Habit[]; completedHabits: Habit[];
  energyTrend: { date: string; label: string; intake: number; burn: number }[];
  todayWorkouts: WeeklyExercise[]; completedWorkouts: WeeklyExercise[];
  currentFaceMonth: 1 | 2; shownFaceMonth: 1 | 2;
  todayFace: ReturnType<typeof faceRoutineSteps>; todayFaceDone: number;
  faceRoutine: FaceRoutineState; todayFoods: Food[];
  nutritionGoals: { calories: number; protein: number; carbs: number; fats: number };
  profile: EnergyProfile; weights: WeightLog[];
  upcomingEvents: PlannerEvent[]; recentPastEvents: PlannerEvent[];
};
type DashboardActions = {
  setPage: (page: import("@/lib/pulse/shared").Page) => void;
  setSelectedDate: (date: string) => void; toggleHabit: (id: string, date?: string) => void;
  openWeightEntry: () => void; openHabitEditor: () => void; openNewFood: () => void;
  onQuickLog: () => void; toggleFaceStep: (id: string, date: string) => void;
  setFaceMonthSelection: (month: 1 | 2) => void;
};
const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const cssVar = (name: string, value: string | number) => ({ [name]: value }) as CSSProperties;

/* ---------- small building blocks ---------- */

/** Number that eases from its previous value to the new one. */
function CountUp({ value, decimals = 0, duration = 1000 }: { value: number; decimals?: number; duration?: number }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (prefersReducedMotion()) { setShown(value); from.current = value; return; }
    const start = performance.now(), begin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = begin + (value - begin) * eased;
      from.current = next; setShown(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{decimals ? shown.toFixed(decimals) : fmt(Math.round(shown))}</>;
}

/** SVG progress ring: the arc draws itself in, and redraws smoothly when the value changes. */
function Ring({ percent, className = "", children }: { percent: number; className?: string; children: ReactNode }) {
  const gid = useId().replace(/:/g, "");
  const [p, setP] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setP(Math.max(0, Math.min(100, percent))));
    return () => cancelAnimationFrame(frame);
  }, [percent]);
  const C = 2 * Math.PI * 44;
  return <div className={`pd-ring ${className}`}>
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{ stopColor: "var(--chart-series-1)" }}/><stop offset="1" style={{ stopColor: "var(--chart-series-2)" }}/></linearGradient></defs>
      <circle className="pd-ring-track" cx="50" cy="50" r="44"/>
      <circle className="pd-ring-bar" cx="50" cy="50" r="44" stroke={`url(#${gid})`} strokeDasharray={C} strokeDashoffset={C * (1 - p / 100)}/>
    </svg>
    <div className="pd-ring-center">{children}</div>
  </div>;
}

/** Tiny trend line for metric cards. */
function Spark({ data }: { data: { v: number }[] }) {
  const gid = useId().replace(/:/g, "");
  if (data.length < 2) return null;
  return <div className="pd-spark" aria-hidden="true">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "var(--chart-series-1)", stopOpacity: .32 }}/><stop offset="1" style={{ stopColor: "var(--chart-series-1)", stopOpacity: 0 }}/></linearGradient></defs>
        <YAxis hide domain={["auto", "auto"]}/>
        <Area type="monotone" dataKey="v" stroke="var(--pd-accent)" strokeWidth={2} fill={`url(#${gid})`} dot={false} isAnimationActive animationDuration={1100} animationEasing="ease-out"/>
      </AreaChart>
    </ResponsiveContainer>
  </div>;
}

type TipItem = { dataKey?: string | number; value?: number | string };
function EnergyTip({ active, payload, label }: { active?: boolean; payload?: TipItem[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  const get = (key: string) => Number(payload.find(item => item.dataKey === key)?.value ?? 0);
  const net = get("intake") - get("burn");
  return <div className="pd-tip">
    <b>{label}</b>
    <div><span><i className="a"/>Food intake</span><span>{fmt(get("intake"))} kcal</span></div>
    <div><span><i className="b"/>Daily burn</span><span>{fmt(get("burn"))} kcal</span></div>
    <div className="net">Net<span>{net > 0 ? "+" : "−"}{fmt(Math.abs(net))} kcal</span></div>
  </div>;
}

export function DashboardPage({ data, actions }: { data: DashboardData; actions: DashboardActions }) {
  const {
    today, todayNutrition, todayEnergy, todayHabits, completedHabits, energyTrend,
    todayWorkouts, completedWorkouts, currentFaceMonth, shownFaceMonth, todayFace,
    todayFaceDone, faceRoutine, todayFoods, nutritionGoals, profile, weights,
    upcomingEvents, recentPastEvents,
  } = data;
  const { setPage, setSelectedDate, toggleHabit, openWeightEntry, openHabitEditor,
    openNewFood, toggleFaceStep, setFaceMonthSelection, onQuickLog } = actions;
  const gradId = useId().replace(/:/g, "");
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"dark" | "light">("dark");

  const habitPercent = todayHabits.length ? Math.round(completedHabits.length / todayHabits.length * 100) : 0;
  const foodPercent = Math.min(100, todayNutrition.calories / Math.max(1, nutritionGoals.calories) * 100);
  const latestWeight = weights.at(-1)?.weight ?? profile.weightKg;
  const weightDirection = weights.length > 1 ? latestWeight - weights.at(-2)!.weight : 0;

  const weightSpark = weights.slice(-14).map(item => ({ v: item.weight }));
  const intakeSpark = energyTrend.map(item => ({ v: item.intake }));
  const burnSpark = energyTrend.map(item => ({ v: item.burn }));

  const macroKcal = [
    { name: "Protein", value: todayNutrition.protein * 4, grams: todayNutrition.protein, fill: "var(--pd-accent)" },
    { name: "Carbs", value: todayNutrition.carbs * 4, grams: todayNutrition.carbs, fill: "var(--pd-accent-2)" },
    { name: "Fats", value: todayNutrition.fats * 9, grams: todayNutrition.fats, fill: "var(--pd-warn)" },
  ];
  const macroTotal = macroKcal.reduce((sum, item) => sum + item.value, 0);
  const donutData = macroTotal > 0 ? macroKcal : [{ name: "Empty", value: 1, grams: 0, fill: "var(--pd-track)" }];

  /* Follow the existing whole-site dark/light control without owning profile state. */
  useEffect(() => {
    const root = document.documentElement;
    const syncMode = () => setMode(root.dataset.theme === "light" ? "light" : "dark");
    syncMode();
    const observer = new MutationObserver(syncMode);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  /* scroll reveal (once per card, lightly staggered) */
  useEffect(() => {
    const host = dashboardRef.current;
    if (!host) return;
    const nodes = host.querySelectorAll<HTMLElement>("[data-reveal]");
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      nodes.forEach(node => node.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const node = entry.target as HTMLElement;
      node.classList.add("is-entering", "is-visible");
      node.addEventListener("transitionend", event => {
        if (event.propertyName === "opacity") node.classList.remove("is-entering");
      }, { once: true });
      observer.unobserve(node);
    }), { threshold: .1, rootMargin: "0px 0px -30px 0px" });
    nodes.forEach((node, index) => {
      node.style.setProperty("--pd-stagger", `${Math.min(index % 4 * 60, 180)}ms`);
      observer.observe(node);
    });
    return () => observer.disconnect();
  }, []);

  /* pointer spotlight on cards (mouse devices only) */
  useEffect(() => {
    const host = dashboardRef.current;
    if (!host || !window.matchMedia("(hover: hover)").matches) return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      const card = (event.target as HTMLElement).closest<HTMLElement>(".pd-card");
      if (!card) return;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - box.left}px`);
        card.style.setProperty("--my", `${event.clientY - box.top}px`);
      });
    };
    host.addEventListener("pointermove", move, { passive: true });
    return () => { host.removeEventListener("pointermove", move); if (frame) cancelAnimationFrame(frame); };
  }, []);

  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return <div ref={dashboardRef} className="pulse-dashboard pd-motion-ready"
    data-mode={mode}>

    <section className="pd-welcome" data-reveal aria-labelledby="pd-title">
      <div className="pd-welcome-copy">
        <span className="pd-eyebrow"><i/> {dateLabel}</span>
        <h1 id="pd-title">Your day, in <strong>rhythm.</strong></h1>
        <p>A calmer look at the small signals that add up to a stronger day.</p>
      </div>
      <div className="pd-tools">
        <button className="pd-quick-button" type="button" onClick={onQuickLog}><Plus size={16}/><span>Quick log</span></button>
      </div>
    </section>

    <section className="pd-hero pd-card" data-reveal aria-label="Daily habit progress">
      <div className="pd-hero-copy"><span className="pd-hero-kicker"><Sparkles size={14}/> Your daily pulse</span>
        <h2>Make today<br/><em>count.</em></h2>
        <p>Steady habits. Useful numbers. Your routine, at your pace.</p>
        <button type="button" className="pd-text-link" onClick={() => setPage("Insights")}>See your progress <ArrowRight size={15}/></button>
      </div>
      <div className="pd-ring-area">
        <Ring percent={habitPercent}><strong><CountUp value={habitPercent}/><small>%</small></strong><span>Habits today</span></Ring>
        <p><i/> {completedHabits.length} of {todayHabits.length} scheduled habits done</p>
      </div>
    </section>

    <section className="pd-metrics" aria-label="Today at a glance">
      <article className="pd-card pd-metric" data-reveal><div className="pd-metric-head"><span>Today’s food</span><i className="food"><Apple size={16}/></i></div>
        <strong><CountUp value={todayNutrition.calories}/> <small>kcal</small></strong>
        <p>{fmt(todayNutrition.protein)}g protein · {fmt(todayNutrition.carbs)}g carbs</p>
        <div className="pd-progress"><i style={cssVar("--pd-progress", foodPercent / 100)}/></div>
        <div className="pd-metric-foot"><span>of {fmt(nutritionGoals.calories)} kcal guide</span><button onClick={() => setPage("Nutrition")}>Food log <ArrowRight size={12}/></button></div>
      </article>
      <article className="pd-card pd-metric" data-reveal><div className="pd-metric-head"><span>Habits</span><i className="habit"><Check size={16}/></i></div>
        <strong><CountUp value={completedHabits.length}/><small> / {todayHabits.length}</small></strong><p>Scheduled intentions completed</p>
        <div className="pd-mini-bars" aria-hidden="true">{todayHabits.map((habit, index) => <i key={`${habit.id}-${index}`} style={cssVar("--i", index)} className={habitDoneOnDate(habit, today) ? "done" : ""}/>)}</div>
        <div className="pd-metric-foot"><span>{habitPercent}% complete</span><button onClick={() => setPage("Habits")}>Habit list <ArrowRight size={12}/></button></div>
      </article>
      <article className="pd-card pd-metric" data-reveal><div className="pd-metric-head"><span>Daily burn</span><i className="burn"><Flame size={16}/></i></div>
        <strong><CountUp value={todayEnergy.totalBurn}/> <small>kcal</small></strong>
        <p>{fmt(todayEnergy.sedentaryTdee)} base + {fmt(todayEnergy.exerciseBurn)} exercise</p>
        <Spark data={burnSpark}/>
        <div className="pd-metric-foot pd-deficit"><span>Deficit <b>{fmt(todayEnergy.deficit)} kcal</b></span><button aria-label="Open calorie burn details" onClick={() => { setSelectedDate(today); setPage("Calorie Burn"); }}><ArrowRight size={14}/></button></div>
      </article>
      <article className="pd-card pd-metric" data-reveal><div className="pd-metric-head"><span>Current weight</span><i className="weight"><Weight size={16}/></i></div>
        <strong><CountUp value={profile.weightKg} decimals={1}/> <small>kg</small></strong>
        <p>{weights.length ? `Latest log · ${new Date(`${weights.at(-1)?.date}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "Log weight to begin your trend"}</p>
        <Spark data={weightSpark}/>
        <div className="pd-metric-foot"><span className={weightDirection <= 0 ? "pd-good" : "pd-muted"}>{weights.length > 1 ? <>{weightDirection <= 0 ? <ArrowDownRight size={13}/> : <ArrowUpRight size={13}/>} {Math.abs(weightDirection).toFixed(1)} kg</> : "BMR uses your profile"}</span><button onClick={openWeightEntry}>Log weight <ArrowRight size={12}/></button></div>
      </article>
    </section>

    <section className="pd-grid pd-analytics">
      <article className="pd-card pd-panel" data-reveal>
        <div className="pd-panel-head"><div><h2>Energy trend</h2><p>Food intake against estimated daily burn.</p></div><button className="pd-link-button" onClick={() => setPage("Insights")}>Insights <ArrowRight size={13}/></button></div>
        <div className="pd-chart" role="img" aria-label="Area chart of daily food intake and calorie burn"><ResponsiveContainer width="100%" height="100%">
          <AreaChart data={energyTrend} margin={{ top: 10, right: 6, bottom: 0, left: 6 }}>
            <defs>
              <linearGradient id={`${gradId}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "var(--chart-series-1)", stopOpacity: .34 }}/><stop offset="1" style={{ stopColor: "var(--chart-series-1)", stopOpacity: 0 }}/></linearGradient>
              <linearGradient id={`${gradId}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "var(--chart-series-2)", stopOpacity: .26 }}/><stop offset="1" style={{ stopColor: "var(--chart-series-2)", stopOpacity: 0 }}/></linearGradient>
            </defs>
            <CartesianGrid stroke="var(--pd-border)" strokeDasharray="3 6" vertical={false}/>
            <XAxis dataKey="label" tick={{ fill: "var(--pd-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickMargin={8} interval="preserveStartEnd" minTickGap={14}/>
            <YAxis hide domain={[0, (max: number) => Math.max(max, nutritionGoals.calories) * 1.12]}/>
            <ReferenceLine y={nutritionGoals.calories} stroke="var(--pd-muted)" strokeDasharray="4 5" strokeOpacity={.5}/>
            <Tooltip content={<EnergyTip/>} cursor={{ stroke: "var(--chart-series-1)", strokeOpacity: .3, strokeDasharray: "4 4" }}/>
            <Area type="monotone" dataKey="burn" stroke="var(--chart-series-2)" strokeWidth={2.2} fill={`url(#${gradId}b)`} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--pd-surface)" }} animationDuration={1200} animationEasing="ease-out"/>
            <Area type="monotone" dataKey="intake" stroke="var(--chart-series-1)" strokeWidth={2.6} fill={`url(#${gradId}a)`} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--pd-surface)" }} animationDuration={1400} animationEasing="ease-out"/>
          </AreaChart>
        </ResponsiveContainer></div>
        <div className="pd-chart-legend"><span><i className="a"/> Food intake</span><span><i className="b"/> Daily burn</span><small>Dashed line marks your calorie guide. Fat-loss values are estimates.</small></div>
      </article>
      <article className="pd-card pd-panel" data-reveal>
        <div className="pd-panel-head"><div><h2>Energy balance</h2><p>Today’s personal snapshot.</p></div><span className="pd-round-icon"><Activity size={16}/></span></div>
        <Ring className="pd-balance-ring" percent={foodPercent}><strong><CountUp value={Math.round(foodPercent)}/><small>%</small></strong><span>Food goal</span></Ring>
        <div className="pd-balance-list"><div><span>BMR</span><b>{fmt(todayEnergy.bmr)} <small>kcal</small></b></div><div><span>Food intake</span><b>{fmt(todayNutrition.calories)} <small>kcal</small></b></div><div><span>Exercise burn</span><b>{fmt(todayEnergy.exerciseBurn)} <small>kcal</small></b></div><div><span>Deficit</span><b>{fmt(todayEnergy.deficit)} <small>kcal</small></b></div></div>
        <button className="pd-secondary-button" onClick={() => { setSelectedDate(today); setPage("Calorie Burn"); }}>Review calorie details <ArrowRight size={14}/></button>
      </article>
    </section>

    <section className="pd-grid pd-two-column">
      <article className="pd-card pd-panel" data-reveal>
        <div className="pd-panel-head"><div><span className="pd-eyebrow"><i/> Today’s intentions</span><h2>Small steps, kept.</h2><p>Tap a habit to update today’s record.</p></div><button className="pd-link-button" onClick={() => setPage("Habits")}>Manage <ArrowRight size={13}/></button></div>
        <div className="pd-habit-list">{todayHabits.map((habit, index) => {
          const Icon = habitIcons[habit.iconKey] ?? Check;
          const done = habitDoneOnDate(habit, today);
          return <button type="button" className={`pd-habit-row${done ? " is-done" : ""}`} key={`${habit.id}-${index}`} aria-pressed={done} onClick={() => toggleHabit(habit.id, today)}>
            <span className={`pd-habit-icon ${habit.color}`}><Icon size={17}/></span><span className="pd-habit-copy"><strong>{habit.title}</strong><small>{habit.detail}</small></span><span className="pd-check">{done && <Check size={13}/>}</span>
          </button>;
        })}{todayHabits.length === 0 && <p className="pd-empty">No habits are scheduled today. Add an intention to build your routine.</p>}</div>
        <button className="pd-add-link" onClick={openHabitEditor}><Plus size={14}/> Add an intention</button>
      </article>
      <article className="pd-card pd-panel" data-reveal>
        <div className="pd-panel-head"><div><span className="pd-eyebrow"><i/> Today · {dayNames[new Date(`${today}T12:00:00`).getDay()]}</span><h2>Your workout</h2><p>{todayWorkouts.length ? `${completedWorkouts.length} of ${todayWorkouts.length} exercises complete` : "No exercises in today’s plan yet."}</p></div><button className="pd-link-button" onClick={() => setPage("Workouts")}>Open plan <ArrowRight size={13}/></button></div>
        {todayWorkouts.length ? <div className="pd-workout-list">{todayWorkouts.map(item => {
          const done = item.completedDates?.includes(today) ?? false;
          return <div className="pd-workout-item" key={item.id}><span className={`pd-check${done ? " checked" : ""}`}>{done && <Check size={12}/>}</span><span className="pd-workout-copy"><strong>{item.name}</strong><small>{item.sets} sets <i>·</i> {item.reps} reps</small></span><span className="pd-focus-tag">{item.focus ?? "General"}</span></div>;
        })}</div> : <div className="pd-empty-state"><span><Dumbbell size={19}/></span><p>Add exercises in Workouts and they’ll appear here.</p></div>}
      </article>
    </section>

    <section className="pd-grid pd-two-column">
      <article className="pd-card pd-panel" data-reveal>
        <div className="pd-panel-head"><div><h2>Nutrition today</h2><p>Your logged food and macro targets.</p></div><button className="pd-link-button" onClick={() => setPage("Nutrition")}>Food log <ArrowRight size={13}/></button></div>
        <div className="pd-donut-row">
          <div className="pd-donut" role="img" aria-label="Macro split by calories">
            <ResponsiveContainer width="100%" height="100%"><PieChart>
              <Pie data={donutData} dataKey="value" innerRadius="68%" outerRadius="100%" paddingAngle={macroTotal > 0 ? 4 : 0} cornerRadius={5} stroke="none" startAngle={90} endAngle={-270} animationDuration={1100} animationEasing="ease-out">
                {donutData.map(item => <Cell key={item.name} fill={item.fill}/>)}
              </Pie>
            </PieChart></ResponsiveContainer>
            <div className="pd-donut-center"><strong><CountUp value={todayNutrition.calories}/></strong><span>kcal</span></div>
          </div>
          <div className="pd-donut-legend">{macroKcal.map(item => <div key={item.name}><i style={{ background: item.fill }}/>{item.name}<b>{macroTotal ? Math.round(item.value / macroTotal * 100) : 0}%</b></div>)}</div>
        </div>
        <div className="pd-macro-grid">{[
          ["Calories", todayNutrition.calories, nutritionGoals.calories, "kcal", "calories"],
          ["Protein", todayNutrition.protein, nutritionGoals.protein, "g", "protein"],
          ["Carbs", todayNutrition.carbs, nutritionGoals.carbs, "g", "carbs"],
          ["Fats", todayNutrition.fats, nutritionGoals.fats, "g", "fats"],
        ].map(([label, value, goal, unit, key]) => {
          const pct = Math.min(100, Number(value) / Math.max(1, Number(goal)) * 100);
          return <div className="pd-macro" key={String(key)}><div><span>{label}</span><b>{fmt(Number(value))}<small> / {fmt(Number(goal))} {unit}</small></b></div><div className="pd-progress"><i style={cssVar("--pd-progress", pct / 100)}/></div></div>;
        })}</div>
        {todayFoods.length ? <div className="pd-food-list">{todayFoods.slice(-3).reverse().map(food => <div key={food.id}><span><Apple size={13}/>{food.name}</span><small>{fmt(food.calories)} kcal · P {fmt(food.protein)}g · C {fmt(food.carbs)}g</small></div>)}</div> : <p className="pd-empty">No food logged today. Add a meal to start your record.</p>}
        <button className="pd-secondary-button" onClick={() => { setSelectedDate(today); openNewFood(); }}><Plus size={14}/> Log food</button>
      </article>
      <article className="pd-card pd-panel" data-reveal>
        <div className="pd-panel-head"><div><span className="pd-eyebrow"><i/> Face care · month {currentFaceMonth}</span><h2>Morning and night, in order.</h2><p>{todayFaceDone} of {todayFace.steps.length} steps checked today.</p></div><Flower2 className="pd-face-mark" size={22}/></div>
        <div className="pd-month-switch" role="group" aria-label="Preview face care month">{([1, 2] as const).map(month => <button key={month} type="button" className={shownFaceMonth === month ? "selected" : ""} aria-pressed={shownFaceMonth === month} onClick={() => setFaceMonthSelection(month)}>Month {month}{currentFaceMonth === month && <small>Current</small>}</button>)}</div>
        <div className="pd-routines">{[{ title: "Morning", steps: todayFace.morning }, { title: "Night", steps: todayFace.night }].map(({ title, steps }) => <div className="pd-routine" key={title}>
          <div className="pd-routine-head"><b><Sun size={13}/>{title} routine</b><small>{steps.filter(step => (faceRoutine.completed[today] ?? []).includes(step.id)).length}/{steps.length} done</small></div>
          {steps.map((step, index) => { const done = (faceRoutine.completed[today] ?? []).includes(step.id); return <button key={step.id} type="button" className={`pd-face-step${done ? " is-done" : ""}`} aria-pressed={done} disabled={shownFaceMonth !== currentFaceMonth} onClick={() => toggleFaceStep(step.id, today)}><span>{index + 1}</span><strong>{step.label}</strong><i>{done && <Check size={12}/>}</i></button>; })}
        </div>)}</div>
        <button className="pd-secondary-button" onClick={() => setPage("Face Care")}>Open face care guide <ArrowRight size={14}/></button>
      </article>
    </section>

    <section className="pd-grid pd-two-column">
      <article className="pd-card pd-panel" data-reveal><div className="pd-panel-head"><div><h2>Upcoming plans</h2><p>Your next active reminders.</p></div><button className="pd-link-button" onClick={() => setPage("Planner")}>Planner <ArrowRight size={13}/></button></div>
        {upcomingEvents.length ? upcomingEvents.map(event => <div className="pd-event" key={event.id}><span className="pd-event-date"><b>{new Date(`${eventDay(event.date)}T12:00:00`).getDate()}</b><small>{new Date(`${eventDay(event.date)}T12:00:00`).toLocaleDateString("en-IN", { month: "short" })}</small></span><span className="pd-event-copy"><strong>{event.title}</strong><small><Clock3 size={12}/>{eventDay(event.date) === today ? "Today" : new Date(`${eventDay(event.date)}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {event.time}</small></span><CalendarDays size={15} className="pd-event-icon"/></div>) : <p className="pd-empty">No upcoming plans on your calendar.</p>}
      </article>
      <article className="pd-card pd-panel" data-reveal><div className="pd-panel-head"><div><h2>Past plans</h2><p>Earlier reminders still to complete.</p></div><button className="pd-link-button" onClick={() => setPage("Planner")}>Planner <ArrowRight size={13}/></button></div>
        {recentPastEvents.length ? recentPastEvents.map(event => <div className="pd-event" key={event.id}><span className="pd-event-date past"><b>{new Date(`${eventDay(event.date)}T12:00:00`).getDate()}</b><small>{new Date(`${eventDay(event.date)}T12:00:00`).toLocaleDateString("en-IN", { month: "short" })}</small></span><span className="pd-event-copy"><strong>{event.title}</strong><small>{new Date(`${eventDay(event.date)}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {event.time}</small></span><Clock3 size={15} className="pd-event-icon"/></div>) : <p className="pd-empty">No unfinished plans from earlier days.</p>}
      </article>
    </section>

    <section className="pd-insight pd-card" data-reveal><span className="pd-insight-icon"><Sparkles size={17}/></span><div><strong>Your energy baseline</strong><p>Mifflin–St Jeor estimates a {fmt(todayEnergy.sedentaryTdee)} kcal sedentary TDEE. Log food and exercise separately to see your daily balance.</p><small>Based on your profile · {profile.weightKg.toFixed(1)} kg</small></div><button type="button" aria-label="Open calorie burn details" onClick={() => setPage("Calorie Burn")}><ArrowRight size={16}/></button></section>

    <footer className="pd-footer"><span><span className="pd-wordmark">PULSE</span> · Your personal life OS</span><span>One day, one useful signal at a time.</span></footer>
    <span className="pd-theme-curtain" aria-hidden="true"/>
  </div>;
}
