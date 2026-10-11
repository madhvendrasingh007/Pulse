"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { ArrowRight, Check, ChevronDown, Dumbbell, Pencil, Plus, X, Trash2 } from "lucide-react";






import { dayNames, weekKeys, localDay } from "@/lib/pulse/shared";
import type { WeeklyExercise } from "@/lib/pulse/shared";
import { Empty } from "@/components/ui/empty-state";

const MUSCLE_GROUPS=["General","Chest","Upper chest","Mid-back","Lats","Shoulders","Front delts","Side delts","Rear delts","Upper back","Traps","Arms","Biceps","Brachialis","Forearms","Triceps","Quads","Hamstrings","Glutes","Calves","Abs","Core","Lower back","Hip flexors","Cardio","Full body","Push","Pull"];
const MAPPED_EXERCISES:Record<string,{session:string;name:string;focus:string;secondary:string;reps:string}[]>={
  mon:[
    {session:"Upper A",name:"Barbell bench press",focus:"Chest",secondary:"Front delts, triceps",reps:"8–12"},
    {session:"Upper A",name:"Barbell or cable row",focus:"Mid-back (lats, rhomboids)",secondary:"Biceps, rear delts",reps:"8–12"},
    {session:"Upper A",name:"Overhead dumbbell press",focus:"Shoulders (front/side delts)",secondary:"Triceps, upper chest",reps:"8–12"},
    {session:"Upper A",name:"Lat pulldown",focus:"Lats",secondary:"Biceps, rear delts",reps:"8–12"},
    {session:"Upper A",name:"Lateral raises",focus:"Side delts",secondary:"Traps",reps:"12–15"},
    {session:"Upper A",name:"Cable triceps pushdown",focus:"Triceps",secondary:"—",reps:"10–15"},
    {session:"Upper A",name:"Dumbbell curl",focus:"Biceps",secondary:"Forearms",reps:"10–15"},
  ],
  tue:[
    {session:"Lower A",name:"Barbell back squat",focus:"Quads, glutes",secondary:"Hamstrings, core, lower back",reps:"6–10"},
    {session:"Lower A",name:"Romanian deadlift",focus:"Hamstrings, glutes",secondary:"Lower back, forearms",reps:"8–12"},
    {session:"Lower A",name:"Leg press",focus:"Quads",secondary:"Glutes, hamstrings",reps:"10–15"},
    {session:"Lower A",name:"Leg curl",focus:"Hamstrings",secondary:"Calves",reps:"10–15"},
    {session:"Lower A",name:"Standing calf raise",focus:"Calves (gastrocnemius)",secondary:"—",reps:"12–20"},
    {session:"Lower A",name:"Hanging knee raise or cable crunch",focus:"Abs (lower abs / rectus abdominis)",secondary:"Hip flexors",reps:"10–15"},
  ],
  thu:[
    {session:"Upper B",name:"Incline dumbbell press",focus:"Upper chest",secondary:"Front delts, triceps",reps:"8–12"},
    {session:"Upper B",name:"Pull-ups / assisted / pulldown",focus:"Lats",secondary:"Biceps, upper back, core",reps:"6–12"},
    {session:"Upper B",name:"Seated cable row",focus:"Mid-back",secondary:"Lats, biceps, rear delts",reps:"8–12"},
    {session:"Upper B",name:"Dumbbell shoulder press",focus:"Shoulders",secondary:"Triceps, upper traps",reps:"8–12"},
    {session:"Upper B",name:"Cable fly",focus:"Chest (inner/overall)",secondary:"Front delts",reps:"10–15"},
    {session:"Upper B",name:"Face pull",focus:"Rear delts, upper back",secondary:"Rotator cuff, traps",reps:"12–15"},
    {session:"Upper B",name:"Overhead triceps extension",focus:"Triceps (long head)",secondary:"—",reps:"10–15"},
    {session:"Upper B",name:"Hammer curl",focus:"Biceps, brachialis",secondary:"Forearms",reps:"10–15"},
  ],
  fri:[
    {session:"Lower B",name:"Conventional or trap-bar deadlift",focus:"Hamstrings, glutes, lower back",secondary:"Quads, traps, forearms, core",reps:"5–8"},
    {session:"Lower B",name:"Bulgarian split squat",focus:"Quads, glutes",secondary:"Hamstrings, core (balance)",reps:"8–12 each side"},
    {session:"Lower B",name:"Hip thrust",focus:"Glutes",secondary:"Hamstrings",reps:"8–12"},
    {session:"Lower B",name:"Leg extension",focus:"Quads",secondary:"—",reps:"10–15"},
    {session:"Lower B",name:"Seated calf raise",focus:"Calves (soleus)",secondary:"—",reps:"12–20"},
    {session:"Lower B",name:"Plank",focus:"Core (abs, obliques)",secondary:"Shoulders, glutes",reps:"30–60 sec"},
  ],
};
const CARDIO_MUSCLE_MAP=[{name:"Incline walk",muscles:"Glutes, hamstrings, calves; heart and lungs"},{name:"Rowing machine",muscles:"Back, legs, arms; full-body endurance"},{name:"Stationary bike",muscles:"Quads, glutes, calves; low impact"},{name:"Cross-trainer",muscles:"Legs and arms; low-impact full body"},{name:"Battle ropes / ski erg",muscles:"Shoulders, back, core, arms"},{name:"Jump rope",muscles:"Calves, shoulders, coordination"}];
const MUSCLE_FREQUENCY_MAP=[{muscle:"Chest",days:"Mon, Thu",exercises:"Bench press, incline press, cable fly"},{muscle:"Back · lats and mid-back",days:"Mon, Thu",exercises:"Rows, pulldown, pull-ups"},{muscle:"Shoulders",days:"Mon, Thu",exercises:"Overhead press, lateral raise, shoulder press"},{muscle:"Rear delts / upper back",days:"Mon, Thu",exercises:"Face pull, rows"},{muscle:"Biceps",days:"Mon, Thu",exercises:"Curl, hammer curl, plus back work"},{muscle:"Triceps",days:"Mon, Thu",exercises:"Pushdown, overhead extension, plus pressing"},{muscle:"Quads",days:"Tue, Fri",exercises:"Squat, leg press, split squat, leg extension"},{muscle:"Hamstrings",days:"Tue, Fri",exercises:"Romanian deadlift, leg curl, deadlift"},{muscle:"Glutes",days:"Tue, Fri",exercises:"Squat, hip thrust, split squat, deadlift"},{muscle:"Calves",days:"Tue, Fri",exercises:"Standing and seated calf raise"},{muscle:"Abs / core",days:"Tue, Fri · optional Sat",exercises:"Knee raise, cable crunch, plank"}];
const wkHue=(s:string)=>[...s].reduce((a,c)=>a+c.charCodeAt(0)*7,0)%360;
const wkChip=(s:string)=>({"--c":`hsl(${wkHue(s)} 70% 62%)`}) as React.CSSProperties;
const wkIsImg=(u:string)=>/\.(gif|png|jpe?g|webp)(\?.*)?$/i.test(u);
const wkIsVideo=(u:string)=>/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(u);
const wkRows=(x:WeeklyExercise)=>Array.from({length:Math.max(x.sets,x.actualSets.length)},(_,i)=>x.actualSets[i]??{reps:"",weight:""} as {reps:string;weight:string;done?:boolean});

