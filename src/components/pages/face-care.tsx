// FILE NAME: face-care.tsx

"use client";
import { useState } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";

import { Check, CheckCircle2, Droplets, Flower2, Heart, HeartPulse, Moon, Pencil, ShieldCheck, Sparkles, Sun, Sunrise } from "lucide-react";

import { localDay, faceRoutineSteps } from "@/lib/pulse/shared";
import type { FaceRoutineState } from "@/lib/pulse/shared";

const RING_R=42;
const RING_C=2*Math.PI*RING_R;

export function FaceRoutineTracker({state,setState,monthSelection,setMonthSelection}:{state:FaceRoutineState;setState:Dispatch<SetStateAction<FaceRoutineState>>;monthSelection:1|2|null;setMonthSelection:(month:1|2|null)=>void}){
  const today=localDay();
  const todayIndex=new Date(`${today}T12:00:00`).getDay();
  const currentMonth=faceRoutineSteps(today,state.startDate,undefined,undefined,state.custom).month;
  const selectedMonth=monthSelection??currentMonth;
  const routine=faceRoutineSteps(today,state.startDate,undefined,selectedMonth,state.custom);
  const canCheckToday=selectedMonth===currentMonth;
  const checked=new Set(state.completed[today]??[]);
  const completedCount=routine.steps.filter(step=>checked.has(step.id)).length;
  const week=[{name:"Monday",index:1},{name:"Tuesday",index:2},{name:"Wednesday",index:3},{name:"Thursday",index:4},{name:"Friday",index:5},{name:"Saturday",index:6},{name:"Sunday",index:0}];
  const [editing,setEditing]=useState(false);
  const [viewDay,setViewDay]=useState<number>(todayIndex);
  const saveTemplate=(day:number,part:"morning"|"night",value:string)=>setState(current=>{const monthKey=String(selectedMonth),dayKey=String(day);const baseline=faceRoutineSteps(today,current.startDate,day,selectedMonth,current.custom);const currentCustom=current.custom?.[monthKey]?.[dayKey]??{morning:baseline.morning,night:baseline.night};const steps=value.split("\n").map(line=>line.trim()).filter(Boolean).map((line,index)=>{const [label,why="Add a note about this step."]=line.split("|").map(text=>text.trim());return{id:`custom-${selectedMonth}-${day}-${part}-${index}`,label,why,time:part==="morning"?"Morning":"Evening"}});return{...current,custom:{...current.custom,[monthKey]:{...current.custom?.[monthKey],[dayKey]:{...currentCustom,[part]:steps}}}}});
  const toggle=(id:string)=>setState(current=>{const ids=new Set(current.completed[today]??[]);ids.has(id)?ids.delete(id):ids.add(id);return{...current,completed:{...current.completed,[today]:[...ids]}}});

  const pct=routine.steps.length?Math.round(completedCount/routine.steps.length*100):0;
  const todayName=week.find(day=>day.index===todayIndex)?.name;
  const viewing=week.find(day=>day.index===viewDay)??week[0];
  const viewingIsToday=viewDay===todayIndex;
  const forViewing=faceRoutineSteps(today,state.startDate,viewDay,selectedMonth,state.custom);

  const renderSteps=(steps:typeof routine.morning,isToday:boolean)=><ol className="fc-steps" key={`${viewDay}-${selectedMonth}`}>{steps.map((step,index)=>{const isDone=checked.has(step.id);const style={"--i":index} as CSSProperties;return <li key={step.id} style={style}>{isToday?<button type="button" className={`fc-step ${isDone?"is-done":""}`} aria-pressed={isDone} disabled={!canCheckToday} onClick={()=>toggle(step.id)}><span className="fc-num">{index+1}</span><span className="fc-step-copy"><b>{step.label}</b><small>{step.why}</small></span><i className={`fc-check ${isDone?"is-checked":""}`} aria-hidden="true"><Check size={13} strokeWidth={3}/></i></button>:<div className="fc-step is-static"><span className="fc-num">{index+1}</span><span className="fc-step-copy"><b>{step.label}</b><small>{step.why}</small></span></div>}</li>})}</ol>;

  return <div className="fc">
    {/* ===== Hero ===== */}
    <section className="fc-hero">
      <div className="fc-ring" role="img" aria-label={`${pct}% of today's steps checked`}>
        <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="fc-ring-track" cx="50" cy="50" r={RING_R}/><circle className="fc-ring-fill" cx="50" cy="50" r={RING_R} strokeDasharray={RING_C} strokeDashoffset={RING_C*(1-pct/100)}/></svg>
        <span className="fc-ring-label"><Flower2 size={20}/><b>{pct}<small>%</small></b></span>
      </div>
      <div className="fc-hero-main">
        <span className="fc-kicker">Month {routine.month} · {routine.phaseLabel}</span>
        <h2>{todayName} routine</h2>
        <p>{completedCount} of {routine.steps.length} morning and night steps checked. Tap today’s steps below to update progress.</p>
      </div>
      <div className="fc-hero-side">
        <div className="fc-segment" role="group" aria-label="Choose routine month">{([1,2] as const).map(month=><button type="button" key={month} aria-pressed={selectedMonth===month} className={selectedMonth===month?"is-selected":""} onClick={()=>setMonthSelection(month)}>Month {month}{currentMonth===month&&<small>Current</small>}</button>)}</div>
        <div className="fc-tip"><ShieldCheck size={18}/><span>Morning priority<b>Apply sunscreen last</b></span></div>
      </div>
    </section>

    {/* ===== Weekly routine ===== */}
    <section className="fc-panel fc-week">
      <div className="fc-head">
        <div><h3>Morning and night, day by day</h3><p>Steps are numbered in application order. Pick a day to view it; today’s steps can be ticked off.</p></div>
        <div className="fc-actions"><span className="fc-status">Month {routine.month}{routine.month===currentMonth?" · Current":" · Preview"}</span><button type="button" className={`fc-btn ${editing?"is-on":""}`} aria-pressed={editing} onClick={()=>setEditing(value=>!value)}>{editing?<Check size={14}/>:<Pencil size={14}/>}{editing?"Done editing":"Edit routine"}</button></div>
      </div>

      {editing?<>
        <p className="fc-hint">One step per line. Add a note after a “|”, for example: <code>Cleanser | Wash away sweat gently</code>. Changes save when you tap outside a box.</p>
        <div className="fc-edit-grid">{week.map(day=>{const forDay=faceRoutineSteps(today,state.startDate,day.index,selectedMonth,state.custom);const isToday=day.index===todayIndex;return <article className={`fc-edit-day ${isToday?"is-today":""}`} key={day.name}><h4>{day.name}{isToday&&<small>Today</small>}</h4><label><span><Sunrise size={14}/> Morning</span><textarea className="fc-editor" aria-label={`${day.name} morning routine`} key={`${selectedMonth}-${day.index}-morning`} defaultValue={forDay.morning.map(step=>`${step.label} | ${step.why}`).join("\n")} onBlur={event=>saveTemplate(day.index,"morning",event.currentTarget.value)}/></label><label><span><Moon size={14}/> Night</span><textarea className="fc-editor" aria-label={`${day.name} night routine`} key={`${selectedMonth}-${day.index}-night`} defaultValue={forDay.night.map(step=>`${step.label} | ${step.why}`).join("\n")} onBlur={event=>saveTemplate(day.index,"night",event.currentTarget.value)}/></label></article>})}</div>
      </>:<>
        <div className="fc-days" role="tablist" aria-label="Choose a day">{week.map(day=>{const isToday=day.index===todayIndex;return <button type="button" role="tab" aria-selected={viewDay===day.index} aria-label={day.name} key={day.name} className={`fc-day ${viewDay===day.index?"is-selected":""} ${isToday?"is-today":""}`} onClick={()=>setViewDay(day.index)}><span>{day.name.slice(0,3)}</span>{isToday&&<i aria-hidden="true"/>}</button>})}</div>
        <div className="fc-day-title"><h4>{viewing.name}</h4>{viewingIsToday?<span className="fc-today">Today</span>:<button type="button" className="fc-link" onClick={()=>setViewDay(todayIndex)}>Back to today</button>}</div>
        <div className="fc-cols">
          <section className="fc-col"><header><span className="fc-col-icon is-morning"><Sunrise size={17}/></span><div><h5>Morning</h5><small>{forViewing.morning.length} steps · in order</small></div></header>{renderSteps(forViewing.morning,viewingIsToday)}</section>
          <section className="fc-col"><header><span className="fc-col-icon is-night"><Moon size={17}/></span><div><h5>Night</h5><small>{forViewing.night.length} steps · in order</small></div></header>{renderSteps(forViewing.night,viewingIsToday)}</section>
        </div>
      </>}
    </section>

    {/* ===== Month by month ===== */}
    <section className="fc-panel">
      <div className="fc-head"><div><h3>How the routine builds over 60 days</h3><p>The weekly schedule changes gradually. Month 2 stays selected automatically after Day 30.</p></div><Sparkles size={19} className="fc-head-icon"/></div>
      <div className="fc-months">
        <article className={`fc-month ${routine.month===1?"is-current":""}`}><header><h4>Month 1</h4><small>Days 1–30 · Weeks 1–4 + start of Week 5</small></header>
          <dl><div><dt>Morning</dt><dd>Rinse or cleanse if oily, optional toner, Vitamin C 10%, gel moisturiser, sunscreen for face/neck/ears, then SPF lip balm.</dd></div><div><dt>Night</dt><dd>Monday/Thursday niacinamide; Tuesday/Friday azelaic acid; Wednesday/Sunday face rest; Saturday T-zone Multani mitti for 10 minutes with no serum, then moisturiser. Finish with neck care and lip cream.</dd></div><div><dt>Weekly focus</dt><dd>Use the 2% salicylic cleanser at night; no separate BHA. If azelaic acid burns, reduce to once weekly. Reapply sunscreen every 2–3 hours outdoors or while sweating.</dd></div></dl>
        </article>
        <article className={`fc-month ${routine.month===2?"is-current":""}`}><header><h4>Month 2</h4><small>Days 31–60 · Weeks 5–8</small></header>
          <dl><div><dt>Morning</dt><dd>Keep the same order. Eye cream is part of morning and night routines.</dd></div><div><dt>Night</dt><dd>Weeks 5–6: retinol Monday; Weeks 7–8: retinol Monday and Friday. Keep azelaic acid on separate nights; Sunday is recovery.</dd></div><div><dt>Weekly focus</dt><dd>Use actives on separate nights. Body retinoid, if used, is Tuesday, Thursday, and Saturday.</dd></div></dl>
        </article>
      </div>
    </section>

    {/* ===== Why these steps ===== */}
    <section className="fc-panel">
      <div className="fc-head"><div><h3>Simple routine, steady progress</h3><p>Why each part of the routine is there.</p></div><Sparkles size={18} className="fc-head-icon"/></div>
      <div className="fc-cards"><article><Sun size={19}/><b>Sunscreen</b><p>Daily protection for face and neck helps limit further tanning and dark marks. Reapply after outdoor time or sweating.</p></article><article><Droplets size={19}/><b>Cleanser + moisturiser</b><p>Wash away sweat gently, then moisturise to keep skin comfortable and support its barrier.</p></article><article><Flower2 size={19}/><b>Vitamin C + niacinamide</b><p>Follow the order in the routine and introduce actives gradually. Skip a step that stings or irritates.</p></article><article><HeartPulse size={19}/><b>Recovery nights</b><p>Sunday is moisturiser only. Retinol and azelaic acid belong on different nights.</p></article></div>
    </section>

    {/* ===== Neck + under-eye, body ===== */}
    <div className="fc-pair">
      <section className="fc-panel">
        <div className="fc-head"><div><h3>Keep these areas gentle</h3><p>Neck and under-eye need steady care and less friction.</p></div><Heart size={18} className="fc-head-icon"/></div>
        <div className="fc-zones"><article><b>Neck</b><p>Use Nigrifix or a urea/lactic acid lotion on the neck at night as directed. Apply sunscreen to exposed skin and do not scrub. Check Nigrifix ingredients before using it continuously.</p></article><article><b>Under-eye</b><p>From Week 5, apply eye cream gently morning and night. Aim for 7–8 hours of sleep, avoid rubbing, and wear sunglasses outside.</p></article></div>
      </section>
      <section className="fc-panel">
        <div className="fc-head"><div><h3>Simple care for stomach and belly</h3><p>Consistency can soften and make marks less noticeable over time; older white marks may change slowly.</p></div><Droplets size={18} className="fc-head-icon"/></div>
        <div className="fc-zones"><article><b>Daily after shower</b><p>On slightly damp skin, apply body lotion to the stomach, belly, and sides. Massage gently for 2–3 minutes.</p></article><article><b>From Week 5 · optional body retinoid</b><p>Tuesday, Thursday, and Saturday nights: apply a thin layer to dry, unbroken skin, then moisturise. Start less often if irritated and keep it separate from face retinol nights.</p></article></div>
      </section>
    </div>

    {/* ===== Daily habits ===== */}
    <section className="fc-panel">
      <div className="fc-head"><div><h3>Daily habits and progress checks</h3><p>Small routines make it easier to follow the plan comfortably.</p></div><CheckCircle2 size={18} className="fc-head-icon"/></div>
      <div className="fc-cards"><article><Sun size={19}/><b>Sun and sweat</b><p>Use sunscreen daily, reapply after outdoor time or sweating, and wash your face after heavy exercise.</p></article><article><Moon size={19}/><b>Sleep and eyes</b><p>Aim for 7–8 hours of sleep, wear sunglasses outside, and avoid rubbing your eyes or picking at spots.</p></article><article><Droplets size={19}/><b>Everyday care</b><p>Drink enough water, eat balanced meals with protein, fruit, and vegetables, and change your pillowcase weekly.</p></article><article><Sparkles size={19}/><b>Progress photos</b><p>Take a photo every two weeks in similar lighting and from the same angle to compare changes calmly.</p></article></div>
    </section>

    <aside className="fc-safety"><ShieldCheck size={20}/><div><b>Pause if your skin reacts</b><p>Add one new active at a time and patch test for 2–3 days. If burning lasts more than a minute, wash it off and pause the product. Never use retinol and azelaic acid on the same night; avoid scrubbing the neck. Use multani mitti only once weekly on the T-zone if tolerated, and never near the eyes.</p></div></aside>
    <p className="fc-note">Routine reference: <b>README (4).md</b> supplied with this project. This guide is educational and does not replace medical advice.</p>
  </div>;
}