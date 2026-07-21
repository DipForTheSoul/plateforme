"use client";

import { useActionState, useRef, useState } from "react";
import { createEvent, updateEvent, type ActionState } from "@/app/actions/events";
import { createVenue } from "@/app/actions/venues";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { LANGUAGE_LABELS } from "@/lib/utils";
import type { Category, Event, Venue } from "@/types/database";

interface Props {
  categories: Category[];
  venues: Venue[];
  /** Langues de la fiche praticien → pré-remplissage (dépôt depuis le profil). */
  defaultLanguages: string[];
  /** Événement existant en mode édition. */
  event?: Event;
}

/** Convertit un ISO en valeur pour <input type="datetime-local">. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ categories, venues, defaultLanguages, event }: Props) {
  const action = event ? updateEvent.bind(null, event.id) : createEvent;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {}
  );

  const [images, setImages] = useState<string[]>(event?.images ?? []);
  const [recurrence, setRecurrence] = useState(event?.recurrence ?? "");
  const [showNewVenue, setShowNewVenue] = useState(false);
  const [venueList, setVenueList] = useState(venues);
  const [selectedVenue, setSelectedVenue] = useState(event?.venue_id ?? "");
  const venueFormRef = useRef<HTMLFormElement>(null);

  // Sur une journée (cours, atelier, soirée) vs plusieurs jours (retraite, voyage).
  const [multiDay, setMultiDay] = useState<boolean>(() => {
    if (event?.start_date && event?.end_date) {
      return (
        new Date(event.end_date).toDateString() !==
        new Date(event.start_date).toDateString()
      );
    }
    return false;
  });

  function toggleNewVenue() {
    setShowNewVenue((open) => {
      const next = !open;
      if (next) {
        setTimeout(
          () =>
            venueFormRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            }),
          60
        );
      }
      return next;
    });
  }

  // Sous-formulaire "nouveau lieu" (géocodé à la création — règle d'or n°3).
  const [venueState, venueAction, venuePending] = useActionState(
    async (prev: ActionState & { venueId?: string }, formData: FormData) => {
      const result = await createVenue(prev, formData);
      if (result.venueId) {
        setVenueList((list) => [
          ...list,
          {
            id: result.venueId!,
            name: String(formData.get("name") ?? ""),
            address: String(formData.get("address") ?? ""),
          } as Venue,
        ]);
        setSelectedVenue(result.venueId);
        setShowNewVenue(false);
      }
      return result;
    },
    {}
  );

  return (
    <div className="flex flex-col gap-8">
      <form action={formAction} className="flex flex-col gap-5">
        <div>
          <label htmlFor="title" className="label">Titre de l&apos;expérience *</label>
          <input id="title" name="title" required minLength={3} maxLength={140}
            defaultValue={event?.title} className="field" />
        </div>

        <div>
          <label htmlFor="description" className="label">Description *</label>
          <textarea id="description" name="description" required minLength={20} rows={8}
            defaultValue={event?.description ?? ""} className="field"
            placeholder="Décrivez l'expérience : déroulé, à qui elle s'adresse…" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="included" className="label">Ce qui est inclus</label>
            <textarea id="included" name="included" rows={4} maxLength={2000}
              defaultValue={event?.included ?? ""} className="field"
              placeholder="Ex. : tapis fournis, tisane, prêt du matériel, repas du midi…" />
          </div>
          <div>
            <label htmlFor="to_bring" className="label">Ce que le/la participant·e doit apporter</label>
            <textarea id="to_bring" name="to_bring" rows={4} maxLength={2000}
              defaultValue={event?.to_bring ?? ""} className="field"
              placeholder="Ex. : tenue confortable, bouteille d'eau, plaid, carnet…" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="category_id" className="label">Catégorie *</label>
            <select id="category_id" name="category_id" required
              defaultValue={event?.category_id ?? ""} className="field">
              <option value="" disabled>Choisir…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="venue_id" className="label">Lieu</label>
            <select id="venue_id" name="venue_id" value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)} className="field">
              <option value="">— À définir —</option>
              {venueList.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <button type="button" onClick={toggleNewVenue}
              className="mt-1 text-xs font-medium text-soul-terracotta underline">
              {showNewVenue ? "− Fermer le nouveau lieu" : "+ Ajouter un nouveau lieu"}
            </button>
          </div>
        </div>

        <div>
          <span className="label">Quand a lieu l&apos;expérience&nbsp;?</span>
          <div className="mb-3 inline-flex rounded-full border border-soul-bronze/30 bg-white p-1 text-sm">
            <button type="button" onClick={() => setMultiDay(false)}
              className={`rounded-full px-4 py-1.5 font-medium transition ${!multiDay ? "bg-soul-brown text-soul-cream" : "text-soul-brown hover:text-soul-terracotta"}`}>
              Sur une journée
            </button>
            <button type="button" onClick={() => setMultiDay(true)}
              className={`rounded-full px-4 py-1.5 font-medium transition ${multiDay ? "bg-soul-brown text-soul-cream" : "text-soul-brown hover:text-soul-terracotta"}`}>
              Sur plusieurs jours
            </button>
          </div>

          {!multiDay ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="start_date" className="label">Date et heure de début *</label>
                <input id="start_date" name="start_date" type="datetime-local" required
                  defaultValue={toLocalInput(event?.start_date)} className="field" />
              </div>
              <p className="self-end pb-2.5 text-xs text-soul-bronze">
                Un cours, un atelier, une soirée… La durée se règle juste en dessous.
                Pour un rendez-vous qui revient (chaque semaine, chaque mois),
                utilisez la récurrence plus bas.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="start_date" className="label">Arrivée (jour &amp; heure) *</label>
                <input id="start_date" name="start_date" type="datetime-local" required
                  defaultValue={toLocalInput(event?.start_date)} className="field" />
              </div>
              <div>
                <label htmlFor="end_date" className="label">Départ (jour &amp; heure) *</label>
                <input id="end_date" name="end_date" type="datetime-local" required
                  defaultValue={toLocalInput(event?.end_date)} className="field" />
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="duration_minutes" className="label">Durée (minutes)</label>
            <input id="duration_minutes" name="duration_minutes" type="number" min={15}
              defaultValue={event?.duration_minutes ?? ""} className="field" />
          </div>
          <div>
            <label htmlFor="price" className="label">Prix (CHF — 0 = prix libre)</label>
            <input id="price" name="price" type="number" min={0} step="0.05"
              defaultValue={event?.price ?? ""} className="field" />
          </div>
          <div>
            <span className="label">Langues *</span>
            <div className="flex flex-wrap gap-3 pt-1.5">
              {Object.entries(LANGUAGE_LABELS).slice(0, 4).map(([code, label]) => (
                <label key={code} className="flex items-center gap-1.5 text-sm text-soul-brown">
                  <input type="checkbox" name="languages" value={code}
                    defaultChecked={
                      event ? event.languages.includes(code) : defaultLanguages.includes(code)
                    } />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {!event && (
          <div className="grid gap-5 rounded-2xl bg-soul-sand/30 p-5 sm:grid-cols-2">
            <div>
              <label htmlFor="recurrence" className="label">Récurrence</label>
              <select id="recurrence" name="recurrence" value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)} className="field">
                <option value="">Événement unique</option>
                <option value="weekly">Chaque semaine</option>
                <option value="biweekly">Toutes les deux semaines</option>
                <option value="monthly">Chaque mois</option>
              </select>
            </div>
            {recurrence && (
              <div>
                <label htmlFor="recurrence_count" className="label">Nombre d&apos;occurrences</label>
                <input id="recurrence_count" name="recurrence_count" type="number"
                  min={2} max={26} defaultValue={4} className="field" />
                <p className="mt-1 text-xs text-soul-bronze">
                  Toutes les dates sont générées automatiquement — 1 seul crédit consommé.
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <span className="label">Photos (max 6 — compressées automatiquement)</span>
          <ImageUploader prefix="event" images={images} onChange={setImages} max={6} />
          {images.map((url) => (
            <input key={url} type="hidden" name="images" value={url} />
          ))}
        </div>

        {state.error && <p className="text-sm text-red-700">{state.error}</p>}

        <button type="submit" disabled={pending} className="btn-primary self-start">
          {pending
            ? "Enregistrement…"
            : event
              ? "Enregistrer les modifications"
              : "Déposer pour validation (1 crédit)"}
        </button>
      </form>

      {showNewVenue && (
        <form ref={venueFormRef} action={venueAction}
          className="card flex flex-col gap-4 border-2 border-soul-terracotta/40 p-6">
          <div className="flex items-center justify-between">
            <p className="font-serif text-lg text-soul-brown">Nouveau lieu</p>
            <button type="button" onClick={() => setShowNewVenue(false)}
              className="text-xs text-soul-bronze underline">Fermer</button>
          </div>
          <p className="text-xs text-soul-bronze">
            L&apos;adresse est géolocalisée automatiquement (recherche par distance).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="v-name">Nom du lieu *</label>
              <input id="v-name" name="name" required className="field" />
            </div>
            <div>
              <label className="label" htmlFor="v-canton">Canton (ex. VD)</label>
              <input id="v-canton" name="canton" maxLength={2} className="field" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="v-address">Adresse complète *</label>
            <input id="v-address" name="address" required className="field"
              placeholder="Rue, numéro, code postal, ville" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="v-country">Pays (code)</label>
              <input id="v-country" name="country" defaultValue="CH" maxLength={2} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="v-capacity">Capacité</label>
              <input id="v-capacity" name="capacity" type="number" min={1} className="field" />
            </div>
          </div>
          {venueState.error && <p className="text-sm text-red-700">{venueState.error}</p>}
          <button type="submit" disabled={venuePending} className="btn-secondary self-start">
            {venuePending ? "Géocodage…" : "Créer le lieu"}
          </button>
        </form>
      )}
    </div>
  );
}
