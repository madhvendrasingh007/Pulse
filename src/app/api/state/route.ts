import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/db/mongoose";
import { PulseState } from "@/models/pulse-state";

const allowedKeys = new Set(["pulse-habits", "pulse-weight-logs", "pulse-energy-profile", "pulse-exercise-burns", "pulse-calorie-targets", "pulse-events", "pulse-weekly-workouts", "pulse-food-logs", "pulse-theme"]);
const dataSchema = z.record(z.string(), z.unknown()).refine((record) => Object.keys(record).every((key) => allowedKeys.has(key)), "Unsupported PULSE data field");
const putSchema = z.object({ data: dataSchema, revision: z.string().datetime().nullable() });

async function owner() {
  const session = await auth();
  const ownerId = session?.user?.email?.trim().toLowerCase();
  return ownerId || null;
}

export async function GET() {
  const ownerId = await owner();
  if (!ownerId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    await connectMongo();
    const record = await PulseState.findOne({ ownerId }).lean();
    return NextResponse.json({ data: record?.data ?? null, updatedAt: record?.updatedAt ?? null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Your secure data store is temporarily unavailable." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const ownerId = await owner();
  if (!ownerId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1_000_000) return NextResponse.json({ error: "PULSE data is too large to save." }, { status: 413 });
  let data: Record<string, unknown>;let revision:string|null;
  try {
    const body = await request.json();
    const parsed=putSchema.parse(body);data=parsed.data;revision=parsed.revision;
    if (JSON.stringify(data).length > 900_000) return NextResponse.json({ error: "PULSE data is too large to save." }, { status: 413 });
  } catch {
    return NextResponse.json({ error: "The PULSE data was invalid." }, { status: 400 });
  }
  try {
    await connectMongo();
    let record;
    if(revision===null){
      try{record=await PulseState.create({ownerId,data});}
      catch(error){if((error as {code?:number})?.code===11000)return NextResponse.json({error:"Another PULSE session saved first. Reload this page to get the newest data."},{status:409});throw error;}
    }else{
      record=await PulseState.findOneAndUpdate({ownerId,updatedAt:new Date(revision)},{$set:{data}},{new:true,runValidators:true}).lean();
      if(!record)return NextResponse.json({error:"Another PULSE session saved newer data. Reload this page before making more changes."},{status:409});
    }
    return NextResponse.json({ ok: true, updatedAt: record?.updatedAt ?? new Date() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Your changes could not be saved. Please retry once the data store is online." }, { status: 503 });
  }
}
