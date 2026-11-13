import {slugify} from '@/lib/utils';

type Identity = {id:string;slug:string;title:string;public_slug?:string|null};
const legacy = /^experience-[0-9a-f]{8}-[0-9a-f-]{27}$/i;
/** Stored short addresses are stable; fallback supports pre-migration snapshots. */
export function eventPublicSlug(event:Identity):string {
  if (event.public_slug) return event.public_slug;
  return legacy.test(event.slug)
    ? `${slugify(event.title)||'experience'}-${event.id.replaceAll('-','').slice(0,12)}`
    : event.slug;
}
export function findPublicEvent<T extends Identity>(events:T[],slug:string):T|null {
  const exact=events.find(event=>event.id===slug||event.slug===slug||eventPublicSlug(event)===slug);
  if(exact)return exact;
  // Retain descriptive URLs even if the title subsequently changes.
  const id=slug.match(/-([a-f0-9]{12})$/i)?.[1];
  const matches=id?events.filter(event=>event.id.replaceAll('-','').startsWith(id)):[];
  return matches.length===1?matches[0]:null;
}
