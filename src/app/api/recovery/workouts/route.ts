import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const file = path.join(process.cwd(), ".pulse-workout-recovery.json");
    const entries = JSON.parse(await readFile(file, "utf8"));
    if (!Array.isArray(entries)) return NextResponse.json({ entries: [] }, { headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ entries }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ entries: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
