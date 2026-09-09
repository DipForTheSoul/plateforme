import {descriptionParts, type DescriptionPart} from '@/lib/description-format';
import {webUrlSchema} from '@/lib/web-url';

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function inlineHtml(parts: DescriptionPart[]): string {
  return parts.map(part => {
    if (typeof part === 'string') return escapeHtml(part);
    const children = inlineHtml(part.children);
    if (part.kind === 'bold') return `<strong>${children}</strong>`;
    if (part.kind === 'italic') return `<em>${children}</em>`;
    if (part.kind === 'underline') return `<u>${children}</u>`;
    const parsed = webUrlSchema.safeParse(part.url);
    return parsed.success && parsed.data
      ? `<a href="${escapeHtml(parsed.data)}">${children}</a>`
      : children;
  }).join('');
}

/** Converts the existing, deliberately small Markdown vocabulary to safe editor HTML. */
export function markdownToEditorHtml(markdown: string): string {
  if (!markdown) return '';
  const lines = markdown.split('\n');
  const blocks: string[] = [];
  for (let index = 0; index < lines.length; index++) {
    if (/^[-*] /.test(lines[index])) {
      const items: string[] = [];
      while (index < lines.length && /^[-*] /.test(lines[index])) {
        items.push(`<li>${inlineHtml(descriptionParts(lines[index].slice(2))) || '<br>'}</li>`);
        index++;
      }
      index--;
      blocks.push(`<ul>${items.join('')}</ul>`);
    } else {
      blocks.push(`<div>${inlineHtml(descriptionParts(lines[index])) || '<br>'}</div>`);
    }
  }
  return blocks.join('');
}

const childrenMarkdown = (node: Node) => Array.from(node.childNodes).map(nodeToMarkdown).join('');

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (!(node instanceof HTMLElement)) return '';
  const tag = node.tagName.toLowerCase();
  if (tag === 'br') return '\n';
  if (tag === 'ul' || tag === 'ol') {
    return Array.from(node.children)
      .filter(child => child.tagName.toLowerCase() === 'li')
      .map(child => `- ${childrenMarkdown(child)}`)
      .join('\n') + '\n';
  }
  if (tag === 'div' || tag === 'p') return childrenMarkdown(node) + '\n';
  if (tag === 'strong' || tag === 'b') return `**${childrenMarkdown(node)}**`;
  if (tag === 'em' || tag === 'i') return `*${childrenMarkdown(node)}*`;
  if (tag === 'u') return `__${childrenMarkdown(node)}__`;
  if (tag === 'a') {
    const label = childrenMarkdown(node);
    const parsed = webUrlSchema.safeParse(node.getAttribute('href'));
    if (!parsed.success || !parsed.data || /[\]\n]/.test(label)) return label;
    const url = parsed.data.replace(/\(/g, '%28').replace(/\)/g, '%29');
    return `[${label}](${url})`;
  }
  // Paste can introduce arbitrary elements. Keep their text/known descendants, never their HTML.
  return childrenMarkdown(node);
}

/** Serializes only the supported formatting vocabulary; pasted HTML cannot reach storage. */
export function editorToMarkdown(editor: HTMLElement): string {
  return childrenMarkdown(editor).replace(/\n$/, '');
}
