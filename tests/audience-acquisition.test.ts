import {expect,it} from 'vitest';
import {classifyAcquisition,audienceDevice,audiencePeriod} from '@/lib/audience-acquisition';
it.each([
 [{source:'facebook',medium:'paid_social'},'paid_social'],
 [{source:'google',medium:'cpc'},'paid_search'],
 [{searchAd:true},'paid_search'],
 [{socialClick:true},'social'],
 [{referrerHost:'www.google.ch'},'google'],
 [{referrerHost:'accounts.google.com'},'unknown'],
 [{referrerHost:'www.forthesoul.ch'},'direct'],
 [{referrerHost:'forthesoul.ch'},'direct'],
 [{referrerHost:'l.facebook.com'},'social'],
 [{medium:'newsletter'},'email'],
 [{referrerHost:'example.org'},'referral'],
] as const)('classe la provenance %j sans confondre réseaux sociaux, publicité et connexion Google',(input,expected)=>{
 expect(classifyAcquisition(input,'www.forthesoul.ch')).toBe(expected);
});
it('choisit les périodes et distingue tablette et mobile',()=>{
 expect(['7','30','90','365'].map(audiencePeriod)).toEqual([7,30,90,30]);
 expect(audienceDevice('Mozilla iPad')).toBe('tablet');
 expect(audienceDevice('Mozilla iPhone Mobile')).toBe('mobile');
});
