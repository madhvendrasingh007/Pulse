// FILE NAME: src/components/pages/insights.tsx
"use client";

import "@/styles/pages/insights.css";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Activity, Apple, Flame, Sparkles } from "lucide-react";
import { fmt } from "@/lib/pulse/shared";

/** Number that eases toward its new value. */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(value); from.current = value; return; }
    const begin = from.current, start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const next = begin + (value - begin) * (1 - Math.pow(1 - t, 3));
      from.current = next; setShown(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{fmt(Math.round(shown))}</>;
}

export function InsightsPage({ averageCalories, bmr, deficit }: { averageCalories: number; bmr: number; deficit: number }) {
  const isDeficit = deficit >= 0;
  const hasLogs = averageCalories > 0;
  // Meter: average intake against BMR, scaled to 0–150% so the BMR marker sits at 2/3.
  const ratio = bmr > 0 ? averageCalories / bmr : 0;
  const meter = Math.min(1.5, ratio) / 1.5;
  const gap = averageCalories - bmr;

  return <div className="ins">
    {/* ===== Hero ===== */}
    <section className="ins-hero" aria-label="Selected day energy balance">
      <div className="ins-balance">
        <span className={`ins-chip ${isDeficit ? "is-deficit" : "is-surplus"}`}>{isDeficit ? "Estimated deficit" : "Estimated surplus"}</span>
        <strong key={deficit} className="ins-num"><CountUp value={Math.abs(deficit)}/> <small>kcal</small></strong>
        <p>Selected day · burn minus food energy</p>
      </div>
      <div className="ins-meter" role="img" aria-label={hasLogs ? `Average intake is ${Math.round(ratio * 100)}% of your BMR` : "No food logs yet"}>
        <div className="ins-meter-top"><span>Average intake vs BMR</span><b>{hasLogs ? `${Math.round(ratio * 100)}%` : "—"}</b></div>
        <div className="ins-track"><i style={{ transform: `scaleX(${meter})` }}/><u aria-hidden="true"/></div>
        <div className="ins-meter-foot"><span>0</span><span>BMR {fmt(bmr)}</span><span>150%</span></div>
      </div>
    </section>

    {/* ===== Stats ===== */}
    <section className="ins-grid" aria-label="Key numbers">
      <article className="ins-card" style={{ "--i": 0 } as CSSProperties}>
        <span className="ins-icon is-intake"><Apple size={17}/></span>
        <div><small>Average daily intake</small><strong><CountUp value={averageCalories}/> <em>kcal</em></strong><p>Average across days where you have food logs.</p></div>
      </article>
      <article className="ins-card" style={{ "--i": 1 } as CSSProperties}>
        <span className="ins-icon is-bmr"><Activity size={17}/></span>
        <div><small>Your current BMR</small><strong><CountUp value={bmr}/> <em>kcal</em></strong><p>Updates when you log a new weight.</p></div>
      </article>
      <article className="ins-card" style={{ "--i": 2 } as CSSProperties}>
        <span className="ins-icon is-gap"><Flame size={17}/></span>
        <div><small>Average intake vs BMR</small><strong className={hasLogs ? (gap > 0 ? "is-up" : "is-down") : ""}>{hasLogs ? `${gap > 0 ? "+" : "−"}${fmt(Math.abs(Math.round(gap)))}` : "—"} {hasLogs && <em>kcal</em>}</strong><p>{hasLogs ? "Positive means you eat above your resting energy." : "Appears once you log food."}</p></div>
      </article>
    </section>

    {/* ===== Tip ===== */}
    <section className="ins-tip" style={{ "--i": 3 } as CSSProperties}>
      <span className="ins-spark"><Sparkles size={17}/></span>
      <div>
        <strong>{hasLogs ? "Keep logging consistently" : "Start with a few logged days"}</strong>
        <p>{hasLogs ? "Daily averages become more useful as you record more days of food and exercise." : "Averages appear once you log food on at least one day. A few days of entries make the numbers more useful."}</p>
        <small>Calculated from your local logs</small>
      </div>
    </section>
  </div>;
}
