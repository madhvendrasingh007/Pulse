// FILE NAME : history.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { Apple, ArrowRight, Check, ChevronLeft, ChevronRight, Dumbbell, Flame, Weight, CalendarDays, Archive, FileDown } from "lucide-react";
import { calculateEnergy, type EnergyProfile } from "@/lib/calculations/energy";
import { SavedPageHistory } from "@/components/pages/history-snapshots";
import { type PlannerEvent } from "@/components/planner-manager";
import { localDay, eventDay, fmt, habitOnDate, habitDoneOnDate } from "@/lib/pulse/shared";
import type { Page, Food, Habit, WeightLog, WeeklyExercise, WorkoutHistoryEntry, WorkoutCompletionEntry, WorkoutWeekArchiveEntry, PageHistoryEntry } from "@/lib/pulse/shared";

type HistoryData={foods:Food[];habits:Habit[];weights:WeightLog[];weeklyWorkouts:Record<string,WeeklyExercise[]>;workoutHistory:WorkoutHistoryEntry[];workoutCompletions:WorkoutCompletionEntry[];workoutWeekHistory:WorkoutWeekArchiveEntry[];pageHistory:PageHistoryEntry[];exerciseBurns:Record<string,number>;events:PlannerEvent[]};
type ReportMode="day"|"month";

/* Cursor-follow glow used by cards (sets --mx / --my, the CSS draws the light) */
const spot=(event:ReactPointerEvent<HTMLElement>)=>{const box=event.currentTarget.getBoundingClientRect();event.currentTarget.style.setProperty("--mx",`${event.clientX-box.left}px`);event.currentTarget.style.setProperty("--my",`${event.clientY-box.top}px`)};

