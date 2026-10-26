"use client";

import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Search } from "lucide-react";

type Suggestion = { value: string; kind: "city" | "venue" };
export function VenueSearch({ initialValue, suggestions, labels }: {
  initialValue: string;
  suggestions: Suggestion[];
  labels: { placeholder: string; suggestions: string; city: string; venue: string };
}) {
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const matches = value.trim() ? suggestions.filter(s => normalize(s.value).includes(normalize(value.trim()))).slice(0, 8) : [];
  const visible = open && matches.length > 0;
  function choose(suggestion: Suggestion) {
    flushSync(() => { setValue(suggestion.value); setOpen(false); setActive(-1); });
    input.current?.form?.requestSubmit();
  }
  return (
    <div className="relative min-w-0 basis-60 flex-1" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soul-bronze" />
      <input ref={input} type="search" role="combobox" name="q" value={value}
        placeholder={labels.placeholder} aria-label={labels.placeholder}
        aria-autocomplete="list" aria-expanded={visible} aria-controls={id}
        aria-activedescendant={visible && active >= 0 ? `${id}-${active}` : undefined}
        autoComplete="off" className="field !rounded-full !py-2.5 !pl-11"
        onFocus={() => setOpen(true)}
        onChange={event => { setValue(event.target.value); setOpen(true); setActive(-1); }}
        onKeyDown={event => {
          if (event.key === "Escape") { setOpen(false); setActive(-1); }
          if ((event.key === "ArrowDown" || event.key === "ArrowUp") && matches.length) {
            event.preventDefault(); setOpen(true);
            setActive(previous => event.key === "ArrowDown" ? (previous + 1) % matches.length : (previous <= 0 ? matches.length - 1 : previous - 1));
          }
          if (event.key === "Enter" && visible && active >= 0) {
            event.preventDefault(); choose(matches[active]);
          }
        }} />
      {visible && <ul id={id} role="listbox" aria-label={labels.suggestions}
        className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-soul-bronze/20 bg-white p-1 shadow-lg">
        {matches.map((suggestion, index) => <li key={suggestion.kind + suggestion.value} role="presentation">
          <button type="button" role="option" id={`${id}-${index}`} aria-selected={index === active}
            className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm text-soul-brown hover:bg-soul-sand ${index === active ? "bg-soul-sand" : ""}`}
            onClick={() => choose(suggestion)}>
            <span className="min-w-0 break-words">{suggestion.value}</span>
            <span className="shrink-0 text-xs text-soul-bronze">{labels[suggestion.kind]}</span>
          </button>
        </li>)}
      </ul>}
    </div>
  );
}
