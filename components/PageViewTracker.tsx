"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { AUDIENCE_CONSENT, AUDIENCE_ID, AUDIENCE_EVENT, isPublicAudiencePath } from '@/lib/audience';

/**
 * Mesure pseudonyme soumise au consentement : un navigateur par jour.
 * Les visites historiques ne sont pas utilisées comme visiteurs uniques.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    if(!isPublicAudiencePath(pathname))return;
    let sent=false;
    const record=()=>{
      if(sent||document.visibilityState!=='visible'||navigator.webdriver)return;
      try{
        if(localStorage.getItem(AUDIENCE_CONSENT)!=='accepted')return;
        const saved=JSON.parse(localStorage.getItem(AUDIENCE_ID)??'null');
        const identity=saved&&saved.expires>Date.now()?saved:{id:crypto.randomUUID(),expires:Date.now()+30*86400000};
        localStorage.setItem(AUDIENCE_ID,JSON.stringify(identity));
        const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
        if(identity.lastSent===today)return;
        sent=true;
        fetch('/api/views',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:pathname,locale,browserId:identity.id}),keepalive:true})
          .then(response=>{if(response.ok&&response.status!==204&&localStorage.getItem(AUDIENCE_CONSENT)==='accepted'){identity.lastSent=today;localStorage.setItem(AUDIENCE_ID,JSON.stringify(identity));}}).catch(()=>undefined);
      }catch{/* Storage blocked: do not invent a new visitor on every page. */}
    };
    record();window.addEventListener(AUDIENCE_EVENT,record);document.addEventListener('visibilitychange',record);
    return()=>{window.removeEventListener(AUDIENCE_EVENT,record);document.removeEventListener('visibilitychange',record);};
  }, [pathname, locale]);

  return null;
}
