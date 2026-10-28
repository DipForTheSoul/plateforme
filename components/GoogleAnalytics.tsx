"use client";

import Script from 'next/script';
import {useEffect, useRef, useState} from 'react';
import {AUDIENCE_CONSENT, AUDIENCE_ID, AUDIENCE_EVENT, AUDIENCE_PREFERENCES, INTERNAL_AUDIENCE, internalAudienceChoice, type InternalAudienceChoice} from '@/lib/audience';

const copy = {
  fr: {title:'Préférences de confidentialité', internal:'Le compteur interne estime les visiteurs à l’aide d’un identifiant aléatoire de navigateur valable 30 jours. Il fonctionne indépendamment de Google, sans suivi publicitaire.', enabled:'Compteur interne activé.', disabled:'Compteur interne désactivé.', enable:'Activer le compteur interne', disable:'Désactiver le compteur interne', google:'Autorisez-vous Google Analytics pour analyser l’utilisation du site ?', accept:'Accepter Google Analytics', refuse:'Refuser Google Analytics', accepted:'Google Analytics accepté.', refused:'Google Analytics refusé.', close:'Fermer', more:'En savoir plus', privacy:'/confidentialite'},
  en: {title:'Privacy preferences', internal:'The internal counter estimates visitors using a random browser identifier valid for 30 days. It works independently of Google, without advertising tracking.', enabled:'Internal counter enabled.', disabled:'Internal counter disabled.', enable:'Enable internal counter', disable:'Disable internal counter', google:'Allow Google Analytics to analyse site usage?', accept:'Accept Google Analytics', refuse:'Refuse Google Analytics', accepted:'Google Analytics accepted.', refused:'Google Analytics refused.', close:'Close', more:'Learn more', privacy:'/en/confidentialite'},
  de: {title:'Datenschutzeinstellungen', internal:'Der interne Zähler schätzt Besucher anhand einer zufälligen Browser-Kennung für 30 Tage. Er funktioniert unabhängig von Google, ohne Werbetracking.', enabled:'Interner Zähler aktiviert.', disabled:'Interner Zähler deaktiviert.', enable:'Internen Zähler aktivieren', disable:'Internen Zähler deaktivieren', google:'Google Analytics zur Analyse der Websitenutzung erlauben?', accept:'Google Analytics akzeptieren', refuse:'Google Analytics ablehnen', accepted:'Google Analytics akzeptiert.', refused:'Google Analytics abgelehnt.', close:'Schließen', more:'Mehr erfahren', privacy:'/de/confidentialite'},
} as const;

function saveCookie(name:string, value:string) {
  document.cookie=`${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;
}

export function GoogleAnalytics({locale,initialConsent=null,initialInternalChoice=null}:{
  locale:string; initialConsent?:'accepted'|'refused'|null; initialInternalChoice?:InternalAudienceChoice|null;
}) {
  const t=copy[locale as keyof typeof copy]??copy.fr;
  const id=process.env.NEXT_PUBLIC_GA_ID;
  const [consent,setConsent]=useState(initialConsent);
  const [internal,setInternal]=useState(internalAudienceChoice(initialInternalChoice,initialConsent));
  const [open,setOpen]=useState(!initialInternalChoice||Boolean(id&&!initialConsent));
  const initialization=useRef<number|undefined>(undefined);

  useEffect(()=>{
    // Information and opposition are displayed before enabling measurement.
    let google=initialConsent;
    let preference=initialInternalChoice;
    try {
      const saved=localStorage.getItem(AUDIENCE_CONSENT);
      if(!google&&(saved==='accepted'||saved==='refused'))google=saved;
      const savedInternal=localStorage.getItem(INTERNAL_AUDIENCE);
      if(!preference&&(savedInternal==='enabled'||savedInternal==='disabled'))preference=savedInternal;
      preference=internalAudienceChoice(preference,google);
      if(google)localStorage.setItem(AUDIENCE_CONSENT,google);
      localStorage.setItem(INTERNAL_AUDIENCE,preference);
      if(preference==='disabled')localStorage.removeItem(AUDIENCE_ID);
      saveCookie(INTERNAL_AUDIENCE,preference);
    } catch {preference='disabled';}
    const next=preference;
    const timer=window.setTimeout(()=>{
      setConsent(google);setInternal(next);
      window.dispatchEvent(new Event(AUDIENCE_EVENT));
    },0);
    initialization.current=timer;
    return()=>window.clearTimeout(timer);
  },[initialConsent,initialInternalChoice]);

  useEffect(()=>{
    const show=()=>setOpen(true);
    window.addEventListener(AUDIENCE_PREFERENCES,show);
    return()=>window.removeEventListener(AUDIENCE_PREFERENCES,show);
  },[]);

  function chooseGoogle(value:'accepted'|'refused') {
    window.clearTimeout(initialization.current);
    const withdraw=value==='refused'&&consent==='accepted';
    try{localStorage.setItem(AUDIENCE_CONSENT,value);}catch{}
    saveCookie(AUDIENCE_CONSENT,value);setConsent(value);setOpen(false);
    // Google refusal must never delete/reset the internal browser identity.
    if(withdraw)window.location.reload();
  }
  function chooseInternal(value:InternalAudienceChoice) {
    window.clearTimeout(initialization.current);
    try{
      localStorage.setItem(INTERNAL_AUDIENCE,value);
      if(value==='disabled')localStorage.removeItem(AUDIENCE_ID);
    }catch{}
    saveCookie(INTERNAL_AUDIENCE,value);setInternal(value);
    window.dispatchEvent(new Event(AUDIENCE_EVENT));
  }

  return <>
    {open&&<aside aria-label={t.title} className="fixed inset-x-0 bottom-0 z-[80] max-h-[80dvh] overflow-y-auto border-t border-soul-bronze/20 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_20px_rgba(69,48,31,0.12)]">
      <div className="mx-auto max-w-7xl space-y-3 text-sm text-soul-brown">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{t.title}</h2><button type="button" className="min-h-11 shrink-0 underline" onClick={()=>setOpen(false)}>{t.close}</button></div>
        <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <p>{t.internal} <span role="status">{internal==='enabled'?t.enabled:t.disabled}</span> <a className="underline" href={t.privacy}>{t.more}</a></p>
          <form action="/api/internal-audience-preference" method="post" onSubmit={e=>{e.preventDefault();chooseInternal(internal==='enabled'?'disabled':'enabled');}}>
            <button name="choice" value={internal==='enabled'?'disabled':'enabled'} className="btn-secondary min-h-11 w-full !px-3 !py-2 !text-xs">{internal==='enabled'?t.disable:t.enable}</button>
          </form>
        </div>
        {id&&<div className="grid items-center gap-2 border-t border-soul-bronze/20 pt-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <p>{t.google} {consent==='accepted'?t.accepted:consent==='refused'?t.refused:''}</p>
          <div className="grid grid-cols-2 gap-2">
            {(['refused','accepted'] as const).map(value=><form key={value} action="/api/analytics-consent" method="post" onSubmit={e=>{e.preventDefault();chooseGoogle(value);}}>
              <button name="consent" value={value} className={`${value==='accepted'?'btn-primary':'btn-secondary'} min-h-11 w-full !px-3 !py-2 !text-xs`}>{value==='accepted'?t.accept:t.refuse}</button>
            </form>)}
          </div>
        </div>}
      </div>
    </aside>}
    {id&&consent==='accepted'&&<>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive"/>
      <Script id="ga4-init" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${id}');`}</Script>
    </>}
  </>;
}
