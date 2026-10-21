"use client";

import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";

/** Opens a deliberately limited, read-only view using only data already on this device. */
export function GuestAccessButton() {
  const router = useRouter();
  const enterGuestView = () => {
    document.cookie = `pulse-guest-mode=1; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 12}${location.protocol === "https:" ? "; Secure" : ""}`;
    router.replace("/");
    router.refresh();
  };

  return <button type="button" onClick={enterGuestView} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:9,width:"100%",minHeight:44,marginTop:14,padding:"10px 14px",border:"1px solid #d8dce4",borderRadius:12,background:"#fff",color:"#252932",fontFamily:"inherit",fontSize:14,fontWeight:600,lineHeight:1.2,cursor:"pointer"}}>
    <Eye size={16}/><span>View as guest</span><small style={{marginLeft:"auto",color:"#687080",fontSize:11}}>Read-only · Admin pages hidden</small>
  </button>;
}
