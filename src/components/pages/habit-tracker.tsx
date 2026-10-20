"use client";
import { useMemo, useState } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { Check, Pencil, Plus, Trash2, ChevronDown, CalendarCheck, PencilLine } from "lucide-react";

import { dayNames, localDay, habitIcons, habitIconOptions, habitColorOptions, habitOnDate, habitDoneOnDate } from "@/lib/pulse/shared";
import type { Habit } from "@/lib/pulse/shared";

type Props = {
  habits: Habit[];
  date: string;
  setDate: (date: string) => void;
  toggleHabit: (id: string, date?: string) => void;
  openHabit: (habit?: Habit) => void;
  removeHabit: (id: string) => void;
  setHabits: Dispatch<SetStateAction<Habit[]>>;
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const GROUPS = [
  { id: "mwf", label: "Mon, Wed, Fri", title: "Monday, Wednesday, Friday", days: [1, 3, 5] },
  { id: "tts", label: "Tue, Thu, Sat", title: "Tuesday, Thursday, Saturday", days: [2, 4, 6] },
  { id: "sun", label: "Sunday", title: "Sunday", days: [0] },
];

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const RING_R = 42;
const RING_C = 2 * Math.PI * RING_R;

export function HabitManager({ habits, date, setDate, toggleHabit, openHabit, removeHabit, setHabits }: Props) {
  const [editingAll, setEditingAll] = useState(false);

  const selected = new Date(`${date}T12:00:00`);
  const dayIndex = selected.getDay();
  const todayKey = localDay();
  const isToday = date === todayKey;

  const liveHabits = habits.filter(h => !h.archived);

  // Week strip: Sunday to Saturday around the selected date
  const week = useMemo(() => {
    const start = new Date(`${date}T12:00:00`);
    start.setDate(start.getDate() - start.getDay());
    return ALL_DAYS.map(i => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = toKey(d);
      const active = habits.filter(h => !h.archived && habitOnDate(h, key));
      const done = active.filter(h => habitDoneOnDate(h, key)).length;
      return { key, label: SHORT_DAYS[i], num: d.getDate(), total: active.length, done };
    });
  }, [habits, date]);

  const todays = liveHabits.filter(h => habitOnDate(h, date));
  const doneCount = todays.filter(h => habitDoneOnDate(h, date)).length;
  const pct = todays.length ? Math.round((doneCount / todays.length) * 100) : 0;
  const remaining = todays.length - doneCount;

  const headline = !todays.length
    ? "Nothing scheduled"
    : remaining === 0
      ? "All done"
      : `${remaining} left to go`;
  const subline = !todays.length
    ? "Add a habit to start building this day's routine."
    : remaining === 0
      ? `You finished all ${todays.length} habits${isToday ? " today" : " on this day"}.`
      : `${doneCount} of ${todays.length} habits done${isToday ? " today" : ""}.`;

  const presetFor = (habit: Habit) => {
    const days = habit.days ?? ALL_DAYS;
    return GROUPS.find(g => g.days.length === days.length && g.days.every(d => days.includes(d)))?.id ?? "daily";
  };
  const setSchedule = (id: string, preset: string) => {
    const days = preset === "daily" ? ALL_DAYS : (GROUPS.find(g => g.id === preset)?.days ?? ALL_DAYS);
    setHabits(all => all.map(h => (h.id === id ? { ...h, days } : h)));
  };
  const update = (id: string, key: "title" | "detail" | "iconKey" | "color", value: string) =>
    setHabits(all => all.map(h => (h.id === id ? { ...h, [key]: value } : h)));

  return (
    <div className={`ht ${editingAll ? "is-editing" : ""}`}>
      {/* Summary */}
      <section className="ht-hero" aria-label="Progress summary">
        <div className="ht-ring" role="img" aria-label={`${pct}% complete`}>
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle className="ht-ring-track" cx="50" cy="50" r={RING_R} />
            <circle
              className="ht-ring-fill"
              cx="50"
              cy="50"
              r={RING_R}
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - pct / 100)}
            />
          </svg>
          <span className="ht-ring-label">
            <b>{pct}</b>
            <small>%</small>
          </span>
        </div>

        <div className="ht-hero-copy">
          <p className="ht-hero-day">
            {isToday ? "Today" : dayNames[dayIndex]}
            {isToday && <span>{dayNames[dayIndex]}</span>}
          </p>
          <h2>{headline}</h2>
          <p>{subline}</p>
        </div>

        <div className="ht-hero-actions">
          {!isToday && (
            <button className="ht-btn ht-btn-ghost" onClick={() => setDate(todayKey)}>
              <CalendarCheck size={15} /> Back to today
            </button>
          )}
          <button
            className={`ht-btn ht-btn-ghost ${editingAll ? "is-on" : ""}`}
            onClick={() => setEditingAll(v => !v)}
            aria-pressed={editingAll}
          >
            {editingAll ? <Check size={15} /> : <PencilLine size={15} />}
            {editingAll ? "Done editing" : "Edit all"}
          </button>
          <button className="ht-btn ht-btn-primary" onClick={() => openHabit()}>
            <Plus size={16} /> Add habit
          </button>
        </div>
      </section>

      {/* Week strip */}
      <nav className="ht-week" aria-label="Choose a day">
        {week.map(d => {
          const frac = d.total ? d.done / d.total : 0;
          return (
            <button
              key={d.key}
              className={`ht-day ${d.key === date ? "is-selected" : ""} ${d.key === todayKey ? "is-today" : ""} ${d.total && d.done === d.total ? "is-complete" : ""}`}
              onClick={() => setDate(d.key)}
              aria-pressed={d.key === date}
              aria-current={d.key === todayKey ? "date" : undefined}
              aria-label={`${d.label} ${d.num}, ${d.done} of ${d.total} done`}
            >
              <span className="ht-day-name">{d.label}</span>
              <span className="ht-day-num">{d.num}</span>
              <span className="ht-day-bar" aria-hidden="true">
                <i style={{ transform: `scaleX(${frac})` }} />
              </span>
            </button>
          );
        })}
      </nav>

      {/* Routines */}
      <div className="ht-groups">
        {GROUPS.map(group => {
          const items = liveHabits.filter(h => (h.days ?? ALL_DAYS).some(day => group.days.includes(day)));
          const isActiveGroup = group.days.includes(dayIndex);
          const groupDone = items.filter(h => habitDoneOnDate(h, date) && habitOnDate(h, date)).length;
          const groupActive = items.filter(h => habitOnDate(h, date)).length;

          return (
            <details className={`ht-group ${isActiveGroup ? "is-active" : ""}`} key={group.id} open={isActiveGroup}>
              <summary className="ht-group-head">
                <span className="ht-group-dot" aria-hidden="true" />
                <span className="ht-group-title">
                  <h3>{group.title}</h3>
                  <p>
                    {isActiveGroup
                      ? groupActive
                        ? `${groupDone} of ${groupActive} done on this day`
                        : "Active on this day"
                      : `${items.length} ${items.length === 1 ? "habit" : "habits"} on matching days`}
                  </p>
                </span>
                {isActiveGroup && <span className="ht-pill">Active</span>}
                <ChevronDown className="ht-chevron" size={18} aria-hidden="true" />
              </summary>

              <div className="ht-group-body">
                {items.length ? (
                  items.map((h, index) => {
                    const Icon = habitIcons[h.iconKey] ?? Check;
                    const active = habitOnDate(h, date);
                    const done = habitDoneOnDate(h, date);
                    const style = { "--i": index } as CSSProperties;

                    return (
                      <article className="ht-item" style={style} key={`${group.id}-${h.id}-${index}`}>
                        {editingAll ? (
                          <>
                            <span className={`ht-icon ${h.color}`}>
                              <Icon size={18} />
                            </span>
                            <div className="ht-fields">
                              <input
                                className="ht-input ht-f-title"
                                aria-label={`${h.title} habit name`}
                                value={h.title}
                                onChange={e => update(h.id, "title", e.target.value)}
                              />
                              <input
                                className="ht-input ht-f-detail"
                                aria-label={`${h.title} details`}
                                value={h.detail}
                                onChange={e => update(h.id, "detail", e.target.value)}
                              />
                              <select
                                className="ht-input"
                                aria-label={`${h.title} schedule`}
                                value={presetFor(h)}
                                onChange={e => setSchedule(h.id, e.target.value)}
                              >
                                <option value="mwf">Mon, Wed, Fri</option>
                                <option value="tts">Tue, Thu, Sat</option>
                                <option value="sun">Sunday</option>
                                <option value="daily">Every day</option>
                              </select>
                              <select
                                className="ht-input"
                                aria-label={`${h.title} icon`}
                                value={h.iconKey}
                                onChange={e => update(h.id, "iconKey", e.target.value)}
                              >
                                {habitIconOptions.map(([key, label]) => (
                                  <option value={key} key={key}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                              <select
                                className="ht-input"
                                aria-label={`${h.title} color`}
                                value={h.color}
                                onChange={e => update(h.id, "color", e.target.value)}
                              >
                                {habitColorOptions.map(([key, label]) => (
                                  <option value={key} key={key}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button className="ht-icon-btn is-danger" aria-label={`Remove ${h.title}`} onClick={() => removeHabit(h.id)}>
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className={`ht-row ${done ? "is-done" : ""}`}
                              disabled={!active}
                              onClick={() => toggleHabit(h.id, date)}
                              aria-pressed={done}
                              title={active ? undefined : "Not scheduled on this day"}
                            >
                              <span className={`ht-icon ${h.color}`}>
                                <Icon size={18} />
                              </span>
                              <span className="ht-copy">
                                <strong>{h.title}</strong>
                                <small>{active ? h.detail : `${h.detail} (not scheduled on ${SHORT_DAYS[dayIndex]})`}</small>
                              </span>
                              <span className={`ht-check ${done ? "is-checked" : ""}`} aria-hidden="true">
                                <Check size={14} strokeWidth={3} />
                              </span>
                            </button>
                            <div className="ht-tools">
                              <button className="ht-icon-btn" aria-label={`Edit ${h.title}`} onClick={() => openHabit(h)}>
                                <Pencil size={15} />
                              </button>
                              <button className="ht-icon-btn is-danger" aria-label={`Remove ${h.title}`} onClick={() => removeHabit(h.id)}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </>
                        )}
                      </article>
                    );
                  })
                ) : (
                  <div className="ht-empty">
                    <p>No habits in this routine yet.</p>
                    <button className="ht-btn ht-btn-ghost" onClick={() => openHabit()}>
                      <Plus size={15} /> Add a habit
                    </button>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>

      <p className="ht-note">Changes made here update your dashboard routine right away.</p>
    </div>
  );
}