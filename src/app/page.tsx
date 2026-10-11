"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Activity, Apple, ArrowRight, Check, Dumbbell, Flame, Heart, Sparkles, Weight, X, CalendarDays } from "lucide-react";

import { calculateEnergy, type EnergyProfile } from "@/lib/calculations/energy";
import { type CoachAction } from "@/components/coach-assistant";
import { ProfileOnboarding } from "@/components/profile-onboarding";
import { type PlannerEvent } from "@/components/planner-manager";


import { localDay, weekKeys, initialHabits, defaultGoals, fmt, habitOnDate, habitDoneOnDate, faceRoutineSteps, useLocalStorageState, eventDay, habitIcons, habitIconOptions, habitColorOptions, habitColorValues } from "@/lib/pulse/shared";
import type { Page, Food, Habit, FoodDraft, WeightLog, WeeklyExercise, FaceRoutineState } from "@/lib/pulse/shared";







import { PageRouter } from "@/components/page-router";
import { AppSidebar, AppTopbar, AppMobileNav } from "@/components/app-navigation";
import { DashboardPage } from "@/components/dashboard-page";

export default function PulseHome() {
  const [page, setPage] = useState<Page>("Dashboard");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [ready, setReady] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [foodOpen, setFoodOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodsLoaded, setFoodsLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(localDay());
  const [habitDate,setHabitDate]=useState(localDay());
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [habits, setHabits, habitsLoaded] = useLocalStorageState<Habit[]>("pulse-habits",initialHabits);
  const [weights,setWeights]=useLocalStorageState<WeightLog[]>("pulse-weight-logs",[]);
  const [profile,setProfile]=useLocalStorageState<EnergyProfile>("pulse-energy-profile",{age:0,gender:"male",heightCm:0,weightKg:0});
  const [nutritionGoals,setNutritionGoals]=useLocalStorageState("pulse-nutrition-goals",defaultGoals);
  const [activityFactor,setActivityFactor]=useLocalStorageState("pulse-activity-factor",1.2);
  const [exerciseBurns,setExerciseBurns]=useLocalStorageState<Record<string,number>>("pulse-exercise-burns",{});
  const [calorieTargets,setCalorieTargets]=useLocalStorageState<Record<string,{calories:number;protein:number;carbs:number;fats:number}>>("pulse-calorie-targets",{});
  const [events,setEvents]=useLocalStorageState<PlannerEvent[]>("pulse-events",[]);
  const [weeklyWorkouts,setWeeklyWorkouts]=useLocalStorageState<Record<string,WeeklyExercise[]>>("pulse-weekly-workouts",{});
  const [faceRoutine,setFaceRoutine]=useLocalStorageState<FaceRoutineState>("pulse-face-routine",{startDate:(()=>{const d=new Date();return localDay(new Date(d.getFullYear(),d.getMonth()+(d.getDate()>12?1:0),12))})(),completed:{}});
  const [faceMonthSelection,setFaceMonthSelection]=useState<1|2|null>(null);
  const [habitOpen,setHabitOpen]=useState(false);
  const [editingHabitId,setEditingHabitId]=useState<string|null>(null);
  const [habitDraft,setHabitDraft]=useState({title:"",detail:"",iconKey:"check",color:"lime",days:[0,1,2,3,4,5,6] as number[]});
  const [hoverIcon,setHoverIcon]=useState<string|null>(null);
  const [hoverColor,setHoverColor]=useState<string|null>(null);
  const previewIconKey=hoverIcon??habitDraft.iconKey;
  const previewColorKey=hoverColor??habitDraft.color;
  const PreviewIcon=habitIcons[previewIconKey]??Check;
  const previewLabel=hoverIcon?habitIconOptions.find(([k])=>k===hoverIcon)?.[1]:hoverColor?habitColorOptions.find(([k])=>k===hoverColor)?.[1]:null;
  const [weightOpen,setWeightOpen]=useState(false);
  const [weightDraft,setWeightDraft]=useState({date:localDay(),weight:0,oldDate:""});
  const [plannerAddRequest,setPlannerAddRequest]=useState(0);
  const [workoutAddRequest,setWorkoutAddRequest]=useState(0);
  const [notice, setNotice] = useState("");
  const [cloudReady,setCloudReady]=useState(false);const [cloudError,setCloudError]=useState("");const [cloudRetry,setCloudRetry]=useState(0);
  const cloudRevision=useRef<string|null>(null);const cloudConflict=useRef(false);
  const [food, setFood] = useState<FoodDraft>({ name: "", amount: "1 serving", calories: "", protein: "", carbs: "", fats: "" });
  const dayFoods = useMemo(() => foods.filter((f) => f.date === selectedDate), [foods, selectedDate]);
  const todayFoods = useMemo(()=>foods.filter(f=>f.date===localDay()),[foods]);
  const nutrition = useMemo(() => dayFoods.reduce((a, f) => ({ calories: a.calories + f.calories, protein: a.protein + f.protein, carbs: a.carbs + f.carbs, fats: a.fats + f.fats }), { calories: 0, protein: 0, carbs: 0, fats: 0 }), [dayFoods]);
  const todayNutrition=useMemo(()=>todayFoods.reduce((a,f)=>({calories:a.calories+f.calories,protein:a.protein+f.protein,carbs:a.carbs+f.carbs,fats:a.fats+f.fats}),{calories:0,protein:0,carbs:0,fats:0}),[todayFoods]);
  const calorieDays = useMemo(()=>{const days=new Map<string,number>();foods.forEach(f=>days.set(f.date,(days.get(f.date)??0)+f.calories));return [...days.values()]},[foods]);
  const averageCalories=calorieDays.length?calorieDays.reduce((sum,n)=>sum+n,0)/calorieDays.length:0;
  const calorieHistory=useMemo(()=>[...new Set([...foods.map(f=>f.date),...Object.keys(exerciseBurns)])].sort((a,b)=>b.localeCompare(a)).map(date=>{const dayFoods=foods.filter(f=>f.date===date);const consumed=dayFoods.reduce((sum,f)=>sum+f.calories,0);const protein=dayFoods.reduce((sum,f)=>sum+f.protein,0);const carbs=dayFoods.reduce((sum,f)=>sum+f.carbs,0);const exercise=exerciseBurns[date]??0;const dayEnergy=calculateEnergy(profile,consumed,exercise,activityFactor);return{date,consumed,exercise,protein,carbs,totalBurn:dayEnergy.totalBurn,deficit:dayEnergy.deficit}}),[foods,exerciseBurns,profile,activityFactor]);
  const energy=calculateEnergy(profile,nutrition.calories,exerciseBurns[selectedDate]??0,activityFactor);
  const todayEnergy=calculateEnergy(profile,todayNutrition.calories,exerciseBurns[localDay()]??0,activityFactor);
  const today=localDay();
  const energyTrend=Array.from({length:7},(_,index)=>{const dateObj=new Date();dateObj.setDate(dateObj.getDate()-(6-index));dateObj.setHours(12,0,0,0);const date=localDay(dateObj);const intake=foods.filter(food=>food.date===date).reduce((sum,food)=>sum+food.calories,0);const burn=calculateEnergy(profile,intake,exerciseBurns[date]??0,activityFactor).totalBurn;return{date,label:dateObj.toLocaleDateString("en-IN",{weekday:"short"}),intake,burn}});
  const currentFaceMonth=faceRoutineSteps(today,faceRoutine.startDate,undefined,undefined,faceRoutine.custom).month;
  useEffect(()=>{setFaceMonthSelection(null)},[currentFaceMonth]);
  const shownFaceMonth=faceMonthSelection??currentFaceMonth;
  const todayFace=faceRoutineSteps(today,faceRoutine.startDate,undefined,shownFaceMonth,faceRoutine.custom);
  const todayFaceDone=(faceRoutine.completed[today]??[]).filter(id=>todayFace.steps.some(step=>step.id===id)).length;
  const todayHabits=habits.filter(h=>!h.archived&&habitOnDate(h,today));
  const completedHabits=todayHabits.filter(h=>habitDoneOnDate(h,today));
  const todayWeekKey=weekKeys[new Date(`${today}T12:00:00`).getDay()];
  const todayWorkouts=weeklyWorkouts[todayWeekKey]??[];
  const completedWorkouts=todayWorkouts.filter(x=>x.completedDates?.includes(today));
  const upcomingEvents=[...events].filter(x=>!x.completed&&eventDay(x.date)>=today).sort((a,b)=>(eventDay(a.date)+a.time).localeCompare(eventDay(b.date)+b.time)).slice(0,5);
  const recentPastEvents=[...events].filter(x=>!x.completed&&eventDay(x.date)<today).sort((a,b)=>(eventDay(b.date)+b.time).localeCompare(eventDay(a.date)+a.time)).slice(0,5);
  useEffect(() => { const stored = localStorage.getItem("pulse-theme") as "dark" | "light" | null; const system = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"; setTheme(stored ?? system); setReady(true); }, []);
  useEffect(() => { const load=()=>{try { setFoods(JSON.parse(localStorage.getItem("pulse-food-logs") ?? "[]") as Food[]); } catch { setFoods([]); } finally { setFoodsLoaded(true); }};load();window.addEventListener("pulse-cloud-hydrated",load);return()=>window.removeEventListener("pulse-cloud-hydrated",load) }, []);
  useEffect(() => { if (foodsLoaded) {localStorage.setItem("pulse-food-logs", JSON.stringify(foods));window.dispatchEvent(new Event("pulse-local-write"))} }, [foods, foodsLoaded]);
  useEffect(()=>{const keys=["pulse-habits","pulse-weight-logs","pulse-energy-profile","pulse-exercise-burns","pulse-calorie-targets","pulse-nutrition-goals","pulse-activity-factor","pulse-events","pulse-weekly-workouts","pulse-food-logs","pulse-face-routine","pulse-theme"];
    const snapshot=()=>Object.fromEntries(keys.flatMap(key=>{const value=localStorage.getItem(key);if(value===null)return[];try{return[[key,JSON.parse(value)]]}catch{return[]}}));
    const load=async()=>{setCloudError("");cloudConflict.current=false;try{const response=await fetch("/api/state",{cache:"no-store"});if(!response.ok)throw new Error("PULSE could not connect to your private data store.");const result=await response.json() as {data:Record<string,unknown>|null;updatedAt:string|null};cloudRevision.current=result.updatedAt;
      if(result.data){for(const [key,value]of Object.entries(result.data))localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new Event("pulse-cloud-hydrated"));}
      else{const saved=await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:snapshot(),revision:null}),cache:"no-store"});if(!saved.ok)throw new Error("PULSE could not move this browser’s starter data into your private store.");const savedResult=await saved.json() as {updatedAt:string};cloudRevision.current=savedResult.updatedAt;}
      setCloudReady(true);
    }catch(error){setCloudError(error instanceof Error?error.message:"PULSE could not reach your private data store.");}};
    void load();
  },[cloudRetry]);
  useEffect(()=>{if(!cloudReady)return;let timer:ReturnType<typeof setTimeout>|undefined;let saving=false;let saveAgain=false;const snapshot=()=>{const keys=["pulse-habits","pulse-weight-logs","pulse-energy-profile","pulse-exercise-burns","pulse-calorie-targets","pulse-nutrition-goals","pulse-activity-factor","pulse-events","pulse-weekly-workouts","pulse-food-logs","pulse-face-routine","pulse-theme"];return Object.fromEntries(keys.flatMap(key=>{const raw=localStorage.getItem(key);if(raw===null)return[];try{return[[key,JSON.parse(raw)]]}catch{return[]}}))};const push=async()=>{if(cloudConflict.current)return;if(saving){saveAgain=true;return;}saving=true;do{saveAgain=false;try{const response=await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:snapshot(),revision:cloudRevision.current}),cache:"no-store"});if(response.status===409){cloudConflict.current=true;setNotice("A newer save exists on another device. Reload PULSE to sync before continuing.");break;}if(!response.ok){setNotice("Sync paused. Your data is still on this device; retry when your connection is back.");break;}const result=await response.json() as {updatedAt:string};cloudRevision.current=result.updatedAt;}catch{setNotice("Sync paused. Your data is still on this device; retry when your connection is back.");break;}}while(saveAgain&&!cloudConflict.current);saving=false;};const save=()=>{if(cloudConflict.current)return;if(timer)clearTimeout(timer);timer=setTimeout(()=>void push(),450);};window.addEventListener("pulse-local-write",save);return()=>{window.removeEventListener("pulse-local-write",save);if(timer)clearTimeout(timer)}},[cloudReady]);
  useEffect(() => { if (ready) { document.documentElement.dataset.theme = theme; localStorage.setItem("pulse-theme", theme);window.dispatchEvent(new Event("pulse-local-write")); } }, [theme, ready]);
  useEffect(()=>{const hydrateTheme=()=>{const stored=localStorage.getItem("pulse-theme");if(stored==="dark"||stored==="light")setTheme(stored)};window.addEventListener("pulse-cloud-hydrated",hydrateTheme);return()=>window.removeEventListener("pulse-cloud-hydrated",hydrateTheme)},[]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(""), 2600); return () => clearTimeout(t); }, [notice]);
  useEffect(()=>{if(!habitsLoaded)return;setHabits(current=>{const today=localDay();const usedIds=new Set<string>();const normalized=current.map((h,index)=>{let id=typeof h.id==="string"&&h.id?h.id:`habit-${index+1}`;while(usedIds.has(id))id=`${id}-${index+1}`;usedIds.add(id);return{...h,id,days:Array.isArray(h.days)?h.days:[0,1,2,3,4,5,6],completions:h.completions??(h.done?{[today]:true}:{}),done:undefined}});const existing=new Set(normalized.map(h=>h.title.trim().toLowerCase()));const merged=[...normalized,...initialHabits.filter(h=>!existing.has(h.title.toLowerCase()))];const finalIds=new Set<string>();const unique=merged.map((h,index)=>{let id=h.id;let suffix=index+1;while(finalIds.has(id)){id=h.id+"-"+suffix;suffix++}finalIds.add(id);return id===h.id?h:{...h,id}});return JSON.stringify(unique)===JSON.stringify(current)?current:unique})},[habitsLoaded,habits,setHabits]);
  const toggleHabit = (id:string,date=localDay()) => setHabits(all=>all.map(h=>{if(h.id!==id)return h;const completions={...(h.completions??{})};completions[date]=!habitDoneOnDate(h,date);return{...h,completions,done:undefined}}));
  const toggleFaceStep=(id:string,date:string)=>setFaceRoutine(current=>{const done=new Set(current.completed[date]??[]);done.has(id)?done.delete(id):done.add(id);return{...current,completed:{...current.completed,[date]:[...done]}}});
  const openHabitEditor=(habit?:Habit)=>{setEditingHabitId(habit?.id??null);setHabitDraft(habit?{title:habit.title,detail:habit.detail,iconKey:habit.iconKey,color:habit.color,days:Array.isArray(habit.days)?habit.days:[0,1,2,3,4,5,6]}:{title:"",detail:"",iconKey:"check",color:"lime",days:[0,1,2,3,4,5,6]});setHabitOpen(true)};
  const saveHabit=()=>{if(!habitDraft.title.trim()||!habitDraft.days.length)return;const habit={...habitDraft,id:editingHabitId??crypto.randomUUID(),title:habitDraft.title.trim(),detail:habitDraft.detail.trim()||"Personal habit"};setHabits(all=>editingHabitId?all.map(h=>h.id===editingHabitId?{...h,...habit}:h):[...all,habit]);setHabitOpen(false);setNotice(editingHabitId?"Habit updated.":"Habit added.")};
  const removeHabit=(id:string)=>{setHabits(all=>all.map(h=>h.id===id?{...h,archived:true}:h));setNotice("Habit removed.")};
  const openWeightEntry=(entry?:WeightLog)=>{setWeightDraft(entry?{date:entry.date,weight:entry.weight,oldDate:entry.date}:{date:localDay(),weight:profile.weightKg,oldDate:""});setWeightOpen(true)};
  const saveWeight=(date:string,value:number,oldDate="")=>{if(!Number.isFinite(value)||value<=0)return;setWeights(all=>[...all.filter(x=>x.date!==date&&x.date!==oldDate),{id:crypto.randomUUID(),date,weight:value}].sort((a,b)=>a.date.localeCompare(b.date)));setProfile(p=>({...p,weightKg:value}));setWeightOpen(false);setNotice(`Weight saved. BMR updated to ${fmt(calculateEnergy({...profile,weightKg:value},0,0,activityFactor).bmr)} kcal.`)};
  const openNewFood = () => { setEditingFoodId(null); setFood({ name: "", amount: "1 serving", calories: "", protein: "", carbs: "", fats: "" }); setFoodOpen(true); };
  const openExistingFood = (entry: Food) => { setEditingFoodId(entry.id); setSelectedDate(entry.date); setFood({name:entry.name,amount:entry.amount,calories:String(entry.calories),protein:String(entry.protein),carbs:String(entry.carbs),fats:String(entry.fats)}); setFoodOpen(true); };
  const saveFood = () => {
    if (!food.name.trim()) { setNotice("Add a food name to continue."); return; }
    const entry: Food = {id:editingFoodId??crypto.randomUUID(),date:selectedDate,name:food.name.trim(),amount:food.amount.trim()||"1 serving",calories:Math.max(0,Number(food.calories)||0),protein:Math.max(0,Number(food.protein)||0),carbs:Math.max(0,Number(food.carbs)||0),fats:Math.max(0,Number(food.fats)||0)};
    setFoods((all) => editingFoodId ? all.map((f) => f.id === editingFoodId ? entry : f) : [...all, entry]);
    setFoodOpen(false); setSheet(false); setPage("Nutrition"); setNotice(editingFoodId ? "Food log updated." : `Food saved for ${selectedDate}.`);
  };
  const act = (label: string) => {
    setSheet(false);
    if (label === "Log food") { openNewFood(); return; }
    if (label === "Complete habit") {
      const next = todayHabits.find((h) => !habitDoneOnDate(h,today));
      if (next) { toggleHabit(next.id,today); setNotice(`${next.title} marked complete.`); }
      else setNotice("You’ve completed today’s intentions.");
      return;
    }
    if(label==="Complete workout"){const next=todayWorkouts.find(x=>!x.completedDates?.includes(today));if(next){setWeeklyWorkouts(all=>({...all,[todayWeekKey]:(all[todayWeekKey]??[]).map(x=>x.id===next.id?{...x,completedDates:[...(x.completedDates??[]),today]}:x)}));setNotice(`${next.name} marked complete.`)}else setNotice(todayWorkouts.length?"Today’s workout is complete.":"Add a workout to today’s plan first.");return;}
    const destinations: Partial<Record<string, Page>> = { "Log workout": "Workouts", "Open workout plan": "Workouts", "Calorie burn": "Calorie Burn", "Log exercise burn": "Calorie Burn", "Log weight": "Weight", "Add event": "Planner" };
    const destination = destinations[label];
    if (destination) setPage(destination);
    if(label==="Log weight"){openWeightEntry();return;}
    if(label==="Add event"){setPlannerAddRequest(v=>v+1);return;}
    setNotice(`${label} opened.`);
  };
  const applyCoachAction = (action: CoachAction) => {
    if (action.type === "navigate") { setPage(action.page as Page); return; }
    if (action.type === "add_habit") { setHabits(h => [...h, {id:crypto.randomUUID(),title:action.title,detail:action.detail||"Personal habit",iconKey:"check",color:"lime",days:[0,1,2,3,4,5,6],completions:{}}]); return; }
    if (action.type === "add_event") { setEvents(all => [...all, {id:crypto.randomUUID(),title:action.title,date:action.date,time:action.time,category:action.category,completed:false}]); setPage("Planner"); return; }
    if (action.type === "add_food") { setFoods(all => [...all, {id:crypto.randomUUID(),date:action.date,name:action.name,amount:action.amount,calories:action.calories,protein:action.protein,carbs:action.carbs,fats:action.fats}]); setSelectedDate(action.date); setPage("Nutrition"); return; }
    if (action.type === "log_weight") { saveWeight(action.date,action.weight); setPage("Weight"); return; }
    if (action.type === "exercise_burn") { setExerciseBurns(all => ({...all,[action.date]:action.calories})); setSelectedDate(action.date); setPage("Calorie Burn"); }
  };
  const dashboardData = { today, todayNutrition, todayEnergy, todayHabits, completedHabits, energyTrend, todayWorkouts, completedWorkouts, currentFaceMonth, shownFaceMonth, todayFace, todayFaceDone, faceRoutine, todayFoods, nutritionGoals, profile, weights, upcomingEvents, recentPastEvents };
  const dashboardActions = { setPage, setSelectedDate, toggleHabit, openWeightEntry, openHabitEditor, openNewFood, toggleFaceStep, setFaceMonthSelection, onQuickLog: () => setSheet(true) };
  if(!cloudReady)return <main className="sync-gate"><div className="sync-mark"><Activity size={23}/></div><span className="eyebrow">PRIVATE PULSE DATA</span><h1>{cloudError?"Your secure store needs attention":"Opening your personal space…"}</h1><p>{cloudError||"Loading your latest logs securely."}</p>{cloudError&&<button className="primary-btn" onClick={()=>setCloudRetry(v=>v+1)}>Retry connection <ArrowRight size={15}/></button>}</main>;
  if(!profile.age||!profile.heightCm||!profile.weightKg)return <ProfileOnboarding onComplete={setProfile}/>;
  return <main className="app-shell">
    <AppSidebar page={page} setPage={setPage} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
    <section className="main-area">
      <AppTopbar page={page} theme={theme} setTheme={setTheme} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
      <div className="content-wrap"><AnimatePresence mode="wait"><motion.div key={page} className="page-content" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:.18}}>
      {page === "Dashboard" ? <DashboardPage data={dashboardData} actions={dashboardActions} /> : <PageRouter page={page} setPage={setPage} setTheme={setTheme} theme={theme} foods={dayFoods} foodLibrary={foods} quickCopyFood={(entry:Food)=>{setFoods(all=>[...all,{...entry,id:crypto.randomUUID(),date:selectedDate}]);setNotice(`${entry.name} added for ${selectedDate}.`)}} nutrition={nutrition} selectedDate={selectedDate} setSelectedDate={setSelectedDate} editFood={openExistingFood} removeFood={(id:string)=>{if(window.confirm("Delete this food entry?"))setFoods(all=>all.filter(food=>food.id!==id))}} habits={habits} toggleHabit={toggleHabit} habitDate={habitDate} setHabitDate={setHabitDate} openHabit={openHabitEditor} removeHabit={removeHabit} setHabits={setHabits} weeklyWorkouts={weeklyWorkouts} setWeeklyWorkouts={setWeeklyWorkouts} openQuick={()=>setSheet(true)} openFood={openNewFood} weightLogs={weights} currentWeight={profile.weightKg} profile={profile} onEditWeight={openWeightEntry} exerciseBurn={exerciseBurns[selectedDate]??0} setExerciseBurn={(n:number)=>setExerciseBurns(all=>({...all,[selectedDate]:n}))} energy={energy} averageCalories={averageCalories} calorieHistory={calorieHistory} calorieTarget={calorieTargets[selectedDate]} onWeightLog={()=>openWeightEntry()} events={events} setEvents={setEvents} plannerAddRequest={plannerAddRequest} onAddEvent={()=>setPlannerAddRequest(v=>v+1)} workoutAddRequest={workoutAddRequest} onAddWorkout={()=>setWorkoutAddRequest(v=>v+1)} onUseCoach={(date,burn,target)=>{setSelectedDate(date);setExerciseBurns(all=>({...all,[date]:burn}));setCalorieTargets(all=>({...all,[date]:target}));setPage("Calorie Burn")}} coachContext={{date:selectedDate,profile,day:{...nutrition,...energy},averageCalories,habits:habits.map(h=>h.title),upcomingEvents:events.slice(0,6).map(e=>({title:e.title,date:e.date,time:e.time}))}} onCoachAction={applyCoachAction} historyData={{foods,habits,weights,weeklyWorkouts,exerciseBurns,events}} nutritionGoals={nutritionGoals} setNutritionGoals={setNutritionGoals} activityFactor={activityFactor} setActivityFactor={setActivityFactor} faceRoutine={faceRoutine} setFaceRoutine={setFaceRoutine} faceMonthSelection={faceMonthSelection} setFaceMonthSelection={setFaceMonthSelection}/>}
      </motion.div></AnimatePresence><footer className="footer-note">Your data belongs to you <span>·</span> PULSE is a personal space</footer></div>
      <AppMobileNav page={page} setPage={setPage} onQuickAdd={()=>setSheet(true)}/>
    </section>

    <AnimatePresence>{sheet&&<><motion.button className="scrim" aria-label="Close quick actions" onClick={()=>setSheet(false)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/><motion.section className="quick-sheet" role="dialog" aria-modal="true" aria-labelledby="quick-title" initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:30,stiffness:300}}><div className="sheet-grabber"/><div className="sheet-head"><div><span className="eyebrow">KEEP YOUR MOMENTUM</span><h2 id="quick-title">What would you like to log?</h2></div><button className="icon-btn" onClick={()=>setSheet(false)} aria-label="Close"><X size={18}/></button></div><div className="quick-grid">{[{label:"Log food",icon:Apple,color:"coral"},{label:"Complete habit",icon:Check,color:"lime"},{label:"Complete workout",icon:Dumbbell,color:"violet"},{label:"Calorie burn",icon:Flame,color:"coral"},{label:"Log weight",icon:Weight,color:"blue"},{label:"Add event",icon:CalendarDays,color:"orange"}].map(({label,icon:Icon,color})=><button key={label} className="quick-action" onClick={()=>act(label)}><span className={`quick-icon ${color}`}><Icon size={18}/></span><span>{label}</span><ArrowRight size={14}/></button>)}</div><p className="sheet-foot"><Sparkles size={13}/> Quick actions stay simple. AI is always optional.</p></motion.section></>}</AnimatePresence>
    <AnimatePresence>{foodOpen&&<><motion.button className="scrim" aria-label="Close food entry" onClick={()=>setFoodOpen(false)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/><motion.section className="food-dialog" role="dialog" aria-modal="true" aria-labelledby="food-title" initial={{opacity:0,scale:.96,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.98}}><div className="dialog-head"><div><span className="eyebrow">NUTRITION · MANUAL ENTRY</span><h2 id="food-title">{editingFoodId ? "Edit food log" : "Add to your food log"}</h2><p>Choose any date and adjust the values at any time.</p></div><button className="icon-btn" onClick={()=>setFoodOpen(false)} aria-label="Close"><X size={18}/></button></div><label className="field-label">Log date<input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></label><label className="field-label">Food or meal<input autoFocus value={food.name} placeholder="e.g. Paneer bhurji" onChange={e=>setFood({...food,name:e.target.value})}/></label><label className="field-label">Serving size<input value={food.amount} onChange={e=>setFood({...food,amount:e.target.value})}/></label><div className="nutrition-inputs">{([{key:"calories",label:"Calories",unit:"kcal"},{key:"protein",label:"Protein",unit:"g"},{key:"carbs",label:"Carbs",unit:"g"},{key:"fats",label:"Fats",unit:"g"}] as const).map(({key,label,unit})=><label className="field-label" key={key}>{label}<span className="input-unit"><input type="number" min="0" value={food[key]} onChange={e=>setFood({...food,[key]:e.target.value})}/><small>{unit}</small></span></label>)}</div><div className="manual-note"><span><Heart size={14}/></span><p>Nutrition values are saved in this browser and can be edited later.</p></div><div className="dialog-actions"><button className="secondary-btn" onClick={()=>setFoodOpen(false)}>Cancel</button><button className="primary-btn" onClick={saveFood}>{editingFoodId ? "Update entry" : "Save food"} <ArrowRight size={15}/></button></div></motion.section></>}</AnimatePresence>
         <AnimatePresence>{habitOpen&&<><motion.button className="scrim" aria-label="Close habit form" onClick={()=>setHabitOpen(false)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/><motion.section className="food-dialog habit-editor" role="dialog" aria-modal="true" aria-labelledby="habit-form-title" initial={{opacity:0,scale:.97,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.98}}><div className="dialog-head"><div><span className="eyebrow">YOUR ROUTINE</span><h2 id="habit-form-title">{editingHabitId?"Edit habit":"Add a habit"}</h2><p>Choose an icon, label, and the days this habit belongs to.</p></div><button className="icon-btn" aria-label="Close" onClick={()=>setHabitOpen(false)}><X size={18}/></button></div><label className="field-label">Habit name<input autoFocus value={habitDraft.title} placeholder="e.g. Morning sunlight" onChange={e=>setHabitDraft({...habitDraft,title:e.target.value})}/></label><label className="field-label">Target or note<input value={habitDraft.detail} placeholder="e.g. 10 minutes · Wellness" onChange={e=>setHabitDraft({...habitDraft,detail:e.target.value})}/></label><div className="habit-preview"><span className={`habit-icon ${previewColorKey}`}><PreviewIcon size={18}/></span><div><strong>{habitDraft.title.trim()||"Your habit"}</strong><small>{habitDraft.detail.trim()||"Personal habit"}</small></div><span className="habit-preview-tag">{previewLabel?`Previewing · ${previewLabel}`:"Preview"}</span></div><fieldset className="habit-icon-field"><legend>Icon</legend><div className="icon-picker">{habitIconOptions.map(([key,label])=>{const I=habitIcons[key]??Check;return <button type="button" key={key} title={label} aria-label={label} aria-pressed={habitDraft.iconKey===key} className={habitDraft.iconKey===key?"selected":""} onMouseEnter={()=>setHoverIcon(key)} onMouseLeave={()=>setHoverIcon(null)} onFocus={()=>setHoverIcon(key)} onBlur={()=>setHoverIcon(null)} onClick={()=>setHabitDraft({...habitDraft,iconKey:key})}><I size={16}/></button>})}</div></fieldset><fieldset className="habit-color-field"><legend>Accent color</legend><div>{habitColorOptions.map(([key,label])=><button type="button" key={key} title={label} aria-label={label} aria-pressed={habitDraft.color===key} className={habitDraft.color===key?"selected":""} onMouseEnter={()=>setHoverColor(key)} onMouseLeave={()=>setHoverColor(null)} onFocus={()=>setHoverColor(key)} onBlur={()=>setHoverColor(null)} onClick={()=>setHabitDraft({...habitDraft,color:key})}><i style={{background:habitColorValues[key]}}/></button>)}</div></fieldset><fieldset className="habit-day-field"><legend>Weekly routine</legend><div className="habit-preset-picker">{[{label:"Monday · Wednesday · Friday",days:[1,3,5]},{label:"Tuesday · Thursday · Saturday",days:[2,4,6]},{label:"Sunday",days:[0]},{label:"Every day",days:[0,1,2,3,4,5,6]}].map(preset=><button type="button" key={preset.label} className={habitDraft.days.join(",")===preset.days.join(",")?"selected":""} onClick={()=>setHabitDraft({...habitDraft,days:preset.days})}>{preset.label}</button>)}</div></fieldset><div className="dialog-actions"><button className="secondary-btn" onClick={()=>setHabitOpen(false)}>Cancel</button><button className="primary-btn" disabled={!habitDraft.days.length||!habitDraft.title.trim()} onClick={saveHabit}>{editingHabitId?"Save changes":"Add habit"} <ArrowRight size={15}/></button></div></motion.section></>}</AnimatePresence>
    <AnimatePresence>{weightOpen&&<><motion.button className="scrim" aria-label="Close weight log" onClick={()=>setWeightOpen(false)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/><motion.section className="food-dialog" role="dialog" aria-modal="true" aria-labelledby="weight-title" initial={{opacity:0,scale:.97,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.98}}><div className="dialog-head"><div><span className="eyebrow">WEIGHT · PERSONAL LOG</span><h2 id="weight-title">Log your weight</h2><p>Your BMR and sedentary TDEE update from this value.</p></div><button className="icon-btn" aria-label="Close" onClick={()=>setWeightOpen(false)}><X size={18}/></button></div><label className="field-label">Log date<input type="date" value={weightDraft.date} onChange={e=>setWeightDraft({...weightDraft,date:e.target.value})}/></label><label className="field-label">Weight in kilograms<input type="number" min="1" step="0.1" value={weightDraft.weight} onChange={e=>setWeightDraft({...weightDraft,weight:Number(e.target.value)})}/></label><div className="manual-note"><span><Activity size={14}/></span><p>Current profile weight: {profile.weightKg.toFixed(1)} kg · BMR: {fmt(calculateEnergy(profile,0,0,activityFactor).bmr)} kcal.</p></div><div className="dialog-actions"><button className="secondary-btn" onClick={()=>setWeightOpen(false)}>Cancel</button><button className="primary-btn" onClick={()=>saveWeight(weightDraft.date,weightDraft.weight,weightDraft.oldDate)}>Save weight <ArrowRight size={15}/></button></div></motion.section></>}</AnimatePresence>
    <AnimatePresence>{notice&&<motion.div className="toast" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}><Check size={15}/>{notice}</motion.div>}</AnimatePresence>
  </main>;
}
