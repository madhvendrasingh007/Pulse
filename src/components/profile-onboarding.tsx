// FILE NAME: src/components/profile-onboarding.tsx
"use client";

import "../styles/pages/profile-onboarding.css";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import Image from "next/image";
import { ArrowRight, CalendarDays, Flame, Gauge, Ruler, Scale, ShieldCheck } from "lucide-react";
import type { EnergyProfile } from "@/lib/calculations/energy";

type FieldName = "age" | "height" | "weight";
const LIMITS: Record<FieldName, { min: number; max: number }> = {
  age: { min: 16, max: 110 },
  height: { min: 100, max: 250 },
  weight: { min: 30, max: 350 },
};

/** Eases a number toward its new value. */
function CountUp({ value, decimals = 0 }: { value: number | null; decimals?: number }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const target = value ?? 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(target); from.current = target; return; }
    const begin = from.current, start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700);
      const next = begin + (target - begin) * (1 - Math.pow(1 - t, 3));
      from.current = next; setShown(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  if (value === null) return <>—</>;
  return <>{decimals ? shown.toFixed(decimals) : Math.round(shown).toLocaleString("en-IN")}</>;
}

export function ProfileOnboarding({ onComplete }: { onComplete: (profile: EnergyProfile) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<EnergyProfile["gender"]>("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const values: Record<FieldName, string> = { age, height, weight };
  const errorFor = (name: FieldName) => {
    const raw = values[name];
    if (raw.trim() === "") return "Required";
    const n = Number(raw), { min, max } = LIMITS[name];
    return Number.isFinite(n) && n >= min && n <= max ? "" : `Enter ${min}–${max}`;
  };
  const showError = (name: FieldName) => (submitted || touched[name]) ? errorFor(name) : "";
  const validCount = (["age", "height", "weight"] as FieldName[]).filter(name => !errorFor(name)).length;
  const allValid = validCount === 3;

  // Live estimates (Mifflin–St Jeor + BMI), shown once all three numbers are valid
  const bmr = allValid ? 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) + (gender === "male" ? 5 : -161) : null;
  const bmi = allValid ? Number(weight) / Math.pow(Number(height) / 100, 2) : null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (!allValid) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('input[aria-invalid="true"]')?.focus());
      return;
    }
    onComplete({ age: Number(age), gender, heightCm: Number(height), weightKg: Number(weight) });
  };

  const field = (name: FieldName, label: string, unit: string, placeholder: string, value: string, set: (v: string) => void, icon: ReactNode, step?: string, i = 0) => {
    const error = showError(name);
    return <label className={`po-field${error ? " has-error" : ""}`} style={{ "--i": i } as CSSProperties}>
      <span className="po-label">{icon}{label}</span>
      <span className="po-input">
        <input required type="number" inputMode={step ? "decimal" : "numeric"} min={LIMITS[name].min} max={LIMITS[name].max} step={step} value={value} placeholder={placeholder}
          aria-invalid={error ? true : undefined} aria-describedby={error ? `po-${name}-err` : undefined}
          onChange={e => set(e.target.value)} onBlur={() => setTouched(t => ({ ...t, [name]: true }))}/>
        <em>{unit}</em>
      </span>
      <small id={`po-${name}-err`} className="po-error" role={error ? "alert" : undefined}>{error}</small>
    </label>;
  };

  return <main className="po">
    <div className="po-bg" aria-hidden="true"><i className="b1"/><i className="b2"/></div>
    <div className="po-wrap">
      {/* ===== Intro ===== */}
      <section className="po-intro">
        <div className="po-mark" style={{ "--i": 0 } as CSSProperties}><Image src="/app-icon.png" alt="PULSE" width={512} height={512} priority/></div>
        <span className="po-kicker" style={{ "--i": 1 } as CSSProperties}>A private start</span>
        <h1 style={{ "--i": 2 } as CSSProperties}>Let’s set your <em>baseline.</em></h1>
        <p className="po-lead" style={{ "--i": 3 } as CSSProperties}>Your energy estimates need a few details. They go into your owner-only PULSE record in Atlas and are not included in the public project code.</p>
        <div className="po-preview" aria-live="polite">
          <article className={allValid ? "is-ready" : ""} style={{ "--i": 4 } as CSSProperties}>
            <span><Flame size={15}/>Estimated BMR</span>
            <b><CountUp value={bmr}/>{bmr !== null && <small> kcal</small>}</b>
            <p>Resting energy per day</p>
          </article>
          <article className={allValid ? "is-ready" : ""} style={{ "--i": 5 } as CSSProperties}>
            <span><Gauge size={15}/>BMI</span>
            <b><CountUp value={bmi} decimals={1}/></b>
            <p>Weight ÷ height²</p>
          </article>
        </div>
      </section>

      {/* ===== Form ===== */}
      <section className="po-card" style={{ "--i": 2 } as CSSProperties}>
        <div className="po-progress" role="progressbar" aria-label="Profile completion" aria-valuemin={0} aria-valuemax={3} aria-valuenow={validCount}>
          <div className="po-progress-track"><i style={{ transform: `scaleX(${validCount / 3})` }}/></div>
          <span>{validCount} of 3 details</span>
        </div>
        <form ref={formRef} className="po-form" onSubmit={submit} noValidate>
          {field("age", "Age", "years", "e.g. 28", age, setAge, <CalendarDays size={14}/>, undefined, 0)}
          <div className="po-field" style={{ "--i": 1 } as CSSProperties}>
            <span className="po-label" id="po-gender">Gender formula</span>
            <div className="po-seg" role="radiogroup" aria-labelledby="po-gender" data-value={gender}>
              <i className="po-seg-thumb" aria-hidden="true"/>
              {(["male", "female"] as const).map(option => <button key={option} type="button" role="radio" aria-checked={gender === option} onClick={() => setGender(option)}>{option === "male" ? "Male" : "Female"}</button>)}
            </div>
            <small className="po-hint">Mifflin–St Jeor equation</small>
          </div>
          {field("height", "Height", "cm", "e.g. 175", height, setHeight, <Ruler size={14}/>, "0.1", 2)}
          {field("weight", "Current weight", "kg", "e.g. 70", weight, setWeight, <Scale size={14}/>, "0.1", 3)}
          <button className="po-submit" type="submit"><span>Save private profile</span><ArrowRight size={17}/></button>
        </form>
        <p className="po-privacy"><ShieldCheck size={14}/> Saved to your private owner record · Never published in the app source</p>
      </section>
    </div>
  </main>;
}
