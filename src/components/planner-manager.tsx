"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarDays, Check, Clock3, Plus, X } from "lucide-react";

export type PlannerEvent = { id: string; title: string; date: string; time: string; category: string; completed?: boolean };

const localDay = () => {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export function PlannerManager({ events, setEvents, addRequest }: {
  events: PlannerEvent[];
  setEvents: React.Dispatch<React.SetStateAction<PlannerEvent[]>>;
  addRequest: number;
}) {
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const blank = { title: "", date: localDay(), time: "09:00", category: "Personal" };
  const [draft, setDraft] = useState(blank);
  const openNew = () => { setEditing(null); setDraft({ ...blank, date: localDay() }); setDialog(true); };
  useEffect(() => { if (addRequest > 0) openNew(); }, [addRequest]);
  const save = () => {
    if (!draft.title.trim() || !draft.date) return;
    const previous = events.find(event => event.id === editing);
    const entry: PlannerEvent = { ...draft, id: editing ?? crypto.randomUUID(), title: draft.title.trim(), completed: previous?.completed ?? false };
    setEvents(all => editing ? all.map(event => event.id === editing ? entry : event) : [...all, entry]);
    setDialog(false);
  };
  const toggleComplete = (id: string) => setEvents(all => all.map(event => event.id === id ? { ...event, completed: !event.completed } : event));
  const remove = (id: string) => setEvents(all => all.filter(event => event.id !== id));
  const today = localDay();
  const ordered = [...events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return <>
    <section className="panel module-panel">
      <div className="panel-heading"><div><h3>Your events</h3><p>Mark finished plans complete to clear them from the dashboard.</p></div><button className="primary-btn" onClick={openNew}><Plus size={15}/> Add event</button></div>
      {ordered.length === 0 ? <div className="empty-state"><span><CalendarDays size={19}/></span><b>Nothing here just yet</b><p>Your planner is ready. Add a workout, reminder, or personal event.</p></div> : ordered.map(event => <div className={`planner-event ${event.completed ? "planner-event-done" : ""}`} key={event.id}>
        <span className="event-date"><strong>{new Date(`${event.date}T12:00:00`).getDate()}</strong><small>{new Date(`${event.date}T12:00:00`).toLocaleDateString("en-IN", { month: "short" }).toUpperCase()}</small></span>
        <div className="event-info"><strong>{event.title}</strong><span>{event.date === today ? "Today" : new Date(`${event.date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {event.time} · {event.category}</span></div>
        <button className="secondary-btn" onClick={() => { setEditing(event.id); setDraft({ title: event.title, date: event.date, time: event.time, category: event.category }); setDialog(true); }}>Edit</button>
        <button className={`planner-complete-btn ${event.completed ? "is-complete" : ""}`} aria-pressed={!!event.completed} onClick={() => toggleComplete(event.id)}><Check size={14}/>{event.completed ? "Completed · undo" : "Mark completed"}</button>
        <button className="delete-btn" aria-label={`Delete ${event.title}`} onClick={() => remove(event.id)}><X size={15}/></button>
      </div>)}
    </section>
    <AnimatePresence>{dialog && <><motion.button className="scrim" aria-label="Close event editor" onClick={() => setDialog(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}/><motion.section className="food-dialog" role="dialog" aria-modal="true" aria-labelledby="event-title" initial={{ opacity: 0, scale: .97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .98 }}>
      <div className="dialog-head"><div><span className="eyebrow">PLANNER · PERSONAL EVENT</span><h2 id="event-title">{editing ? "Edit event" : "Add an event"}</h2><p>Choose when it happens and what kind of reminder it is.</p></div><button className="icon-btn" aria-label="Close" onClick={() => setDialog(false)}><X size={18}/></button></div>
      <label className="field-label">Event name<input autoFocus value={draft.title} placeholder="e.g. Meal prep" onChange={e => setDraft({ ...draft, title: e.target.value })}/></label>
      <div className="nutrition-inputs"><label className="field-label">Date<input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })}/></label><label className="field-label">Time<input type="time" value={draft.time} onChange={e => setDraft({ ...draft, time: e.target.value })}/></label></div>
      <label className="field-label">Category<input value={draft.category} placeholder="Personal" onChange={e => setDraft({ ...draft, category: e.target.value })}/></label>
      <div className="dialog-actions"><button className="secondary-btn" onClick={() => setDialog(false)}>Cancel</button><button className="primary-btn" onClick={save}>{editing ? "Save changes" : "Add event"} <ArrowRight size={15}/></button></div>
    </motion.section></>}</AnimatePresence>
  </>;
}
