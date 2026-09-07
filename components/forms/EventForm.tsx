"use client";

import { startTransition, useActionState, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useDraftForm } from "./useDraftForm";
import { WebUrlInput } from "./WebUrlInput";
import { DescriptionEditor } from './DescriptionEditor';
import { toEventLocalInput } from "@/lib/event-time";
import { createEvent, updateEvent, type ActionState } from "@/app/actions/events";
import { removeOccurrence } from "@/app/actions/events";
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
  /** Autres dates de la série, visibles au propriétaire et à l'administration. */
  occurrences?: { id: string; start_date: string }[];
  draftOwner?: string;
}

/** Convertit un ISO en valeur pour <input type="datetime-local">. */
function toLocalInput(iso: string | null | undefined): string {
  return toEventLocalInput(iso);
}

export function EventForm({
  categories,
  venues,
  defaultLanguages,
  event,
  selectedCategoryIds = [],
  action: actionOverride,
  practitioners,
  occurrences = [],
  draftOwner = 'local',
}: Props) {
  const t = useTranslations("eventForm");
  const tCat = useTranslations("categories");
  const td = useTranslations("draft");
  const locale = useLocale();
  const router = useRouter();
  const action =
    actionOverride ?? (event ? updateEvent.bind(null, event.id) : createEvent);

  const [images, setImages] = useState<string[]>(event?.images ?? []);
  const [recurrence, setRecurrence] = useState(event?.recurrence ?? "");
  const [showNewVenue, setShowNewVenue] = useState(false);
  const [venueList, setVenueList] = useState(venues);
  const [selectedVenue, setSelectedVenue] = useState(event?.venue_id ?? "");
  const [startDate, setStartDate] = useState(toLocalInput(event?.start_date));
  const [endDate, setEndDate] = useState(toLocalInput(event?.end_date));
  const [recurrenceCount, setRecurrenceCount] = useState(event?.recurrence_count ?? 4);
  const [uploading, setUploading] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>(() => crypto.randomUUID());
  const [updatedAt, setUpdatedAt] = useState(event?.updated_at ?? '');
  const [customDates, setCustomDates] = useState<string[]>(event?.recurrence === 'custom' ? occurrences.map(o => toLocalInput(o.start_date)) : []);
  const [visibleOccurrences, setVisibleOccurrences] = useState(occurrences);
  const [removing, startRemoving] = useTransition();
  const [occurrenceError, setOccurrenceError] = useState('');
  const venueFormRef = useRef<HTMLFormElement>(null);

  // Sur une journée (cours, atelier, soirée) vs plusieurs jours (retraite, voyage).
  const [multiDay, setMultiDay] = useState<boolean>(() => {
    if (event?.start_date && event?.end_date) {
      return (
        toLocalInput(event.end_date).slice(0, 10) !==
        toLocalInput(event.start_date).slice(0, 10)
      );
    }
    return false;
  });

  const draft = useDraftForm(`event:${draftOwner}:${event?.id ?? (practitioners ? 'admin-new' : 'new')}`,
    { images, recurrence, recurrenceCount, selectedVenue, multiDay, startDate, endDate, venueList, submissionId, customDates }, (data, fields) => {
      if (Array.isArray(data.images)) setImages(data.images.filter((v): v is string => typeof v === 'string'));
      const restoredRecurrence = fields.recurrence?.[0] ?? data.recurrence;
      const restoredCount = fields.recurrence_count?.[0] ?? data.recurrenceCount;
      const restoredVenue = fields.venue_id?.[0] ?? data.selectedVenue;
      if (typeof restoredRecurrence === 'string') setRecurrence(restoredRecurrence);
      if (restoredCount !== undefined && Number.isFinite(Number(restoredCount))) setRecurrenceCount(Number(restoredCount));
      if (typeof restoredVenue === 'string') setSelectedVenue(restoredVenue);
      if (typeof data.multiDay === 'boolean') setMultiDay(data.multiDay);
      // The DOM snapshot is authoritative: an input event can precede React's commit.
      const restoredStart = fields.start_date?.[0] ?? data.startDate;
      const restoredEnd = fields.end_date?.[0] ?? data.endDate;
      if (typeof restoredStart === 'string') setStartDate(restoredStart);
      if (typeof restoredEnd === 'string') setEndDate(restoredEnd);
      if (Array.isArray(data.venueList)) setVenueList(data.venueList as Venue[]);
      if (typeof data.submissionId === 'string') setSubmissionId(data.submissionId);
      const restoredCustom = fields.occurrence_dates ?? data.customDates;
      if (Array.isArray(restoredCustom)) setCustomDates(restoredCustom.filter((v): v is string => typeof v === 'string'));
    });

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (prev, data) => {
      try {
        const result = await action(prev, data);
        if (result.success) {
          draft.clear();
          if (result.updatedAt) setUpdatedAt(result.updatedAt);
          if (result.occurrences) setVisibleOccurrences(result.occurrences);
          if (result.redirectTo) router.push(result.redirectTo);
        }
        return result;
      } catch { return { error: td('networkError') }; }
    },
    {}
  );


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
      let result;
      try { result = await createVenue(prev, formData); }
      catch { return { error: td('networkError') }; }
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
      <form {...draft.formProps} action={formAction} onSubmit={draft.submit(formAction)} className="flex flex-col gap-5">
        <p className="text-xs text-soul-bronze" role="status">{td(draft.storageError ? 'unavailable' : 'hint')}</p>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="submission_id" value={submissionId} />
        <input type="hidden" name="updated_at" value={updatedAt} />
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
          <DescriptionEditor defaultValue={event?.description ?? ''}/>
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
            <span id="category_ids" className="label">{t("universeLabel")} <span className="font-normal text-soul-bronze">{t("universeMulti")}</span></span>
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
                    {tCat.has(c.slug as never) ? tCat(c.slug as never) : c.name}
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
                  value={startDate} onInput={e => setStartDate(e.currentTarget.value)} onChange={e => setStartDate(e.target.value)} className="field" />
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
                  value={startDate} onInput={e => setStartDate(e.currentTarget.value)} onChange={e => setStartDate(e.target.value)} className="field" />
              </div>
              <div>
                <label htmlFor="end_date" className="label">{t("departureLabel")}</label>
                <input id="end_date" name="end_date" type="datetime-local" required
                  value={endDate} min={startDate} onInput={e => setEndDate(e.currentTarget.value)} onChange={e => setEndDate(e.target.value)} className="field" />
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="duration_minutes" className="label">{t("durationLabel")}</label>
            <input id="duration_minutes" name="duration_minutes" type="number" min={0.01}
              step="any"
              defaultValue={event?.duration_minutes ? event.duration_minutes / 60 : ""} className="field" />
          </div>
          <div>
            <label htmlFor="price" className="label">{t("priceLabel")}</label>
            <input id="price" name="price" type="number" min={0} step="0.05"
              defaultValue={event?.price ?? ""} className="field" />
          </div>
          <div>
            <span id="languages" className="label">{t("languagesLabel")}</span>
            <div className="flex flex-wrap gap-3 pt-1.5">
              {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
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

        {!event?.parent_event_id && (
          <div className="grid gap-5 rounded-2xl bg-soul-sand/30 p-5 sm:grid-cols-2">
            <div>
              <label htmlFor="recurrence" className="label">{t("recurrenceLabel")}</label>
              <select id="recurrence" name="recurrence" value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)} className="field">
                <option value="">{t("recurrenceNone")}</option>
                <option value="weekly">{t("recurrenceWeekly")}</option>
                <option value="biweekly">{t("recurrenceBiweekly")}</option>
                <option value="monthly">{t("recurrenceMonthly")}</option>
                <option value="custom">{t("recurrenceCustom")}</option>
              </select>
            </div>
            {recurrence && recurrence !== 'custom' && (
              <div>
                <label htmlFor="recurrence_count" className="label">{t("occurrencesLabel")}</label>
                <input id="recurrence_count" name="recurrence_count" type="number"
                  min={2} max={26} value={recurrenceCount} onChange={e => setRecurrenceCount(Number(e.target.value))} className="field" />
                <p className="mt-1 text-xs text-soul-bronze">
                  {t("occurrencesHint")}
                </p>
              </div>
            )}
            {recurrence === 'custom' && <div id="occurrence_dates" className="sm:col-span-2 flex flex-col gap-3">
              <p className="text-sm">{t('customDatesHint')}</p>
              {customDates.map((date, index) => <div key={index} className="flex gap-2">
                <input type="datetime-local" name="occurrence_dates" required min={startDate} aria-label={t('customDate', { number: index + 1 })} className="field min-w-0" value={date}
                  onInput={e => { const value = e.currentTarget.value; setCustomDates(dates => dates.map((d, i) => i === index ? value : d)); }}
                  onChange={e => setCustomDates(dates => dates.map((d, i) => i === index ? e.target.value : d))} />
                <button type="button" className="btn-secondary" onClick={() => setCustomDates(dates => dates.filter((_, i) => i !== index))}>{t('removeOccurrence')}</button>
              </div>)}
              <button type="button" className="btn-secondary self-start" disabled={customDates.length >= 25} onClick={() => setCustomDates(dates => [...dates, ''])}>{t('addDate')}</button>
            </div>}
            {event && <p className="text-xs sm:col-span-2">{t('seriesEditHint')}</p>}
          </div>
        )}

        {event && visibleOccurrences.length > 0 && (
          <section className="rounded-2xl border border-soul-violet/20 bg-soul-violet/5 p-5">
            <h3 className="font-medium text-soul-brown">{t("occurrencesList")}</h3>
            <input type="hidden" name="parent_event_id" value={event.id} />
            <ul className="mt-3 flex flex-col gap-2">
              {[{id:event.id,start_date:event.start_date}, ...visibleOccurrences].map((occurrence) => (
                <li key={occurrence.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm text-soul-brown">
                  <time dateTime={occurrence.start_date}>
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "full",
                      timeStyle: "short",
                      timeZone: "Europe/Zurich",
                    }).format(new Date(occurrence.start_date))}
                  </time>
                  <button type="button" disabled={removing || pending} onClick={() => startRemoving(async () => {
                    if(draft.hasChanges()) { setOccurrenceError(t('saveBeforeDelete')); return; }
                    try {
                      const result = await removeOccurrence(occurrence.id, event.id);
                      if (result.error) { setOccurrenceError(result.error); return; }
                      if (result.redirectTo) { draft.clear(); router.push(result.redirectTo); return; }
                      const remaining = visibleOccurrences.filter(o => o.id !== occurrence.id);
                      setVisibleOccurrences(remaining);
                      setRecurrence(remaining.length ? 'custom' : '');
                      setCustomDates(remaining.map(o => toLocalInput(o.start_date)));
                      if (result.updatedAt) setUpdatedAt(result.updatedAt);
                      setOccurrenceError('');
                    } catch { setOccurrenceError(td('networkError')); }
                  })}
                    className="text-sm text-red-700 underline">
                    {t("removeOccurrence")}
                  </button>
                </li>
              ))}
            </ul>
            {occurrenceError && <p role="alert">{occurrenceError}</p>}
          </section>
        )}

        <div>
          <label htmlFor="video_url" className="label">{t("videoLabel")}</label>
          <WebUrlInput id="video_url" name="video_url" placeholder={t("videoPlaceholder")}
            defaultValue={event?.video_url ?? ""} className="field" />
          <p className="mt-1 text-xs text-soul-bronze">
            {t("videoHint")}
          </p>
        </div>

        <div>
          <span className="label">{t("photosLabel")}</span>
          <ImageUploader prefix="event" images={images} onChange={setImages} onBusyChange={setUploading} max={6} />
          {images.map((url) => (
            <input key={url} type="hidden" name="images" value={url} />
          ))}
        </div>

        {state.error && <div role="alert" className="text-sm text-red-700"><p>{state.error}</p>
          {state.fieldErrors && <ul>{Object.entries(state.fieldErrors).map(([name, message]) => <li key={name}><a href={`#${name}`}>{message}</a></li>)}</ul>}
        </div>}
        {state.success && <p role="status" className="text-sm text-green-700">{state.success}</p>}

        <button type="submit" disabled={pending || uploading || venuePending || removing} className="btn-primary self-start">
          {pending
            ? t("saving")
            : event
              ? t("saveChanges")
              : practitioners ? t("publishDirectly") : t("submitForValidation")}
        </button>
      </form>

      {showNewVenue && (
        <form ref={venueFormRef} action={venueAction} onReset={e => e.preventDefault()}
          onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); startTransition(() => venueAction(data)); }}
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
          {venueState.error && <p role="alert" className="text-sm text-red-700">{venueState.error}</p>}
          <button type="submit" disabled={venuePending} className="btn-secondary self-start">
            {venuePending ? t("geocoding") : t("createVenue")}
          </button>
        </form>
      )}
    </div>
  );
}
