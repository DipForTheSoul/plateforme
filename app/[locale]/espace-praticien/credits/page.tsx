import Image from "next/image";
import { getCurrentPractitioner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CREDIT_PACKS, STATIC_PAYMENT, resolvePackPriceChf, getPromo, discountedChf } from "@/lib/credits";
import { formatDate } from "@/lib/utils";
import type { CreditPack, CreditTransaction } from "@/types/database";
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
  const [{ data }, { data: packData }, { data: settingsData }] = await Promise.all([
    supabase
      .from("credit_transactions")
      .select("*")
      .eq("practitioner_id", practitioner.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("credit_packs")
      .select("*")
      .eq("practitioner_id", practitioner.id)
      .gt("credits_remaining", 0)
      .order("expires_at", { ascending: true, nullsFirst: false }),
    supabase.from("settings").select("key, value"),
  ]);
  const transactions = (data as CreditTransaction[]) ?? [];
  const packs = (packData as CreditPack[]) ?? [];
  const settings = Object.fromEntries(
    ((settingsData as { key: string; value: string }[]) ?? []).map((s) => [s.key, s.value])
  );
  // IBAN / bénéficiaire : éditables par l'admin (Didier) depuis /admin/parametres.
  const beneficiary = settings.payment_beneficiary?.trim() || STATIC_PAYMENT.beneficiary;
  const iban = settings.payment_iban?.trim() || STATIC_PAYMENT.iban;
  const promo = getPromo(settings);

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

      {packs.length > 0 && (
        <section className="card p-6">
          <h2 className="mb-3 font-serif text-lg text-soul-brown">Vos packs</h2>
          <ul className="divide-y divide-soul-bronze/10">
            {packs.map((pack) => {
              const expired = pack.expires_at
                ? new Date(pack.expires_at) < new Date()
                : false;
              return (
                <li key={pack.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-soul-brown">
                      Pack de {pack.credits_total} publication{pack.credits_total > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-soul-bronze">
                      {pack.expires_at
                        ? `Valable jusqu'au ${formatDate(pack.expires_at)}`
                        : "Sans date d'échéance"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      expired
                        ? "bg-red-100 text-red-700"
                        : "bg-soul-violet/10 text-soul-violet"
                    }`}
                  >
                    {expired ? "Expiré" : "Actif"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-soul-bronze">
            Un pack dont la date est dépassée passe automatiquement en « expiré » ;
            ses crédits ne sont plus utilisables. En revanche, les expériences que vous
            avez publiées pendant la validité de votre pack <strong>restent en ligne
            jusqu&apos;à leur date</strong> (puis se retirent automatiquement peu après),
            même si le pack a expiré entre-temps.
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl text-soul-brown">Packs de publications</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => {
            const priceChf = resolvePackPriceChf(pack, settings);
            const hasDiscount = promo !== null && promo.percent > 0;
            const finalChf = hasDiscount ? discountedChf(priceChf, promo!.percent) : priceChf;
            return (
              <div key={pack.id} className="card flex flex-col p-6">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-serif text-lg text-soul-brown">{pack.labelFr}</p>
                  {promo && (
                    <span className="rounded-full bg-soul-violet/10 px-2.5 py-0.5 text-xs font-semibold text-soul-violet">
                      {promo.label}
                    </span>
                  )}
                </div>
                <p className="mt-2 font-serif text-3xl text-soul-brown">
                  {hasDiscount && (
                    <span className="mr-2 align-middle text-xl text-soul-bronze/60 line-through">
                      {priceChf.toFixed(0)}.–
                    </span>
                  )}
                  CHF {finalChf.toFixed(0)}.–
                </p>
                <p className="mt-1 text-xs text-soul-bronze">
                  {(finalChf / pack.credits).toFixed(0)}.– / publication
                </p>
                <BuyPackButton packId={pack.id} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-2 font-serif text-lg text-soul-brown">
          Paiement par Revolut / virement
        </h2>
        <p className="text-sm text-soul-ink/80">
          Vous préférez payer par Revolut ou par virement ? Réglez le montant du pack
          choisi à {beneficiary} :
        </p>

        <div className="mt-4 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex flex-col items-center gap-3">
            <Image
              src={STATIC_PAYMENT.revolutQr}
              alt="QR code Revolut ForTheSoul"
              width={160}
              height={160}
              className="rounded-xl border border-soul-bronze/20 bg-white p-2"
            />
            <a
              href={STATIC_PAYMENT.revolutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-soul-violet px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-soul-violet-dark"
            >
              Payer via Revolut
            </a>
          </div>

          <div className="text-sm text-soul-ink/80">
            <p>Scannez le QR code ou cliquez sur « Payer via Revolut ».</p>
            {iban && (
              <div className="mt-3 rounded-xl bg-soul-sand/40 p-4 font-mono text-sm text-soul-brown">
                <p>{beneficiary}</p>
                <p className="mt-1">IBAN&nbsp;: {iban}</p>
              </div>
            )}
            <p className="mt-3 text-xs text-soul-bronze">
              {STATIC_PAYMENT.note} Les crédits sont ajoutés manuellement par Didier à
              réception du paiement (1-2 jours ouvrés).
            </p>
          </div>
        </div>
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
