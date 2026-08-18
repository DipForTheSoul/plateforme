/**
 * Packs de publications (Phase 6). 1 crédit = 1 dépôt d'événement
 * (une récurrence complète = 1 crédit, pas 1 par occurrence).
 * // PLACEHOLDER — tarifs indicatifs à valider avec Didier avant mise en prod.
 */

export interface CreditPack {
  id: string;
  credits: number;
  /** Prix en centimes CHF (format Stripe). */
  amountCents: number;
  labelFr: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack-1", credits: 1, amountCents: 2500, labelFr: "1 publication" },
  { id: "pack-5", credits: 5, amountCents: 10000, labelFr: "Pack 5 publications" },
  { id: "pack-10", credits: 10, amountCents: 18000, labelFr: "Pack 10 publications" },
];

export function getPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

/** Clé `settings` du prix éditable d'un pack (ex. "pack-1" → "price_pack_1"). */
export function packPriceKey(id: string): string {
  return `price_${id.replace("-", "_")}`;
}

/**
 * Prix d'un pack en CHF : valeur éditée par l'admin (table `settings`) si présente
 * et valide, sinon le prix par défaut du code. Utilisé pour l'affichage ; le
 * checkout applique la même logique côté serveur.
 */
export function resolvePackPriceChf(
  pack: CreditPack,
  settings: Record<string, string | undefined>
): number {
  const chf = Number(settings[packPriceKey(pack.id)]);
  return Number.isFinite(chf) && chf > 0 ? chf : pack.amountCents / 100;
}

export interface Promo {
  label: string;
  /** Pourcentage de réduction (1–100). */
  percent: number;
}

/**
 * Promotion active (étiquette + % de réduction), éditée par l'admin dans les
 * `settings` (`promo_label`, `promo_discount_percent`). Renvoie null si pas de
 * label ou pas de remise valide.
 */
export function getPromo(settings: Record<string, string | undefined>): Promo | null {
  const label = settings.promo_label?.trim();
  const percent = Number(settings.promo_discount_percent);
  if (!label) return null;
  if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) {
    // Étiquette seule (sans remise) : on l'affiche quand même.
    return { label, percent: 0 };
  }
  return { label, percent };
}

/** Prix après remise, arrondi au franc. */
export function discountedChf(priceChf: number, percent: number): number {
  return Math.round(priceChf * (1 - percent / 100));
}

/**
 * Paiement manuel (en plus de Stripe) : lien Revolut + QR. L'admin attribue
 * ensuite les crédits à la main à réception.
 * // iban: optionnel — à renseigner si Didier veut aussi le virement IBAN classique.
 */
export const STATIC_PAYMENT = {
  beneficiary: "ForTheSoul — Didier Picamoles",
  revolutUrl: "https://revolut.me/didierma4i/pocket/3enbaV62Rx",
  revolutQr: "/revolut-qr.png",
  iban: "", // optionnel — laisser vide tant que Didier ne fournit pas d'IBAN de virement
  note: "Indiquez votre nom de praticien·ne et le pack choisi en communication.",
};
