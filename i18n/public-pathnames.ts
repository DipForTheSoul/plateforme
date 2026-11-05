/** Internal page identity stays stable; only its public address is localized. */
export const publicPathnames: Record<string, Record<'fr'|'de'|'en', string>> = {
  '/devenir-praticien': {
    fr:'/devenir-praticien', de:'/angebot-erstellen', en:'/become-a-practitioner',
  },
};

export function publicPath(path:string,locale:string):string {
  const resolved=publicPathnames[path]?.[locale as 'fr'|'de'|'en']??path;
  return `${locale==='fr'?'':`/${locale}`}${resolved==='/'?'':resolved}`||'/';
}
