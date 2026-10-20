// FILENAME: src/components/pages/weight.tsx
"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp, Minus, Pencil, Plus, Weight } from "lucide-react";

import type { WeightLog } from "@/lib/pulse/shared";
import { Empty } from "@/components/ui/empty-state";

type Range="7"|"30"|"all";
type Row={id:string;date:string;label:string;value:number};

const shortDate=(date:string)=>new Date(`${date}T12:00:00`).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
const signed=(n:number)=>`${n>0?"+":""}${n.toFixed(1)}`;

/* Custom tooltip with the full date and the exact weight */
function WeightTip({active,payload}:{active?:boolean;payload?:{payload:Row}[]}){
  if(!active||!payload?.length)return null;
  const row=payload[0].payload;
  return <div className="wt-tip"><small>{new Date(`${row.date}T12:00:00`).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</small><b>{row.value.toFixed(1)} <span>kg</span></b></div>;
}

export function WeightTracker({entries,currentWeight,onNew,onEdit}:{entries:WeightLog[];currentWeight:number;onNew:()=>void;onEdit:(entry?:WeightLog)=>void}){
  const [range,setRange]=useState<Range>("7");
  const sorted=[...entries].sort((a,b)=>a.date.localeCompare(b.date));const recent=sorted.slice(-7);const average=recent.length?recent.reduce((sum,x)=>sum+x.weight,0)/recent.length:currentWeight;

  const shown=range==="7"?sorted.slice(-7):range==="30"?sorted.slice(-30):sorted;
  const rows:Row[]=shown.map(x=>({id:x.id,date:x.date,label:shortDate(x.date),value:x.weight}));
  const values=shown.map(x=>x.weight);
  const lowest=values.length?Math.min(...values):currentWeight;
  const highest=values.length?Math.max(...values):currentWeight;
  const rangeChange=shown.length>1?shown[shown.length-1].weight-shown[0].weight:0;
  const rangeAverage=values.length?values.reduce((a,b)=>a+b,0)/values.length:currentWeight;
  const lastChange=sorted.length>1?sorted[sorted.length-1].weight-sorted[sorted.length-2].weight:null;

  const deltaFor=(index:number)=>index>0?sorted[index].weight-sorted[index-1].weight:null;
  const reversed=sorted.map((entry,index)=>({entry,delta:deltaFor(index)})).reverse();
  const rangeLabel=range==="7"?"last 7 entries":range==="30"?"last 30 entries":"all entries";

  return <div className="wt">
    {/* ===== Hero ===== */}
    <section className="wt-hero">
      <div className="wt-now">
        <span className="wt-kicker">Personal weight history</span>
        <strong key={currentWeight} className="wt-num">{currentWeight.toFixed(1)} <small>kg</small></strong>
        {lastChange!==null&&<span className={`wt-chip ${lastChange<0?"is-down":lastChange>0?"is-up":""}`}>{lastChange<0?<ArrowDown size={14}/>:lastChange>0?<ArrowUp size={14}/>:<Minus size={14}/>}{signed(lastChange)} kg since previous entry</span>}
        <p>7-entry average: <b>{average.toFixed(1)} kg</b></p>
        <small className="wt-note">BMR and sedentary TDEE update using your latest logged weight.</small>
        <button type="button" className="wt-btn is-primary" onClick={onNew}><Plus size={16}/> Log weight</button>
      </div>
      <div className="wt-stats">
        <article style={{"--i":0} as CSSProperties}><span>Average</span><b>{rangeAverage.toFixed(1)}<small> kg</small></b><p>{rangeLabel}</p></article>
        <article style={{"--i":1} as CSSProperties}><span>Change</span><b className={rangeChange<0?"is-down":rangeChange>0?"is-up":""}>{shown.length>1?signed(rangeChange):"—"}<small>{shown.length>1?" kg":""}</small></b><p>{rangeLabel}</p></article>
        <article style={{"--i":2} as CSSProperties}><span>Lowest</span><b>{values.length?lowest.toFixed(1):"—"}<small>{values.length?" kg":""}</small></b><p>{rangeLabel}</p></article>
        <article style={{"--i":3} as CSSProperties}><span>Highest</span><b>{values.length?highest.toFixed(1):"—"}<small>{values.length?" kg":""}</small></b><p>{rangeLabel}</p></article>
      </div>
    </section>

    {/* ===== Chart ===== */}
    <section className="wt-panel">
      <div className="wt-head">
        <div><h3>Weight trend</h3><p>Dashed line marks the average for the selected range.</p></div>
        <div className="wt-segment" role="group" aria-label="Chart range">{([["7","7"],["30","30"],["all","All"]] as const).map(([key,text])=><button type="button" key={key} aria-pressed={range===key} className={range===key?"is-selected":""} onClick={()=>setRange(key)}>{text}</button>)}</div>
      </div>
      {rows.length?<div className="wt-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={rows} margin={{top:12,right:12,bottom:0,left:-14}}><defs><linearGradient id="weightGradient2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-series-1)" stopOpacity={.32}/><stop offset="100%" stopColor="var(--chart-series-1)" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false}/><XAxis dataKey="label" tick={{fill:"var(--muted)",fontSize:11}} axisLine={false} tickLine={false} tickMargin={8} minTickGap={24}/><YAxis domain={[(min:number)=>Math.floor(min-1),(max:number)=>Math.ceil(max+1)]} tick={{fill:"var(--muted)",fontSize:11}} axisLine={false} tickLine={false} width={42} tickFormatter={(v:number)=>String(v)}/><Tooltip content={<WeightTip/>} cursor={{stroke:"var(--chart-series-1)",strokeOpacity:.35,strokeDasharray:"4 4"}}/><ReferenceLine y={rangeAverage} stroke="var(--muted)" strokeDasharray="5 5" strokeOpacity={.7}/><Area type="monotone" dataKey="value" stroke="var(--chart-series-1)" strokeWidth={2.5} fill="url(#weightGradient2)" dot={rows.length<=14?{r:3.5,strokeWidth:2,fill:"var(--surface)"}:false} activeDot={{r:6}} animationDuration={1000}/></AreaChart></ResponsiveContainer></div>:<Empty message="Log a weigh-in to see your trend." icon={Weight}/>}
    </section>

    {/* ===== Entries ===== */}
    <section className="wt-panel">
      <div className="wt-head"><div><h3>Weight entries</h3><p>Choose any date to add or correct a past weigh-in.</p></div><button type="button" className="wt-btn is-primary" onClick={onNew}><Plus size={15}/> Log weight</button></div>
      {sorted.length===0?<Empty message="Start with your current weight. Each entry updates your energy calculation." icon={Weight}/>:<div className="wt-list">{reversed.map(({entry,delta},index)=><article className="wt-row" style={{"--i":Math.min(index,12)} as CSSProperties} key={entry.id}>
        <span className="wt-row-icon"><Weight size={16}/></span>
        <div className="wt-row-copy"><b>{entry.weight.toFixed(1)} kg</b><small>{new Date(`${entry.date}T12:00:00`).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</small></div>
        {delta!==null&&<span className={`wt-delta ${delta<0?"is-down":delta>0?"is-up":""}`}>{delta<0?<ArrowDown size={13}/>:delta>0?<ArrowUp size={13}/>:<Minus size={13}/>}{signed(delta)}</span>}
        <button type="button" className="wt-btn wt-btn-sm" onClick={()=>onEdit(entry)}><Pencil size={13}/> Edit</button>
      </article>)}</div>}
    </section>
  </div>;
}