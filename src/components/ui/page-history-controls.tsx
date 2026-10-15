"use client";

import { Archive, RotateCcw } from "lucide-react";
import { useState } from "react";
import type React from "react";
import type { Page, PageHistoryEntry } from "@/lib/pulse/shared";

export function PageHistoryControls({ page, date, snapshot, setHistory, onReset }: {
  page: Page;
  date: string;
  snapshot: unknown;
  setHistory: React.Dispatch<React.SetStateAction<PageHistoryEntry[]>>;
  onReset: () => void;
}) {
  const [savedNotice, setSavedNotice] = useState("");
  const save = (label = `${page} · ${new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { dateStyle: "medium" })}`) => {
    setHistory(all => [{ id: crypto.randomUUID(), savedAt: new Date().toISOString(), date, page, label, snapshot: JSON.parse(JSON.stringify(snapshot)) }, ...all.filter(entry => entry.page !== page || entry.date !== date)]);
    setSavedNotice(`Saved for ${date}. Saving again for this date will replace this version.`);
  };
  const reset = () => {
    if (!window.confirm(`Save the current ${page} data to History and reset this page?`)) return;
    save(`${page} · saved before reset · ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`);
    onReset();
  };

  return <section className="panel page-history-controls" aria-label={`${page} history actions`}>
    <div><b>Save this page to History</b><small>Saving again for {date} replaces that date’s saved version. Other dates stay unchanged.</small></div>
    <div><button className="secondary-btn" type="button" onClick={() => save()}><Archive size={14}/> Save to history</button><button className="secondary-btn page-history-reset" type="button" onClick={reset}><RotateCcw size={14}/> Save &amp; reset</button></div>
    {savedNotice&&<small className="page-history-saved" role="status">{savedNotice}</small>}
  </section>;
}
