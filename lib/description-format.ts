export type DescriptionPart = string | {kind: 'bold' | 'italic' | 'underline' | 'link'; children: DescriptionPart[]; url?: string};

export const DESCRIPTION_VISIBLE_MAX = 8000;
export const DESCRIPTION_STORAGE_MAX = 16000;

const visibleLength = (parts: DescriptionPart[]): number => parts.reduce((length, part) =>
  length + (typeof part === 'string' ? part.length : visibleLength(part.children)), 0);

/** Count what readers see, not Markdown markers or link destinations. */
export function descriptionVisibleLength(markdown: string): number {
  return markdown.split('\n').reduce((length, line, index) =>
    length + (index ? 1 : 0) + visibleLength(descriptionParts(line.replace(/^[-*] /, ''))), 0);
}

/** Bounded inline grammar shared by public HTML and plain-text exports. No raw HTML. */
export function descriptionParts(text: string, depth = 0): DescriptionPart[] {
  if (depth >= 8) return [text];
  const pattern = /\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*(.+?)\*\*(?!\*)|__(.+?)__|\*([^*\n]+)\*/g;
  const parts: DescriptionPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    const kind = match[1] ? 'link' : match[3] ? 'bold' : match[4] ? 'underline' : 'italic';
    parts.push({kind, children: descriptionParts(match[1] ?? match[3] ?? match[4] ?? match[5], depth + 1), url: match[2]});
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}
