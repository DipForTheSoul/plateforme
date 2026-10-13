"use client";

import {useState} from "react";

export function BuyFeaturedButton({eventId,label,pendingLabel}:{eventId:string;label:string;pendingLabel:string}) {
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");

  async function checkout() {
    setPending(true);setError("");
    try {
      const response=await fetch("/api/stripe/featured-checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok||typeof payload.url!=="string")throw new Error(typeof payload.error==="string"?payload.error:"Paiement indisponible.");
      window.location.assign(payload.url);
    } catch (cause) {
      setError(cause instanceof Error?cause.message:"Paiement indisponible.");setPending(false);
    }
  }

  return <div className="flex flex-col items-end gap-1">
    <button type="button" onClick={checkout} disabled={pending} className="btn-primary !px-4 !py-2.5 text-sm">{pending?pendingLabel:label}</button>
    {error&&<p role="alert" className="max-w-56 text-right text-xs text-red-700">{error}</p>}
  </div>;
}
