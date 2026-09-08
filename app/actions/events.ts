"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPractitioner, getCurrentProfile } from '@/lib/auth';
import { parseEventForm, occurrenceSchedule } from '@/lib/event-input';
import { sendEmail } from '@/lib/email';
import { submissionReceivedEmail } from '@/lib/email-templates';

export interface ActionState { error?: string; fieldErrors?: Record<string, string>; success?: string; redirectTo?: string; updatedAt?: string; occurrences?: {id:string;start_date:string}[]; }

const labels: Record<string, string> = { title: 'Titre', description: 'Description (20 à 8 000 caractères)', category_ids: 'Univers : sélectionnez au moins un univers', venue_id: 'Lieu', start_date: 'Date et heure de début', end_date: 'Date et heure de fin (après le début)', duration_minutes: 'Durée en heures', price: 'Prix', languages: 'Langues : sélectionnez au moins une langue', recurrence_count: 'Nombre de dates : de 2 à 26', occurrence_dates: 'Dates supplémentaires : distinctes et après la première date', video_url: 'Lien vidéo', external_url: 'Lien d’inscription / document externe : adresse http(s) valide, maximum 2 048 caractères', images: 'Photos : maximum 6' };

async function save(eventId: string | null, formData: FormData, admin: boolean): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile || (admin && profile.role !== 'admin')) return { error: 'Connexion autorisée requise.' };
  const practitioner = admin ? null : await getCurrentPractitioner();
  if (!admin && (!practitioner || practitioner.status !== 'approved')) return { error: 'Votre fiche praticien doit être validée avant de publier.' };
  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(parsed.error.issues.map(i => [String(i.path[0]), labels[String(i.path[0])] ?? i.message]));
    return { error: 'Vérifiez les champs indiqués. Votre saisie est conservée.', fieldErrors };
  }
  const owner = admin ? String(formData.get('owner_practitioner_id') ?? '') : practitioner!.id;
  if (admin && !eventId && !/^[\da-f-]{36}$/i.test(owner)) return { error: 'Choisissez le/la praticien·ne propriétaire.', fieldErrors: { owner_practitioner_id: 'Praticien propriétaire' } };
  let occurrences;
  try { occurrences = occurrenceSchedule(parsed.data); }
  catch { return { error: 'Une répétition tombe sur une heure inexistante en Suisse. Choisissez une autre heure de départ.' }; }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_event_transaction', {
    p_event_id: eventId,
    p_practitioner_id: owner || null,
    p_input: { ...parsed.data, occurrences },
    p_submission_id: String(formData.get('submission_id') ?? '') || null,
    p_expected_updated_at: String(formData.get('updated_at') ?? '') || null,
  });
  if (error || !data) {
    const known = error?.message ?? '';
    return { error: known.includes('épuisé') ? 'Solde de publications épuisé. Aucun événement créé.' : known.includes('modifiée') ? 'Cette expérience a été modifiée entre-temps. Gardez votre brouillon et rechargez la page avant de réessayer.' : 'Enregistrement non confirmé. Votre saisie est conservée ; vous pouvez réessayer sans double débit.' };
  }
  if (!eventId && !admin && !data.replayed && practitioner?.contact.email) {
    // A notification failure cannot turn a committed save into an apparent failure.
    try { await sendEmail({ to: practitioner.contact.email, ...submissionReceivedEmail(practitioner.name, parsed.data.title, profile.preferred_lang) }); }
    catch { console.error('[events] Notification de dépôt non envoyée'); }
  }
  revalidatePath('/', 'layout');
  return { success: eventId ? 'Expérience mise à jour.' : 'Expérience enregistrée.', updatedAt: data.updated_at, occurrences: data.occurrences,
    ...(!eventId || !admin ? { redirectTo: admin ? '/admin/soumissions?cree=1' : '/espace-praticien/evenements?' + (eventId ? 'modifie' : 'depose') + '=1' } : {}) };
}

export async function createEvent(_prev: ActionState, data: FormData) { return save(null, data, false); }
export async function updateEvent(id: string, _prev: ActionState, data: FormData) { return save(id, data, false); }
export async function adminCreateEvent(_prev: ActionState, data: FormData) { return save(null, data, true); }
export async function adminUpdateEvent(id: string, _prev: ActionState, data: FormData) { return save(id, data, true); }

export async function removeOccurrence(id: string, parentId: string): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: 'Connexion requise.' };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('remove_event_occurrence', { p_occurrence_id: id, p_parent_id: parentId });
  if (error) return { error: 'Suppression non confirmée. Rechargez la page pour vérifier les dates avant de réessayer.' };
  revalidatePath('/', 'layout');
  const base = profile.role === 'admin' ? '/admin/soumissions' : '/espace-praticien/evenements';
  return { success: 'Date supprimée.', updatedAt: data?.updated_at,
    ...(id === parentId ? {redirectTo: data?.parent_id ? `${base}/${data.parent_id}` : base} : {}) };
}

export async function deleteAdminOccurrence(formData: FormData): Promise<void> {
  await removeOccurrence(String(formData.get('occurrence_id') ?? ''), String(formData.get('parent_event_id') ?? ''));
}

export async function deleteEvent(formData: FormData): Promise<void> {
  const practitioner = await getCurrentPractitioner();
  const id = String(formData.get('event_id') ?? '');
  if (!practitioner || !id) return;
  const supabase = await createClient();
  const { error } = await supabase.from('events').delete().eq('id', id).eq('practitioner_id', practitioner.id);
  if (error) throw new Error('Suppression impossible. Réessayez.');
  revalidatePath('/', 'layout');
}
