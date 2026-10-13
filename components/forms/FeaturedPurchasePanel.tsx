"use client";

import {useState} from 'react';
import {useLocale} from 'next-intl';
import {BuyFeaturedButton} from '@/app/[locale]/espace-praticien/evenements/BuyFeaturedButton';

const labels = {
  fr: {open:'Mettre en avant', title:'Option visibilité', duration:'Mettre cette offre en avant pendant', days:'jours', pay:'Payer avec Stripe'},
  de: {open:'Hervorheben', title:'Sichtbarkeit', duration:'Dieses Angebot hervorheben für', days:'Tage', pay:'Mit Stripe bezahlen'},
  en: {open:'Feature this offer', title:'Visibility option', duration:'Feature this offer for', days:'days', pay:'Pay with Stripe'},
};

export function FeaturedPurchasePanel({eventId,price,days,pendingLabel}:{eventId:string;price:number;days:number;pendingLabel:string}) {
  const locale=useLocale();
  const text=labels[locale as keyof typeof labels]??labels.en;
  const [open,setOpen]=useState(false);
  const panelId=`featured-${eventId}`;
  return <div className="w-full">
    <div className="flex justify-end">
      <button type="button" className="btn-secondary !px-4 !py-2 text-sm" aria-expanded={open} aria-controls={panelId} onClick={()=>setOpen(!open)}>{text.open}</button>
    </div>
    {open&&<section id={panelId} aria-label={text.title} className="-mx-5 -mb-5 mt-4 rounded-b-2xl border-t-2 border-soul-violet bg-soul-sand/35 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-soul-violet">{text.title}</p>
          <p className="mt-2 text-xs tracking-[-0.01em] text-soul-brown min-[360px]:text-[13px] sm:text-base">{text.duration} <strong className="whitespace-nowrap">{days} {text.days}.</strong></p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-4">
          <p className="font-serif text-2xl text-soul-brown">CHF {Number.isInteger(price)?`${price}.–`:new Intl.NumberFormat(locale,{minimumFractionDigits:2,maximumFractionDigits:2}).format(price)}</p>
          <BuyFeaturedButton eventId={eventId} label={text.pay} pendingLabel={pendingLabel}/>
        </div>
      </div>
    </section>}
  </div>;
}
