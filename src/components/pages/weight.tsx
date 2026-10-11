"use client";


import { Area, AreaChart, ResponsiveContainer, XAxis } from "recharts";
import { Plus, Weight } from "lucide-react";







import type { WeightLog } from "@/lib/pulse/shared";
import { Empty } from "@/components/ui/empty-state";

export function WeightTracker({entries,currentWeight,onNew,onEdit}:{entries:WeightLog[];currentWeight:number;onNew:()=>void;onEdit:(entry?:WeightLog)=>void}){
  const sorted=[...entries].sort((a,b)=>a.date.localeCompare(b.date));const recent=sorted.slice(-7);const average=recent.length?recent.reduce((sum,x)=>sum+x.weight,0)/recent.length:currentWeight;
  return <><div className="weight-feature panel"><div><span className="eyebrow">PERSONAL WEIGHT HISTORY</span><h2>{currentWeight.toFixed(1)} <small>kg</small></h2><p>7-entry average: {average.toFixed(1)} kg</p><small>BMR and sedentary TDEE update using your latest logged weight.</small></div><div className="weight-feature-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={recent.map(x=>({day:x.date,value:x.weight}))}><Area type="monotone" dataKey="value" stroke="var(--blue)" strokeWidth={2} fill="url(#weightGradient2)"/><defs><linearGradient id="weightGradient2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--blue)" stopOpacity={.25}/><stop offset="100%" stopColor="var(--blue)" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="day" hide/></AreaChart></ResponsiveContainer></div></div><section className="panel module-panel"><div className="panel-heading"><div><h3>Weight entries</h3><p>Choose any date to add or correct a past weigh-in.</p></div><button className="primary-btn" onClick={onNew}><Plus size={15}/> Log weight</button></div>{sorted.length===0?<Empty message="Start with your current weight. Each entry updates your energy calculation." icon={Weight}/>:sorted.slice().reverse().map(entry=><div className="weight-log-row" key={entry.id}><div><b>{entry.weight.toFixed(1)} kg</b><small>{new Date(`${entry.date}T12:00:00`).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</small></div><button className="secondary-btn" onClick={()=>onEdit(entry)}>Edit</button></div>)}</section></>;
}
