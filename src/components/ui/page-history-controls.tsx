"use client";

import { Archive, RotateCcw } from "lucide-react";
import { useState } from "react";
import type React from "react";
import type { Page, PageHistoryEntry } from "@/lib/pulse/shared";

export function PageHistoryControls({ page, snapshot, setHistory, onReset }: {
  page: Page;
  snapshot: unknown;
  setHistory: React.Dispatch<React.SetStateAction<PageHistoryEntry[]>>;
  onReset: () => void;
}) {
  const [savedNotice, setSavedNotice] = useState("");
  const save = (label = `${page} · ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`) => {
    setHistory(all => [{ id: crypto.randomUUID(), savedAt: new Date().toISOString(), page, label, snapshot: JSON.parse(JSON.stringify(snapshot)) }, ...all]);
    setSavedNotice("Saved in History. This version stays there after reset.");
  };
  const reset = () => {
    if (!window.confirm(`Save the current ${page} data to History and reset this page?`)) return;
    save(`${page} · saved before reset · ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`);
    onReset();
  };

  return <section className="panel page-history-controls" aria-label={`${page} history actions`}>
    <div><b>Keep a version of this page</b><small>Save again after edits to keep multiple versions in History.</small></div>
    <div><button className="secondary-btn" type="button" onClick={() => save()}><Archive size={14}/> Save to history</button><button className="secondary-btn page-history-reset" type="button" onClick={reset}><RotateCcw size={14}/> Save &amp; reset</button></div>
    {savedNotice&&<small className="page-history-saved" role="status">{savedNotice}</small>}
  </section>;
}
