"use client";
import { Activity, Apple, ArrowRight, Check, Clock3, Flame, Flower2, Plus, Weight } from "lucide-react";
import { BarChart as RBarChart, Bar as RBar, CartesianGrid as RGrid, ResponsiveContainer as RContainer, Tooltip as RTooltip, XAxis as RXAxis, YAxis as RYAxis } from "recharts";
import { habitDoneOnDate, eventDay, fmt, faceRoutineSteps, habitIcons, dayNames } from "@/lib/pulse/shared";
import type { Food, Habit, WeightLog, WeeklyExercise, FaceRoutineState } from "@/lib/pulse/shared";
import type { EnergyProfile } from "@/lib/calculations/energy";
import type { PlannerEvent } from "@/components/planner-manager";
import "./dashboard.css";

type NutritionTotals = { calories: number; protein: number; carbs: number; fats: number };
type EnergyTotals = { bmr: number; totalBurn: number; sedentaryTdee: number; exerciseBurn: number; deficit: number; fatLossGrams: number; weeklyFatLossKg: number };
type DashboardData = { today: string; todayNutrition: NutritionTotals; todayEnergy: EnergyTotals; todayHabits: Habit[]; completedHabits: Habit[]; energyTrend: { date: string; label: string; intake: number; burn: number }[]; todayWorkouts: WeeklyExercise[]; completedWorkouts: WeeklyExercise[]; currentFaceMonth: 1 | 2; shownFaceMonth: 1 | 2; todayFace: ReturnType<typeof faceRoutineSteps>; todayFaceDone: number; faceRoutine: FaceRoutineState; todayFoods: Food[]; nutritionGoals: NutritionTotals; profile: EnergyProfile; weights: WeightLog[]; upcomingEvents: PlannerEvent[]; recentPastEvents: PlannerEvent[] };
type DashboardActions = { setPage: (page: import("@/lib/pulse/shared").Page) => void; setSelectedDate: (date: string) => void; toggleHabit: (id: string, date?: string) => void; openWeightEntry: () => void; openHabitEditor: () => void; openNewFood: () => void; onQuickLog: () => void; toggleFaceStep: (id: string, date: string) => void; setFaceMonthSelection: (month: 1 | 2) => void };

