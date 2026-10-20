"use client";
import { useState } from "react";
import type React from "react";
import { AlertTriangle, Flame, Heart, Target } from "lucide-react";
import { signOut } from "next-auth/react";
const PULSE_DATA_KEYS = [
  "pulse-habits", "pulse-weight-logs", "pulse-energy-profile", "pulse-exercise-burns",
  "pulse-calorie-targets", "pulse-nutrition-goals", "pulse-activity-factor", "pulse-events",
  "pulse-weekly-workouts", "pulse-workout-history", "pulse-workout-completions",
  "pulse-workout-week-history", "pulse-active-workout-week", "pulse-workout-template",
  "pulse-page-history", "pulse-food-logs", "pulse-quick-dish-edits", "pulse-face-routine",
  "pulse-theme", "pulse-color-theme", "pulse-dashboard-theme", "pulse-style",
];

export function SettingsPage({nutritionGoals,setNutritionGoals,activityFactor,setActivityFactor}:{nutritionGoals:typeof import("@/lib/pulse/shared").defaultGoals;setNutritionGoals:React.Dispatch<React.SetStateAction<typeof import("@/lib/pulse/shared").defaultGoals>>;activityFactor:number;setActivityFactor:React.Dispatch<React.SetStateAction<number>>;theme?:"light"|"dark";setTheme?:(theme:"light"|"dark")=>void}) {
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState("");

  const resetPulse = async () => {
    const confirmed = window.confirm("Erase all PULSE profile data and logs from this device and your private owner record? This removes habits, workouts, history, food logs, goals, and your profile. This cannot be undone.");
    if (!confirmed) return;

    setResetBusy(true);
    setResetError("");
    try {
      const localOnly = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_PULSE_LOCAL_AUTH === "true";
      if (!localOnly) {
        const currentResponse = await fetch("/api/state", { cache: "no-store" });
        if (!currentResponse.ok) throw new Error("Could not read the private owner record. Nothing was erased.");
        const current = await currentResponse.json() as { updatedAt: string | null };
        const resetResponse = await fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: {}, revision: current.updatedAt }),
          cache: "no-store",
        });
        if (!resetResponse.ok) throw new Error("Could not reset the private owner record. Nothing was erased from this device.");
      }

      for (const key of PULSE_DATA_KEYS) localStorage.removeItem(key);
      window.location.assign("/");
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "Reset failed. Your data was not cleared.");
      setResetBusy(false);
    }
  };

  return <div className="settings-stack"><section className="panel settings-targets"><div className="panel-heading"><div><h3>Daily nutrition expectations</h3><p>These targets appear on your dashboard and nutrition summary.</p></div><Target size={17}/></div><div className="settings-goal-grid">{([{key:"calories",label:"Calories",unit:"kcal"},{key:"protein",label:"Protein",unit:"g"},{key:"carbs",label:"Carbohydrates",unit:"g"},{key:"fats",label:"Fat",unit:"g"}] as const).map(({key,label,unit})=><label key={key}>{label}<span><input type="number" min="0" value={nutritionGoals[key]} onChange={e=>setNutritionGoals(all=>({...all,[key]:Math.max(0,Number(e.target.value))}))}/><small>{unit} / day</small></span></label>)}</div></section><section className="panel settings-targets"><div className="panel-heading"><div><h3>Calorie burn calculation</h3><p>Mifflin–St Jeor BMR with a configurable daily activity multiplier.</p></div><Flame size={17}/></div><label className="activity-factor-setting">Daily activity multiplier<input type="number" min="1" max="2.4" step="0.05" value={activityFactor} onChange={e=>setActivityFactor(Math.min(2.4,Math.max(1,Number(e.target.value)||1)))}/><small>1.00 = resting baseline · 1.20 = sedentary · 1.55 = moderately active</small></label><p className="module-disclaimer">BMR continues to use your age, height, weight, and sex. This multiplier adjusts the daily baseline before logged exercise is added.</p></section><section className="panel setting-row"><div><b>Food preferences</b><small>Default suggestions avoid meat and fish.</small></div><span className="pref-tag">Eggetarian</span></section><section className="panel setting-row"><div><b>Privacy by default</b><small>Your tracking data syncs to your owner-only Atlas record.</small></div><span className="privacy-tag"><Heart size={13}/> Private cloud</span></section><section className="panel setting-row"><div><b>Owner session</b><small>End this private session on this device.</small></div><button className="secondary-btn" onClick={()=>signOut({callbackUrl:"/login"})}>Sign out</button></section><section className="panel settings-reset"><span className="settings-reset-icon"><AlertTriangle size={17}/></span><div><h3>Start over</h3><p>Erase your profile, habits, workouts, food logs, goals, and history from this device and your private owner record. You’ll be returned to profile setup.</p></div><button className="settings-reset-button" type="button" disabled={resetBusy} onClick={() => void resetPulse()}>{resetBusy ? "Resetting…" : "Erase all PULSE data"}</button>{resetError && <p className="settings-reset-error" role="alert">{resetError}</p>}</section><div className="module-disclaimer">PULSE syncs edits to Atlas after a short delay. Keep a separate backup of important personal records.</div></div>;
}
