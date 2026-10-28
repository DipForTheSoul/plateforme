"use client";

import {useEffect,useRef} from 'react';
import {usePathname} from 'next/navigation';
import {useLocale} from 'next-intl';
import {INTERNAL_AUDIENCE,AUDIENCE_ID,AUDIENCE_EVENT,isPublicAudiencePath} from '@/lib/audience';

/** A page display has its own retry token; visitor identity stays independent. */
export function PageViewTracker() {
  const pathname=usePathname();const locale=useLocale();
  const navigation=useRef<{key:string;id:string;done:boolean}|null>(null);
  useEffect(()=>{
    if(!isPublicAudiencePath(pathname))return;
    const key=locale+':'+pathname;
    if(navigation.current?.key!==key)navigation.current={key,id:crypto.randomUUID(),done:false};
    const event=navigation.current!;
    let pending=false;
    const record=()=>{
      if(event.done||pending||document.visibilityState!=='visible'||navigator.webdriver)return;
      try{
        if(localStorage.getItem(INTERNAL_AUDIENCE)!=='enabled')return;
        let saved;try{saved=JSON.parse(localStorage.getItem(AUDIENCE_ID)??'null');}catch{}
        const validId=typeof saved?.id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved.id);
        const identity=validId&&saved.expires>Date.now()?saved:{id:crypto.randomUUID(),expires:Date.now()+30*86400000};
        localStorage.setItem(AUDIENCE_ID,JSON.stringify(identity));
        const params=new URLSearchParams(location.search);
        let referrerHost='';try{referrerHost=new URL(document.referrer).hostname;}catch{}
        pending=true;
        fetch('/api/views',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,signal:AbortSignal.timeout(4000),body:JSON.stringify({
          path:pathname,locale,browserId:identity.id,eventId:event.id,
          acquisition:{source:(params.get('utm_source')??'').slice(0,80),medium:(params.get('utm_medium')??'').slice(0,80),referrerHost,searchAd:['gclid','wbraid','gbraid','msclkid'].some(k=>params.has(k)),socialClick:params.has('fbclid')},
        })}).then(response=>{
          pending=false;
          if(response.ok)event.done=true;
        }).catch(()=>{pending=false;});
      }catch{/* Blocked storage must not invent a visitor on every display. */}
    };
    record();window.addEventListener(AUDIENCE_EVENT,record);document.addEventListener('visibilitychange',record);
    return()=>{window.removeEventListener(AUDIENCE_EVENT,record);document.removeEventListener('visibilitychange',record);};
  },[pathname,locale]);
  return null;
}
