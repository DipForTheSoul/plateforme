import { createClient } from "@/lib/supabase/server";
import { grantCreditsManually } from "@/app/actions/admin";
import { formatDate } from "@/lib/utils";
import type { CreditTransaction, Practitioner } from "@/types/database";

export const dynamic = "force-dynamic";

/**
 * Attribution manuelle de crédits (paiement statique QR/IBAN — Phase 6) +
 * historique complet des transactions.
 */
export default async function AdminCreditsPage() {
  const supabase = await createClient();
  const [{ data: practitionersData }, { data: transactionsData }] =
    await Promise.all([
      supabase.from("practitioners").select("*").order("name"),
      supabase
        .from("credit_transactions")
        .select("*, practitioner:practitioners(name)")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const practitioners = (practitionersData as Practitioner[]) ?? [];
  const transactions =
    (transactionsData as (CreditTransaction & {
      practitioner: { name: string } | null;
    })[]) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6">
        <h2 className="mb-1 font-serif text-lg text-soul-brown">
          Attribuer des crédits manuellement
        </h2>
        <p className="mb-4 text-sm text-soul-bronze">
          Pour les paiements reçus par QR / IBAN (hors Stripe).
        </p>
        <form action={grantCreditsManually} className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="label" htmlFor="practitioner_id">Praticien·ne</label>
            <select id="practitioner_id" name="practitioner_id" required className="field">
              <option value="" disabled>Choisir…</option>
              {practitioners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.credits} crédit{p.credits > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="label" htmlFor="amount">Crédits</label>
            <input id="amount" name="amount" type="number" min={1} defaultValue={5}
              required className="field" />
          </div>
          <div className="min-w-48 flex-1">
            <label className="label" htmlFor="note">Note</label>
            <input id="note" name="note" placeholder="Virement reçu le…" className="field" />
          </div>
          <button type="submit" className="btn-primary">Attribuer</button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-xl text-soul-brown">Dernières transactions</h2>
        <div className="card divide-y divide-soul-bronze/10">
          {transactions.length === 0 && (
            <p className="p-4 text-sm text-soul-bronze">Aucune transaction.</p>
          )}
          {transactions.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div>
                <p className="font-medium text-soul-brown">
                  {t.practitioner?.name ?? "?"} —{" "}
                  <span className={t.amount > 0 ? "text-green-700" : "text-soul-terracotta"}>
                    {t.amount > 0 ? `+${t.amount}` : t.amount}
                  </span>
                </p>
                <p className="text-xs text-soul-bronze">
                  {formatDate(t.created_at)} ·{" "}
                  {t.type === "purchase" ? "Achat Stripe" : t.type === "manual" ? "Manuel" : "Consommation"}
                  {t.note && <> · {t.note}</>}
                  {t.stripe_session_id && <> · {t.stripe_session_id.slice(0, 18)}…</>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
