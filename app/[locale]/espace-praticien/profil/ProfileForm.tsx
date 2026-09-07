"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { updatePractitionerProfile } from "@/app/actions/practitioner";
import type { ActionState } from "@/app/actions/events";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { LANGUAGE_LABELS } from "@/lib/utils";
import type { Practitioner } from "@/types/database";

export function ProfileForm({
  practitioner,
  action,
}: {
  practitioner: Practitioner;
  /** Action serveur alternative (édition admin d'une autre fiche, §3). */
  action?: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const t = useTranslations("practitioner");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action ?? updatePractitionerProfile,
    {}
  );
  const [photos, setPhotos] = useState<string[]>(practitioner.photos);
  const [logo, setLogo] = useState<string[]>(
    practitioner.logo_url ? [practitioner.logo_url] : []
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const draftInitializedRef = useRef(false);
  const draftKey = `forthesoul:profile-draft:${practitioner.id}`;

  const saveDraft = useCallback(() => {
    if (!draftInitializedRef.current || !formRef.current) return;
    const values: Record<string, string[]> = {};
    for (const [name, value] of new FormData(formRef.current).entries()) {
      if (typeof value !== "string") continue;
      values[name] = [...(values[name] ?? []), value];
    }
    localStorage.setItem(draftKey, JSON.stringify({ values, photos, logo }));
  }, [draftKey, logo, photos]);

  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (!saved || !formRef.current) {
      draftInitializedRef.current = true;
      return;
    }
    try {
      const draft = JSON.parse(saved) as {
        values?: Record<string, string[]>;
        photos?: string[];
        logo?: string[];
      };
      const values = draft.values ?? {};
      for (const field of Array.from(formRef.current.elements)) {
        if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) continue;
        const savedValues = values[field.name];
        if (!field.name || !savedValues) continue;
        if (field instanceof HTMLInputElement && field.type === "checkbox") {
          field.checked = savedValues.includes(field.value);
        } else if (field instanceof HTMLInputElement && field.type !== "file") {
          field.value = savedValues[0] ?? "";
        } else if (field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
          field.value = savedValues[0] ?? "";
        }
      }
      queueMicrotask(() => {
        if (Array.isArray(draft.photos)) setPhotos(draft.photos);
        if (Array.isArray(draft.logo)) setLogo(draft.logo);
        draftInitializedRef.current = true;
        setDraftRestored(true);
      });
    } catch {
      localStorage.removeItem(draftKey);
      draftInitializedRef.current = true;
    }
  }, [draftKey]);

  useEffect(() => {
    saveDraft();
  }, [logo, photos, saveDraft]);

  useEffect(() => {
    if (state.success) localStorage.removeItem(draftKey);
  }, [draftKey, state.success]);

  function clearDraft() {
    localStorage.removeItem(draftKey);
    window.location.reload();
  }

  return (
    <form ref={formRef} action={formAction} onInput={saveDraft} onChange={saveDraft}
      className="flex flex-col gap-5">
      {draftRestored && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-soul-violet/20 bg-soul-violet/5 px-4 py-3 text-sm text-soul-brown">
          <span>{t("draftRestored")}</span>
          <button type="button" onClick={clearDraft} className="underline">{t("clearDraft")}</button>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">{t("namePublic")}</label>
          <input id="name" name="name" required defaultValue={practitioner.name} className="field" />
        </div>
        <div>
          <label htmlFor="specialties" className="label">{t("specialties")}</label>
          <input id="specialties" name="specialties"
            defaultValue={practitioner.specialties.join(", ")} className="field"
            placeholder={t("specialtiesPlaceholder")} />
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="label">{t("bio")}</label>
        <textarea id="bio" name="bio" rows={6} defaultValue={practitioner.bio ?? ""}
          className="field" placeholder={t("bioPlaceholder")} />
      </div>

      <div>
        <span className="label">{t("languagesSpoken")}</span>
        <div className="flex flex-wrap gap-3 pt-1">
          {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
            <label key={code} className="flex items-center gap-1.5 text-sm text-soul-brown">
              <input type="checkbox" name="languages" value={code}
                defaultChecked={practitioner.languages.includes(code)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="email" className="label">{t("contactEmail")}</label>
          <input id="email" name="email" type="email"
            defaultValue={practitioner.contact.email ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="phone" className="label">{t("phone")}</label>
          <input id="phone" name="phone" defaultValue={practitioner.contact.phone ?? ""}
            placeholder="+41 78 123 45 67" className="field" />
          <p className="mt-1 text-xs text-soul-bronze">{t("phoneHint")}</p>
        </div>
        <div>
          <label htmlFor="website" className="label">{t("website")}</label>
          <input id="website" name="website" type="text" inputMode="url" placeholder="ex. monsite.ch"
            defaultValue={practitioner.contact.website ?? ""} className="field" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="instagram" className="label">{t("instagram")}</label>
          <input id="instagram" name="instagram" type="text" inputMode="url" placeholder="instagram.com/…"
            defaultValue={practitioner.links.instagram ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="facebook" className="label">{t("facebook")}</label>
          <input id="facebook" name="facebook" type="text" inputMode="url" placeholder="facebook.com/…"
            defaultValue={practitioner.links.facebook ?? ""} className="field" />
        </div>
      </div>

      <div>
        <label htmlFor="review_url" className="label">{t("reviewLink")}</label>
        <input id="review_url" name="review_url" type="text" inputMode="url" placeholder="ex. google.com/…"
          defaultValue={practitioner.review_url ?? ""} className="field" />
        <p className="mt-1 text-xs text-soul-bronze">{t("reviewHint")}</p>
      </div>

      <div>
        <span className="label">{t("logoLabel")}</span>
        <ImageUploader prefix="practitioner-logo" images={logo} onChange={setLogo} max={1} />
        <input type="hidden" name="logo_url" value={logo[0] ?? ""} />
      </div>

      <div>
        <span className="label">{t("photosLabel")}</span>
        <ImageUploader prefix="practitioner" images={photos} onChange={setPhotos} max={6} />
        {photos.map((url) => (
          <input key={url} type="hidden" name="photos" value={url} />
        ))}
      </div>

      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">{state.success}</p>}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? t("saving") : t("saveProfile")}
      </button>
    </form>
  );
}
