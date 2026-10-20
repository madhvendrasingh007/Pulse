// FILENAME: history-snapshots.tsx
"use client";

import type { ComponentType, CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { Archive, CalendarDays, CheckCircle2, ChevronRight, Flame, Flower2, LayoutDashboard, Apple, Settings, Weight } from "lucide-react";
import type { PageHistoryEntry } from "@/lib/pulse/shared";

type Value = Record<string, unknown>;
const record = (value: unknown): Value => value && typeof value === "object" && !Array.isArray(value) ? value as Value : {};
const list = (value: unknown): Value[] => Array.isArray(value) ? value.map(record) : [];
const label = (value: unknown, fallback = "—") => value === undefined || value === null || value === "" ? fallback : String(value);
const days = (value: unknown) => Array.isArray(value) ? value.map(day => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][Number(day)] ?? String(day)).join(" · ") : "Every day";
const entryDate = (value: unknown) => label(value);
const metric = (title: string, value: unknown) => <div className="hs-metric" key={title}><small>{title}</small><b>{label(value, "0")}</b></div>;

/* Cursor-follow glow (the CSS draws the light from --mx / --my) */
const spot = (event: ReactPointerEvent<HTMLElement>) => { const box = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`); event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`); };

function SnapshotDetails({ entry }: { entry: PageHistoryEntry }) {
  const data = record(entry.snapshot);
  if (entry.page === "Habits") return <div className="hs-items">{list(entry.snapshot).length ? list(entry.snapshot).map((habit,index)=><article className="hs-item" key={label(habit.id,String(index))}><b>{label(habit.title,"Habit")}</b><span>{label(habit.detail)} · {days(habit.days)}</span><small>{Object.keys(record(habit.completions)).length} saved completion dates</small></article>) : <p className="hs-empty">No habits in this saved version.</p>}</div>;
  if (entry.page === "Nutrition") return <div className="hs-items">{list(entry.snapshot).length ? list(entry.snapshot).map((food,index)=><article className="hs-item" key={label(food.id,String(index))}><b>{label(food.name,"Food entry")} · {label(food.calories,"0")} kcal</b><span>{entryDate(food.date)} · {label(food.amount,"1 serving")}</span><small>Protein {label(food.protein,"0")}g · Carbs {label(food.carbs,"0")}g · Fat {label(food.fats,"0")}g</small></article>) : <p className="hs-empty">No food entries in this saved version.</p>}</div>;
  if (entry.page === "Face Care") {
    const completed = record(data.completed), custom = record(data.custom);
    const routines = Object.entries(custom).flatMap(([month,week])=>Object.entries(record(week)).map(([day,routine])=>({month,day,routine:record(routine)})));
    return <div className="hs-stack"><div className="hs-metrics">{metric("Routine start",data.startDate)}{metric("Days with check-ins",Object.keys(completed).length)}{metric("Custom day routines",routines.length)}</div>{routines.length>0&&<div className="hs-items">{routines.map((item,index)=><article className="hs-item" key={`${item.month}-${item.day}-${index}`}><b>Month {item.month} · {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][Number(item.day)]??`Day ${item.day}`}</b><span>Morning: {list(item.routine.morning).map(step=>label(step.label)).join(", ")||"No custom steps"}</span><span>Night: {list(item.routine.night).map(step=>label(step.label)).join(", ")||"No custom steps"}</span></article>)}</div>}</div>;
  }
  if (entry.page === "Calorie Burn") {
    const burns=record(data.exerciseBurns), targets=record(data.calorieTargets); const dates=[...new Set([...Object.keys(burns),...Object.keys(targets)])].sort().reverse();
    return <div className="hs-items">{dates.length?dates.map(day=>{const target=record(targets[day]);return <article className="hs-item" key={day}><b>{day}</b><span>Exercise burn: {label(burns[day],"0")} kcal · Target: {label(target.calories,"—")} kcal</span>{target.calories!==undefined&&<small>Protein {label(target.protein)}g · Carbs {label(target.carbs)}g · Fat {label(target.fats)}g</small>}</article>}):<p className="hs-empty">No calorie-burn entries in this saved version.</p>}</div>;
  }
  if (entry.page === "Weight") return <div className="hs-items">{list(data.entries).length?list(data.entries).map((item,index)=><article className="hs-item" key={label(item.id,String(index))}><b>{label(item.weight)} kg</b><span>{entryDate(item.date)}</span></article>):<p className="hs-empty">Profile weight: {label(data.currentWeight)} kg · No dated weigh-ins in this saved version.</p>}</div>;
  if (entry.page === "Planner") return <div className="hs-items">{list(entry.snapshot).length?list(entry.snapshot).map((event,index)=><article className="hs-item" key={label(event.id,String(index))}><b>{label(event.title,"Event")}</b><span>{entryDate(event.date)} · {label(event.time)} · {label(event.category,"Personal")}</span><small>{event.completed?"Completed":"Planned"}</small></article>):<p className="hs-empty">No planner events in this saved version.</p>}</div>;
  if (entry.page === "Settings") {const goals=record(data.nutritionGoals);return <div className="hs-metrics">{metric("Daily calories",`${label(goals.calories,"—")} kcal`)}{metric("Protein",`${label(goals.protein,"—")} g`)}{metric("Carbohydrates",`${label(goals.carbs,"—")} g`)}{metric("Fat",`${label(goals.fats,"—")} g`)}{metric("Activity multiplier",data.activityFactor)}{metric("Theme",data.theme)}</div>}
  if (entry.page === "Dashboard") return <div className="hs-stack"><div className="hs-metrics">{metric("Food entries",list(data.foods).length)}{metric("Habits",list(data.habits).length)}{metric("Weight entries",list(data.weights).length)}{metric("Planner events",list(data.events).length)}{metric("Workout days",Object.keys(record(data.weeklyWorkouts)).length)}{metric("Workout completions",list(data.workoutCompletions).length)}</div><p className="hs-help">This dashboard snapshot preserves the tracker data as it was when saved.</p></div>;
  return <p className="hs-help">Saved version for {entry.page}.</p>;
}

