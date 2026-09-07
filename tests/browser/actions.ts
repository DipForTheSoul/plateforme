import { parseEventForm } from '@/lib/event-input';
export let mode = 'validation';
export function setMode(value: string) {mode=value;}
async function persist(_prev: unknown,data:FormData) {
  await new Promise(resolve=>setTimeout(resolve,300));
  if (mode==='network') throw new Error('Simulated network failure');
  if (mode==='validation') return {error:'Test : erreur serveur. Vos données doivent rester présentes.'};
  if (data.has('title')) {
    const parsed=parseEventForm(data);
    if(!parsed.success) return {error:'Champs invalides : '+parsed.error.issues.map(i=>i.path[0]).join(', ')};
  }
  return {success:'Test : enregistrement réussi.'};
}
export const createEvent=persist;
export const updateEvent=async(_id:string,prev:unknown,data:FormData)=>persist(prev,data);
export const updatePractitionerProfile=persist;
export const removeOccurrence=async()=>({success:'Date supprimée.'});
export const createVenue=async(_prev:unknown,data:FormData)=>mode==='network'?{error:'Test : carte indisponible'}:{success:'Lieu créé',venueId:'50000000-0000-4000-8000-000000000001',name:data.get('name')};
