import {descriptionParts, type DescriptionPart} from './description-format';
const plain = (parts: DescriptionPart[]): string => parts.map(part => typeof part === 'string' ? part : plain(part.children) + (part.kind === 'link' ? ` (${part.url})` : '')).join('');
/** Plain-text channels (cards, search previews, calendars) must not expose formatting markers. */
export function descriptionText(value:string|null|undefined):string {
  return plain(descriptionParts(value??'')).replace(/^[-*] /gm,'• ');
}
