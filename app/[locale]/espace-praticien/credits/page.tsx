import { getCurrentPractitioner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CREDIT_PACKS, STATIC_PAYMENT } from "@/lib/credits";
import { formatDate } from "@/lib/utils";
import type { CreditTransaction } from "@/types/database";
import { BuyPackButton } from "./BuyPackButton";

export const dynamic = "force-dynamic";

/**
 * Crédits praticien (Phase 6) : solde, rachat 1 clic (Stripe Checkout),
 * paiement statique QR/IBAN, historique.
 */
export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ achat?: string }>;
}) {
  const practitioner = await getCurrentPractitioner();
  const { achat } = await searchParams;
  if (!practitioner) {
    return <p className="text-sm text-soul-bronze">Aucune fiche praticien.</p>;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("practitioner_id", practitioner.id)
    .order("created_at", { ascending: false })
    .limit(30);
  const transactions = (data as CreditTransaction[]) ?? [];

  return (
    <div className="flex flex-col gap-8">
      {achat === "succes" && (
        <div className="rounded-2xl border border-green-300 bg-green-50 p-4 text-sm text-green-800">
          Merci ! Le paiement est confirmé — vos crédits apparaissent dès
          réception du webhook Stripe (quelques secondes).
        </div>
      )}
      {achat === "annule" && (
        <div className="rounded-2xl border border-soul-amber/50 bg-soul-ivory p-4 text-sm text-soul-brown">
          Paiement annulé — aucun montant débité.
        </div>
      )}

      <div className="card p-6">
        <p className="text-sm text-soul-bronze">Solde actuel</p>
        <p className="font-serif text-5xl text-soul-brown">
          {practitioner.credits}
          <span className="ml-2 text-lg text-soul-bronze">
            publication{practitioner.credits > 1 ? "s" : ""}
          </span>
        </p>
        {practitioner.credits === 0 && (
          <p className="mt-2 text-sm text-soul-terracotta">
            Solde épuisé : le dépôt d&apos;expériences est bloqué. Rechargez ci-dessous.
          </p>
        )}
      </div>

      <section>
        <h2 className="mb-4 text-xl text-soul-brown">Packs de publications</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <div key={pack.id} className="card flex flex-col p-6">
              <p className="font-serif text-lg text-soul-brown">{pack.labelFr}</p>
              <p className="mt-2 font-serif text-3xl text-soul-brown">
                CHF {(pack.amountCents / 100).toFixed(0)}.–
              </p>
              <p className="mt-1 text-xs text-soul-bronze">
                {(pack.amountCents / 100 / pack.credits).toFixed(0)}.– / publication
              </p>
              <BuyPackButton packId={pack.id} />
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-2 font-serif text-lg text-soul-brown">
          Paiement par virement (QR / IBAN)
        </h2>
        <p className="text-sm text-soul-ink/80">
          Vous préférez un virement bancaire ? Versez le montant du pack choisi à :
        </p>
        <div className="mt-3 rounded-xl bg-soul-sand/40 p-4 font-mono text-sm text-soul-brown">
          <p>{STATIC_PAYMENT.beneficiary}</p>
          <p className="mt-1">{STATIC_PAYMENT.iban}</p>
        </div>
        <p className="mt-3 text-xs text-soul-bronze">
          {STATIC_PAYMENT.note} Les crédits sont ajoutés manuellement par Didier à
          réception du virement (1-2 jours ouvrés).
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl text-soul-brown">Historique</h2>
        <div className="card divide-y divide-soul-bronze/10">
          {transactions.length === 0 && (
            <p className="p-4 text-sm text-soul-bronze">Aucune transaction.</p>
          )}
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p className="text-soul-brown">
                  {t.type === "purchase" ? "Achat de pack" : t.type === "manual" ? "Crédit manuel" : t.note ?? "Publication"}
                </p>
                <p className="text-xs text-soul-bronze">{formatDate(t.created_at)}</p>
              </div>
              <span className={`font-semibold ${t.amount > 0 ? "text-green-700" : "text-soul-terracotta"}`}>
                {t.amount > 0 ? `+${t.amount}` : t.amount}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
