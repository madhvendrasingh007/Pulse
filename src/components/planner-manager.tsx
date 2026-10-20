// FILENAME: src/components/planner-manager.tsx
"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarDays, Check, Clock3, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { createLocalId } from "@/lib/pulse/shared";

export type PlannerEvent = { id: string; title: string; date: string; time: string; category: string; completed?: boolean };

type Filter = "all" | "open" | "today" | "done";

const localDay = () => {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const QUICK_CATEGORIES = ["Personal", "Workout", "Work", "Health", "Reminder"];

/* Stable color per category name */
const hue = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0) * 7, 0) % 360;
const tone = (s: string) => ({ "--c": `hsl(${hue(s || "Personal")} 68% 58%)` }) as CSSProperties;

const dayDiff = (date: string, today: string) =>
  Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000);

const dayLabel = (date: string, today: string) => {
  const diff = dayDiff(date, today);
  const pretty = new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  if (diff === 0) return { title: "Today", sub: pretty };
  if (diff === 1) return { title: "Tomorrow", sub: pretty };
  if (diff === -1) return { title: "Yesterday", sub: pretty };
  return { title: pretty, sub: diff > 0 ? `In ${diff} days` : `${Math.abs(diff)} days ago` };
};

export function PlannerManager({ events, setEvents, addRequest }: {
  events: PlannerEvent[];
  setEvents: Dispatch<SetStateAction<PlannerEvent[]>>;
  addRequest: number;
}) {
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const blank = { title: "", date: localDay(), time: "09:00", category: "Personal" };
  const [draft, setDraft] = useState(blank);
  const openNew = () => { setEditing(null); setDraft({ ...blank, date: localDay() }); setDialog(true); };
  useEffect(() => { if (addRequest > 0) openNew(); }, [addRequest]);
  const save = () => {
    if (!draft.title.trim() || !draft.date) return;
    const previous = events.find(event => event.id === editing);
    const entry: PlannerEvent = { ...draft, id: editing ?? createLocalId(), title: draft.title.trim(), completed: previous?.completed ?? false };
    setEvents(all => editing ? all.map(event => event.id === editing ? entry : event) : [...all, entry]);
    setDialog(false);
  };
  const toggleComplete = (id: string) => setEvents(all => all.map(event => event.id === id ? { ...event, completed: !event.completed } : event));
  const remove = (id: string) => setEvents(all => all.filter(event => event.id !== id));
  const today = localDay();
  const ordered = [...events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const openCount = events.filter(event => !event.completed).length;
  const doneCount = events.filter(event => event.completed).length;
  const todayCount = events.filter(event => event.date === today).length;
  const overdueCount = events.filter(event => !event.completed && event.date < today).length;

  const visible = ordered.filter(event => filter === "all" ? true : filter === "open" ? !event.completed : filter === "today" ? event.date === today : !!event.completed);
  const groups = visible.reduce<{ date: string; items: PlannerEvent[] }[]>((list, event) => {
    const last = list[list.length - 1];
    if (last && last.date === event.date) last.items.push(event);
    else list.push({ date: event.date, items: [event] });
    return list;
  }, []);

  const filters: [Filter, string, number][] = [["all", "All", events.length], ["open", "Open", openCount], ["today", "Today", todayCount], ["done", "Done", doneCount]];

  return <div className="pl">
    {/* ===== Summary ===== */}
    <section className="pl-hero" aria-label="Planner summary">
      <div className="pl-hero-copy">
        <span className="pl-kicker">Planner</span>
        <h2>{openCount === 0 ? "All clear" : `${openCount} ${openCount === 1 ? "plan" : "plans"} open`}</h2>
        <p>{overdueCount > 0 ? `${overdueCount} ${overdueCount === 1 ? "event is" : "events are"} overdue.` : "Mark finished plans complete to clear them from the dashboard."}</p>
        <button type="button" className="pl-btn is-primary" onClick={openNew}><Plus size={16} /> Add event</button>
      </div>
      <div className="pl-stats">
        <article style={{ "--i": 0 } as CSSProperties}><span>Today</span><b>{todayCount}</b></article>
        <article style={{ "--i": 1 } as CSSProperties}><span>Open</span><b>{openCount}</b></article>
        <article className={overdueCount ? "is-warn" : ""} style={{ "--i": 2 } as CSSProperties}><span>Overdue</span><b>{overdueCount}</b></article>
        <article className="is-ok" style={{ "--i": 3 } as CSSProperties}><span>Done</span><b>{doneCount}</b></article>
      </div>
    </section>

    {/* ===== Events ===== */}
    <section className="pl-panel">
      <div className="pl-head">
        <div><h3>Your events</h3><p>Mark finished plans complete to clear them from the dashboard.</p></div>
        <div className="pl-segment" role="group" aria-label="Filter events">{filters.map(([key, text, count]) => <button type="button" key={key} aria-pressed={filter === key} className={filter === key ? "is-selected" : ""} onClick={() => setFilter(key)}>{text}<small>{count}</small></button>)}</div>
      </div>

      {events.length === 0 ? <div className="pl-empty"><span><CalendarDays size={22} /></span><b>Nothing here just yet</b><p>Your planner is ready. Add a workout, reminder, or personal event.</p><button type="button" className="pl-btn" onClick={openNew}><Plus size={15} /> Add your first event</button></div>
        : visible.length === 0 ? <div className="pl-empty"><span><Check size={22} /></span><b>No events in this view</b><p>Try another filter to see the rest of your plans.</p><button type="button" className="pl-btn" onClick={() => setFilter("all")}>Show all events</button></div>
        : <div className="pl-groups" key={filter}>{groups.map((group, groupIndex) => {
          const label = dayLabel(group.date, today);
          return <section className="pl-group" key={group.date} style={{ "--g": groupIndex } as CSSProperties}>
            <header className={group.date === today ? "is-today" : ""}><b>{label.title}</b><small>{label.sub}</small></header>
            <div className="pl-events">{group.items.map((event, index) => {
              const overdue = !event.completed && event.date < today;
              const d = new Date(`${event.date}T12:00:00`);
              return <article className={`pl-event ${event.completed ? "is-done" : ""} ${overdue ? "is-overdue" : ""}`} style={{ "--i": index, ...tone(event.category) } as CSSProperties} key={event.id}>
                <span className="pl-date"><strong>{d.getDate()}</strong><small>{d.toLocaleDateString("en-IN", { month: "short" })}</small></span>
                <div className="pl-info">
                  <strong>{event.title}</strong>
                  <span className="pl-meta"><i><Clock3 size={13} /> {event.time}</i><i className="pl-cat"><Tag size={12} /> {event.category}</i>{overdue && <i className="pl-overdue">Overdue</i>}</span>
                </div>
                <div className="pl-actions">
                  <button type="button" className={`pl-done-btn ${event.completed ? "is-complete" : ""}`} aria-pressed={!!event.completed} onClick={() => toggleComplete(event.id)}><span className="pl-check"><Check size={13} strokeWidth={3} /></span>{event.completed ? "Completed · undo" : "Mark completed"}</button>
                  <button type="button" className="pl-icon-btn" aria-label={`Edit ${event.title}`} onClick={() => { setEditing(event.id); setDraft({ title: event.title, date: event.date, time: event.time, category: event.category }); setDialog(true); }}><Pencil size={15} /></button>
                  <button type="button" className="pl-icon-btn is-danger" aria-label={`Delete ${event.title}`} onClick={() => remove(event.id)}><Trash2 size={15} /></button>
                </div>
              </article>;
            })}</div>
          </section>;
        })}</div>}
    </section>

    <AnimatePresence>{dialog && <><motion.button className="scrim" aria-label="Close event editor" onClick={() => setDialog(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /><motion.section className="food-dialog pl-dialog" role="dialog" aria-modal="true" aria-labelledby="event-title" initial={{ opacity: 0, scale: .97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .98 }}>
      <div className="dialog-head"><div><span className="eyebrow">PLANNER · PERSONAL EVENT</span><h2 id="event-title">{editing ? "Edit event" : "Add an event"}</h2><p>Choose when it happens and what kind of reminder it is.</p></div><button className="icon-btn" aria-label="Close" onClick={() => setDialog(false)}><X size={18} /></button></div>
      <label className="field-label">Event name<input autoFocus value={draft.title} placeholder="e.g. Meal prep" onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
      <div className="nutrition-inputs"><label className="field-label">Date<input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></label><label className="field-label">Time<input type="time" value={draft.time} onChange={e => setDraft({ ...draft, time: e.target.value })} /></label></div>
      <label className="field-label">Category<input value={draft.category} placeholder="Personal" onChange={e => setDraft({ ...draft, category: e.target.value })} /></label>
      <div className="pl-chips" role="group" aria-label="Quick categories">{QUICK_CATEGORIES.map(name => <button type="button" key={name} aria-pressed={draft.category === name} className={`pl-chip ${draft.category === name ? "is-selected" : ""}`} style={tone(name)} onClick={() => setDraft({ ...draft, category: name })}>{name}</button>)}</div>
      <div className="dialog-actions"><button className="secondary-btn" onClick={() => setDialog(false)}>Cancel</button><button className="primary-btn" onClick={save}>{editing ? "Save changes" : "Add event"} <ArrowRight size={15} /></button></div>
    </motion.section></>}</AnimatePresence>
  </div>;
}