const pageOrder = ["Dashboard","Habits","Nutrition","Face Care","Calorie Burn","Weight","Planner","Settings"] as const;

const pageIcons: Record<(typeof pageOrder)[number], { icon: ComponentType<{ size?: number }>; tone: string }> = {
  Dashboard: { icon: LayoutDashboard, tone: "orange" },
  Habits: { icon: CheckCircle2, tone: "lime" },
  Nutrition: { icon: Apple, tone: "rose" },
  "Face Care": { icon: Flower2, tone: "pink" },
  "Calorie Burn": { icon: Flame, tone: "violet" },
  Weight: { icon: Weight, tone: "blue" },
  Planner: { icon: CalendarDays, tone: "teal" },
  Settings: { icon: Settings, tone: "indigo" },
};

export function SavedPageHistory({ entries }: { entries: PageHistoryEntry[] }) {
  const groups = pageOrder.map(page => ({ page, saved: entries.filter(entry => entry.page === page) })).filter(group => group.saved.length);
  if (!groups.length) return <section className="hs-panel"><div className="hs-head"><div><h3><Archive size={16}/> Page history</h3><p>Saved versions from other pages appear here.</p></div></div><p className="hs-empty">No page versions have been saved yet.</p></section>;
  return <div className="hs-groups">{groups.map(({ page, saved }, groupIndex) => {
    const { icon: Icon, tone } = pageIcons[page];
    return <section className="hs-panel hs-group" style={{ "--i": groupIndex } as CSSProperties} key={page}>
      <div className="hs-head hs-group-head"><span className={`hs-ic ${tone}`}><Icon size={17}/></span><div><h3>{page} history</h3><p>{saved.length} saved {saved.length===1?"version":"versions"} · each one stays after reset.</p></div><span className="hs-count">{saved.length}</span></div>
      <div className="hs-snaps">{saved.map(entry=><details className="hs-snap" key={entry.id} onPointerMove={spot}><summary><span><b>{entry.label}</b><small>{new Date(entry.savedAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</small></span><ChevronRight className="hs-chevron" size={16}/></summary><div className="hs-snap-body"><SnapshotDetails entry={entry}/></div></details>)}</div>
    </section>;
  })}</div>;
}