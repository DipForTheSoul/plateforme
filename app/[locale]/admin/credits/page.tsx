import { createClient } from "@/lib/supabase/server";
import { SettingNumberForm } from "@/components/admin/SettingNumberForm";
import { GrantCreditsForm } from "@/components/admin/GrantCreditsForm";
import { AdjustCreditsForm } from "@/components/admin/AdjustCreditsForm";
import { formatDate } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import type { CreditTransaction, Practitioner } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminCreditsPage() {
  const supabase = await createClient();
  const t = await getTranslations("admin.credits");
  const tc = await getTranslations("admin.common");

  const [{ data: practitionersData }, { data: transactionsData }, { data: settingData }] =
    await Promise.all([
      supabase.from("practitioners").select("*").order("name"),
      supabase
        .from("credit_transactions")
        .select("*, practitioner:practitioners(name)")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("settings").select("value").eq("key", "pack_default_valid_days").maybeSingle(),
    ]);

  const practitioners = (practitionersData as Practitioner[]) ?? [];
  const packValidDays = (settingData as { value: string } | null)?.value ?? "365";
  const transactions =
    (transactionsData as (CreditTransaction & {
      practitioner: { name: string } | null;
    })[]) ?? [];

  const practitionersList = practitioners.map((p) => ({
    id: p.id,
    name: p.name,
    credits: p.credits,
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6">
        <h2 className="mb-3 font-serif text-lg text-soul-brown">{t("packValidity")}</h2>
        <SettingNumberForm
          settingKey="pack_default_valid_days"
          label={t("packValidityLabel")}
          hint={t("packValidityHint")}
          defaultValue={packValidDays}
          suffix={tc("days")}
          saveLabel={tc("save")}
        />
      </section>

      <section className="card p-6">
        <h2 className="mb-1 font-serif text-lg text-soul-brown">
          {t("manualGrant")}
        </h2>
        <p className="mb-4 text-sm text-soul-bronze">
          {t("manualGrantHint")}
        </p>
        <GrantCreditsForm practitioners={practitionersList} />
      </section>

      <section className="card p-6">
        <h2 className="mb-1 font-serif text-lg text-soul-brown">
          {t("deductTitle")}
        </h2>
        <p className="mb-4 text-sm text-soul-bronze">
          {t("deductHint")}
        </p>
        <AdjustCreditsForm practitioners={practitionersList} />
      </section>

      <section>
        <h2 className="mb-4 text-xl text-soul-brown">{t("recentTransactions")}</h2>
        <div className="card divide-y divide-soul-bronze/10">
          {transactions.length === 0 && (
            <p className="p-4 text-sm text-soul-bronze">{t("noTransactions")}</p>
          )}
          {transactions.map((tx) => (
            <div key={tx.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div>
                <p className="font-medium text-soul-brown">
                  {tx.practitioner?.name ?? "?"} —{" "}
                  <span className={tx.amount > 0 ? "text-green-700" : "text-soul-terracotta"}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </span>
                </p>
                <p className="text-xs text-soul-bronze">
                  {formatDate(tx.created_at)} ·{" "}
                  {tx.type === "purchase" ? t("txStripe") : tx.type === "manual" ? t("txManual") : t("txConsumption")}
                  {tx.note && <> · {tx.note}</>}
                  {tx.stripe_session_id && <> · {tx.stripe_session_id.slice(0, 18)}…</>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
