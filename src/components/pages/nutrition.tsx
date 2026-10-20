// FILE NAME: nutrition.tsx
"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import { Bar, BarChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Apple, ChevronLeft, ChevronRight, Copy, Pencil, Plus, Trash2 } from "lucide-react";

import { localDay, fmt } from "@/lib/pulse/shared";
import type { Food, CalorieDay } from "@/lib/pulse/shared";
import { Empty } from "@/components/ui/empty-state";

export function NutritionTracker({foods,foodLibrary,quickCopyFood,nutrition,date,setDate,editFood,openFood,removeFood,history}:{foods:Food[];foodLibrary:Food[];quickCopyFood:(food:Food)=>void;nutrition:{calories:number;protein:number;carbs:number;fats:number};date:string;setDate:(date:string)=>void;editFood:(food:Food)=>void;openFood:()=>void;removeFood:(id:string)=>void;history:CalorieDay[]}){
  const [quickEdits,setQuickEdits]=useState<Record<string,Food|null>>({});
  const [editingQuick,setEditingQuick]=useState<string|null>(null);
  const [quickDraft,setQuickDraft]=useState({name:"",amount:"",calories:"",protein:"",carbs:"",fats:""});
  useEffect(()=>{const load=()=>{try{setQuickEdits(JSON.parse(localStorage.getItem("pulse-quick-dish-edits")??"{}"))}catch{setQuickEdits({})}};load();window.addEventListener("pulse-cloud-hydrated",load);return()=>window.removeEventListener("pulse-cloud-hydrated",load)},[]);
  const saveQuickEdits=(next:Record<string,Food|null>)=>{setQuickEdits(next);localStorage.setItem("pulse-quick-dish-edits",JSON.stringify(next));window.dispatchEvent(new Event("pulse-local-write"))};
  const historyByDate=new Map(history.map(row=>[row.date.slice(0,10),row]));
  const week=Array.from({length:7},(_,i)=>{const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()-6+i);const key=localDay(d);const row=historyByDate.get(key);return{date:key,label:d.toLocaleDateString("en-IN",{weekday:"short"}),protein:row?.protein??0,carbs:row?.carbs??0,calories:row?.consumed??0}});
  const quickCopies=[...foodLibrary].sort((a,b)=>b.date.localeCompare(a.date)).reduce<{key:string;food:Food}[]>((list,entry)=>{const key=[entry.name.trim().toLowerCase(),entry.amount,entry.calories,entry.protein,entry.carbs,entry.fats].join("|");if(Object.prototype.hasOwnProperty.call(quickEdits,key)&&quickEdits[key]===null)return list;const food=quickEdits[key]??entry;return list.some(item=>item.key===key)?list:[...list,{key,food}]},[]).slice(0,8);

  const isToday=date===localDay();
  const shift=(n:number)=>{const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+n);setDate(localDay(d))};
  const prettyDate=new Date(`${date}T12:00:00`).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"});
  const macroEnergy=[
    {key:"protein",name:"Protein",value:nutrition.protein,kcal:nutrition.protein*4},
    {key:"carbs",name:"Carbs",value:nutrition.carbs,kcal:nutrition.carbs*4},
    {key:"fats",name:"Fat",value:nutrition.fats,kcal:nutrition.fats*9},
  ];
  const totalMacroKcal=macroEnergy.reduce((a,m)=>a+m.kcal,0);
  const share=(kcal:number)=>totalMacroKcal?Math.round(kcal/totalMacroKcal*100):0;

  return <div className="nt">
    {/* ===== Date bar ===== */}
    <div className="nt-bar">
      <div className="nt-date">
        <button type="button" className="nt-icon-btn" aria-label="Previous day" onClick={()=>shift(-1)}><ChevronLeft size={18}/></button>
        <label className="nt-date-field"><span>Food log for</span><input aria-label="Choose food log date" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
        <button type="button" className="nt-icon-btn" aria-label="Next day" onClick={()=>shift(1)}><ChevronRight size={18}/></button>
      </div>
      <button type="button" className="nt-btn" onClick={()=>setDate(localDay())} disabled={isToday}>Today</button>
    </div>

    {/* ===== Summary ===== */}
    <section className="nt-hero" aria-label="Daily nutrition summary">
      <div className="nt-energy">
        <span className="nt-label">{isToday?"Today":prettyDate}</span>
        <strong key={nutrition.calories} className="nt-kcal">{fmt(nutrition.calories)} <small>kcal</small></strong>
        <p>{foods.length} food {foods.length===1?"entry":"entries"}{isToday?` · ${prettyDate}`:""}</p>
        <div className="nt-split" role="img" aria-label={totalMacroKcal?`Calories from protein ${share(macroEnergy[0].kcal)}%, carbs ${share(macroEnergy[1].kcal)}%, fat ${share(macroEnergy[2].kcal)}%`:"No macros logged"}>
          {totalMacroKcal>0?macroEnergy.map(m=><i key={m.key} className={`is-${m.key}`} style={{flexGrow:m.kcal}}/>):<i className="is-empty"/>}
        </div>
      </div>
      <div className="nt-macros">{macroEnergy.map(m=><div className={`nt-macro is-${m.key}`} key={m.key}><span><i aria-hidden="true"/>{m.name}</span><b>{fmt(m.value)}<small>g</small></b><em>{share(m.kcal)}% of calories</em></div>)}</div>
    </section>

    {/* ===== Chart + entries ===== */}
    <div className="nt-grid">
      <section className="nt-panel nt-chart-panel">
        <div className="nt-head"><div><h3>Calories and macros</h3><p>Seven-day calories, protein, and carbs.</p></div><span className="nt-tag">7-day view</span></div>
        <div className="nt-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={week} margin={{top:8,right:4,bottom:0,left:-16}}><CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false}/><XAxis dataKey="label" tick={{fill:"var(--muted)",fontSize:12}} axisLine={false} tickLine={false}/><YAxis yAxisId="macros" tick={{fill:"var(--muted)",fontSize:11}} axisLine={false} tickLine={false}/><YAxis yAxisId="calories" orientation="right" tick={{fill:"var(--muted)",fontSize:11}} axisLine={false} tickLine={false}/><Tooltip cursor={{fill:"color-mix(in srgb, var(--muted) 10%, transparent)"}} contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,fontSize:12}} formatter={(value,name)=>[`${Number(value).toLocaleString()} ${name==="Calories"?"kcal":"g"}`,name]} /><Legend wrapperStyle={{fontSize:12}}/><Bar yAxisId="macros" dataKey="protein" name="Protein" fill="var(--chart-series-1)" radius={[6,6,0,0]} animationDuration={900}/><Bar yAxisId="macros" dataKey="carbs" name="Carbs" fill="var(--chart-series-2)" radius={[6,6,0,0]} animationDuration={900}/><Line yAxisId="calories" dataKey="calories" name="Calories" type="monotone" stroke="var(--chart-series-3)" strokeWidth={2.5} dot={{r:3}} animationDuration={1100}/></BarChart></ResponsiveContainer></div>
      </section>

      <section className="nt-panel nt-food-panel">
        <div className="nt-head"><div><h3>Food entries</h3><p>Meals logged for this day.</p></div><button className="nt-btn is-primary" onClick={openFood}><Plus size={15}/> Add food</button></div>
        {foods.length?<div className="nt-foods" key={date}>{foods.map((f,index)=><article className="nt-food" style={{"--i":index} as CSSProperties} key={f.id}>
          <span className="nt-food-icon"><Apple size={17}/></span>
          <div className="nt-food-copy"><b>{f.name}</b><small>{f.amount}</small><span className="nt-food-macros"><i className="is-protein"/>P {fmt(f.protein)}g<i className="is-carbs"/>C {fmt(f.carbs)}g<i className="is-fats"/>F {fmt(f.fats)}g</span></div>
          <strong className="nt-food-kcal">{fmt(f.calories)} <small>kcal</small></strong>
          <div className="nt-food-tools"><button className="nt-btn nt-btn-sm" onClick={()=>editFood(f)}><Pencil size={13}/> Edit</button><button className="nt-icon-btn is-danger" aria-label={`Delete ${f.name}`} title={`Delete ${f.name}`} onClick={()=>removeFood(f.id)}><Trash2 size={15}/></button></div>
        </article>)}</div>:<Empty message="Add your first meal or snack for this date." icon={Apple}/>}
      </section>
    </div>

    {/* ===== Quick add ===== */}
    <section className="nt-panel nt-quick">
      <div className="nt-head"><div><h3>Quick add a recent dish</h3><p>Tap a dish to copy its serving and nutrition to {date}.</p></div><Copy size={18} className="nt-head-icon"/></div>
      {quickCopies.length?<div className="nt-quick-grid">{quickCopies.map(({key,food:item},index)=><article className="nt-quick-item" style={{"--i":index} as CSSProperties} key={key}>
        <button type="button" className="nt-quick-card" onClick={()=>quickCopyFood(item)}><span className="nt-quick-name"><b>{item.name}</b><small>{item.amount}</small></span><strong>{fmt(item.calories)} kcal</strong><small>P {fmt(item.protein)}g · C {fmt(item.carbs)}g · F {fmt(item.fats)}g</small><span className="nt-quick-add" aria-hidden="true"><Plus size={14}/></span></button>
        <div className="nt-quick-actions"><button type="button" className="nt-btn nt-btn-sm" onClick={()=>{setEditingQuick(key);setQuickDraft({name:item.name,amount:item.amount,calories:String(item.calories),protein:String(item.protein),carbs:String(item.carbs),fats:String(item.fats)})}}><Pencil size={12}/> Edit</button><button type="button" className="nt-btn nt-btn-sm is-danger" aria-label={`Remove ${item.name} from quick dishes`} onClick={()=>{if(window.confirm(`Remove ${item.name} from quick dishes?`))saveQuickEdits({...quickEdits,[key]:null})}}><Trash2 size={12}/> Delete</button></div>
      </article>)}</div>:<p className="nt-note">Log a dish once and it will appear here for quick reuse.</p>}
      {editingQuick&&<div className="nt-editor"><h4>Edit quick dish</h4><div className="nt-editor-fields">{([ ["name","Dish name"],["amount","Serving size"],["calories","Calories"],["protein","Protein"],["carbs","Carbs"],["fats","Fat"] ] as const).map(([key,label])=><label key={key}>{label}<input type={key==="name"||key==="amount"?"text":"number"} min={key==="name"||key==="amount"?undefined:0} value={quickDraft[key]} onChange={event=>setQuickDraft({...quickDraft,[key]:event.target.value})}/></label>)}</div><div className="nt-editor-actions"><button type="button" className="nt-btn" onClick={()=>setEditingQuick(null)}>Cancel</button><button type="button" className="nt-btn is-primary" onClick={()=>{if(!quickDraft.name.trim())return;saveQuickEdits({...quickEdits,[editingQuick]:{id:`quick-${editingQuick}`,date,name:quickDraft.name.trim(),amount:quickDraft.amount.trim()||"1 serving",calories:Math.max(0,Number(quickDraft.calories)||0),protein:Math.max(0,Number(quickDraft.protein)||0),carbs:Math.max(0,Number(quickDraft.carbs)||0),fats:Math.max(0,Number(quickDraft.fats)||0)}});setEditingQuick(null)}}>Save dish</button></div></div>}
    </section>
  </div>;
}