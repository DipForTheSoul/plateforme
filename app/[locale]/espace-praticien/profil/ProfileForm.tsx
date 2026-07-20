"use client";

import { useActionState, useState } from "react";
import { updatePractitionerProfile } from "@/app/actions/practitioner";
import type { ActionState } from "@/app/actions/events";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { LANGUAGE_LABELS } from "@/lib/utils";
import type { Practitioner } from "@/types/database";

export function ProfileForm({ practitioner }: { practitioner: Practitioner }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updatePractitionerProfile,
    {}
  );
  const [photos, setPhotos] = useState<string[]>(practitioner.photos);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">Nom public *</label>
          <input id="name" name="name" required defaultValue={practitioner.name} className="field" />
        </div>
        <div>
          <label htmlFor="specialties" className="label">Spécialités (séparées par des virgules)</label>
          <input id="specialties" name="specialties"
            defaultValue={practitioner.specialties.join(", ")} className="field"
            placeholder="Danse extatique, Breathwork…" />
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="label">Biographie</label>
        <textarea id="bio" name="bio" rows={6} defaultValue={practitioner.bio ?? ""}
          className="field" placeholder="Votre parcours, votre approche, ce qui vous anime…" />
      </div>

      <div>
        <span className="label">Langues parlées</span>
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
          <label htmlFor="email" className="label">E-mail de contact</label>
          <input id="email" name="email" type="email"
            defaultValue={practitioner.contact.email ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="phone" className="label">Téléphone</label>
          <input id="phone" name="phone" defaultValue={practitioner.contact.phone ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="website" className="label">Site web</label>
          <input id="website" name="website" type="url" placeholder="https://…"
            defaultValue={practitioner.contact.website ?? ""} className="field" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="instagram" className="label">Instagram</label>
          <input id="instagram" name="instagram" type="url" placeholder="https://instagram.com/…"
            defaultValue={practitioner.links.instagram ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="facebook" className="label">Facebook</label>
          <input id="facebook" name="facebook" type="url" placeholder="https://facebook.com/…"
            defaultValue={practitioner.links.facebook ?? ""} className="field" />
        </div>
      </div>

      <div>
        <span className="label">Photos (la première est votre portrait principal)</span>
        <ImageUploader prefix="practitioner" images={photos} onChange={setPhotos} max={6} />
        {photos.map((url) => (
          <input key={url} type="hidden" name="photos" value={url} />
        ))}
      </div>

      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">{state.success}</p>}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Enregistrement…" : "Enregistrer ma fiche"}
      </button>
    </form>
  );
}
