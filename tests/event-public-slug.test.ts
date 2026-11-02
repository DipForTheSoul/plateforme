import {expect,it} from 'vitest';
import {eventPublicSlug,findPublicEvent} from '@/lib/event-public-slug';
const event={id:'ec05b014-34b9-4fe3-8183-025707b5c04c',slug:'experience-ec05b014-34b9-4fe3-8183-025707b5c04c',title:'Danse soufie à Neuchâtel'};
it('gives imported links a descriptive address and retains old links',()=>{
 const slug=eventPublicSlug(event);
 expect(slug).toBe('danse-soufie-a-neuchatel-ec05b01434b9');
 expect(findPublicEvent([event],event.slug)).toEqual(event);
 expect(findPublicEvent([event],slug)).toEqual(event);
});
it('keeps previously shared descriptive links working after a title edit',()=>{
 expect(findPublicEvent([{...event,title:'Nouveau titre'}],eventPublicSlug(event))?.id).toBe(event.id);
});
it('preserves already readable links and rejects unknown identities',()=>{
 expect(eventPublicSlug({...event,slug:'danse-soufie-abc12'})).toBe('danse-soufie-abc12');
 expect(findPublicEvent([event],'inconnu-ffffffffffff')).toBeNull();
});
