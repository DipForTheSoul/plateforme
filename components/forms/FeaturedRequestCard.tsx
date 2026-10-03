"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

export interface FeaturedRequestCopy {
  badge: string;
  title: string;
  description: string;
  duration: string;
  priceLabel: string;
  choice: string;
  paymentHint: string;
  selected: string;
}

export function FeaturedRequestCard({
  copy,
  priceChf,
  durationDays,
  name = "featured_request",
}: {
  copy: FeaturedRequestCopy;
  priceChf: number;
  durationDays: number;
  name?: string;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <section className={`relative overflow-hidden rounded-3xl border-2 p-5 transition sm:p-6 ${checked
      ? "border-soul-violet bg-gradient-to-br from-soul-violet/[0.09] via-white to-soul-sand/60 shadow-[0_16px_38px_rgba(101,79,171,0.16)]"
      : "border-soul-violet/20 bg-gradient-to-br from-white to-soul-sand/45"
    }`}>
      <div aria-hidden className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-soul-violet/10 blur-2xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-soul-violet text-white shadow-sm">
            <Sparkles aria-hidden className="h-6 w-6" />
          </span>
          <div>
            <span className="inline-flex rounded-full bg-soul-violet/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-soul-violet">
              {copy.badge}
            </span>
            <h3 className="mt-2 font-serif text-xl leading-tight text-soul-brown">{copy.title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-soul-ink/75">{copy.description}</p>
            <p className="mt-2 text-xs font-medium text-soul-bronze">{copy.duration.replace("{days}", String(durationDays))}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-soul-violet/10 pt-4 sm:min-w-52 sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-[0.12em] text-soul-bronze">{copy.priceLabel}</p>
            <p className="font-serif text-3xl text-soul-brown">CHF {priceChf.toFixed(0)}.–</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-white px-3 py-2.5 text-xs font-semibold text-soul-violet shadow-sm ring-1 ring-soul-violet/25 transition hover:bg-soul-violet/5 sm:px-4 sm:text-sm">
            <input
              type="checkbox"
              name={name}
              value="true"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
              className="h-4 w-4 accent-soul-violet"
            />
            {copy.choice}
          </label>
        </div>
      </div>
      <p className="relative mt-4 border-t border-soul-violet/10 pt-3 text-xs text-soul-bronze">
        {checked ? copy.selected : copy.paymentHint}
      </p>
    </section>
  );
}
