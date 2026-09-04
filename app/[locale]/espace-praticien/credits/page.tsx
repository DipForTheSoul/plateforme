import Image from "next/image";
import { getTranslations } from "next-intl/server";
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
  const tr = await getTranslations("practitioner");
  const practitioner = await getCurrentPractitioner();
  const { achat } = await searchParams;
  if (!practitioner) {
    return <p className="text-sm text-soul-bronze">{tr("noProfileShort")}</p>;
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
          {tr("creditsAchatSuccess")}
        </div>
      )}
      {achat === "annule" && (
        <div className="rounded-2xl border border-soul-amber/50 bg-soul-ivory p-4 text-sm text-soul-brown">
          {tr("creditsAchatCancelled")}
        </div>
      )}

      <div className="card p-6">
        <p className="text-sm text-soul-bronze">{tr("creditsCurrentBalance")}</p>
        <p className="font-serif text-5xl text-soul-brown">
          {practitioner.credits}
          <span className="ml-2 text-lg text-soul-bronze">
            {tr("creditsPublications", { count: practitioner.credits })}
          </span>
        </p>
        {practitioner.credits === 0 && (
          <p className="mt-2 text-sm text-soul-terracotta">
            {tr("creditsBalanceEmptyInline")}
          </p>
        )}
      </div>

      {packs.length > 0 && (
        <section className="card p-6">
          <h2 className="mb-3 font-serif text-lg text-soul-brown">{tr("creditsYourPacks")}</h2>
          <ul className="divide-y divide-soul-bronze/10">
            {packs.map((pack) => {
              const expired = pack.expires_at
                ? new Date(pack.expires_at) < new Date()
                : false;
              return (
                <li key={pack.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-soul-brown">
                      {tr("creditsPackOf", { count: pack.credits_total })}
                    </p>
                    <p className="text-xs text-soul-bronze">
                      {pack.expires_at
                        ? tr("creditsValidUntil", { date: formatDate(pack.expires_at) })
                        : tr("creditsNoExpiry")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      expired
                        ? "bg-red-100 text-red-700"
                        : "bg-soul-violet/10 text-soul-violet"
                    }`}
                  >
                    {expired ? tr("creditsExpired") : tr("creditsActive")}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-soul-bronze">{tr("creditsPacksNote")}</p>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl text-soul-brown">{tr("creditsPacksHeading")}</h2>
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
                  {tr("creditsPerPublication", { price: (finalChf / pack.credits).toFixed(0) })}
                </p>
                <BuyPackButton packId={pack.id} />
              </div>
            );
          })}
        </div>
      </section>

      {iban && (
        <section className="card p-6">
          <h2 className="mb-2 font-serif text-lg text-soul-brown">
            {tr("creditsPaymentTitle")}
          </h2>
          <p className="text-sm text-soul-ink/80">
            {tr("creditsPaymentIntro", { beneficiary })}
          </p>
          <div className="mt-4 rounded-xl bg-soul-sand/40 p-4 font-mono text-sm text-soul-brown">
            <p>{beneficiary}</p>
            <p className="mt-1">{tr("creditsIban")}&nbsp;: {iban}</p>
          </div>
          <p className="mt-3 text-xs text-soul-bronze">
            {tr("creditsPaymentNote", { note: STATIC_PAYMENT.note })}
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl text-soul-brown">{tr("creditsHistory")}</h2>
        <div className="card divide-y divide-soul-bronze/10">
          {transactions.length === 0 && (
            <p className="p-4 text-sm text-soul-bronze">{tr("creditsNoTransactions")}</p>
          )}
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p className="text-soul-brown">
                  {t.type === "purchase"
                    ? tr("creditsTxPurchase")
                    : t.type === "manual"
                      ? tr("creditsTxManual")
                      : t.note ?? tr("creditsTxPublication")}
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
