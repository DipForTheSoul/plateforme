/** Plain-text channels (cards, search previews, calendars) must not expose formatting markers. */
export function descriptionText(value:string|null|undefined):string {
  return (value??'').replace(/\*\*([^*\n]+)\*\*/g,'$1').replace(/\[([^\]\n]+)\]\(([^\s)]+)\)/g,'$1 ($2)').replace(/^[-*] /gm,'• ');
}
