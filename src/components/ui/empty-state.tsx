"use client";
import type { LucideIcon } from "lucide-react";
export function Empty({message,icon:Icon}:{message:string;icon:LucideIcon}) {
  return <div className="empty-state"><span><Icon size={19}/></span><b>Nothing here just yet</b><p>{message}</p></div>;
}
