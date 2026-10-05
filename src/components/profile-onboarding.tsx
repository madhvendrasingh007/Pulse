"use client";

import { useState } from "react";
import { Activity, ArrowRight, ShieldCheck } from "lucide-react";
import type { EnergyProfile } from "@/lib/calculations/energy";

export function ProfileOnboarding({ onComplete }: { onComplete: (profile: EnergyProfile) => void }) {
  const [age,setAge]=useState("");const [gender,setGender]=useState<EnergyProfile["gender"]>("male");const [height,setHeight]=useState("");const [weight,setWeight]=useState("");
  const submit=(event:React.FormEvent<HTMLFormElement>)=>{event.preventDefault();const profile={age:Number(age),gender,heightCm:Number(height),weightKg:Number(weight)};if(profile.age<16||profile.age>110||profile.heightCm<100||profile.heightCm>250||profile.weightKg<30||profile.weightKg>350)return;onComplete(profile)};
  return <main className="profile-setup"><section className="profile-setup-card"><div className="sync-mark"><Activity size={23}/></div><span className="eyebrow">A PRIVATE START</span><h1>Let’s set your baseline.</h1><p>Your energy estimates need a few details. They go into your owner-only PULSE record in Atlas and are not included in the public project code.</p><form className="profile-setup-form" onSubmit={submit}><div className="profile-fields"><label>Age<input required type="number" min="16" max="110" value={age} onChange={e=>setAge(e.target.value)} placeholder="Years"/></label><label>Gender formula<select value={gender} onChange={e=>setGender(e.target.value as EnergyProfile["gender"])}><option value="male">Male · Mifflin–St Jeor</option><option value="female">Female · Mifflin–St Jeor</option></select></label><label>Height<input required type="number" min="100" max="250" step="0.1" value={height} onChange={e=>setHeight(e.target.value)} placeholder="cm"/></label><label>Current weight<input required type="number" min="30" max="350" step="0.1" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="kg"/></label></div><button className="primary-btn" type="submit">Save private profile <ArrowRight size={15}/></button></form><div className="profile-privacy"><ShieldCheck size={14}/> Saved to your private owner record · Never published in the app source</div></section></main>;
}
