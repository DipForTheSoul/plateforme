export type PriceMode = 'fixed' | 'free' | 'flexible' | 'unspecified';

/** Preserve legacy meaning: zero meant pay-what-you-want, never free. */
export function eventPriceMode(value: number | null | undefined, mode?: PriceMode): PriceMode {
  return mode ?? (value == null ? 'unspecified' : Number(value) === 0 ? 'flexible' : 'fixed');
}

export function priceLabelKey(mode: PriceMode): 'free' | 'priceFree' | 'priceUnspecified' {
  return mode === 'free' ? 'priceFree' : mode === 'flexible' ? 'free' : 'priceUnspecified';
}
