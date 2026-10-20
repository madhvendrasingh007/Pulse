// FILE NAME: calorie-burn.tsx
"use client";

import type { CSSProperties } from "react";
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronLeft, ChevronRight, Flame, Minus, Plus } from "lucide-react";

import { calculateEnergy } from "@/lib/calculations/energy";

import { localDay, fmt } from "@/lib/pulse/shared";
import type { CalorieDay } from "@/lib/pulse/shared";
import { Empty } from "@/components/ui/empty-state";

type ChartRow={date:string;label:string;consumed:number;exercise:number;totalBurn:number;deficit:number;protein:number;carbs:number;logged:boolean};

const kcal=(n:number)=>`${Math.round(n).toLocaleString("en-IN")} kcal`;

/* Custom tooltip: shows intake, burn and the resulting balance for that day */
function BurnTip({active,payload}:{active?:boolean;payload?:{payload:ChartRow}[]}){
  if(!active||!payload?.length)return null;
  const row=payload[0].payload;
  const balance=row.totalBurn-row.consumed;
  return <div className="cb-tip">
    <b>{row.label}</b>
    {row.logged?<>
      <p><i className="is-intake"/>Food intake<span>{kcal(row.consumed)}</span></p>
      <p><i className="is-burn"/>Total burn<span>{kcal(row.totalBurn)}</span></p>
      <p className={balance>=0?"is-deficit":"is-surplus"}>{balance>=0?"Deficit":"Surplus"}<span>{kcal(Math.abs(balance))}</span></p>
    </>:<small>Nothing logged this day</small>}
  </div>;
}

