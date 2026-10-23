"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { flushSync } from "react-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { VenueSearch } from "./VenueSearch";

type Props = {
  search: ComponentProps<typeof VenueSearch>;
  country: string;
  canton: string;
  countries: string[];
  cantons: string[];
  countryNames: Record<string, string>;
  labels: { filters: string; search: string; country: string; canton: string; allCountries: string; allCantons: string; reset: string; apply: string; close: string; empty: string };
};

export function VenueFilters({ search, country, canton, countries, cantons, countryNames, labels }: Props) {
  const form = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState({ country, canton });
  const [draft, setDraft] = useState({ country, canton });
  const multipleCountries = countries.length > 1;
  const effectiveCountry = multipleCountries ? draft.country : countries[0] ?? "";
  const hasCantons = effectiveCountry === "CH" && cantons.length > 0;
  const count = Number(multipleCountries && Boolean(applied.country)) + Number(applied.country === "CH" && Boolean(applied.canton));

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  function showFilters() {
    setDraft(applied);
    dialog.current?.showModal();
    setOpen(true);
  }

  function apply() {
    const nextCanton = hasCantons ? draft.canton : "";
    const nextCountry = multipleCountries ? draft.country : nextCanton ? effectiveCountry : "";
    flushSync(() => setApplied({ country: nextCountry, canton: nextCanton }));
    dialog.current?.close();
    form.current?.requestSubmit();
  }

  return <>
    <form ref={form} method="get" className="mt-6 grid grid-cols-2 items-center gap-3 sm:flex sm:flex-wrap [&>div:first-child]:col-span-2 [&>div:first-child]:basis-full sm:[&>div:first-child]:basis-60">
      <VenueSearch {...search} />
      <input type="hidden" name="pays" value={applied.country} />
      <input type="hidden" name="canton" value={applied.canton} />
      <button type="button" onClick={showFilters} aria-haspopup="dialog" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-soul-bronze/30 bg-white px-4 text-sm text-soul-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soul-violet">
        <SlidersHorizontal aria-hidden className="h-4 w-4 shrink-0" />
        {labels.filters}{count > 0 && <span> · {count}</span>}
      </button>
      <button type="submit" className="btn-primary min-h-11 justify-center gap-2 !px-4 !py-2.5 !text-sm sm:!px-6">
        <Search aria-hidden className="h-4 w-4 shrink-0" />{labels.search}
      </button>
    </form>
    <dialog ref={dialog} aria-labelledby={titleId} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border-0 bg-soul-cream p-0 text-soul-brown shadow-xl backdrop:bg-black/40 sm:inset-0 sm:m-auto sm:max-w-md sm:rounded-3xl">
      <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id={titleId} className="font-serif text-2xl">{labels.filters}</h2>
          <button type="button" aria-label={labels.close} onClick={() => dialog.current?.close()} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-soul-bronze/20 bg-white"><X aria-hidden className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5">
          {multipleCountries && <label className="block text-sm font-medium">{labels.country}
            <select className="field mt-2 min-h-11" value={draft.country} onChange={event => setDraft({country:event.target.value,canton:""})}>
              <option value="">{labels.allCountries}</option>
              {countries.map(code => <option key={code} value={code}>{countryNames[code] ?? code}</option>)}
            </select>
          </label>}
          {hasCantons && <label className="block text-sm font-medium">{labels.canton}
            <select className="field mt-2 min-h-11" value={draft.canton} onChange={event => setDraft(previous => ({...previous,canton:event.target.value}))}>
              <option value="">{labels.allCantons}</option>
              {cantons.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>}
          {!multipleCountries && !hasCantons && <p className="text-sm text-soul-bronze">{labels.empty}</p>}
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => setDraft({country:"",canton:""})} className="min-h-11 text-sm text-soul-violet underline underline-offset-4">{labels.reset}</button>
          <button type="button" onClick={apply} className="btn-primary min-h-11 !px-4 !text-sm">{labels.apply}</button>
        </div>
      </div>
    </dialog>
  </>;
}
