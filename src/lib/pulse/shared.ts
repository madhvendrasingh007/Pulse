import type React from "react";
import { useEffect, useState } from "react";
import { Activity, AlarmClock, Apple, Bath, BedDouble, Bike, BookMarked, BookOpen, Brain, Check, CigaretteOff, CircleCheck, CircleDot, Clock3, CloudSun, Coffee, CupSoda, Droplet, Droplets, Dumbbell, Flame, Flower, Flower2, Footprints, GlassWater, HandHeart, Heart, HeartPulse, Home, Leaf, Lightbulb, Moon, Mountain, MoveUp, Music, NotebookPen, PersonStanding, Pill, RefreshCcw, Salad, Settings, ShieldCheck, Smile, Snowflake, Sparkles, Sprout, Star, StretchHorizontal, Sun, Sunrise, Target, Thermometer, Timer, Trees, TrendingUp, Utensils, Waves, Weight, Wind, Zap, CalendarDays } from "lucide-react";
import type { LucideIcon } from "lucide-react";
export type Page = "Dashboard" | "Habits" | "Workouts" | "Nutrition" | "Face Care" | "Calorie Burn" | "Weight" | "Planner" | "History" | "Insights" | "AI Coach" | "Settings";
export type Food = { id: string; date: string; name: string; amount: string; calories: number; protein: number; carbs: number; fats: number };
export type Habit = { id: string; title: string; detail: string; iconKey: string; color: string; days?: number[]; completions?: Record<string,boolean>; done?: boolean; archived?:boolean };
export type FoodDraft={name:string;amount:string;calories:string;protein:string;carbs:string;fats:string};
export type WeightLog = { id: string; date: string; weight: number };
export type CalorieDay = { date:string; consumed:number; exercise:number; deficit:number; totalBurn:number; protein:number; carbs:number };
export type WeeklyExercise={id:string;name:string;sets:number;reps:string;mediaUrl:string;focus?:string;secondaryMuscles?:string;actualSets:{reps:string;weight:string;done?:boolean}[];completedDates?:string[]};export type FaceStep={id:string;label:string;why:string;time:string};export type FaceRoutineState={startDate:string;completed:Record<string,string[]>;custom?:Record<string,Record<string,{morning:FaceStep[];night:FaceStep[]}>>};
export const eventDay=(date:string)=>String(date).slice(0,10);
export const localDay = (date = new Date()) => { const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return d.toISOString().slice(0, 10); };
export const nav: { name: Page; icon: LucideIcon }[] = [
  { name: "Dashboard", icon: Home }, { name: "Habits", icon: Check }, { name: "Workouts", icon: Dumbbell }, { name: "Nutrition", icon: Apple }, { name: "Face Care", icon: Flower2 }, { name: "Calorie Burn", icon: Flame }, { name: "Weight", icon: Weight }, { name: "Planner", icon: CalendarDays }, { name: "History", icon: Clock3 }, { name: "Insights", icon: TrendingUp }, { name: "AI Coach", icon: Sparkles }, { name: "Settings", icon: Settings },
];
export const faceRoutineSteps=(date:string,startDate:string,weekdayOverride?:number,monthOverride?:1|2,custom?:FaceRoutineState["custom"])=>{
  const dayNumber=Math.floor((new Date(`${date}T12:00:00`).getTime()-new Date(`${startDate}T12:00:00`).getTime())/86400000)+1;
  const month=monthOverride??(dayNumber>30?2:1);
  const phaseDay=monthOverride===1?Math.min(30,Math.max(1,dayNumber)):monthOverride===2?Math.max(31,dayNumber):dayNumber;
  const phase=phaseDay<=14?1:phaseDay<=28?2:phaseDay<=42?3:4;
  const phaseLabel=month===1?"Barrier and brightening":phase===1?"Weeks 1–2":phase===2?"Weeks 3–4":phase===3?"Weeks 5–6":"Weeks 7–8";
  const weekday=weekdayOverride??new Date(`${date}T12:00:00`).getDay();
  const applyCustom=(baseMorning:FaceStep[],baseNight:FaceStep[])=>{const override=custom?.[String(month)]?.[String(weekday)];const finalMorning=override?.morning??baseMorning;const finalNight=override?.night??baseNight;return{month,phase,phaseLabel,morning:finalMorning,night:finalNight,steps:[...finalMorning,...finalNight]}};
  const morning=month===1?[
    {id:"am-cleanse",label:"Water rinse or cleanse if skin feels oily",why:"Use a water rinse when comfortable; the 2% salicylic cleanser is reserved for night.",time:"Morning"},
    {id:"am-toner",label:"Toner · optional",why:"Use Wonder Mochi toner only if it feels comfortable; skip if it stings.",time:"Morning"},
    {id:"am-vitamin-c",label:"Vitamin C serum · 10%",why:"Apply after cleansing and optional toner.",time:"Morning"},
    {id:"am-moisturize",label:"Oil-free gel moisturiser",why:"Apply a light layer to keep skin comfortable.",time:"Morning"},
    {id:"am-sunscreen",label:"Sunscreen · face, neck, and ears",why:"Use two finger-lengths. Reapply every 2–3 hours outdoors or after sweating.",time:"Morning"},
    {id:"am-lip-spf",label:"SPF lip balm",why:"Protect lips during the day; avoid licking or peeling them.",time:"Morning"},
  ]:[
    {id:"am-cleanse",label:"Gentle cleanse (or water rinse if you barely sweated)",why:"Cleans away sweat and oil without scrubbing.",time:"Morning"},
    {id:"am-toner",label:"Wonder Mochi toner",why:"Apply after cleansing.",time:"Morning"},
    {id:"am-vitamin-c",label:"Vitamin C serum",why:"Apply after toner and wait 1–2 minutes. Skip the next morning if your skin feels sensitive after retinol.",time:"Morning"},
    ...(phaseDay>=31?[{id:"am-eye-cream",label:"Caffeine eye gel",why:"Month 2 addition. Apply gently under the eyes.",time:"Morning"}]:[]),
    {id:"am-moisturize",label:"Light gel moisturiser",why:"Helps keep skin comfortable and supports the skin barrier.",time:"Morning"},
    {id:"am-sunscreen",label:"Sunscreen · face and neck",why:"Apply generously. Prefer PA++++ outdoors or on sweaty days; reapply around lunch after outdoor time or sweating.",time:"Morning"},
    ...(phaseDay>=31?[{id:"am-lip-spf",label:"SPF lip balm",why:"Protect lips during the day.",time:"Morning"}]:[]),
  ];
  if(month===1){
    const treatment=weekday===1?[{id:"pm-niacinamide",label:"Niacinamide serum",why:"Monday treatment for Month 1.",time:"Evening"}]:weekday===2?[{id:"pm-azelaic",label:"Azelaic acid · 10%",why:"Tuesday treatment. A mild tingle can happen at first; if it burns, reduce to once weekly for a while.",time:"Evening"}]:weekday===4?[{id:"pm-niacinamide",label:"Niacinamide serum",why:"Thursday treatment for Month 1.",time:"Evening"}]:weekday===5?[{id:"pm-azelaic",label:"Azelaic acid · 10%",why:"Friday treatment. Keep this separate from any retinoid use.",time:"Evening"}]:weekday===6?[{id:"pm-multani",label:"Multani mitti mask · 10 minutes",why:"Saturday only, T-zone only. No serum tonight; rinse, then moisturise.",time:"Evening"}]:[{id:"pm-recovery",label:"Rest night · moisturiser only",why:"Wednesday and Sunday are recovery nights with no face treatment.",time:"Evening"}];
    const night=[
      {id:"pm-cleanse",label:"Cleanse · salicylic cleanser at night",why:"If you wore sunscreen or sweated heavily, remove it first with micellar water or an oil cleanser, then use the Minimalist 2% salicylic cleanser. No separate BHA is needed.",time:"Evening"},
      {id:"pm-toner",label:"Toner · optional",why:"Apply after cleansing if it does not sting; skip if uncomfortable.",time:"Evening"},
      ...treatment,
      {id:"pm-moisturize",label:"Oil-free gel moisturiser",why:"Apply after the treatment, or use alone on Wednesday and Sunday recovery nights.",time:"Evening"},
      {id:"pm-neck-care",label:"Neck care · Nigrifix or urea/lactic lotion",why:"Apply to the neck at night as directed. Do not scrub; check Nigrifix ingredients before using it continuously.",time:"Evening"},
      {id:"pm-lip-care",label:"Nivea lip cream",why:"Use at night. Avoid licking or peeling dry lips.",time:"Evening"},
    ];
    return applyCustom(morning,night);
  }
  const activeNight=weekday===0?[]:phase===1?[{id:"pm-niacinamide",label:"Niacinamide",why:"Use Monday–Saturday in Weeks 1–2 if comfortable.",time:"Evening"}]:phase===2?(weekday===1||weekday===3||weekday===5?[{id:"pm-azelaic",label:"Azelaic acid",why:"Monday, Wednesday, and Friday in Weeks 3–4. Patch test before starting.",time:"Evening"}]:[{id:"pm-niacinamide",label:"Niacinamide",why:"Tuesday, Thursday, and Saturday in Weeks 3–4 if comfortable.",time:"Evening"}]):phase===3?(weekday===1?[{id:"pm-retinol",label:"Retinol · pea-sized amount",why:"Weeks 5–6: Monday only. Start on dry skin, avoid the eye area, and do not combine with azelaic acid the same night.",time:"Evening"}]:weekday===3||weekday===5?[{id:"pm-azelaic",label:"Azelaic acid",why:"Wednesday and Friday in Weeks 5–6, on nights separate from retinol.",time:"Evening"}]:weekday===6?[{id:"pm-hydrating-mask",label:"Niacinamide + hydrating mask",why:"Saturday option for Weeks 5–6; skip the mask if it irritates.",time:"Evening"}]:[{id:"pm-niacinamide",label:"Niacinamide",why:"Tuesday and Thursday in Weeks 5–6 if comfortable.",time:"Evening"}]):(weekday===1||weekday===5?[{id:"pm-retinol",label:"Retinol · pea-sized amount",why:"Weeks 7–8: Monday and Friday. Keep it separate from azelaic acid and reduce frequency if irritated.",time:"Evening"}]:weekday===3?[{id:"pm-azelaic",label:"Azelaic acid",why:"Wednesday in Weeks 7–8, on a separate night from retinol.",time:"Evening"}]:weekday===6?[{id:"pm-saturday-option",label:"Azelaic acid OR niacinamide + hydrating mask",why:"Choose one Saturday option in Weeks 7–8; keep the mask optional.",time:"Evening"}]:[{id:"pm-niacinamide",label:"Niacinamide",why:"Tuesday and Thursday in Weeks 7–8 if comfortable.",time:"Evening"}]);
  const night=[
    {id:"pm-cleanse",label:"Gentle cleanse",why:"Wash after heavy sweating and remove sunscreen without scrubbing.",time:"Evening"},
    ...(weekday===6&&phase<=2?[{id:"pm-multani",label:"Multani mitti · T-zone only · 10 minutes",why:"Saturday only in Weeks 1–4. Keep it away from the eyes and skip if it irritates.",time:"Evening"}]:[]),
    {id:"pm-toner",label:"Wonder Mochi toner",why:"Apply after cleansing.",time:"Evening"},...activeNight,
    ...(phaseDay>=31?[{id:"pm-eye-cream",label:"Caffeine eye gel",why:"Month 2 addition. Apply gently before moisturiser.",time:"Evening"}]:[]),
    {id:"pm-moisturize",label:"Gel moisturiser",why:"Finish with moisturiser. Do not use retinol and azelaic acid on the same night.",time:"Evening"},
    ...(weekday===0?[{id:"pm-recovery",label:"Sunday recovery night",why:"Keep Sunday to moisturiser only for the face and neck.",time:"Evening"}]:[{id:"pm-neck-care",label:"Neck: Nigrifix as directed, then moisturiser",why:"Neck only, Monday–Saturday. Do not scrub; pause if irritated and follow the product label.",time:"Evening"}]),
    ...(phaseDay>=31?[{id:"pm-lip-care",label:"Nivea lip cream",why:"Use at night.",time:"Evening"}]:[]),
  ];
  return applyCustom(morning,night);
};export const habitIcons: Record<string, LucideIcon> = { sun:Sun, sunrise:Sunrise, cloudSun:CloudSun, moon:Moon, heart:Heart, heartPulse:HeartPulse, activity:Activity, workout:Dumbbell, bike:Bike, walk:PersonStanding, footsteps:Footprints, stretch:StretchHorizontal, breathe:Wind, steam:Waves, ice:Snowflake, water:Droplets, glass:GlassWater, droplet:Droplet, serum:Flower2, ointment:Pill, leaf:Leaf, sprout:Sprout, trees:Trees, book:BookOpen, journal:NotebookPen, brain:Brain, smile:Smile, sparkles:Sparkles, star:Star, target:Target, timer:Timer, clock:AlarmClock, coffee:Coffee, soda:CupSoda, apple:Apple, salad:Salad, meal:Utensils, bath:Bath, shield:ShieldCheck, light:Lightbulb, music:Music, warmth:Thermometer, refresh:RefreshCcw, mountain:Mountain, energy:Zap, steps:MoveUp, check:Check, habitCheck:CircleCheck, habitDot:CircleDot, care:HandHeart, bookMarked:BookMarked, flame:Flame, noSmoke:CigaretteOff, rest:BedDouble, focus:Target, flower:Flower };
export const habitIconOptions: [string,string][] = [["sun","Morning sunlight"],["sunrise","Sunrise"],["cloudSun","Daylight"],["moon","Sleep / evening"],["heart","Heart health"],["heartPulse","Pulse"],["activity","Activity"],["workout","Workout"],["bike","Cycling"],["walk","Walking"],["footsteps","Steps"],["stretch","Stretching"],["breathe","Breathing"],["steam","Steam"],["ice","Ice / cooling"],["water","Drink water"],["glass","Water glass"],["serum","Serum / skincare"],["ointment","Ointment"],["leaf","Wellness"],["sprout","Growth"],["book","Reading"],["journal","Journaling"],["brain","Mindfulness"],["smile","Mood"],["sparkles","Self care"],["target","Target"],["timer","Timed habit"],["clock","Routine"],["coffee","Coffee"],["apple","Fruit"],["salad","Healthy meal"],["meal","Meal"],["bath","Bath"],["shield","Health"],["music","Music"],["warmth","Temperature"],["refresh","Reset"],["energy","Energy"],["check","Check-in"]];
export const habitColorOptions: [string,string][] = [["orange","Coral"],["lime","Lime"],["violet","Violet"],["blue","Blue"],["rose","Rose"],["amber","Amber"],["teal","Teal"],["sky","Sky"],["pink","Pink"],["mint","Mint"],["indigo","Indigo"]];
export const habitColorValues: Record<string,string> = { orange:"#ff9065", lime:"#b4e86e", violet:"#a899ff", blue:"#69b7ff", rose:"#ed6b98", amber:"#f2bd4d", teal:"#49c9b5", sky:"#4aa9db", pink:"#e47ad4", mint:"#62c99a", indigo:"#7777e9" };
export const weekKeys=["sun","mon","tue","wed","thu","fri","sat"] as const;
export const dayNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
export const initialHabits: Habit[] = [
  { id:"habit-sun", title:"Morning sunlight", detail:"10 min · Wellness", iconKey:"sun", color:"orange", days:[0,1,2,3,4,5,6] },
  { id:"habit-workout", title:"Workout", detail:"Movement · Training", iconKey:"workout", color:"violet", days:[1,3,5] },
  { id:"habit-serum", title:"Apply serum", detail:"Skincare · Morning", iconKey:"serum", color:"orange", days:[1,3,5] },
  { id:"habit-ointment", title:"Apply ointment", detail:"Skincare · Evening", iconKey:"ointment", color:"blue", days:[2,4,6] },
  { id:"habit-read", title:"Reading", detail:"20 min · Mind", iconKey:"book", color:"violet", days:[0,1,2,3,4,5,6] },
  { id:"habit-water", title:"Drink water", detail:"2.5 L · Health", iconKey:"water", color:"blue", days:[0,1,2,3,4,5,6] },
  { id:"habit-steam", title:"Steam", detail:"Skincare · Self care", iconKey:"steam", color:"lime", days:[2,4,6] },
  { id:"habit-ice", title:"Apply ice on face", detail:"Skincare · Sunday routine", iconKey:"ice", color:"blue", days:[0] },
];
export const defaultGoals = { calories: 2100, protein: 130, carbs: 240, fats: 70 };
export const fmt = (n: number) => Math.round(n).toLocaleString();
export const habitOnDate=(habit:Habit,date:string)=>!Array.isArray(habit.days)||habit.days.includes(new Date(`${date}T12:00:00`).getDay());
export const habitDoneOnDate=(habit:Habit,date:string)=>habit.completions?.[date]??(date===localDay()&&habit.done===true);

export function useLocalStorageState<T>(key:string,initial:T):[T,React.Dispatch<React.SetStateAction<T>>,boolean]{
  const [value,setValue]=useState<T>(initial);const [loaded,setLoaded]=useState(false);
  useEffect(()=>{try{const stored=localStorage.getItem(key);if(stored!==null)setValue(JSON.parse(stored) as T)}catch{}finally{setLoaded(true)}},[key]);
  useEffect(()=>{const hydrate=()=>{try{const stored=localStorage.getItem(key);if(stored!==null)setValue(JSON.parse(stored) as T)}catch{}};window.addEventListener("pulse-cloud-hydrated",hydrate);return()=>window.removeEventListener("pulse-cloud-hydrated",hydrate)},[key]);
  useEffect(()=>{if(loaded){localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new Event("pulse-local-write"))}},[key,value,loaded]);
  return [value,setValue,loaded];
}