export function CalorieBurnTracker({date,setDate,exerciseBurn,setExerciseBurn,energy,history,activityFactor}:{date:string;setDate:(date:string)=>void;exerciseBurn:number;setExerciseBurn:(n:number)=>void;energy:ReturnType<typeof calculateEnergy>;history:CalorieDay[];activityFactor:number}){
  const historyByDate=new Map(history.map(row=>[row.date.slice(0,10),row]));
  const chartRows:ChartRow[]=Array.from({length:7},(_,index)=>{const day=new Date(`${date}T12:00:00`);day.setDate(day.getDate()-6+index);const key=localDay(day);const row=historyByDate.get(key);return{date:key,label:day.toLocaleDateString("en-IN",{weekday:"short",day:"numeric"}),consumed:row?.consumed??0,exercise:row?.exercise??0,totalBurn:row?.totalBurn??energy.sedentaryTdee,deficit:row?.deficit??energy.sedentaryTdee,protein:row?.protein??0,carbs:row?.carbs??0,logged:!!row}});

  const isToday=date===localDay();
  const shift=(n:number)=>{const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+n);setDate(localDay(d))};
  const prettyDate=new Date(`${date}T12:00:00`).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"});

  const isDeficit=energy.deficit>=0;
  const intakePct=energy.totalBurn>0?Math.min(100,Math.round(energy.caloriesConsumed/energy.totalBurn*100)):0;
  const over=energy.totalBurn>0&&energy.caloriesConsumed>energy.totalBurn;

  const loggedRows=chartRows.filter(r=>r.logged);
  const avg=(pick:(r:ChartRow)=>number)=>loggedRows.length?loggedRows.reduce((a,r)=>a+pick(r),0)/loggedRows.length:0;
  const avgIntake=avg(r=>r.consumed);
  const avgBurn=avg(r=>r.totalBurn);
  const avgBalance=avgBurn-avgIntake;

  const addBurn=(n:number)=>setExerciseBurn(Math.max(0,Math.round((Number(exerciseBurn)||0)+n)));

  const breakdown:{label:string;value:number;unit:string;hint:string;highlight?:boolean}[]=[
    {label:"BMR",value:energy.bmr,unit:"kcal",hint:"Basal metabolic rate: estimated energy your body uses at rest from your profile."},
    {label:"Sedentary TDEE · BMR × "+activityFactor.toFixed(2),value:energy.sedentaryTdee,unit:"kcal",hint:"Daily baseline before logged exercise: BMR multiplied by your activity setting."},
    {label:"Exercise burn",value:energy.exerciseBurn,unit:"kcal",hint:"Calories from exercise logged for this selected date."},
    {label:"Total daily burn",value:energy.totalBurn,unit:"kcal",hint:"Estimated baseline daily burn plus logged exercise.",highlight:true},
  ];
  const balanceRows:{label:string;value:number;unit:string;hint:string;highlight?:boolean}[]=[
    {label:"Food energy",value:energy.caloriesConsumed,unit:"kcal",hint:"Calories entered in your food log for this date."},
    {label:"Deficit / surplus",value:energy.deficit,unit:"kcal",hint:"Total daily burn minus food calories. Positive is an estimated deficit.",highlight:true},
    {label:"Estimated fat loss",value:energy.fatLossGrams,unit:"g / day",hint:"A mathematical estimate based on the daily energy balance."},
    {label:"Weekly estimate",value:energy.weeklyFatLossKg,unit:"kg / week",hint:"A mathematical estimate based on the daily energy balance."},
  ];
  const renderRows=(rows:typeof breakdown)=>rows.map((row,index)=><div key={row.label} className={`cb-row ${row.highlight?"is-highlight":""}`} style={{"--i":index} as CSSProperties}><span title={row.hint}><b>{row.label}</b><small>{row.hint}</small></span><strong>{Number(row.value).toLocaleString("en-IN",{maximumFractionDigits:1})} <em>{row.unit}</em></strong></div>);

  return <div className="cb">
    {/* ===== Date bar ===== */}
    <div className="cb-bar">
      <div className="cb-date">
        <button type="button" className="cb-icon-btn" aria-label="Previous day" onClick={()=>shift(-1)}><ChevronLeft size={18}/></button>
        <label className="cb-date-field"><span>Energy day</span><input aria-label="Choose calorie burn date" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
        <button type="button" className="cb-icon-btn" aria-label="Next day" onClick={()=>shift(1)}><ChevronRight size={18}/></button>
      </div>
      <button type="button" className="cb-btn" onClick={()=>setDate(localDay())} disabled={isToday}>Today</button>
    </div>

    {/* ===== Summary ===== */}
    <section className="cb-hero" aria-label="Energy summary">
      <div className="cb-balance">
        <span className={`cb-chip ${isDeficit?"is-deficit":"is-surplus"}`}>{isDeficit?"Estimated deficit":"Estimated surplus"}</span>
        <strong key={energy.deficit} className="cb-balance-num">{fmt(Math.abs(energy.deficit))} <small>kcal</small></strong>
        <p>{isToday?"Today":prettyDate} · burn minus food energy</p>
        <div className="cb-meter" role="img" aria-label={`Food intake is ${intakePct}% of total burn`}>
          <div className="cb-meter-track"><i className={over?"is-over":""} style={{transform:`scaleX(${intakePct/100})`}}/></div>
          <div className="cb-meter-legend"><span>Food {fmt(energy.caloriesConsumed)}</span><span>Burn {fmt(energy.totalBurn)}</span></div>
        </div>
      </div>
      <div className="cb-tiles">
        <article className="cb-tile"><span>Daily burn</span><b>{fmt(energy.totalBurn)} <small>kcal</small></b><p>{fmt(energy.sedentaryTdee)} base + {fmt(energy.exerciseBurn)} exercise</p></article>
        <article className="cb-tile"><span>Food intake</span><b>{fmt(energy.caloriesConsumed)} <small>kcal</small></b><p>From Nutrition food entries</p></article>
      </div>
    </section>

    {/* ===== Exercise entry ===== */}
    <section className="cb-panel cb-entry">
      <div className="cb-head"><div><h3>Exercise burn</h3><p>Record workout and activity calories for this date.</p></div><span className="cb-head-icon"><Flame size={18}/></span></div>
      <div className="cb-entry-body">
        <label className="cb-field">Exercise calories burned
          <div className="cb-stepper">
            <button type="button" className="cb-icon-btn" aria-label="Decrease by 50" onClick={()=>addBurn(-50)}><Minus size={16}/></button>
            <input type="number" inputMode="numeric" min="0" step="10" value={exerciseBurn} onChange={e=>setExerciseBurn(Math.max(0,Number(e.target.value)))}/>
            <button type="button" className="cb-icon-btn" aria-label="Increase by 50" onClick={()=>addBurn(50)}><Plus size={16}/></button>
          </div>
          <small>Keep exercise burn separate from your resting and daily movement estimate.</small>
        </label>
        <div className="cb-quick" aria-label="Quick add exercise calories">
          {[100,250,500].map(n=><button type="button" className="cb-btn cb-btn-sm" key={n} onClick={()=>addBurn(n)}><Plus size={13}/> {n}</button>)}
          <button type="button" className="cb-btn cb-btn-sm" onClick={()=>setExerciseBurn(0)} disabled={!exerciseBurn}>Reset</button>
        </div>
      </div>
    </section>

    {/* ===== Chart ===== */}
    <section className="cb-panel cb-chart-panel">
      <div className="cb-head"><div><h3>Daily intake and burn</h3><p>Compare food energy with your estimated total burn by day.</p></div><span className="cb-tag">Last 7 days</span></div>
      {history.length?<>
        <div className="cb-avgs">
          <div><span>Avg food</span><b>{fmt(avgIntake)}<small> kcal</small></b></div>
          <div><span>Avg burn</span><b>{fmt(avgBurn)}<small> kcal</small></b></div>
          <div className={avgBalance>=0?"is-deficit":"is-surplus"}><span>Avg {avgBalance>=0?"deficit":"surplus"}</span><b>{fmt(Math.abs(avgBalance))}<small> kcal</small></b></div>
          <p>{loggedRows.length} of 7 days logged</p>
        </div>
        <div className="cb-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartRows} margin={{top:10,right:8,bottom:0,left:-14}}><defs><linearGradient id="cbIntake" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-series-1)" stopOpacity={1}/><stop offset="100%" stopColor="var(--chart-series-1)" stopOpacity={.55}/></linearGradient></defs><CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false}/><XAxis dataKey="label" interval={0} tick={{fill:"var(--muted)",fontSize:11}} axisLine={false} tickLine={false} tickMargin={8}/><YAxis tick={{fill:"var(--muted)",fontSize:11}} axisLine={false} tickLine={false} width={44} tickFormatter={(v:number)=>v>=1000?`${(v/1000).toFixed(1).replace(".0","")}k`:String(v)}/><Tooltip content={<BurnTip/>} cursor={{fill:"color-mix(in srgb, var(--muted) 10%, transparent)"}}/><Legend iconType="circle" wrapperStyle={{fontSize:12,paddingTop:8}}/><Bar dataKey="consumed" name="Food intake" fill="url(#cbIntake)" radius={[8,8,0,0]} maxBarSize={38} animationDuration={900}>{chartRows.map(row=><Cell key={row.date} fillOpacity={row.logged?1:.25} stroke={row.date===date?"var(--text)":"none"} strokeWidth={row.date===date?1.5:0}/>)}</Bar><Line dataKey="totalBurn" name="Total burn" type="monotone" stroke="var(--chart-series-2)" strokeWidth={2.5} strokeDasharray="6 4" dot={{r:4,strokeWidth:2,fill:"var(--surface)"}} activeDot={{r:6}} animationDuration={1200}/></ComposedChart></ResponsiveContainer></div>
      </>:<Empty message="Log food or exercise burn to start a daily comparison." icon={Flame}/>}
    </section>

    {/* ===== How it's calculated ===== */}
    <section className="cb-panel">
      <div className="cb-head"><div><h3>How your estimate is calculated</h3><p>{"Mifflin–St Jeor BMR × "+activityFactor.toFixed(2)+" activity multiplier, then add exercise."}</p></div><span className="cb-tag">{date}</span></div>
      <div className="cb-breakdown">
        <div className="cb-group"><h4>Burn</h4>{renderRows(breakdown)}</div>
        <div className="cb-group"><h4>Balance</h4>{renderRows(balanceRows)}</div>
      </div>
      <p className="cb-note">Estimates use the existing Mifflin–St Jeor calculation and approximate 7,700 kcal/kg conversion; they are not a prediction of scale change.</p>
    </section>
  </div>;
}