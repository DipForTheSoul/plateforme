"use client";

import { useActionState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createVenue } from "@/app/actions/venues";
import type { ActionState } from "@/app/actions/events";
import type { Venue } from "@/types/database";

interface Props {
  venue?: Venue;
  action?: (
    prev: ActionState & { venueId?: string },
    formData: FormData
  ) => Promise<ActionState & { venueId?: string }>;
}

export function VenueForm({ venue, action }: Props) {
  const router = useRouter();
  const t = useTranslations("admin.venues");
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState & { venueId?: string }, formData: FormData) => {
      const result = await (action ?? createVenue)(prev, formData);
      if (result.venueId || result.success) router.push("/admin/lieux");
      return result;
    },
    {}
  );

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-6">
      <div>
        <label className="label" htmlFor="name">{t("venueName")}</label>
        <input id="name" name="name" required defaultValue={venue?.name} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="address">{t("fullAddress")}</label>
        <input id="address" name="address" required defaultValue={venue?.address} className="field"
          placeholder={t("addressPlaceholder")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="city">{t("city")}</label>
          <input id="city" name="city" defaultValue={venue?.city ?? ""} placeholder={t("cityPlaceholder")} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="canton">{t("canton")}</label>
          <input id="canton" name="canton" maxLength={2} defaultValue={venue?.canton ?? ""} placeholder={t("cantonPlaceholder")} className="field" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="country">{t("country")}</label>
          <input id="country" name="country" required defaultValue={venue?.country ?? "CH"} maxLength={2} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="capacity">{t("capacity")}</label>
          <input id="capacity" name="capacity" type="number" min={1} defaultValue={venue?.capacity ?? ""} className="field" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">{t("description")}</label>
        <textarea id="description" name="description" rows={4} defaultValue={venue?.description ?? ""} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="website">{t("website")}</label>
        <input id="website" name="website" type="url" inputMode="url"
          defaultValue={venue?.contact?.website ?? ""} placeholder="https://…" className="field" />
      </div>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">{state.success}</p>}
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? t("geocoding") : venue ? t("save") : t("createAndGeocode")}
      </button>
    </form>
  );
}