function Ring({ pct }: { pct: number }) {
  const r = 54, c = 2 * Math.PI * r;
  return (
    <svg className="pd-ring" viewBox="0 0 128 128" role="img" aria-label={`${pct}% of habits done`}>
      <circle cx="64" cy="64" r={r} className="track" />
      <circle cx="64" cy="64" r={r} className="arc" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 64 64)" />
      <text x="64" y="68" textAnchor="middle" className="num">{pct}%</text>
      <text x="64" y="86" textAnchor="middle" className="cap">habits</text>
    </svg>
  );
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return <p className="pd-empty">Log weight twice to see a trend.</p>;
  const min = Math.min(...values), max = Math.max(...values), span = Math.max(0.1, max - min);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 200},${46 - ((v - min) / span) * 40}`).join(" ");
  return <svg className="pd-spark" viewBox="0 0 200 52" preserveAspectRatio="none" aria-hidden="true"><polyline points={pts} /></svg>;
}

export function DashboardPage({ data: { today, todayNutrition, todayEnergy, todayHabits, completedHabits, energyTrend, todayWorkouts, completedWorkouts, currentFaceMonth, shownFaceMonth, todayFace, todayFaceDone, faceRoutine, todayFoods, nutritionGoals, profile, weights, upcomingEvents, recentPastEvents }, actions: { setPage, setSelectedDate, toggleHabit, openWeightEntry, openHabitEditor, openNewFood, toggleFaceStep, setFaceMonthSelection, onQuickLog } }: { data: DashboardData; actions: DashboardActions }) {
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const habitPct = todayHabits.length ? Math.round((completedHabits.length / todayHabits.length) * 100) : 0;
  const dow = dayNames[new Date(`${today}T12:00:00`).getDay()];
  const dateLabel = (d: string, o: Intl.DateTimeFormatOptions) => new Date(`${eventDay(d)}T12:00:00`).toLocaleDateString("en-IN", o);
  const faceDoneIds = faceRoutine.completed[today] ?? [];
  const macros: [string, number, number, string][] = [["Calories", todayNutrition.calories, nutritionGoals.calories, "kcal"], ["Protein", todayNutrition.protein, nutritionGoals.protein, "g"], ["Carbs", todayNutrition.carbs, nutritionGoals.carbs, "g"], ["Fats", todayNutrition.fats, nutritionGoals.fats, "g"]];
  const wts = weights.slice(-14).map(w => w.weight);
  const wDelta = wts.length > 1 ? wts[wts.length - 1] - wts[0] : 0;

  return (
    <div className="pd">
      <header className="pd-top">
        <div>
          <p className="pd-date" suppressHydrationWarning>{new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          <h1 suppressHydrationWarning>{hello}, Madhvendra</h1>
          <p className="pd-sub">A little progress every day. Here is where you stand.</p>
        </div>
        <div className="pd-top-actions">
          <button className="pd-btn primary" onClick={onQuickLog}><Plus size={16} /> Quick log</button>
        </div>
      </header>

      <section className="pd-hero">
        <div>
          <h2>Make today count.</h2>
          <p>{completedHabits.length} of {todayHabits.length} habits done, {fmt(todayNutrition.calories)} kcal logged, {completedWorkouts.length} of {todayWorkouts.length} exercises finished.</p>
          <button className="pd-link" onClick={() => setPage("Insights")}>See your progress <ArrowRight size={14} /></button>
        </div>
        <Ring pct={habitPct} />
      </section>

      <div className="pd-stats">
        <article className="pd-card">
          <div className="pd-card-h"><span>Food today</span><Apple size={16} /></div>
          <div className="pd-big">{fmt(todayNutrition.calories)}<small>kcal</small></div>
          <div className="pd-bar"><i style={{ width: `${Math.min(100, (todayNutrition.calories / Math.max(1, nutritionGoals.calories)) * 100)}%` }} /></div>
          <p className="pd-note">of {fmt(nutritionGoals.calories)} kcal guide</p>
        </article>
        <article className="pd-card">
          <div className="pd-card-h"><span>Habits</span><Check size={16} /></div>
          <div className="pd-big">{completedHabits.length}<small>/ {todayHabits.length}</small></div>
          <div className="pd-bar"><i style={{ width: `${habitPct}%` }} /></div>
          <p className="pd-note">{habitPct}% complete</p>
        </article>
        <article className="pd-card">
          <div className="pd-card-h"><span>Daily burn</span><Flame size={16} /></div>
          <div className="pd-big">{fmt(todayEnergy.totalBurn)}<small>kcal</small></div>
          <p className="pd-note">{fmt(todayEnergy.sedentaryTdee)} base + {fmt(todayEnergy.exerciseBurn)} exercise</p>
          <button className="pd-link sm" onClick={() => { setSelectedDate(today); setPage("Calorie Burn"); }}>Deficit {fmt(todayEnergy.deficit)} kcal <ArrowRight size={13} /></button>
        </article>
        <article className="pd-card">
          <div className="pd-card-h"><span>Weight</span><Weight size={16} /></div>
          <div className="pd-big">{profile.weightKg.toFixed(1)}<small>kg</small></div>
          <Spark values={wts} />
          <button className="pd-link sm" onClick={openWeightEntry}>Log weight <ArrowRight size={13} /></button>
        </article>
      </div>

      <div className="pd-grid two">
        <section className="pd-panel">
          <div className="pd-panel-h"><div><h3>Today&rsquo;s habits</h3><p>Tap to mark complete.</p></div><button className="pd-link sm" onClick={() => setPage("Habits")}>Manage</button></div>
          <div className="pd-list">
            {todayHabits.map((h, i) => { const Icon = habitIcons[h.iconKey] ?? Check; const done = habitDoneOnDate(h, today);
              return <button key={h.id + i} className={`pd-row ${done ? "done" : ""}`} onClick={() => toggleHabit(h.id, today)}>
                <span className="pd-ico"><Icon size={16} /></span>
                <span className="pd-row-t"><strong>{h.title}</strong><small>{h.detail}</small></span>
                <span className={`pd-check ${done ? "on" : ""}`}>{done && <Check size={12} />}</span>
              </button>; })}
            {!todayHabits.length && <p className="pd-empty">No habits scheduled today.</p>}
          </div>
          <button className="pd-btn ghost" onClick={openHabitEditor}><Plus size={14} /> Add a habit</button>
        </section>

        <section className="pd-panel">
          <div className="pd-panel-h"><div><h3>Energy balance</h3><p>Last 7 days, food in versus burn.</p></div><button className="pd-link sm" onClick={() => setPage("Calorie Burn")}>Details</button></div>
          <div className="pd-chart">
            <RContainer width="100%" height="100%">
              <RBarChart data={energyTrend} margin={{ top: 6, right: 2, bottom: 0, left: 2 }} barGap={3}>
                <RGrid stroke="var(--line)" strokeDasharray="3 4" vertical={false} />
                <RXAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <RYAxis hide />
                <RTooltip cursor={{ fill: "var(--soft)" }} formatter={(v) => [`${Number(v).toLocaleString()} kcal`]} contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }} />
                <RBar dataKey="intake" name="Food intake" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                <RBar dataKey="burn" name="Daily burn" fill="var(--info)" radius={[4, 4, 0, 0]} />
              </RBarChart>
            </RContainer>
          </div>
          <dl className="pd-kv">
            <div><dt>BMR</dt><dd>{fmt(todayEnergy.bmr)} kcal</dd></div>
            <div><dt>Estimated deficit</dt><dd>{fmt(todayEnergy.deficit)} kcal</dd></div>
            <div><dt>Fat loss</dt><dd>{fmt(todayEnergy.fatLossGrams)} g/day</dd></div>
            <div><dt>Weekly estimate</dt><dd>{fmt(todayEnergy.weeklyFatLossKg)} kg</dd></div>
          </dl>
        </section>
      </div>

      <section className="pd-panel">
        <div className="pd-panel-h"><div><h3>Workout for {dow}</h3><p>{todayWorkouts.length ? `${completedWorkouts.length} of ${todayWorkouts.length} exercises complete` : "No exercises planned yet."}</p></div><button className="pd-link sm" onClick={() => setPage("Workouts")}>Open plan</button></div>
        {todayWorkouts.length ? <div className="pd-table-wrap"><table className="pd-table">
          <thead><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Focus</th><th>Status</th></tr></thead>
          <tbody>{todayWorkouts.map(x => { const d = x.completedDates?.includes(today); return <tr key={x.id}><td data-label="Exercise"><strong>{x.name}</strong></td><td data-label="Sets">{x.sets}</td><td data-label="Reps">{x.reps}</td><td data-label="Focus"><span className="pd-chip">{x.focus ?? "General"}</span></td><td data-label="Status"><span className={`pd-chip ${d ? "ok" : ""}`}>{d ? "Done" : "Pending"}</span></td></tr>; })}</tbody>
        </table></div> : <p className="pd-empty">Add exercises to {dow}&rsquo;s plan in Workouts.</p>}
      </section>

      <div className="pd-grid two">
        <section className="pd-panel">
          <div className="pd-panel-h"><div><h3>Nutrition</h3><p>Macros against your goals.</p></div><button className="pd-link sm" onClick={() => setPage("Nutrition")}>Food log</button></div>
          <div className="pd-macros">{macros.map(([l, v, g, u]) => <div key={l}><span>{l}</span><b>{fmt(v)}<small> / {fmt(g)} {u}</small></b><div className="pd-bar"><i style={{ width: `${Math.min(100, (v / Math.max(1, g)) * 100)}%` }} /></div></div>)}</div>
          {todayFoods.length ? <div className="pd-table-wrap"><table className="pd-table">
            <thead><tr><th>Latest food</th><th>kcal</th><th>P</th><th>C</th></tr></thead>
            <tbody>{todayFoods.slice(-4).reverse().map(f => <tr key={f.id}><td data-label="Food"><strong>{f.name}</strong></td><td data-label="kcal">{fmt(f.calories)}</td><td data-label="Protein">{fmt(f.protein)}g</td><td data-label="Carbs">{fmt(f.carbs)}g</td></tr>)}</tbody>
          </table></div> : <p className="pd-empty">Nothing logged yet today.</p>}
          <button className="pd-btn ghost" onClick={() => { setSelectedDate(today); openNewFood(); }}><Plus size={14} /> Log food</button>
        </section>

        <section className="pd-panel">
          <div className="pd-panel-h"><div><h3>Weekly summary</h3><p>Intake, burn and net per day.</p></div><button className="pd-link sm" onClick={() => setPage("Insights")}>Insights</button></div>
          <div className="pd-table-wrap"><table className="pd-table">
            <thead><tr><th>Day</th><th>In</th><th>Burn</th><th>Net</th></tr></thead>
            <tbody>{energyTrend.map(d => { const net = d.intake - d.burn; return <tr key={d.date}><td data-label="Day"><strong>{d.label}</strong></td><td data-label="In">{fmt(d.intake)}</td><td data-label="Burn">{fmt(d.burn)}</td><td data-label="Net"><span className={`pd-chip ${net <= 0 ? "ok" : "warn"}`}>{net > 0 ? "+" : ""}{fmt(net)}</span></td></tr>; })}</tbody>
          </table></div>
          {wts.length > 1 && <p className="pd-note">Weight over the last {wts.length} entries: {wDelta > 0 ? "+" : ""}{wDelta.toFixed(1)} kg.</p>}
        </section>
      </div>

      <section className="pd-panel">
        <div className="pd-panel-h">
          <div className="pd-face-t"><span className="pd-ico"><Flower2 size={18} /></span><div><h3>Face care</h3><p>{todayFaceDone} of {todayFace.steps.length} steps today. SPF comes first in the morning.</p></div></div>
          <div className="pd-seg" role="group" aria-label="Face care month">{([1, 2] as const).map(m => <button key={m} className={shownFaceMonth === m ? "on" : ""} onClick={() => setFaceMonthSelection(m)}>Month {m}{currentFaceMonth === m ? " (now)" : ""}</button>)}</div>
        </div>
        <div className="pd-bar"><i style={{ width: `${todayFace.steps.length ? (todayFaceDone / todayFace.steps.length) * 100 : 0}%` }} /></div>
        <div className="pd-grid two inner">
          {[{ title: "Morning", steps: todayFace.morning }, { title: "Night", steps: todayFace.night }].map(({ title, steps }) => (
            <div key={title} className="pd-routine">
              <div className="pd-routine-h"><b>{title}</b><small>{steps.filter(s => faceDoneIds.includes(s.id)).length}/{steps.length}</small></div>
              {steps.map(s => { const done = faceDoneIds.includes(s.id); return <button key={s.id} className={`pd-row slim ${done ? "done" : ""}`} aria-pressed={done} disabled={shownFaceMonth !== currentFaceMonth} onClick={() => toggleFaceStep(s.id, today)}><span className="pd-row-t"><strong>{s.label}</strong></span><span className={`pd-check ${done ? "on" : ""}`}>{done && <Check size={12} />}</span></button>; })}
            </div>
          ))}
        </div>
        <button className="pd-btn ghost" onClick={() => setPage("Face Care")}>Full routine and monthly guide</button>
      </section>

      <div className="pd-grid two">
        {[{ title: "Upcoming plans", sub: "Next active reminders.", list: upcomingEvents, empty: "No upcoming plans.", past: false }, { title: "Recent past plans", sub: "Earlier plans still open.", list: recentPastEvents, empty: "Nothing left over from earlier days.", past: true }].map(b => (
          <section className="pd-panel" key={b.title}>
            <div className="pd-panel-h"><div><h3>{b.title}</h3><p>{b.sub}</p></div><button className="pd-link sm" onClick={() => setPage("Planner")}>Planner</button></div>
            {b.list.length ? b.list.map(e => <div className="pd-event" key={e.id}><span className={`pd-date-chip ${b.past ? "soft" : ""}`}><strong>{dateLabel(e.date, { day: "numeric" })}</strong><small>{dateLabel(e.date, { month: "short" })}</small></span><div><strong>{e.title}</strong><span><Clock3 size={12} /> {!b.past && eventDay(e.date) === today ? "Today" : dateLabel(e.date, { weekday: "short", day: "numeric", month: "short" })}, {e.time}</span></div></div>) : <p className="pd-empty">{b.empty}</p>}
          </section>
        ))}
      </div>

      <div className="pd-insight"><Activity size={18} /><p><strong>Your energy baseline.</strong> Mifflin&ndash;St Jeor estimates a {fmt(todayEnergy.sedentaryTdee)} kcal sedentary TDEE at {profile.weightKg.toFixed(1)} kg. Log food and exercise to see your daily balance.</p><button className="pd-link sm" onClick={() => setPage("Calorie Burn")}>Open</button></div>
    </div>
  );
}
