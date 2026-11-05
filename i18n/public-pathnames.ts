/** Internal page identity stays stable; only its public address is localized. */
export const publicPathnames: Record<string, Record<'fr'|'de'|'en', string>> = {
  '/experiences': {fr:'/experiences',de:'/erlebnisse',en:'/experiences'},
  '/experiences/[slug]': {fr:'/experiences/[slug]',de:'/erlebnisse/[slug]',en:'/experiences/[slug]'},
  '/praticiens': {fr:'/praticiens',de:'/anbieter',en:'/practitioners'},
  '/praticiens/[slug]': {fr:'/praticiens/[slug]',de:'/anbieter/[slug]',en:'/practitioners/[slug]'},
  '/lieux': {fr:'/lieux',de:'/orte',en:'/venues'},
  '/lieux/[id]': {fr:'/lieux/[id]',de:'/orte/[id]',en:'/venues/[id]'},
  '/a-propos': {fr:'/a-propos',de:'/ueber-uns',en:'/about'},
  '/contact': {fr:'/contact',de:'/kontakt',en:'/contact'},
  '/cgu': {fr:'/cgu',de:'/nutzungsbedingungen',en:'/terms-of-use'},
  '/cgv': {fr:'/cgv',de:'/verkaufsbedingungen',en:'/terms-of-sale'},
  '/confidentialite': {fr:'/confidentialite',de:'/datenschutz',en:'/privacy'},
  '/mentions-legales': {fr:'/mentions-legales',de:'/impressum',en:'/legal-notice'},
  '/favoris': {fr:'/favoris',de:'/favoriten',en:'/favourites'},
  '/connexion': {fr:'/connexion',de:'/anmelden',en:'/sign-in'},
  '/inscription': {fr:'/inscription',de:'/registrierung',en:'/sign-up'},
  '/mot-de-passe-oublie': {fr:'/mot-de-passe-oublie',de:'/passwort-vergessen',en:'/forgot-password'},
  '/reinitialiser-mot-de-passe': {fr:'/reinitialiser-mot-de-passe',de:'/passwort-zuruecksetzen',en:'/reset-password'},
  '/devenir-praticien': {
    fr:'/devenir-praticien', de:'/angebot-erstellen', en:'/become-a-practitioner',
  },
};

export function publicPath(path:string,locale:string):string {
  const suffixAt=path.search(/[?#]/);
  const pathname=suffixAt===-1?path:path.slice(0,suffixAt);
  const suffix=suffixAt===-1?'':path.slice(suffixAt);
  let resolved=publicPathnames[pathname]?.[locale as 'fr'|'de'|'en']??pathname;
  if(resolved===pathname){
    for(const [template,translations] of Object.entries(publicPathnames)){
      const parameter=template.match(/\/(\[[^/]+\])$/)?.[1];
      if(!parameter)continue;
      const prefix=template.slice(0,-parameter.length);
      const value=pathname.startsWith(prefix)?pathname.slice(prefix.length):'';
      if(value&&!value.includes('/')){
        resolved=(translations[locale as 'fr'|'de'|'en']??template).replace(parameter,value);
        break;
      }
    }
  }
  return (`${locale==='fr'?'':`/${locale}`}${resolved==='/'?'':resolved}`||'/')+suffix;
}
