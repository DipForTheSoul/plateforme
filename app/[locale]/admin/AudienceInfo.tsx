'use client';

import {useEffect,useId,useRef,useState} from 'react';

/** The same help works with a mouse, keyboard and a touch screen. */
export function AudienceInfo({label,text}:{label:string;text:string}) {
 const id=useId();const root=useRef<HTMLDivElement>(null);
 const [open,setOpen]=useState(false);
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 return <div ref={root} className={`absolute right-3 top-3 ${open?'z-30':'z-10'}`} onPointerEnter={e=>{if(e.pointerType==='mouse')setOpen(true);}} onPointerLeave={e=>{if(e.pointerType==='mouse')setOpen(false);}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false);}}>
   <button type="button" aria-label={label} aria-describedby={open?id:undefined} aria-expanded={open} onFocus={e=>{if(e.currentTarget.matches(':focus-visible'))setOpen(true);}} onClick={()=>setOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-full text-soul-violet focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soul-violet"><span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs font-semibold">i</span></button>
   {open&&<div className="absolute right-0 top-10 w-72 max-w-[calc(100vw-3rem)] pt-2"><div id={id} role="tooltip" className="rounded-xl border border-soul-violet/20 bg-white p-4 text-left text-sm leading-relaxed text-soul-brown shadow-lg">{text}</div></div>}
 </div>;
}
