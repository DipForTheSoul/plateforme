"use client";
import {useEffect, useRef, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {z} from 'zod';
import {addressSuggestionSchema, type AddressPoint, type AddressSuggestion} from '@/lib/address-search';

export function VenueAddressFields() {
  const t = useTranslations('addressSearch');
  const tf = useTranslations('eventForm');
  const locale = useLocale();
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [canton, setCanton] = useState('');
  const [country, setCountry] = useState('CH');
  const [manual, setManual] = useState(false);
  const [point, setPoint] = useState<AddressPoint | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'empty' | 'error' | 'ready'>('idle');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const generation = useRef(0);

  useEffect(() => {
    if (manual || country !== 'CH' || point || address.trim().length < 4) return;
    const current = ++generation.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus('loading');
      try {
        const response = await fetch(`/api/address-search?${new URLSearchParams({q: address, lang: locale})}`, {signal: controller.signal});
        if (!response.ok) throw new Error('Unavailable');
        const data = z.object({suggestions: z.array(addressSuggestionSchema).max(5)}).parse(await response.json());
        if (current !== generation.current || controller.signal.aborted) return;
        setSuggestions(data.suggestions); setStatus(data.suggestions.length ? 'ready' : 'empty');
      } catch {
        if (current !== generation.current || controller.signal.aborted) return;
        setSuggestions([]); setStatus('error');
      }
    }, 450);
    return () => {window.clearTimeout(timer); controller.abort();};
  }, [address, country, locale, manual, point]);

  function invalidate() {generation.current++; setPoint(null); setSuggestions([]); setStatus('idle'); setActive(-1);}
  function choose(item: AddressSuggestion) {
    generation.current++;
    setAddress(item.address); setCity(item.city); setCanton(item.canton); setCountry(item.country);
    setPoint({lat: item.lat, lng: item.lng}); setSuggestions([]); setOpen(false); setStatus('idle'); setActive(-1);
  }
  const expanded = open && suggestions.length > 0;
  return <>
    <div className="relative" onBlur={event => {if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);}}>
      <label className="label" htmlFor="v-address">{tf('fullAddressLabel')}</label>
      <input id="v-address" name="address" required maxLength={300} className="field" autoComplete="off"
        value={address} placeholder={t('placeholder')} role="combobox" aria-autocomplete="list" aria-expanded={expanded}
        aria-controls="venue-address-results" aria-activedescendant={expanded && active >= 0 ? `venue-address-${active}` : undefined}
        aria-describedby="venue-address-help" onFocus={() => setOpen(true)}
        onChange={e => {setAddress(e.target.value); invalidate(); setOpen(true);}}
        onKeyDown={e => {
          if (e.key === 'Escape') {setOpen(false); return;}
          if (e.key === 'ArrowDown' && suggestions.length) {e.preventDefault(); setOpen(true); setActive(n => (n + 1) % suggestions.length);}
          if (e.key === 'ArrowUp' && suggestions.length) {e.preventDefault(); setOpen(true); setActive(n => (n - 1 + suggestions.length) % suggestions.length);}
          if (e.key === 'Enter' && expanded) {e.preventDefault(); if (active >= 0) choose(suggestions[active]);}
        }}/>
      {expanded && <ul id="venue-address-results" role="listbox" aria-label={t('suggestions')} className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-soul-bronze/30 bg-white shadow-lg">
        {suggestions.map((item, index) => <li key={`${item.lat}:${item.lng}:${item.address}`} id={`venue-address-${index}`} role="option" aria-selected={active === index}
          onMouseDown={e => e.preventDefault()} onClick={() => choose(item)}
          className={`cursor-pointer break-words px-4 py-3 text-sm text-soul-brown hover:bg-soul-sand/40 ${active === index ? 'bg-soul-sand/40' : ''}`}>{item.address}</li>)}
      </ul>}
      <p id="venue-address-help" className="mt-1 text-xs text-soul-bronze">{t('hint')} <a className="underline" href="https://www.geo.admin.ch/" target="_blank" rel="noreferrer">© swisstopo</a></p>
      <p role="status" className="mt-1 text-sm text-soul-brown">{status === 'loading' ? t('loading') : status === 'empty' ? t('empty') : status === 'error' ? t('error') : ''}</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <div><label className="label" htmlFor="v-city">{tf('cityLabel')}</label><input id="v-city" name="city" maxLength={120} className="field" value={city} onChange={e => {setCity(e.target.value); invalidate();}}/></div>
      <div><label className="label" htmlFor="v-canton">{tf('cantonLabel')}</label><input id="v-canton" name="canton" maxLength={2} className="field" value={canton} onChange={e => {setCanton(e.target.value.toUpperCase()); invalidate();}}/></div>
      <div><label className="label" htmlFor="v-country">{tf('countryLabel')}</label><input id="v-country" name="country" maxLength={2} required className="field" value={country} onChange={e => {setCountry(e.target.value.toUpperCase()); invalidate();}}/></div>
    </div>
    <button type="button" className="self-start text-sm text-soul-violet underline" onClick={() => {invalidate(); setManual(!manual); setOpen(false);}}>{manual ? t('automatic') : t('manual')}</button>
    {(manual || country !== 'CH') && <p className="text-sm text-soul-brown">{t('manualHint')}</p>}
    {point && <p role="status" className="text-sm text-green-800">{t('selected')}</p>}
    <input type="hidden" name="address_mode" value={manual || country !== 'CH' ? 'manual' : 'automatic'}/>
    <input type="hidden" name="lat" value={point?.lat ?? ''}/><input type="hidden" name="lng" value={point?.lng ?? ''}/>
  </>;
}
