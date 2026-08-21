"use client";

import { useActionState, useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
  /** Univers déjà rattachés (multi-univers §2.1) en mode édition. */
  selectedCategoryIds?: string[];
  /** Action serveur alternative (ex. édition/création côté admin, §3). */
  action?: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  /** Liste des praticien·nes (mode admin création : choix du propriétaire). */
  practitioners?: { id: string; name: string }[];
}

/** Convertit un ISO en valeur pour <input type="datetime-local">. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
  categories,
  venues,
  defaultLanguages,
  event,
  selectedCategoryIds = [],
  action: actionOverride,
  practitioners,
}: Props) {
  const t = useTranslations("eventForm");
  const action =
    actionOverride ?? (event ? updateEvent.bind(null, event.id) : createEvent);
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
        {practitioners && !event && (
          <div className="rounded-2xl border border-soul-violet/20 bg-soul-violet/5 p-4">
            <label htmlFor="owner_practitioner_id" className="label">
              {t("ownerLabel")}
            </label>
            <select id="owner_practitioner_id" name="owner_practitioner_id" required
              className="field" defaultValue="">
              <option value="" disabled>{t("choose")}</option>
              {practitioners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-soul-bronze">
              {t("ownerHint")}
            </p>
          </div>
        )}

        <div>
          <label htmlFor="title" className="label">{t("titleLabel")}</label>
          <input id="title" name="title" required minLength={3} maxLength={140}
            defaultValue={event?.title} className="field" />
        </div>

        <div>
          <label htmlFor="description" className="label">{t("descriptionLabel")}</label>
          <textarea id="description" name="description" required minLength={20} rows={8}
            defaultValue={event?.description ?? ""} className="field"
            placeholder={t("descriptionPlaceholder")} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="included" className="label">{t("includedLabel")}</label>
            <textarea id="included" name="included" rows={4} maxLength={2000}
              defaultValue={event?.included ?? ""} className="field"
              placeholder={t("includedPlaceholder")} />
          </div>
          <div>
            <label htmlFor="to_bring" className="label">{t("toBringLabel")}</label>
            <textarea id="to_bring" name="to_bring" rows={4} maxLength={2000}
              defaultValue={event?.to_bring ?? ""} className="field"
              placeholder={t("toBringPlaceholder")} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <span className="label">{t("universeLabel")} <span className="font-normal text-soul-bronze">{t("universeMulti")}</span></span>
            <div className="flex flex-wrap gap-2 pt-1.5">
              {categories.map((c) => {
                const checked = event
                  ? selectedCategoryIds.includes(c.id)
                  : false;
                return (
                  <label key={c.id}
                    className="flex items-center gap-1.5 rounded-full border border-soul-bronze/30 bg-white px-3 py-1.5 text-sm text-soul-brown cursor-pointer has-[:checked]:border-soul-violet has-[:checked]:bg-soul-violet/10">
                    <input type="checkbox" name="category_ids" value={c.id}
                      defaultChecked={checked} />
                    {c.name}
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-soul-bronze">{t("universeHint")}</p>
          </div>
          <div>
            <label htmlFor="venue_id" className="label">{t("venueLabel")}</label>
            <select id="venue_id" name="venue_id" value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)} className="field">
              <option value="">{t("venueToDefine")}</option>
              {venueList.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <button type="button" onClick={toggleNewVenue}
              className="mt-1 text-xs font-medium text-soul-terracotta underline">
              {showNewVenue ? t("closeNewVenue") : t("addNewVenue")}
            </button>
          </div>
        </div>

        <div>
          <span className="label">{t("whenLabel")}</span>
          <div className="mb-3 inline-flex rounded-full border border-soul-bronze/30 bg-white p-1 text-sm">
            <button type="button" onClick={() => setMultiDay(false)}
              className={`rounded-full px-4 py-1.5 font-medium transition ${!multiDay ? "bg-soul-violet text-white" : "text-soul-brown hover:text-soul-terracotta"}`}>
              {t("oneDay")}
            </button>
            <button type="button" onClick={() => setMultiDay(true)}
              className={`rounded-full px-4 py-1.5 font-medium transition ${multiDay ? "bg-soul-violet text-white" : "text-soul-brown hover:text-soul-terracotta"}`}>
              {t("multiDay")}
            </button>
          </div>

          {!multiDay ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="start_date" className="label">{t("startLabel")}</label>
                <input id="start_date" name="start_date" type="datetime-local" required
                  defaultValue={toLocalInput(event?.start_date)} className="field" />
              </div>
              <p className="self-end pb-2.5 text-xs text-soul-bronze">
                {t("oneDayHint")}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="start_date" className="label">{t("arrivalLabel")}</label>
                <input id="start_date" name="start_date" type="datetime-local" required
                  defaultValue={toLocalInput(event?.start_date)} className="field" />
              </div>
              <div>
                <label htmlFor="end_date" className="label">{t("departureLabel")}</label>
                <input id="end_date" name="end_date" type="datetime-local" required
                  defaultValue={toLocalInput(event?.end_date)} className="field" />
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="duration_minutes" className="label">{t("durationLabel")}</label>
            <input id="duration_minutes" name="duration_minutes" type="number" min={15}
              defaultValue={event?.duration_minutes ?? ""} className="field" />
          </div>
          <div>
            <label htmlFor="price" className="label">{t("priceLabel")}</label>
            <input id="price" name="price" type="number" min={0} step="0.05"
              defaultValue={event?.price ?? ""} className="field" />
          </div>
          <div>
            <span className="label">{t("languagesLabel")}</span>
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
              <label htmlFor="recurrence" className="label">{t("recurrenceLabel")}</label>
              <select id="recurrence" name="recurrence" value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)} className="field">
                <option value="">{t("recurrenceNone")}</option>
                <option value="weekly">{t("recurrenceWeekly")}</option>
                <option value="biweekly">{t("recurrenceBiweekly")}</option>
                <option value="monthly">{t("recurrenceMonthly")}</option>
              </select>
            </div>
            {recurrence && (
              <div>
                <label htmlFor="recurrence_count" className="label">{t("occurrencesLabel")}</label>
                <input id="recurrence_count" name="recurrence_count" type="number"
                  min={2} max={26} defaultValue={4} className="field" />
                <p className="mt-1 text-xs text-soul-bronze">
                  {t("occurrencesHint")}
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <label htmlFor="video_url" className="label">{t("videoLabel")}</label>
          <input id="video_url" name="video_url" type="url" placeholder="https://youtu.be/… ou https://vimeo.com/…"
            defaultValue={event?.video_url ?? ""} className="field" />
          <p className="mt-1 text-xs text-soul-bronze">
            {t("videoHint")}
          </p>
        </div>

        <div>
          <span className="label">{t("photosLabel")}</span>
          <ImageUploader prefix="event" images={images} onChange={setImages} max={6} />
          {images.map((url) => (
            <input key={url} type="hidden" name="images" value={url} />
          ))}
        </div>

        {state.error && <p className="text-sm text-red-700">{state.error}</p>}

        <button type="submit" disabled={pending} className="btn-primary self-start">
          {pending
            ? t("saving")
            : event
              ? t("saveChanges")
              : t("submitForValidation")}
        </button>
      </form>

      {showNewVenue && (
        <form ref={venueFormRef} action={venueAction}
          className="card flex flex-col gap-4 border-2 border-soul-terracotta/40 p-6">
          <div className="flex items-center justify-between">
            <p className="font-serif text-lg text-soul-brown">{t("newVenueTitle")}</p>
            <button type="button" onClick={() => setShowNewVenue(false)}
              className="text-xs text-soul-bronze underline">{t("close")}</button>
          </div>
          <p className="text-xs text-soul-bronze">
            {t("newVenueHint")}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="v-name">{t("venueNameLabel")}</label>
              <input id="v-name" name="name" required className="field" />
            </div>
            <div>
              <label className="label" htmlFor="v-canton">{t("cantonLabel")}</label>
              <input id="v-canton" name="canton" maxLength={2} className="field" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="v-address">{t("fullAddressLabel")}</label>
            <input id="v-address" name="address" required className="field"
              placeholder={t("fullAddressPlaceholder")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="v-city">{t("cityLabel")}</label>
              <input id="v-city" name="city" className="field" placeholder={t("cityPlaceholder")} />
            </div>
            <div>
              <label className="label" htmlFor="v-country">{t("countryLabel")}</label>
              <input id="v-country" name="country" defaultValue="CH" maxLength={2} required className="field" />
            </div>
            <div>
              <label className="label" htmlFor="v-capacity">{t("capacityLabel")}</label>
              <input id="v-capacity" name="capacity" type="number" min={1} className="field" />
            </div>
          </div>
          {venueState.error && <p className="text-sm text-red-700">{venueState.error}</p>}
          <button type="submit" disabled={venuePending} className="btn-secondary self-start">
            {venuePending ? t("geocoding") : t("createVenue")}
          </button>
        </form>
      )}
    </div>
  );
}
