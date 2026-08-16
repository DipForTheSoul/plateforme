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
