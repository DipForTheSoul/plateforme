"use client";

import { useActionState } from "react";
import { WebUrlInput } from '@/components/forms/WebUrlInput';
import { useDraftForm } from '@/components/forms/useDraftForm';
import { DraftNotice } from '@/components/forms/DraftNotice';
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createVenue } from "@/app/actions/venues";
import type { ActionState } from "@/app/actions/events";
import type { Venue } from "@/types/database";

interface Props {
  draftOwner: string;
  venue?: Venue;
  action?: (
    prev: ActionState & { venueId?: string },
    formData: FormData
  ) => Promise<ActionState & { venueId?: string }>;
}

export function VenueForm({ venue, action, draftOwner }: Props) {
  return <VenueFormBody key={`${draftOwner}:${venue?.id ?? 'new'}`} venue={venue} action={action} draftOwner={draftOwner} />;
}

function VenueFormBody({ venue, action, draftOwner }: Props) {
  const router = useRouter();
  const t = useTranslations("admin.venues");
  const td = useTranslations('draft');
  const draft = useDraftForm(`venue:${draftOwner}:${venue?.id ?? 'new'}`, {}, undefined, { persistent: true });
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState & { venueId?: string }, formData: FormData) => {
      try {
        const result = await (action ?? createVenue)(prev, formData);
        if (result.success) { draft.clear(); router.push("/admin/lieux"); }
        return result;
      } catch { return { error: td('networkError') }; }
    },
    {}
  );

  return (
    <form {...draft.formProps} action={formAction} onSubmit={draft.submit(formAction)} className="card flex flex-col gap-4 p-6">
      <DraftNotice draft={draft} busy={pending} />
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
        <WebUrlInput id="website" name="website"
          defaultValue={venue?.contact?.website ?? ""} placeholder="https://…" className="field" />
      </div>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">{state.success}</p>}
      <button type="submit" disabled={draft.conflict || pending} className="btn-primary self-start">
        {pending ? t("geocoding") : venue ? t("save") : t("createAndGeocode")}
      </button>
    </form>
  );
}
