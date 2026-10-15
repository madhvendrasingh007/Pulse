"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { ArrowRight, Check, ChevronDown, Dumbbell, Pencil, Plus, X, Trash2, Archive, RotateCcw } from "lucide-react";






import { dayNames, weekKeys, localDay } from "@/lib/pulse/shared";
import type { WeeklyExercise, WorkoutHistoryEntry, WorkoutCompletionEntry, WorkoutWeekArchiveEntry } from "@/lib/pulse/shared";
import { Empty } from "@/components/ui/empty-state";

const MUSCLE_GROUPS=["General","Chest","Upper chest","Mid-back","Lats","Shoulders","Front delts","Side delts","Rear delts","Upper back","Traps","Arms","Biceps","Brachialis","Forearms","Triceps","Quads","Hamstrings","Glutes","Calves","Abs","Core","Lower back","Hip flexors","Cardio","Full body","Push","Pull"];
type PlannedMove={session:string;name:string;sets:number;reps:string;rest:string;focus:string;secondary:string;notes?:string};
const WORKOUT_SESSIONS:Record<string,string>={mon:"Push",tue:"Pull",wed:"Treadmill Cardio",thu:"Upper Power + Arms",fri:"Legs A (Quad Focus)",sat:"Legs B + Shoulders + Abs",sun:"Rest / Long Walk"};
const MAPPED_EXERCISES:Record<string,PlannedMove[]>={
  mon:[
    {session:"Push",name:"Incline DB Press",sets:4,reps:"8–10",rest:"2–3 min",focus:"Chest",secondary:"Front delts, triceps"},
    {session:"Push",name:"Flat Machine/Barbell Chest Press",sets:4,reps:"8–10",rest:"2–3 min",focus:"Chest",secondary:"Front delts, triceps"},
    {session:"Push",name:"Cable Chest Fly (low to high)",sets:3,reps:"12–15",rest:"60–90 sec",focus:"Chest",secondary:"Front delts"},
    {session:"Push",name:"Seated DB Shoulder Press",sets:3,reps:"8–10",rest:"2 min",focus:"Front delts",secondary:"Side delts, triceps"},
    {session:"Push",name:"DB Lateral Raise",sets:4,reps:"12–15",rest:"60 sec",focus:"Side delts",secondary:"Upper back"},
    {session:"Push",name:"Overhead Rope Extension",sets:3,reps:"10–12",rest:"60–90 sec",focus:"Triceps",secondary:""},
    {session:"Push",name:"Tricep Pushdown",sets:3,reps:"12–15",rest:"60 sec",focus:"Triceps",secondary:""},
  ],
  tue:[
    {session:"Pull",name:"Lat Pulldown (wide grip)",sets:4,reps:"8–10",rest:"2 min",focus:"Lats",secondary:"Biceps, upper back"},
    {session:"Pull",name:"Chest-Supported Row",sets:4,reps:"8–10",rest:"2 min",focus:"Upper back",secondary:"Lats, rear delts, biceps"},
    {session:"Pull",name:"Seated Cable Row",sets:3,reps:"10–12",rest:"90 sec",focus:"Upper back",secondary:"Lats, biceps, rear delts"},
    {session:"Pull",name:"Straight-Arm Pulldown",sets:3,reps:"12–15",rest:"60–90 sec",focus:"Lats",secondary:"Triceps"},
    {session:"Pull",name:"Rear Delt Fly",sets:3,reps:"12–15",rest:"60 sec",focus:"Rear delts",secondary:"Upper back"},
    {session:"Pull",name:"Barbell/EZ Bar Curl",sets:3,reps:"8–10",rest:"90 sec",focus:"Biceps",secondary:"Forearms"},
    {session:"Pull",name:"Hammer Curl",sets:3,reps:"10–12",rest:"60 sec",focus:"Biceps",secondary:"Forearms"},
  ],
  wed:[{session:"Treadmill Cardio",name:"Treadmill interval session",sets:0,reps:"About 40 min",rest:"—",focus:"Cardio",secondary:"Quads, glutes, calves",notes:"5 min easy warm-up · 6 rounds of 2 min hard at 8–10% incline and 2 min easy · 5–10 min cool-down."}],
  thu:[
    {session:"Upper Power + Arms",name:"Flat DB Press",sets:4,reps:"6–8",rest:"2–3 min",focus:"Chest",secondary:"Front delts, triceps"},
    {session:"Upper Power + Arms",name:"Pull-ups / Neutral-Grip Pulldown",sets:4,reps:"6–10",rest:"2–3 min",focus:"Lats",secondary:"Biceps, upper back"},
    {session:"Upper Power + Arms",name:"One-Arm DB Row",sets:3,reps:"10–12",rest:"90 sec",focus:"Upper back",secondary:"Lats, biceps, rear delts"},
    {session:"Upper Power + Arms",name:"Face Pull",sets:3,reps:"12–15",rest:"60 sec",focus:"Rear delts",secondary:"Upper back"},
    {session:"Upper Power + Arms",name:"Machine Shoulder Press",sets:3,reps:"8–10",rest:"2 min",focus:"Front delts",secondary:"Side delts, triceps"},
    {session:"Upper Power + Arms",name:"Incline DB Curl",sets:3,reps:"10–12",rest:"60–90 sec",focus:"Biceps",secondary:"Forearms"},
    {session:"Upper Power + Arms",name:"Skull Crushers",sets:3,reps:"10–12",rest:"90 sec",focus:"Triceps",secondary:""},
    {session:"Upper Power + Arms",name:"Cable Bicep Curl",sets:3,reps:"12–15",rest:"60 sec",focus:"Biceps",secondary:"Forearms"},
    {session:"Upper Power + Arms",name:"Machine Dip / Close-Grip Pushdown",sets:3,reps:"8–10",rest:"90 sec",focus:"Triceps",secondary:"Chest, front delts"},
  ],
  fri:[
    {session:"Legs A (Quad Focus)",name:"Back or Hack Squat",sets:4,reps:"6–8",rest:"2–3 min",focus:"Quads",secondary:"Glutes, abs, lower back"},
    {session:"Legs A (Quad Focus)",name:"Leg Press",sets:4,reps:"10–12",rest:"2 min",focus:"Quads",secondary:"Glutes"},
    {session:"Legs A (Quad Focus)",name:"Bulgarian Split Squat (per leg)",sets:3,reps:"10",rest:"90 sec",focus:"Quads",secondary:"Glutes"},
    {session:"Legs A (Quad Focus)",name:"Leg Extension",sets:3,reps:"12–15",rest:"60 sec",focus:"Quads",secondary:""},
    {session:"Legs A (Quad Focus)",name:"Hip Thrust / Glute Bridge",sets:3,reps:"10–12",rest:"90 sec",focus:"Glutes",secondary:"Hamstrings, quads"},
    {session:"Legs A (Quad Focus)",name:"Lying/Seated Hamstring Curl",sets:3,reps:"10–12",rest:"90 sec",focus:"Hamstrings",secondary:"Calves"},
    {session:"Legs A (Quad Focus)",name:"Standing Calf Raise",sets:4,reps:"12–15",rest:"60 sec",focus:"Calves",secondary:""},
    {session:"Legs A (Quad Focus)",name:"Hanging Leg Raise",sets:3,reps:"12",rest:"60 sec",focus:"Abs",secondary:"Forearms"},
  ],
  sat:[
    {session:"Legs B + Shoulders + Abs",name:"Romanian Deadlift",sets:4,reps:"8–10",rest:"2–3 min",focus:"Hamstrings",secondary:"Glutes, lower back, forearms"},
    {session:"Legs B + Shoulders + Abs",name:"Front or Hack Squat",sets:3,reps:"8",rest:"2 min",focus:"Quads",secondary:"Glutes, abs"},
    {session:"Legs B + Shoulders + Abs",name:"Hamstring Curl",sets:3,reps:"10–12",rest:"90 sec",focus:"Hamstrings",secondary:"Calves"},
    {session:"Legs B + Shoulders + Abs",name:"Walking Lunges (per leg)",sets:3,reps:"12",rest:"90 sec",focus:"Glutes",secondary:"Quads, hamstrings"},
    {session:"Legs B + Shoulders + Abs",name:"Seated Calf Raise",sets:4,reps:"15",rest:"60 sec",focus:"Calves",secondary:""},
    {session:"Legs B + Shoulders + Abs",name:"DB Shoulder Press",sets:4,reps:"8–10",rest:"2 min",focus:"Front delts",secondary:"Side delts, triceps"},
    {session:"Legs B + Shoulders + Abs",name:"Lateral Raise",sets:4,reps:"12–15",rest:"60 sec",focus:"Side delts",secondary:"Upper back"},
    {session:"Legs B + Shoulders + Abs",name:"Cable Crunch",sets:3,reps:"15",rest:"60 sec",focus:"Abs",secondary:""},
    {session:"Legs B + Shoulders + Abs",name:"Plank",sets:3,reps:"45–60 sec",rest:"60 sec",focus:"Abs",secondary:"Front delts, glutes"},
  ],
};
const CARDIO_MUSCLE_MAP=[{name:"Incline walk",muscles:"Glutes, hamstrings, calves; heart and lungs"},{name:"Rowing machine",muscles:"Back, legs, arms; full-body endurance"},{name:"Stationary bike",muscles:"Quads, glutes, calves; low impact"},{name:"Cross-trainer",muscles:"Legs and arms; low-impact full body"},{name:"Battle ropes / ski erg",muscles:"Shoulders, back, core, arms"},{name:"Jump rope",muscles:"Calves, shoulders, coordination"}];
const MUSCLE_VOLUME=[{muscle:"Chest",direct:15,indirect:3,days:2},{muscle:"Lats",direct:11,indirect:10,days:2},{muscle:"Upper back",direct:10,indirect:22,days:2},{muscle:"Front delts",direct:10,indirect:21,days:3},{muscle:"Side delts",direct:8,indirect:10,days:2},{muscle:"Rear delts",direct:6,indirect:10,days:2},{muscle:"Biceps",direct:12,indirect:18,days:2},{muscle:"Triceps",direct:12,indirect:25,days:2},{muscle:"Forearms",direct:0,indirect:19,days:0},{muscle:"Quads",direct:17,indirect:6,days:2},{muscle:"Hamstrings",direct:10,indirect:6,days:2},{muscle:"Glutes",direct:6,indirect:21,days:2},{muscle:"Calves",direct:8,indirect:6,days:2},{muscle:"Abs",direct:9,indirect:7,days:2},{muscle:"Lower back",direct:0,indirect:8,days:0}];
const TRAINING_RULES=["Warm up with 5 min easy cardio and 1–2 light ramp-up sets before your first lift.","Keep most sets 1–2 reps short of failure; the last isolation set may go to failure, with one drop set at about 25% lighter.","For the first 1–2 heavy compound lifts, do one heavy top set followed by back-off sets about 10% lighter.","When every set reaches the top of its rep range, add the smallest available weight jump next time.","Take a deload week every 6–8 weeks by reducing working sets about 40%.","If you miss a workout, skip it instead of doubling up. Priority: Legs A → Pull → Push → Upper → Legs B.","Aim for 8,000–10,000 steps daily, including rest days."];
const wkHue=(s:string)=>[...s].reduce((a,c)=>a+c.charCodeAt(0)*7,0)%360;
const wkChip=(s:string)=>({"--c":`hsl(${wkHue(s)} 70% 62%)`}) as React.CSSProperties;
const wkIsImg=(u:string)=>/\.(gif|png|jpe?g|webp)(\?.*)?$/i.test(u);
const wkIsVideo=(u:string)=>/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(u);
const wkRows=(x:WeeklyExercise)=>Array.from({length:Math.max(x.sets,x.actualSets.length)},(_,i)=>x.actualSets[i]??{reps:"",weight:""} as {reps:string;weight:string;done?:boolean});
const mondayKey=(key:string)=>{const d=new Date(`${key}T12:00:00`);d.setDate(d.getDate()-((d.getDay()+6)%7));return localDay(d)};
const shiftDate=(key:string,days:number)=>{const d=new Date(`${key}T12:00:00`);d.setDate(d.getDate()+days);return localDay(d)};

