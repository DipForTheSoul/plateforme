export const acquisitionChannels=['paid_search','paid_social','paid_other','google','search_other','social','email','referral','direct','unknown'] as const;
export type AcquisitionChannel=typeof acquisitionChannels[number];
export type AcquisitionInput={source?:string;medium?:string;referrerHost?:string;searchAd?:boolean;socialClick?:boolean};
const paid=new Set(['cpc','ppc','paid','paid_social','paid-social','paid_search','paid-search','display','ads','sponsored','retargeting']);
const google=/^(?:www\.|m\.)?google\.(?:com|ch|fr|de|at|it|es|be|nl|co\.uk|ca|com\.au)$/;
const social=/(?:^|\.)(?:facebook\.com|instagram\.com|fb\.com|tiktok\.com|linkedin\.com|threads\.net|threads\.com|t\.co)$/;
export function classifyAcquisition(input:AcquisitionInput,ownHost:string):AcquisitionChannel {
  const source=(input.source??'').trim().toLowerCase().slice(0,80);
  const medium=(input.medium??'').trim().toLowerCase().slice(0,80);
  const host=(input.referrerHost??'').trim().toLowerCase().replace(/\.$/,'').slice(0,253);
  const meta=/^(?:fb|ig|an|th|meta|facebook|instagram|threads)$/.test(source)||social.test(host);
  if(input.searchAd)return 'paid_search';
  if(paid.has(medium))return /google|bing|adwords|microsoft/.test(source)?'paid_search':meta?'paid_social':'paid_other';
  if(['email','e-mail','newsletter'].includes(medium))return 'email';
  // Authentication returns are not organic search traffic.
  if(/^(?:accounts|myaccount|oauth|consent)\.google\./.test(host))return 'unknown';
  if(google.test(host)||(source==='google'&&medium==='organic'))return 'google';
  if(/^(?:www\.)?(?:bing\.com|duckduckgo\.com|search\.yahoo\.com|ecosia\.org)$/.test(host))return 'search_other';
  // A Facebook click ID also occurs on unpaid links: it does not prove an ad.
  if(meta||input.socialClick||medium==='social'||medium==='organic_social')return 'social';
  if(host&&host.replace(/^www\./,'')!==ownHost.toLowerCase().replace(/^www\./,''))return 'referral';
  if(source||medium)return 'unknown';
  return 'direct';
}
export function audienceDevice(ua:string|null):'mobile'|'tablet'|'desktop'|'unknown' {
  if(!ua)return 'unknown';
  if(/iPad|Tablet|Android(?!.*Mobile)|Macintosh.*Mobile/i.test(ua))return 'tablet';
  return /Mobile|iPhone|iPod|Android/i.test(ua)?'mobile':'desktop';
}
export function audiencePeriod(value:unknown):7|30|90 {return value==='7'?7:value==='90'?90:30;}
