"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateSettings } from "@/app/actions/settings";
import type { ActionState } from "@/app/actions/events";

export function SettingsForm({ values }: { values: Record<string, string> }) {
  const t = useTranslations("admin.settings");
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateSettings,
    {}
  );

  return (
    <form action={action} className="card flex flex-col gap-5 p-6">
      <div>
        <label htmlFor="exchange_rate_eur" className="label">
          {t("exchangeRate")}
        </label>
        <input
          id="exchange_rate_eur"
          name="exchange_rate_eur"
          inputMode="decimal"
          defaultValue={values.exchange_rate_eur ?? "1.05"}
          className="field !max-w-40"
          placeholder="1.05"
        />
        <p className="mt-1 text-xs text-soul-bronze">
          {t("exchangeRateHint")}
        </p>
      </div>

      <div>
        <label htmlFor="event_delist_days" className="label">
          {t("delistDays")}
        </label>
        <input
          id="event_delist_days"
          name="event_delist_days"
          inputMode="numeric"
          defaultValue={values.event_delist_days ?? "15"}
          className="field !max-w-40"
          placeholder="15"
        />
        <p className="mt-1 text-xs text-soul-bronze">
          {t("delistDaysHint")}
        </p>
      </div>

      <div className="rounded-xl border border-soul-bronze/15 p-4">
        <p className="label mb-3">{t("packPrices")}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="price_pack_1" className="text-xs text-soul-bronze">{t("pack1")}</label>
            <input id="price_pack_1" name="price_pack_1" inputMode="decimal"
              defaultValue={values.price_pack_1 ?? "25"} className="field" placeholder="25" />
          </div>
          <div>
            <label htmlFor="price_pack_5" className="text-xs text-soul-bronze">{t("pack5")}</label>
            <input id="price_pack_5" name="price_pack_5" inputMode="decimal"
              defaultValue={values.price_pack_5 ?? "100"} className="field" placeholder="100" />
          </div>
          <div>
            <label htmlFor="price_pack_10" className="text-xs text-soul-bronze">{t("pack10")}</label>
            <input id="price_pack_10" name="price_pack_10" inputMode="decimal"
              defaultValue={values.price_pack_10 ?? "180"} className="field" placeholder="180" />
          </div>
        </div>
        <p className="mt-2 text-xs text-soul-bronze">
          {t("packPricesHint")}
        </p>
      </div>

      <div className="rounded-xl border border-soul-bronze/15 p-4">
        <p className="label mb-3">{t("promoTitle")}</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="promo_label" className="text-xs text-soul-bronze">
              {t("promoLabel")}
            </label>
            <input id="promo_label" name="promo_label" maxLength={40}
              defaultValue={values.promo_label ?? ""} className="field"
              placeholder={t("promoLabelPlaceholder")} />
          </div>
          <div>
            <label htmlFor="promo_discount_percent" className="text-xs text-soul-bronze">
              {t("promoDiscount")}
            </label>
            <input id="promo_discount_percent" name="promo_discount_percent"
              inputMode="numeric" defaultValue={values.promo_discount_percent ?? ""}
              className="field !max-w-24" placeholder="—" />
          </div>
        </div>
        <p className="mt-2 text-xs text-soul-bronze">
          {t("promoHint")}
        </p>
      </div>

      <div>
        <label htmlFor="payment_beneficiary" className="label">
          {t("beneficiary")}
        </label>
        <input
          id="payment_beneficiary"
          name="payment_beneficiary"
          defaultValue={values.payment_beneficiary ?? "ForTheSoul — Didier Picamoles"}
          className="field"
          placeholder="ForTheSoul — Didier Picamoles"
        />
      </div>

      <div>
        <label htmlFor="payment_iban" className="label">
          {t("iban")}
        </label>
        <input
          id="payment_iban"
          name="payment_iban"
          defaultValue={values.payment_iban ?? ""}
          className="field"
          placeholder="CH00 0000 0000 0000 0000 0"
        />
        <p className="mt-1 text-xs text-soul-bronze">
          {t("ibanHint")}
        </p>
      </div>

      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">{state.success}</p>}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? t("saving") : t("saveButton")}
      </button>
    </form>
  );
}
