"use client";

import { useState, type ComponentProps } from "react";
import { Search } from "lucide-react";
import { VenueSearch } from "./VenueSearch";

type Props = {
  search: ComponentProps<typeof VenueSearch>;
  country: string;
  canton: string;
  countries: string[];
  cantons: string[];
  countryNames: Record<string, string>;
  labels: { search: string; country: string; canton: string; allCountries: string; allCantons: string };
};

export function VenueFilters({ search, country, canton, countries, cantons, countryNames, labels }: Props) {
  const [selectedCountry, setSelectedCountry] = useState(country);
  const [selectedCanton, setSelectedCanton] = useState(canton);
  const multipleCountries = countries.length > 1;
  const effectiveCountry = multipleCountries ? selectedCountry : countries[0] ?? "";
  const hasCantons = effectiveCountry === "CH" && cantons.length > 0;
  const submittedCountry = multipleCountries ? selectedCountry : selectedCanton ? effectiveCountry : "";

  return <form method="get" className="mt-6 grid grid-cols-2 items-center gap-3 sm:flex sm:flex-wrap [&>div:first-child]:col-span-2 [&>div:first-child]:basis-full sm:[&>div:first-child]:basis-60">
    <VenueSearch {...search} />
    <input type="hidden" name="pays" value={submittedCountry} />
    {multipleCountries && <select aria-label={labels.country} className="field min-h-11 min-w-0 !w-auto !rounded-full !py-2.5 text-sm" value={selectedCountry} onChange={event => { setSelectedCountry(event.target.value); setSelectedCanton(""); }}>
      <option value="">{labels.allCountries}</option>
      {countries.map(code => <option key={code} value={code}>{countryNames[code] ?? code}</option>)}
    </select>}
    {hasCantons ? <select name="canton" aria-label={labels.canton} className="field min-h-11 min-w-0 !w-full !rounded-full !py-2.5 text-sm sm:!w-auto" value={selectedCanton} onChange={event => setSelectedCanton(event.target.value)}>
      <option value="">{labels.allCantons}</option>
      {cantons.map(value => <option key={value} value={value}>{value}</option>)}
    </select> : <input type="hidden" name="canton" value="" />}
    <button type="submit" className="btn-primary min-h-11 justify-center gap-2 !px-4 !py-2.5 !text-sm sm:!px-6">
      <Search aria-hidden className="h-4 w-4 shrink-0" />{labels.search}
    </button>
  </form>;
}