export function WeeklyWorkoutPlanner({addRequest,plans,plansReady,setPlans,history,setHistory,completions,weekHistory,setWeekHistory,onComplete,onProgress}:{addRequest:number;plans:Record<string,WeeklyExercise[]>;plansReady:boolean;setPlans:React.Dispatch<React.SetStateAction<Record<string,WeeklyExercise[]>>>;history:WorkoutHistoryEntry[];setHistory:React.Dispatch<React.SetStateAction<WorkoutHistoryEntry[]>>;completions:WorkoutCompletionEntry[];weekHistory:WorkoutWeekArchiveEntry[];setWeekHistory:React.Dispatch<React.SetStateAction<WorkoutWeekArchiveEntry[]>>;onComplete:(exercise:WeeklyExercise,date:string)=>void;onProgress:(exercise:WeeklyExercise,date:string)=>void}){
  const todayKey=weekKeys[new Date().getDay()];
  const workoutDays=["mon","tue","wed","thu","fri","sat","sun"] as const;
  const [day,setDay]=useState<string>(todayKey);
  const [dialog,setDialog]=useState(false);
  const [editing,setEditing]=useState<string|null>(null);
  const [customMode,setCustomMode]=useState(false);
  const empty={name:"",sets:3,reps:"8–12",rest:"",notes:"",mediaUrl:"",focus:"Chest",secondary:""};
  const [draft,setDraft]=useState(empty);
  const [hiddenDemo,setHiddenDemo]=useState<Record<string,boolean>>({});
  const [zoom,setZoom]=useState<{url:string;name:string}|null>(null);
  const [selectedWeek,setSelectedWeek]=useState("");
  const items=plans[day]??[];
  const dayIndex=weekKeys.indexOf(day as typeof weekKeys[number]);
  const isToday=day===todayKey;
  const today=localDay();
  const openNew=()=>{setEditing(null);setDraft(empty);setCustomMode(false);setDialog(true)};
  useEffect(()=>{if(addRequest>0)openNew()},[addRequest]);
  const openEdit=(item:WeeklyExercise)=>{const focus=item.focus??"General";setEditing(item.id);setDraft({name:item.name,sets:item.sets,reps:item.reps,rest:item.rest??"",notes:item.notes??"",mediaUrl:item.mediaUrl,focus,secondary:item.secondaryMuscles??""});setCustomMode(!MUSCLE_GROUPS.includes(focus));setDialog(true)};
  const save=()=>{
    if(!draft.name.trim())return;
    const old=items.find(x=>x.id===editing);
    const sets=Math.max(1,Math.min(20,Number(draft.sets)||1));
    const actualSets=[...(old?.actualSets??[])];
    while(actualSets.length<sets)actualSets.push({reps:"",weight:""});
    const entry:WeeklyExercise={id:editing??crypto.randomUUID(),name:draft.name.trim(),sets,reps:draft.reps.trim()||"8–12",rest:draft.rest.trim(),notes:draft.notes.trim(),mediaUrl:draft.mediaUrl.trim(),focus:draft.focus.trim()||"General",secondaryMuscles:draft.secondary.trim(),actualSets,completedDates:old?.completedDates??[]};
    setPlans(all=>({...all,[day]:editing?(all[day]??[]).map(x=>x.id===editing?entry:x):[...(all[day]??[]),entry]}));
    setDialog(false);
  };
  const patch=(id:string,fn:(x:WeeklyExercise)=>WeeklyExercise)=>setPlans(all=>({...all,[day]:(all[day]??[]).map(x=>x.id===id?fn(x):x)}));
  const updateSet=(item:WeeklyExercise,i:number,change:Partial<{reps:string;weight:string;done:boolean}>)=>{const list=wkRows(item);list[i]={...list[i],...change};const updated={...item,actualSets:list};patch(item.id,()=>updated);onProgress(updated,today)};
  const addSet=(item:WeeklyExercise)=>{const list=wkRows(item);const last=list[list.length-1];const updated={...item,actualSets:[...list,{reps:last?.reps??"",weight:last?.weight??"",done:false}]};patch(item.id,()=>updated);onProgress(updated,today)};
  const removeSet=(item:WeeklyExercise,i:number)=>{const updated={...item,actualSets:wkRows(item).filter((_,idx)=>idx!==i)};patch(item.id,()=>updated);onProgress(updated,today)};
  const remove=(id:string)=>setPlans(all=>({...all,[day]:(all[day]??[]).filter(x=>x.id!==id)}));
  const mappedForDay=MAPPED_EXERCISES[day]??[];
  const missingMapped=mappedForDay.filter(suggestion=>!items.some(item=>item.name.trim().toLowerCase()===suggestion.name.toLowerCase()));
  const addMappedDay=()=>{if(!missingMapped.length)return;const mapped:WeeklyExercise[]=missingMapped.map(suggestion=>({id:crypto.randomUUID(),name:suggestion.name,sets:suggestion.sets,reps:suggestion.reps,rest:suggestion.rest,notes:suggestion.notes,mediaUrl:"",focus:suggestion.focus,secondaryMuscles:suggestion.secondary,actualSets:Array.from({length:suggestion.sets},()=>({reps:"",weight:""})),completedDates:[]}));setPlans(all=>({...all,[day]:[...(all[day]??[]),...mapped]}))};
  const toggleComplete=(item:WeeklyExercise)=>{if(!isToday)return;const wasDone=item.completedDates?.includes(today)??false;const actualSets=wkRows(item).map(set=>({...set,done:!wasDone}));const updated={...item,actualSets,completedDates:wasDone?item.completedDates?.filter(d=>d!==today):[...(item.completedDates??[]),today]};if(!wasDone)onComplete({...updated,actualSets},today);patch(item.id,()=>updated)};

  const allRows=items.flatMap(wkRows);
  const setsDone=allRows.filter(s=>s.done).length;
  const volume=allRows.filter(s=>s.done).reduce((a,s)=>a+(Number(s.reps)||0)*(Number(s.weight)||0),0);
  const focusList=[...new Set(items.map(i=>i.focus??"General"))];
  const exercisesDone=items.filter(x=>x.completedDates?.includes(today)).length;
  const hasPlan=Object.values(plans).some(dayItems=>dayItems.length>0);
  const buildWorkbookPlan=()=>Object.fromEntries(Object.entries(MAPPED_EXERCISES).map(([key,moves])=>[key,moves.map(move=>({id:crypto.randomUUID(),name:move.name,sets:move.sets,reps:move.reps,rest:move.rest,notes:move.notes,mediaUrl:"",focus:move.focus,secondaryMuscles:move.secondary,actualSets:Array.from({length:move.sets},()=>({reps:"",weight:""})),completedDates:[]}))])) as Record<string,WeeklyExercise[]>;
  const saveSnapshot=(label?:string)=>{
    if(!hasPlan)return;
    const savedAt=new Date().toISOString();
    const suggested=`Workout plan · ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}`;
    setHistory(all=>[{id:crypto.randomUUID(),savedAt,label:label?.trim()||suggested,plan:JSON.parse(JSON.stringify(plans)) as Record<string,WeeklyExercise[]>},...all]);
  };
  useEffect(()=>{if(!plansReady)return;const source="gym-plan-6-day-v1";if(localStorage.getItem("pulse-workout-template")===source)return;if(hasPlan)saveSnapshot("Previous workout plan archived before applying Gym Plan · "+new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}));setPlans(buildWorkbookPlan());localStorage.setItem("pulse-workout-template",source);window.dispatchEvent(new Event("pulse-local-write"))},[plansReady]);
  useEffect(()=>{if(!plansReady||localStorage.getItem("pulse-workout-template")!=="gym-plan-6-day-v1")return;const current=mondayKey(today);const active=localStorage.getItem("pulse-active-workout-week");if(!active){localStorage.setItem("pulse-active-workout-week",current);return}if(active>=current)return;const archiveEntries:WorkoutWeekArchiveEntry[]=[];for(let start=active;start<current;start=shiftDate(start,7)){const end=shiftDate(start,6);archiveEntries.push({id:`week-${start}`,startDate:start,endDate:end,savedAt:new Date().toISOString(),plan:JSON.parse(JSON.stringify(plans)) as Record<string,WeeklyExercise[]>,completions:completions.filter(entry=>entry.date>=start&&entry.date<=end)})}setWeekHistory(existing=>[...archiveEntries.filter(entry=>!existing.some(saved=>saved.startDate===entry.startDate)),...existing].sort((a,b)=>b.startDate.localeCompare(a.startDate)));setPlans(existing=>Object.fromEntries(Object.entries(existing).map(([key,items])=>[key,items.map(item=>({...item,actualSets:item.actualSets.map(set=>({reps:"",weight:"",done:false}))}))])));localStorage.setItem("pulse-active-workout-week",current);window.dispatchEvent(new Event("pulse-local-write"))},[plansReady,today]);
  const savePlan=()=>{const label=window.prompt("Name this workout snapshot (optional):","");if(label===null)return;saveSnapshot(label);};
  const resetPlan=()=>{if(!hasPlan){setPlans({});return;}if(!window.confirm("Save this workout plan to History, then reset the weekly plan?"))return;saveSnapshot("Weekly plan archived before reset · "+new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}));setPlans({});};
  const applyWorkbookPlan=()=>{if(hasPlan&&!window.confirm("Save your current plan to History and replace it with the 6-day plan from Gym_Plan_6_Day.xlsx?"))return;if(hasPlan)saveSnapshot("Plan archived before applying 6-day gym plan · "+new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}));setPlans(buildWorkbookPlan())};
  const thisWeekStart=mondayKey(today);const thisWeekEnd=shiftDate(thisWeekStart,6);const chosenArchive=weekHistory.find(entry=>entry.id===selectedWeek);const reportStart=chosenArchive?.startDate??thisWeekStart;const reportEnd=chosenArchive?.endDate??thisWeekEnd;const reportPlan=chosenArchive?.plan??plans;const reportLogs=chosenArchive?.completions??completions.filter(entry=>entry.date>=reportStart&&entry.date<=reportEnd);
  const downloadWeekPdf=()=>{document.title=`Pulse-workout-${reportStart}`;window.print();window.setTimeout(()=>{document.title="PULSE"},1000)};

  return <div className="wk">
    <section className="panel wk-week">
      <div className="wk-week-head"><div><span className="eyebrow">WEEKLY SPLIT</span><h3>Pick a day</h3></div><span className="demo-tag">6 TRAINING DAYS · 134 WORKING SETS</span></div>
      <div className="wk-tabs" role="tablist">{workoutDays.map(key=>{const i=weekKeys.indexOf(key);const list=plans[key]??[];const first=list[0]?.focus;return <button key={key} role="tab" aria-selected={day===key} aria-label={dayNames[i]} className={`wk-tab ${day===key?"selected":""} ${key===todayKey?"is-today":""}`} onClick={()=>setDay(key)}><b>{dayNames[i].slice(0,3)}</b><span>{list.length?`${list.length} ex`:"Rest"}</span>{first?<i style={wkChip(first)}/>:<i className="empty"/>}{key===todayKey&&<em>TODAY</em>}</button>})}</div>
      <div className="wk-archive-actions"><div><b>{history.length} saved {history.length===1?"snapshot":"snapshots"}</b><small>Save a version before making a new weekly plan.</small></div><div><button type="button" className="secondary-btn" onClick={applyWorkbookPlan}><RotateCcw size={14}/> Apply 6-day plan</button><button type="button" className="secondary-btn" onClick={savePlan} disabled={!hasPlan}><Archive size={14}/> Save to history</button><button type="button" className="secondary-btn danger" onClick={resetPlan}><RotateCcw size={14}/> Reset plan</button></div></div>
      <div className="wk-week-history"><label>Past/current week<select value={selectedWeek} onChange={event=>setSelectedWeek(event.target.value)}><option value="">Current week · {thisWeekStart} to {thisWeekEnd}</option>{weekHistory.map(entry=><option value={entry.id} key={entry.id}>{entry.startDate} – {entry.endDate}</option>)}</select></label><button type="button" className="secondary-btn" onClick={downloadWeekPdf}>Download week PDF</button><small>Print dialog opens; choose “Save as PDF” to download a file.</small></div>
    </section>

    <section className="wk-print-report" aria-hidden="true"><h1>PULSE · Workout week</h1><p>{reportStart} to {reportEnd}{chosenArchive?" · Archived":" · Current week"}</p><p>Weekly target: 6 sessions · 134 working sets · Sunday recovery.</p>{["mon","tue","wed","thu","fri","sat","sun"].map(key=>{const dayEntries=reportPlan[key]??[];if(!dayEntries.length)return null;const weekday=weekKeys.indexOf(key as typeof weekKeys[number]);return <section key={key}><h2>{dayNames[weekday]} · {WORKOUT_SESSIONS[key]}</h2>{dayEntries.map(item=>{const logs=reportLogs.filter(entry=>entry.workoutId===item.id&&entry.date>=reportStart&&entry.date<=reportEnd);return <article key={item.id}><b>{item.name}</b><span>{item.focus??"General"} · {item.sets>0?`${item.sets} sets × `:""}{item.reps}{item.rest?` · Rest ${item.rest}`:""}</span>{item.notes&&<small>{item.notes}</small>}{logs.length?logs.map(log=><div key={log.id}>{log.date} · {log.completed?"Completed":"In progress"} · {(log.actualSets??[]).map((set,i)=>`Set ${i+1}: ${set.reps||"—"} reps × ${set.weight||"—"} kg${set.done?" ✓":""}`).join("; ")}</div>):<small>Not logged this week</small>}</article>})}</section>})}</section>

    <section className="panel wk-day">
      <div className="wk-day-head">
        <div className="wk-day-title"><span className="eyebrow">{isToday?"TODAY · ":""}{dayNames[dayIndex].toUpperCase()}</span><h2>{dayNames[dayIndex]}</h2><span className="wk-session-pill">{WORKOUT_SESSIONS[day]}</span><div className="wk-tags">{focusList.length?focusList.map(f=><span className="wk-chip" style={wkChip(f)} key={f}>{f}</span>):<span className="wk-chip muted">No muscle focus yet</span>}</div></div>
        <div className="wk-day-actions">{mappedForDay.length>0&&<button className="secondary-btn wk-map-add" title="Adds mapped exercises that are not already in this day plan" onClick={addMappedDay} disabled={!missingMapped.length}><Plus size={14}/>{missingMapped.length?`Add ${mappedForDay[0].session} map (${missingMapped.length})`:"Map added"}</button>}<button className="primary-btn" onClick={openNew}><Plus size={16}/> Add exercise</button></div>
      </div>
      {items.length>0&&<div className="wk-stats"><div><small>EXERCISES</small><b>{items.length}</b></div><div><small>SETS DONE</small><b>{setsDone}<span>/{allRows.length}</span></b></div><div><small>VOLUME</small><b>{Math.round(volume).toLocaleString()}<span> kg</span></b></div><div><small>COMPLETED{isToday?"":" (TODAY ONLY)"}</small><b>{isToday?exercisesDone:0}<span>/{items.length}</span></b></div></div>}
      {items.length===0?<Empty message={`${day==="sun"?"Recovery day · optional easy long walk. Keep up your daily steps.":`Add exercises for ${dayNames[dayIndex]}. They stay in your weekly template.`}`} icon={Dumbbell}/>:<div className="wk-list">{items.map((item,index)=>{
        const rows=wkRows(item);const done=rows.filter(s=>s.done).length;const focus=item.focus??"General";const isDone=item.completedDates?.includes(today);const hasImg=wkIsImg(item.mediaUrl);const demoHidden=hiddenDemo[item.id];
        return <article className={`wk-card ${isDone?"is-done":""} ${item.mediaUrl?"has-media":""}`} key={item.id}>
          <header className="wk-card-head">
            <span className="wk-num">{index+1}</span>
            <div className="wk-title"><h4>{item.name}</h4><div className="wk-meta"><span className="wk-chip" style={wkChip(focus)}>{focus}</span><span className="wk-target">{item.sets>0?<><b>{item.sets}</b> sets × </>:null}<b>{item.reps}</b>{item.focus==="Cardio"?"":" reps"}{item.rest&&item.rest!=="—"&&<> · Rest <b>{item.rest}</b></>}</span></div>{item.secondaryMuscles&&<small className="wk-secondary">Also works: {item.secondaryMuscles}</small>}{item.notes&&<small className="wk-exercise-note">{item.notes}</small>}</div>
            <div className="wk-icons"><button className="wk-icon" aria-label={`Edit ${item.name}`} onClick={()=>openEdit(item)}><Pencil size={16}/></button><button className="wk-icon danger" aria-label={`Remove ${item.name}`} onClick={()=>remove(item.id)}><Trash2 size={16}/></button></div>
          </header>
          {rows.length>0&&<div className="wk-progress"><div className="bar-track"><div className="bar-fill lime-fill" style={{width:`${Math.min(100,done/Math.max(1,rows.length)*100)}%`}}/></div><small>{done}/{rows.length} sets done</small></div>}
          {item.mediaUrl&&(hasImg?<div className="wk-demo-block"><button type="button" className="wk-demo-toggle" onClick={()=>setHiddenDemo(s=>({...s,[item.id]:!s[item.id]}))}>{demoHidden?"Show demo":"Hide demo"} <ChevronDown size={14} style={{transform:demoHidden?"none":"rotate(180deg)"}}/></button>{!demoHidden&&<button type="button" className="wk-demo" onClick={()=>setZoom({url:item.mediaUrl,name:item.name})} aria-label={`Enlarge ${item.name} demo`}><img src={item.mediaUrl} alt={`${item.name} demo`} loading="lazy"/><span>Tap to enlarge</span></button>}</div>:wkIsVideo(item.mediaUrl)?<div className="wk-demo-block"><video className="wk-video" src={item.mediaUrl} controls playsInline preload="metadata" aria-label={`${item.name} exercise demo`}/></div>:<a href={item.mediaUrl} target="_blank" rel="noreferrer" className="wk-guide-link"><ArrowRight size={15}/> Open exercise guide</a>)}
          <div className="wk-sets">
            <div className="wk-set-head"><span>SET</span><span>REPS</span><span>KG</span><span>DONE</span></div>
            {rows.map((s,i)=>{const extra=i>=item.sets;return <div className={`wk-set ${s.done?"is-done":""}`} key={i}><span className="wk-set-n">{i+1}{extra&&<em>Extra</em>}</span><input aria-label={`${item.name} set ${i+1} reps`} inputMode="numeric" type="number" min="0" placeholder={item.reps} value={s.reps} onChange={e=>updateSet(item,i,{reps:e.target.value})}/><input aria-label={`${item.name} set ${i+1} weight`} inputMode="decimal" type="number" min="0" step="0.5" placeholder="0" value={s.weight} onChange={e=>updateSet(item,i,{weight:e.target.value})}/><div className="wk-set-end"><button type="button" aria-pressed={!!s.done} aria-label={`Mark set ${i+1} done`} className={`check-circle ${s.done?"checked":""}`} onClick={()=>updateSet(item,i,{done:!s.done})}>{s.done&&<Check size={14}/>}</button>{extra&&<button type="button" className="wk-icon danger sm" aria-label={`Remove set ${i+1}`} onClick={()=>removeSet(item,i)}><X size={14}/></button>}</div></div>})}
          </div>
          <footer className="wk-card-foot"><button className="secondary-btn" onClick={()=>addSet(item)}><Plus size={14}/> Add set</button><button className={`secondary-btn workout-completion ${isDone?"is-complete":""}`} disabled={!isToday} onClick={()=>toggleComplete(item)}>{isDone?<><Check size={14}/> Completed</>:isToday?"Mark exercise complete":"Open on this day to complete"}</button></footer>
        </article>})}</div>}
      <details className="wk-map-reference"><summary>Program guide · training rules, muscle volume and progress log</summary><div className="wk-reference-grid"><section><h3>Training rules</h3>{TRAINING_RULES.map((rule,index)=><div className="wk-reference-row" key={rule}><b>{index+1}. {rule}</b></div>)}<div className="wk-reference-row"><b>Weekly nutrition guide</b><small>Starting point: about 2,200–2,400 kcal and 150–170 g protein daily. Adjust after two weeks using your weekly average weight.</small></div><div className="wk-reference-row"><b>Weight trend</b><small>Target loss is about 0.5–0.9 kg per week. Faster than about 1 kg weekly may affect muscle retention and training performance.</small></div></section><section><h3>Weekly muscle volume</h3>{MUSCLE_VOLUME.map(row=><div className="wk-reference-row" key={row.muscle}><b>{row.muscle}</b><span>{row.days} days</span><small>{row.direct} direct sets · {row.indirect} indirect sets per week</small></div>)}</section><section><h3>Weekly progress log</h3><div className="wk-reference-row"><b>Track each week</b><small>Weekly average body weight, change from last week, waist, average daily steps, sessions completed out of 6, and notes.</small></div><div className="wk-reference-row"><b>Target weight range</b><span>78–82 kg</span><small>Use the Weight page for dated weigh-ins and review the trend here weekly.</small></div><div className="wk-reference-row"><b>Workout frequency</b><span>6 sessions</span><small>Wednesday is cardio; Sunday is rest or an easy long walk.</small></div><h3>Cardio and muscles worked</h3>{CARDIO_MUSCLE_MAP.map(row=><div className="wk-reference-row" key={row.name}><b>{row.name}</b><small>{row.muscles}</small></div>)}</section></div></details>
    </section>
    <p className="module-disclaimer">Planned sets are a target — add as many extra sets as you actually do. Everything saves in this browser and syncs to your private store.</p>

    <AnimatePresence>{zoom&&<><motion.button className="scrim" aria-label="Close preview" onClick={()=>setZoom(null)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/><motion.div className="wk-lightbox" initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.98}}><div className="wk-lightbox-bar"><b>{zoom.name}</b><button className="icon-btn" aria-label="Close" onClick={()=>setZoom(null)}><X size={18}/></button></div><img src={zoom.url} alt={`${zoom.name} demo`}/></motion.div></>}</AnimatePresence>

    <AnimatePresence>{dialog&&<><motion.button className="scrim" aria-label="Close workout editor" onClick={()=>setDialog(false)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/><motion.section className="food-dialog wk-dialog" role="dialog" aria-modal="true" aria-labelledby="weekly-exercise-title" initial={{opacity:0,scale:.97,y:8}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.98}}>
      <div className="dialog-head"><div><span className="eyebrow">{dayNames[dayIndex].toUpperCase()} · WEEKLY TEMPLATE</span><h2 id="weekly-exercise-title">{editing?"Edit exercise":"Add an exercise"}</h2><p>You can always do extra sets while logging.</p></div><button className="icon-btn" aria-label="Close" onClick={()=>setDialog(false)}><X size={18}/></button></div>
      <label className="field-label">Exercise name<input autoFocus value={draft.name} placeholder="e.g. Dumbbell chest press" onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
      <label className="field-label">Secondary muscles <span className="optional-label">optional</span><input value={draft.secondary} placeholder="e.g. Front delts, triceps" onChange={e=>setDraft({...draft,secondary:e.target.value})}/></label>
      <div className="field-label">Muscle group<div className="wk-chip-picker" role="radiogroup" aria-label="Muscle group">{MUSCLE_GROUPS.map(g=><button type="button" role="radio" aria-checked={!customMode&&draft.focus===g} key={g} style={wkChip(g)} className={`wk-chip pick ${!customMode&&draft.focus===g?"selected":""}`} onClick={()=>{setCustomMode(false);setDraft({...draft,focus:g})}}>{g}</button>)}<button type="button" role="radio" aria-checked={customMode} className={`wk-chip pick custom ${customMode?"selected":""}`} onClick={()=>{setCustomMode(true);if(MUSCLE_GROUPS.includes(draft.focus))setDraft({...draft,focus:""})}}>Custom…</button></div>{customMode&&<input className="wk-custom-input" value={draft.focus} placeholder="e.g. Shoulder + Chest" onChange={e=>setDraft({...draft,focus:e.target.value})}/>}</div>
      <div className="nutrition-inputs wk-target-inputs"><label className="field-label">Planned sets<input type="number" min="1" max="20" value={draft.sets} onChange={e=>setDraft({...draft,sets:Math.max(1,Number(e.target.value))})}/></label><label className="field-label">Target reps / time<input value={draft.reps} onChange={e=>setDraft({...draft,reps:e.target.value})}/></label><label className="field-label">Rest between sets<input value={draft.rest} placeholder="e.g. 90 sec" onChange={e=>setDraft({...draft,rest:e.target.value})}/></label></div><label className="field-label">Exercise notes <span className="optional-label">optional</span><textarea rows={2} value={draft.notes} placeholder="Warm-up, interval structure, or cue" onChange={e=>setDraft({...draft,notes:e.target.value})}/></label>
      <label className="field-label">Demo GIF / image / video URL <span className="optional-label">optional</span><input type="url" value={draft.mediaUrl} placeholder="https://…" onChange={e=>setDraft({...draft,mediaUrl:e.target.value})}/></label>
      {wkIsImg(draft.mediaUrl)&&<div className="wk-demo static"><img src={draft.mediaUrl} alt="Demo preview"/></div>}
      <div className="dialog-actions"><button className="secondary-btn" onClick={()=>setDialog(false)}>Cancel</button><button className="primary-btn" disabled={!draft.name.trim()} onClick={save}>Save exercise <ArrowRight size={15}/></button></div>
    </motion.section></>}</AnimatePresence>
  </div>;
}