export function CalendarHistory({data,date,setDate,setPage,profile,activityFactor}:{data:HistoryData;date:string;setDate:(d:string)=>void;setPage:(p:Page)=>void;profile:EnergyProfile;activityFactor:number}){
  const [month,setMonth]=useState(()=>new Date(date+"T12:00:00"));
  const [printReq,setPrintReq]=useState<{mode:ReportMode;n:number}|null>(null);
  const year=month.getFullYear(),monthIndex=month.getMonth(),firstDay=new Date(year,monthIndex,1).getDay(),daysInMonth=new Date(year,monthIndex+1,0).getDate();
  const dates=Array.from({length:daysInMonth},(_,i)=>localDay(new Date(year,monthIndex,i+1,12)));
  const stepMonth=(amount:number)=>setMonth(current=>new Date(current.getFullYear(),current.getMonth()+amount,1));
  const logsByDate=useMemo(()=>{
    const result:Record<string,WorkoutCompletionEntry[]>={};
    for(const entry of data.workoutCompletions)(result[entry.date]??=[]).push(entry);
    for(const [key,items] of Object.entries(data.weeklyWorkouts))for(const item of items)for(const completedDate of item.completedDates??[]){
      if((result[completedDate]??[]).some(log=>log.workoutId===item.id))continue;
      (result[completedDate]??=[]).push({id:`legacy-${item.id}-${completedDate}`,workoutId:item.id,date:completedDate,name:item.name,focus:item.focus??"General",sets:item.sets,reps:item.reps,rest:item.rest,actualSets:[],completed:true,recordedAt:completedDate});
    }
    return result;
  },[data.workoutCompletions,data.weeklyWorkouts]);
  const recordDates=new Set<string>([...data.foods.map(f=>f.date.slice(0,10)),...Object.keys(data.exerciseBurns),...data.weights.map(w=>w.date.slice(0,10)),...data.events.map(e=>eventDay(e.date)),...data.habits.flatMap(h=>Object.keys(h.completions??{})),...Object.values(logsByDate).flat().map(entry=>entry.date),...data.workoutHistory.map(entry=>localDay(new Date(entry.savedAt))),...data.workoutWeekHistory.flatMap(entry=>entry.completions.map(log=>log.date)),...data.pageHistory.map(entry=>localDay(new Date(entry.savedAt)))]);
  const selectedFoods=data.foods.filter(f=>f.date.slice(0,10)===date),selectedHabits=data.habits.filter(h=>habitOnDate(h,date)),doneHabits=selectedHabits.filter(h=>habitDoneOnDate(h,date));
  const completedWorkouts=logsByDate[date]??[],selectedEvents=data.events.filter(e=>eventDay(e.date)===date),weight=data.weights.filter(w=>w.date.slice(0,10)===date).slice(-1)[0],exercise=data.exerciseBurns[date]??0;
  const totals=selectedFoods.reduce((sum,f)=>({calories:sum.calories+f.calories,protein:sum.protein+f.protein,carbs:sum.carbs+f.carbs,fats:sum.fats+f.fats}),{calories:0,protein:0,carbs:0,fats:0});
  const energy=calculateEnergy(profile,totals.calories,exercise,activityFactor);
  const workoutDetail=(day:string)=>{
    const done=data.habits.filter(h=>habitOnDate(h,day)&&habitDoneOnDate(h,day));
    const scheduled=data.habits.filter(h=>habitOnDate(h,day));
    const foods=data.foods.filter(f=>f.date.slice(0,10)===day);const calories=foods.reduce((sum,f)=>sum+f.calories,0);const burn=data.exerciseBurns[day]??0;
    const dailyEnergy=calculateEnergy(profile,calories,burn,activityFactor);const workouts=logsByDate[day]??[];
    return {done,scheduled,calories,burn,dailyEnergy,workouts};
  };
  const monthLabel=month.toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  const longDate=new Date(date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const isToday=date===localDay();
  const habitPct=selectedHabits.length?Math.round(doneHabits.length/selectedHabits.length*100):0;
  const stagger=(i:number)=>({"--i":i}) as CSSProperties;

  /* ---------- PDF reports (browser print dialog -> "Save as PDF") ---------- */
  const requestPrint=(mode:ReportMode)=>setPrintReq(current=>({mode,n:(current?.n??0)+1}));
  useEffect(()=>{
    if(!printReq)return;
    const previousTitle=document.title;
    document.title=printReq.mode==="day"?`Pulse-day-report-${date}`:`Pulse-month-report-${year}-${String(monthIndex+1).padStart(2,"0")}`;
    const restore=()=>{document.title=previousTitle;setPrintReq(null)};
    window.addEventListener("afterprint",restore,{once:true});
    const timer=window.setTimeout(()=>window.print(),80);
    return()=>{window.clearTimeout(timer);window.removeEventListener("afterprint",restore)};
  },[printReq]);

  const monthRows=printReq?.mode==="month"?dates.map(day=>{const detail=workoutDetail(day);const logged=data.weights.filter(w=>w.date.slice(0,10)===day).slice(-1)[0];return{day,...detail,weight:logged?.weight,events:data.events.filter(e=>eventDay(e.date)===day).length,active:recordDates.has(day)}}):[];
  const activeRows=monthRows.filter(row=>row.active);
  const pastRows=monthRows.filter(row=>row.day<=localDay());
  const monthHabitsDone=pastRows.reduce((sum,row)=>sum+row.done.length,0),monthHabitsPlanned=pastRows.reduce((sum,row)=>sum+row.scheduled.length,0);
  const foodRows=monthRows.filter(row=>row.calories>0);
  const monthAvgFood=foodRows.length?foodRows.reduce((sum,row)=>sum+row.calories,0)/foodRows.length:0;
  const monthBurnTotal=monthRows.reduce((sum,row)=>sum+row.burn,0);
  const monthWorkouts=monthRows.reduce((sum,row)=>sum+row.workouts.length,0);
  const monthWeights=data.weights.filter(w=>w.date.slice(0,7)===`${year}-${String(monthIndex+1).padStart(2,"0")}`).slice().sort((a,b)=>a.date.localeCompare(b.date));
  const weightChange=monthWeights.length>1?monthWeights[monthWeights.length-1].weight-monthWeights[0].weight:null;

  const dayReport=<>
    <h1>PULSE · Day report</h1>
    <p className="hs-pr-sub">{longDate}</p>
    <div className="hs-pr-stats">
      <div><small>Habits</small><b>{doneHabits.length} / {selectedHabits.length}</b></div>
      <div><small>Food</small><b>{fmt(totals.calories)} kcal</b></div>
      <div><small>Total burn</small><b>{fmt(energy.totalBurn)} kcal</b></div>
      <div><small>{energy.deficit>=0?"Deficit":"Surplus"}</small><b>{fmt(Math.abs(energy.deficit))} kcal</b></div>
      <div><small>Exercise</small><b>{fmt(exercise)} kcal</b></div>
      <div><small>Protein / Carbs / Fat</small><b>{fmt(totals.protein)} / {fmt(totals.carbs)} / {fmt(totals.fats)} g</b></div>
      <div><small>Weight</small><b>{weight?`${weight.weight.toFixed(1)} kg`:"—"}</b></div>
      <div><small>Workouts</small><b>{completedWorkouts.length}</b></div>
    </div>
    <h2>Habits</h2>
    {selectedHabits.length?<table><thead><tr><th>Habit</th><th>Status</th></tr></thead><tbody>{selectedHabits.map((h,index)=><tr key={h.id+"-"+index}><td>{h.title}</td><td>{habitDoneOnDate(h,date)?"Done":"Not done"}</td></tr>)}</tbody></table>:<p>No routine scheduled.</p>}
    <h2>Workouts</h2>
    {completedWorkouts.length?completedWorkouts.map(w=><article key={w.id}><b>{w.name}</b><span>{w.focus} · Planned {w.sets} × {w.reps}{w.rest?` · Rest ${w.rest}`:""} · {w.completed?"Completed":"In progress"}</span>{(w.actualSets??[]).length?<small>{w.actualSets!.map((set,index)=>`Set ${index+1}: ${set.reps||"—"} reps × ${set.weight||"—"} kg${set.done?" ✓":""}`).join("  ·  ")}</small>:<small>No set-by-set measurements saved.</small>}</article>):<p>No workout logged.</p>}
    <h2>Food</h2>
    {selectedFoods.length?<table><thead><tr><th>Item</th><th>Serving</th><th>kcal</th><th>P</th><th>C</th><th>F</th></tr></thead><tbody>{selectedFoods.map(f=><tr key={f.id}><td>{f.name}</td><td>{f.amount}</td><td>{fmt(f.calories)}</td><td>{fmt(f.protein)}g</td><td>{fmt(f.carbs)}g</td><td>{fmt(f.fats)}g</td></tr>)}<tr className="hs-pr-total"><td colSpan={2}>Total</td><td>{fmt(totals.calories)}</td><td>{fmt(totals.protein)}g</td><td>{fmt(totals.carbs)}g</td><td>{fmt(totals.fats)}g</td></tr></tbody></table>:<p>No food entries.</p>}
    <h2>Planner</h2>
    {selectedEvents.length?<table><thead><tr><th>Event</th><th>Time</th><th>Status</th></tr></thead><tbody>{selectedEvents.map(e=><tr key={e.id}><td>{e.title}</td><td>{e.time}</td><td>{e.completed?"Completed":"Planned"}</td></tr>)}</tbody></table>:<p>No planner events.</p>}
    <p className="hs-pr-foot">Generated {new Date().toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}. Energy figures are estimates.</p>
  </>;

  const monthReport=<>
    <h1>PULSE · Month report</h1>
    <p className="hs-pr-sub">{monthLabel}</p>
    <div className="hs-pr-stats">
      <div><small>Days with activity</small><b>{activeRows.length} / {daysInMonth}</b></div>
      <div><small>Habit completion</small><b>{monthHabitsPlanned?Math.round(monthHabitsDone/monthHabitsPlanned*100):0}%</b></div>
      <div><small>Workouts logged</small><b>{monthWorkouts}</b></div>
      <div><small>Avg food (logged days)</small><b>{fmt(monthAvgFood)} kcal</b></div>
      <div><small>Exercise burn</small><b>{fmt(monthBurnTotal)} kcal</b></div>
      <div><small>Weigh-ins</small><b>{monthWeights.length}</b></div>
      <div><small>Weight change</small><b>{weightChange===null?"—":`${weightChange>0?"+":""}${weightChange.toFixed(1)} kg`}</b></div>
      <div><small>Planner events</small><b>{monthRows.reduce((sum,row)=>sum+row.events,0)}</b></div>
    </div>
    <h2>Day by day</h2>
    {activeRows.length?<table className="hs-pr-month"><thead><tr><th>Date</th><th>Habits</th><th>Workouts</th><th>Food</th><th>Exercise</th><th>Burn</th><th>Balance</th><th>Weight</th></tr></thead><tbody>{activeRows.map(row=><tr key={row.day}><td>{new Date(row.day+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</td><td>{row.done.length}/{row.scheduled.length}</td><td>{row.workouts.length?row.workouts.map(w=>w.name).join(", "):"—"}</td><td>{row.calories?fmt(row.calories):"—"}</td><td>{row.burn?fmt(row.burn):"—"}</td><td>{fmt(row.dailyEnergy.totalBurn)}</td><td>{row.calories||row.burn?fmt(row.dailyEnergy.deficit):"—"}</td><td>{row.weight?row.weight.toFixed(1):"—"}</td></tr>)}</tbody></table>:<p>No saved activity in this month.</p>}
    <p className="hs-pr-foot">Calories in kcal; balance is total burn minus food (positive = deficit). Generated {new Date().toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}. Energy figures are estimates.</p>
  </>;

  /* ---------- Calendar ---------- */
  const monthNav=<div className="hs-month-nav"><button type="button" className="hs-icon-btn" aria-label="Previous month" onClick={()=>stepMonth(-1)}><ChevronLeft size={17}/></button><b>{monthLabel}</b><button type="button" className="hs-icon-btn" aria-label="Next month" onClick={()=>stepMonth(1)}><ChevronRight size={17}/></button></div>;
  const monthGrid=<><div className="hs-weekdays">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><span key={d}>{d}</span>)}</div><div className="hs-grid" key={`${year}-${monthIndex}`}>{Array.from({length:firstDay},(_,i)=><span className="hs-blank" key={`blank-${i}`}/>)}{dates.map((day,i)=>{
    const detail=workoutDetail(day);const hasRecord=recordDates.has(day);
    const workoutLines=detail.workouts.map(log=>`${log.name}: ${(log.actualSets??[]).length?log.actualSets!.map((set,index)=>`Set ${index+1} ${set.reps||"—"} reps × ${set.weight||"—"} kg`).join(", "):`${log.sets} × ${log.reps} (set measurements not saved)`}`).join("; ");
    const tooltip=`${day}\nHabits: ${detail.done.length}/${detail.scheduled.length} done${detail.done.length?` · ${detail.done.map(h=>h.title).join(", ")}`:""}\nWorkout: ${workoutLines||"No workout logged"}\nFood: ${fmt(detail.calories)} kcal\nExercise: ${fmt(detail.burn)} kcal\nTotal burn: ${fmt(detail.dailyEnergy.totalBurn)} kcal · Balance: ${fmt(detail.dailyEnergy.deficit)} kcal`;
    return <button type="button" key={day} title={tooltip} aria-label={tooltip.replaceAll("\n",", ")} aria-pressed={day===date} className={`hs-day ${day===date?"is-selected ":""}${hasRecord?"has-records ":""}${day===localDay()?"is-today":""}`} onClick={()=>setDate(day)}><span className="hs-day-num">{i+1}</span>{hasRecord&&<i/>}<span className="hs-tooltip"><b>{new Date(day+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</b><small><strong>Habits</strong> {detail.done.length}/{detail.scheduled.length}{detail.done.length?` · ${detail.done.map(h=>h.title).join(", ")}`:""}</small><small><strong>Workout</strong> {detail.workouts.length?detail.workouts.map(log=><span key={log.id}>{log.name}: {(log.actualSets??[]).length?log.actualSets!.map((set,index)=>`S${index+1} ${set.reps||"—"} × ${set.weight||"—"}kg`).join(" · "):`${log.sets} × ${log.reps} · details not saved`}</span>):"No workout logged"}</small><small><strong>Calories</strong> {fmt(detail.calories)} in · {fmt(detail.burn)} exercise · {fmt(detail.dailyEnergy.totalBurn)} total burn</small></span></button>;
  })}</div></>;

  return <div className="hs">
    {/* ===== Top: calendar + selected day ===== */}
    <div className="hs-top">
      <section className="hs-panel hs-calendar">
        <div className="hs-head"><div><h3>Activity calendar</h3><p>Dates with saved records are marked.</p></div></div>
        {monthNav}
        {monthGrid}
        <div className="hs-legend"><span><i className="is-dot"/> Has saved activity</span><span><i className="is-box"/> Selected date</span></div>
        <button type="button" className="hs-btn" onClick={()=>{setDate(localDay());setMonth(new Date(localDay()+"T12:00:00"))}}>Jump to today <ArrowRight size={14}/></button>
      </section>

      <div className="hs-day-col">
        <section className="hs-hero" key={`hero-${date}`}>
          <div className="hs-hero-top">
            <div className="hs-hero-copy">
              <span className="hs-kicker">{isToday?"Today · daily summary":"Daily summary"}</span>
              <h2>{longDate}</h2>
              <p>All your saved activity for this date, together.</p>
            </div>
            <div className="hs-hero-habits" role="img" aria-label={`${habitPct}% of habits done`}><b>{habitPct}<small>%</small></b><span>habits done</span></div>
          </div>
          <div className="hs-reports">
            <button type="button" className="hs-btn is-primary" onClick={()=>requestPrint("day")}><FileDown size={15}/> Day report PDF</button>
            <button type="button" className="hs-btn" onClick={()=>requestPrint("month")}><FileDown size={15}/> {monthLabel} PDF</button>
            <small>Opens the print dialog. Choose “Save as PDF” to download.</small>
          </div>
        </section>

        <div className="hs-summary" key={`sum-${date}`}>
          <article className="hs-card" style={stagger(0)} onPointerMove={spot}><span><i className="hs-ic lime"><Check size={15}/></i>Habits</span><b>{doneHabits.length}<small> / {selectedHabits.length}</small></b><p>{selectedHabits.length?habitPct+"% of routine complete":"No routine scheduled"}</p></article>
          <article className="hs-card" style={stagger(1)} onPointerMove={spot}><span><i className="hs-ic orange"><Apple size={15}/></i>Food</span><b>{fmt(totals.calories)}<small> kcal</small></b><p>{selectedFoods.length} entries · P {fmt(totals.protein)}g · C {fmt(totals.carbs)}g</p></article>
          <article className="hs-card" style={stagger(2)} onPointerMove={spot}><span><i className="hs-ic violet"><Flame size={15}/></i>Energy</span><b>{fmt(energy.totalBurn)}<small> kcal burn</small></b><p>{fmt(exercise)} kcal exercise · {fmt(energy.deficit)} balance</p></article>
          <article className="hs-card" style={stagger(3)} onPointerMove={spot}><span><i className="hs-ic blue"><Weight size={15}/></i>Weight</span><b>{weight?weight.weight.toFixed(1):"—"}<small>{weight?" kg":""}</small></b><p>{weight?"Weight record saved":"No weight record"}</p></article>
        </div>
      </div>
    </div>

    {/* ===== Day records ===== */}
    <div className="hs-duo">
      <section className="hs-panel" key={`hab-${date}`}>
        <div className="hs-head"><div><h3>Habits and workouts</h3><p>{doneHabits.length} completed of {selectedHabits.length} scheduled</p></div></div>
        <div className="hs-rows">
          {selectedHabits.map((h,index)=><div className="hs-row" style={stagger(index)} key={h.id+"-"+index}><span className={`hs-ic ${h.color}`}><Check size={15}/></span><b>{h.title}</b><span className={`hs-pill ${habitDoneOnDate(h,date)?"is-done":""}`}>{habitDoneOnDate(h,date)?"Done":"Not done"}</span></div>)}
          {completedWorkouts.map((w,index)=><article className="hs-workout" style={stagger(selectedHabits.length+index)} key={w.id}>
            <div className="hs-row"><span className="hs-ic violet"><Dumbbell size={15}/></span><b>{w.name}</b><span className={`hs-pill ${w.completed?"is-done":""}`}>{w.completed?"Completed":"In progress"}</span></div>
            <small>{w.focus} · Planned {w.sets} × {w.reps}{w.rest?` · Rest ${w.rest}`:""}</small>
            {(w.actualSets??[]).length?<div className="hs-sets">{w.actualSets!.map((set,index)=><span className={set.done?"is-done":""} key={`${w.id}-${index}`}>Set {index+1}: {set.reps||"—"} reps × {set.weight||"—"} kg {set.done?"✓":""}</span>)}</div>:<small className="hs-legacy">This older completion has no saved set-by-set measurements.</small>}
          </article>)}
        </div>
        {!selectedHabits.length&&!completedWorkouts.length&&<p className="hs-empty">No habit or workout records for this date.</p>}
      </section>

      <section className="hs-panel" key={`food-${date}`}>
        <div className="hs-head"><div><h3>Food and plans</h3><p>Meals and planner events for the selected date.</p></div></div>
        <div className="hs-rows">
          {selectedFoods.map((f,index)=><div className="hs-row" style={stagger(index)} key={f.id}><span className="hs-ic orange"><Apple size={15}/></span><b>{f.name}</b><span className="hs-meta">{fmt(f.calories)} kcal</span></div>)}
          {selectedEvents.map((e,index)=><div className="hs-row" style={stagger(selectedFoods.length+index)} key={e.id}><span className="hs-ic blue"><CalendarDays size={15}/></span><b>{e.title}</b><span className="hs-meta">{e.time} · {e.completed?"Completed":"Planned"}</span></div>)}
        </div>
        {!selectedFoods.length&&!selectedEvents.length&&<p className="hs-empty">No food entries or planner events for this date.</p>}
      </section>
    </div>

    {/* ===== Archives ===== */}
    <div className="hs-duo">
      <section className="hs-panel">
        <div className="hs-head"><div><h3><Archive size={16}/> Weekly workout archives</h3><p>{data.workoutWeekHistory.length} archived weeks · records remain after a reset.</p></div></div>
        {data.workoutWeekHistory.length?<div className="hs-snaps">{data.workoutWeekHistory.slice().sort((a,b)=>b.startDate.localeCompare(a.startDate)).map(week=><details className="hs-snap" key={week.id} onPointerMove={spot}><summary><span><b>{week.startDate} – {week.endDate}</b><small>Saved {new Date(week.savedAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</small></span><em>{week.completions.length} logged entries</em><ChevronRight className="hs-chevron" size={16}/></summary><div className="hs-snap-body">{week.completions.length?week.completions.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(log=><article className="hs-workout" key={log.id}><b>{new Date(log.date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"})} · {log.name}</b><small>{log.focus} · {log.completed?"Completed":"In progress"}</small><div className="hs-sets">{(log.actualSets??[]).map((set,index)=><span className={set.done?"is-done":""} key={`${log.id}-${index}`}>Set {index+1}: {set.reps||"—"} reps × {set.weight||"—"} kg {set.done?"✓":""}</span>)}</div></article>):<p className="hs-empty">No workout sets were logged in this week.</p>}</div></details>)}</div>:<p className="hs-empty">No completed week has been archived yet. The current week appears on the Workouts page.</p>}
      </section>

      <section className="hs-panel">
        <div className="hs-head"><div><h3><Archive size={16}/> Saved workout plans</h3><p>{data.workoutHistory.length} snapshots · saved versions remain here after weekly reset.</p></div></div>
        {data.workoutHistory.length?<div className="hs-snaps">{data.workoutHistory.map(entry=><details className="hs-snap" key={entry.id} onPointerMove={spot}><summary><span><b>{entry.label}</b><small>{new Date(entry.savedAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</small></span><em>{Object.values(entry.plan).reduce((sum,items)=>sum+items.length,0)} exercises</em><ChevronRight className="hs-chevron" size={16}/></summary><div className="hs-plan-days">{["mon","tue","wed","thu","fri","sat","sun"].map((key,index)=>{const list=entry.plan[key]??[];if(!list.length)return null;return <section key={key}><h4>{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][index]}</h4>{list.map(exercise=><div className="hs-plan-ex" key={exercise.id}><b>{exercise.name}</b><span>{exercise.focus??"General"} · {exercise.sets} × {exercise.reps}</span>{exercise.secondaryMuscles&&<small>Also works: {exercise.secondaryMuscles}</small>}</div>)}</section>})}</div></details>)}</div>:<p className="hs-empty">No saved workout plans yet. Use “Save to history” on the Workouts page to keep a version.</p>}
      </section>
    </div>

    <div className="hs-saved"><SavedPageHistory entries={data.pageHistory}/></div>

    <div className="hs-actions"><button type="button" className="hs-btn" onClick={()=>setPage("Nutrition")}>Open food log</button><button type="button" className="hs-btn" onClick={()=>setPage("Calorie Burn")}>Open calorie burn</button><button type="button" className="hs-btn" onClick={()=>setPage("Planner")}>Open planner</button></div>

    {/* ===== Print-only report (hidden on screen) ===== */}
    {printReq&&<section className="hs-print-report" aria-hidden="true">{printReq.mode==="day"?dayReport:monthReport}</section>}
  </div>;
}