export function WeeklyWorkoutPlanner({addRequest,plans,setPlans}:{addRequest:number;plans:Record<string,WeeklyExercise[]>;setPlans:React.Dispatch<React.SetStateAction<Record<string,WeeklyExercise[]>>>}){
  const todayKey=weekKeys[new Date().getDay()];
  const workoutDays=["mon","tue","wed","thu","fri","sat","sun"] as const;
  const [day,setDay]=useState<string>(todayKey);
  const [dialog,setDialog]=useState(false);
  const [editing,setEditing]=useState<string|null>(null);
  const [customMode,setCustomMode]=useState(false);
  const empty={name:"",sets:3,reps:"8–12",mediaUrl:"",focus:"Chest",secondary:""};
  const [draft,setDraft]=useState(empty);
  const [hiddenDemo,setHiddenDemo]=useState<Record<string,boolean>>({});
  const [zoom,setZoom]=useState<{url:string;name:string}|null>(null);
  const items=plans[day]??[];
  const dayIndex=weekKeys.indexOf(day as typeof weekKeys[number]);
  const isToday=day===todayKey;
  const today=localDay();
  const openNew=()=>{setEditing(null);setDraft(empty);setCustomMode(false);setDialog(true)};
  useEffect(()=>{if(addRequest>0)openNew()},[addRequest]);
  const openEdit=(item:WeeklyExercise)=>{const focus=item.focus??"General";setEditing(item.id);setDraft({name:item.name,sets:item.sets,reps:item.reps,mediaUrl:item.mediaUrl,focus,secondary:item.secondaryMuscles??""});setCustomMode(!MUSCLE_GROUPS.includes(focus));setDialog(true)};
  const save=()=>{
    if(!draft.name.trim())return;
    const old=items.find(x=>x.id===editing);
    const sets=Math.max(1,Math.min(20,Number(draft.sets)||1));
    const actualSets=[...(old?.actualSets??[])];
    while(actualSets.length<sets)actualSets.push({reps:"",weight:""});
    const entry:WeeklyExercise={id:editing??crypto.randomUUID(),name:draft.name.trim(),sets,reps:draft.reps.trim()||"8–12",mediaUrl:draft.mediaUrl.trim(),focus:draft.focus.trim()||"General",secondaryMuscles:draft.secondary.trim(),actualSets,completedDates:old?.completedDates??[]};
    setPlans(all=>({...all,[day]:editing?(all[day]??[]).map(x=>x.id===editing?entry:x):[...(all[day]??[]),entry]}));
    setDialog(false);
  };
  const patch=(id:string,fn:(x:WeeklyExercise)=>WeeklyExercise)=>setPlans(all=>({...all,[day]:(all[day]??[]).map(x=>x.id===id?fn(x):x)}));
  const updateSet=(item:WeeklyExercise,i:number,change:Partial<{reps:string;weight:string;done:boolean}>)=>patch(item.id,x=>{const list=wkRows(x);list[i]={...list[i],...change};return{...x,actualSets:list}});
  const addSet=(item:WeeklyExercise)=>patch(item.id,x=>{const list=wkRows(x);const last=list[list.length-1];return{...x,actualSets:[...list,{reps:last?.reps??"",weight:last?.weight??"",done:false}]}});
  const removeSet=(item:WeeklyExercise,i:number)=>patch(item.id,x=>({...x,actualSets:wkRows(x).filter((_,idx)=>idx!==i)}));
  const remove=(id:string)=>setPlans(all=>({...all,[day]:(all[day]??[]).filter(x=>x.id!==id)}));
  const mappedForDay=MAPPED_EXERCISES[day]??[];
  const missingMapped=mappedForDay.filter(suggestion=>!items.some(item=>item.name.trim().toLowerCase()===suggestion.name.toLowerCase()));
  const addMappedDay=()=>{if(!missingMapped.length)return;const mapped:WeeklyExercise[]=missingMapped.map(suggestion=>({id:crypto.randomUUID(),name:suggestion.name,sets:3,reps:suggestion.reps,mediaUrl:"",focus:suggestion.focus,secondaryMuscles:suggestion.secondary,actualSets:Array.from({length:3},()=>({reps:"",weight:""})),completedDates:[]}));setPlans(all=>({...all,[day]:[...(all[day]??[]),...mapped]}))};
  const toggleComplete=(item:WeeklyExercise)=>{if(!isToday)return;patch(item.id,x=>({...x,completedDates:x.completedDates?.includes(today)?x.completedDates.filter(d=>d!==today):[...(x.completedDates??[]),today]}))};

  const allRows=items.flatMap(wkRows);
  const setsDone=allRows.filter(s=>s.done).length;
  const volume=allRows.filter(s=>s.done).reduce((a,s)=>a+(Number(s.reps)||0)*(Number(s.weight)||0),0);
  const focusList=[...new Set(items.map(i=>i.focus??"General"))];
  const exercisesDone=items.filter(x=>x.completedDates?.includes(today)).length;

  return <div className="wk">
    <section className="panel wk-week">
      <div className="wk-week-head"><div><span className="eyebrow">WEEKLY SPLIT</span><h3>Pick a day</h3></div><span className="demo-tag">REPEATS EVERY WEEK</span></div>
      <div className="wk-tabs" role="tablist">{workoutDays.map(key=>{const i=weekKeys.indexOf(key);const list=plans[key]??[];const first=list[0]?.focus;return <button key={key} role="tab" aria-selected={day===key} aria-label={dayNames[i]} className={`wk-tab ${day===key?"selected":""} ${key===todayKey?"is-today":""}`} onClick={()=>setDay(key)}><b>{dayNames[i].slice(0,3)}</b><span>{list.length?`${list.length} ex`:"Rest"}</span>{first?<i style={wkChip(first)}/>:<i className="empty"/>}{key===todayKey&&<em>TODAY</em>}</button>})}</div>
    </section>

    <section className="panel wk-day">
      <div className="wk-day-head">
        <div className="wk-day-title"><span className="eyebrow">{isToday?"TODAY · ":""}{dayNames[dayIndex].toUpperCase()}</span><h2>{dayNames[dayIndex]}</h2>{mappedForDay.length>0&&<span className="wk-session-pill">{mappedForDay[0].session} · MUSCLE MAP</span>}<div className="wk-tags">{focusList.length?focusList.map(f=><span className="wk-chip" style={wkChip(f)} key={f}>{f}</span>):<span className="wk-chip muted">No muscle focus yet</span>}</div></div>
        <div className="wk-day-actions">{mappedForDay.length>0&&<button className="secondary-btn wk-map-add" title="Adds mapped exercises that are not already in this day plan" onClick={addMappedDay} disabled={!missingMapped.length}><Plus size={14}/>{missingMapped.length?`Add ${mappedForDay[0].session} map (${missingMapped.length})`:"Map added"}</button>}<button className="primary-btn" onClick={openNew}><Plus size={16}/> Add exercise</button></div>
      </div>
      {items.length>0&&<div className="wk-stats"><div><small>EXERCISES</small><b>{items.length}</b></div><div><small>SETS DONE</small><b>{setsDone}<span>/{allRows.length}</span></b></div><div><small>VOLUME</small><b>{Math.round(volume).toLocaleString()}<span> kg</span></b></div><div><small>COMPLETED{isToday?"":" (TODAY ONLY)"}</small><b>{isToday?exercisesDone:0}<span>/{items.length}</span></b></div></div>}
      {items.length===0?<Empty message={`Add exercises for ${dayNames[dayIndex]}. They stay in your weekly template.`} icon={Dumbbell}/>:<div className="wk-list">{items.map((item,index)=>{
        const rows=wkRows(item);const done=rows.filter(s=>s.done).length;const focus=item.focus??"General";const isDone=item.completedDates?.includes(today);const hasImg=wkIsImg(item.mediaUrl);const demoHidden=hiddenDemo[item.id];
        return <article className={`wk-card ${isDone?"is-done":""} ${item.mediaUrl?"has-media":""}`} key={item.id}>
          <header className="wk-card-head">
            <span className="wk-num">{index+1}</span>
            <div className="wk-title"><h4>{item.name}</h4><div className="wk-meta"><span className="wk-chip" style={wkChip(focus)}>{focus}</span><span className="wk-target"><b>{item.sets}</b> sets × <b>{item.reps}</b> reps</span></div>{item.secondaryMuscles&&<small className="wk-secondary">Also works: {item.secondaryMuscles}</small>}</div>
            <div className="wk-icons"><button className="wk-icon" aria-label={`Edit ${item.name}`} onClick={()=>openEdit(item)}><Pencil size={16}/></button><button className="wk-icon danger" aria-label={`Remove ${item.name}`} onClick={()=>remove(item.id)}><Trash2 size={16}/></button></div>
          </header>
          <div className="wk-progress"><div className="bar-track"><div className="bar-fill lime-fill" style={{width:`${Math.min(100,done/Math.max(1,rows.length)*100)}%`}}/></div><small>{done}/{rows.length} sets done</small></div>
          {item.mediaUrl&&(hasImg?<div className="wk-demo-block"><button type="button" className="wk-demo-toggle" onClick={()=>setHiddenDemo(s=>({...s,[item.id]:!s[item.id]}))}>{demoHidden?"Show demo":"Hide demo"} <ChevronDown size={14} style={{transform:demoHidden?"none":"rotate(180deg)"}}/></button>{!demoHidden&&<button type="button" className="wk-demo" onClick={()=>setZoom({url:item.mediaUrl,name:item.name})} aria-label={`Enlarge ${item.name} demo`}><img src={item.mediaUrl} alt={`${item.name} demo`} loading="lazy"/><span>Tap to enlarge</span></button>}</div>:wkIsVideo(item.mediaUrl)?<div className="wk-demo-block"><video className="wk-video" src={item.mediaUrl} controls playsInline preload="metadata" aria-label={`${item.name} exercise demo`}/></div>:<a href={item.mediaUrl} target="_blank" rel="noreferrer" className="wk-guide-link"><ArrowRight size={15}/> Open exercise guide</a>)}
          <div className="wk-sets">
            <div className="wk-set-head"><span>SET</span><span>REPS</span><span>KG</span><span>DONE</span></div>
            {rows.map((s,i)=>{const extra=i>=item.sets;return <div className={`wk-set ${s.done?"is-done":""}`} key={i}><span className="wk-set-n">{i+1}{extra&&<em>Extra</em>}</span><input aria-label={`${item.name} set ${i+1} reps`} inputMode="numeric" type="number" min="0" placeholder={item.reps} value={s.reps} onChange={e=>updateSet(item,i,{reps:e.target.value})}/><input aria-label={`${item.name} set ${i+1} weight`} inputMode="decimal" type="number" min="0" step="0.5" placeholder="0" value={s.weight} onChange={e=>updateSet(item,i,{weight:e.target.value})}/><div className="wk-set-end"><button type="button" aria-pressed={!!s.done} aria-label={`Mark set ${i+1} done`} className={`check-circle ${s.done?"checked":""}`} onClick={()=>updateSet(item,i,{done:!s.done})}>{s.done&&<Check size={14}/>}</button>{extra&&<button type="button" className="wk-icon danger sm" aria-label={`Remove set ${i+1}`} onClick={()=>removeSet(item,i)}><X size={14}/></button>}</div></div>})}
          </div>
          <footer className="wk-card-foot"><button className="secondary-btn" onClick={()=>addSet(item)}><Plus size={14}/> Add set</button><button className={`secondary-btn workout-completion ${isDone?"is-complete":""}`} disabled={!isToday} onClick={()=>toggleComplete(item)}>{isDone?<><Check size={14}/> Completed</>:isToday?"Mark exercise complete":"Open on this day to complete"}</button></footer>
        </article>})}</div>}
      <details className="wk-map-reference"><summary>Muscle frequency and cardio reference</summary><div className="wk-reference-grid"><section><h3>Weekly muscle frequency</h3>{MUSCLE_FREQUENCY_MAP.map(row=><div className="wk-reference-row" key={row.muscle}><b>{row.muscle}</b><span>{row.days}</span><small>{row.exercises}</small></div>)}</section><section><h3>Cardio and muscles worked</h3>{CARDIO_MUSCLE_MAP.map(row=><div className="wk-reference-row" key={row.name}><b>{row.name}</b><small>{row.muscles}</small></div>)}</section></div></details>
    </section>
    <p className="module-disclaimer">Planned sets are a target — add as many extra sets as you actually do. Everything saves in this browser and syncs to your private store.</p>

    <AnimatePresence>{zoom&&<><motion.button className="scrim" aria-label="Close preview" onClick={()=>setZoom(null)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/><motion.div className="wk-lightbox" initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.98}}><div className="wk-lightbox-bar"><b>{zoom.name}</b><button className="icon-btn" aria-label="Close" onClick={()=>setZoom(null)}><X size={18}/></button></div><img src={zoom.url} alt={`${zoom.name} demo`}/></motion.div></>}</AnimatePresence>

    <AnimatePresence>{dialog&&<><motion.button className="scrim" aria-label="Close workout editor" onClick={()=>setDialog(false)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/><motion.section className="food-dialog wk-dialog" role="dialog" aria-modal="true" aria-labelledby="weekly-exercise-title" initial={{opacity:0,scale:.97,y:8}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.98}}>
      <div className="dialog-head"><div><span className="eyebrow">{dayNames[dayIndex].toUpperCase()} · WEEKLY TEMPLATE</span><h2 id="weekly-exercise-title">{editing?"Edit exercise":"Add an exercise"}</h2><p>You can always do extra sets while logging.</p></div><button className="icon-btn" aria-label="Close" onClick={()=>setDialog(false)}><X size={18}/></button></div>
      <label className="field-label">Exercise name<input autoFocus value={draft.name} placeholder="e.g. Dumbbell chest press" onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
      <label className="field-label">Secondary muscles <span className="optional-label">optional</span><input value={draft.secondary} placeholder="e.g. Front delts, triceps" onChange={e=>setDraft({...draft,secondary:e.target.value})}/></label>
      <div className="field-label">Muscle group<div className="wk-chip-picker" role="radiogroup" aria-label="Muscle group">{MUSCLE_GROUPS.map(g=><button type="button" role="radio" aria-checked={!customMode&&draft.focus===g} key={g} style={wkChip(g)} className={`wk-chip pick ${!customMode&&draft.focus===g?"selected":""}`} onClick={()=>{setCustomMode(false);setDraft({...draft,focus:g})}}>{g}</button>)}<button type="button" role="radio" aria-checked={customMode} className={`wk-chip pick custom ${customMode?"selected":""}`} onClick={()=>{setCustomMode(true);if(MUSCLE_GROUPS.includes(draft.focus))setDraft({...draft,focus:""})}}>Custom…</button></div>{customMode&&<input className="wk-custom-input" value={draft.focus} placeholder="e.g. Shoulder + Chest" onChange={e=>setDraft({...draft,focus:e.target.value})}/>}</div>
      <div className="nutrition-inputs"><label className="field-label">Planned sets<input type="number" min="1" max="20" value={draft.sets} onChange={e=>setDraft({...draft,sets:Math.max(1,Number(e.target.value))})}/></label><label className="field-label">Target reps<input value={draft.reps} onChange={e=>setDraft({...draft,reps:e.target.value})}/></label></div>
      <label className="field-label">Demo GIF / image / video URL <span className="optional-label">optional</span><input type="url" value={draft.mediaUrl} placeholder="https://…" onChange={e=>setDraft({...draft,mediaUrl:e.target.value})}/></label>
      {wkIsImg(draft.mediaUrl)&&<div className="wk-demo static"><img src={draft.mediaUrl} alt="Demo preview"/></div>}
      <div className="dialog-actions"><button className="secondary-btn" onClick={()=>setDialog(false)}>Cancel</button><button className="primary-btn" disabled={!draft.name.trim()} onClick={save}>Save exercise <ArrowRight size={15}/></button></div>
    </motion.section></>}</AnimatePresence>
  </div>;
}
