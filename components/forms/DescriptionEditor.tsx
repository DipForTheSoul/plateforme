"use client";
import {useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {EventDescription} from '@/components/EventDescription';
import {webUrlSchema} from '@/lib/web-url';

export function DescriptionEditor({defaultValue = ''}: {defaultValue?: string}) {
  const t = useTranslations('descriptionEditor');
  const tf = useTranslations('eventForm');
  const ref = useRef<HTMLTextAreaElement>(null);
  const selection = useRef({start: 0, end: 0});
  const [preview, setPreview] = useState<string | null>(null);
  const [panel, setPanel] = useState<'link' | 'emoji' | null>(null);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  function remember() {
    const field = ref.current;
    if (field) selection.current = {start: field.selectionStart, end: field.selectionEnd};
  }
  function insert(replacement: string) {
    const field = ref.current;
    if (!field) return false;
    const {start, end} = selection.current;
    if (field.value.length - (end - start) + replacement.length > 8000) {
      setError(t('tooLong')); return false;
    }
    field.setRangeText(replacement, start, end, 'select');
    field.dispatchEvent(new Event('input', {bubbles: true}));
    setPreview(null); setPanel(null); setError(''); field.focus();
    return true;
  }
  function format(kind: 'bold' | 'italic' | 'underline' | 'list') {
    remember();
    const field = ref.current;
    if (!field) return;
    const {start, end} = selection.current;
    const text = field.value.slice(start, end) || t('sample');
    const marker = kind === 'bold' ? '**' : kind === 'italic' ? '*' : '__';
    insert(kind === 'list'
      ? (start > 0 && field.value[start - 1] !== '\n' ? '\n' : '') + text.split('\n').map(line => '- ' + line).join('\n')
      : text.startsWith(marker) && text.endsWith(marker) && text.length > marker.length * 2 && !(kind === 'italic' && text.startsWith('**') && !text.startsWith('***'))
        ? text.slice(marker.length, -marker.length) : marker + text + marker);
  }
  function open(kind: 'link' | 'emoji') {
    remember(); setError('');
    if (kind === 'link') {
      setLabel(ref.current?.value.slice(selection.current.start, selection.current.end) || t('sample'));
      setUrl('');
    }
    setPanel(panel === kind ? null : kind);
  }
  function insertLink() {
    const parsed = webUrlSchema.safeParse(url);
    if (!parsed.success || !parsed.data || parsed.data.length > 2048 || !label.trim() || /[\[\]\n]/.test(label)) {
      setError(t('invalidLink')); return;
    }
    // Parentheses are valid in URLs but delimit links in our small text grammar.
    insert('[' + label.trim() + '](' + parsed.data.replace(/\(/g, '%28').replace(/\)/g, '%29') + ')');
  }
  return <>
    <div role="group" aria-label={t('toolbar')} className="mb-2 flex flex-wrap gap-2">
      {(['bold', 'italic', 'underline', 'list'] as const).map(kind =>
        <button key={kind} type="button" className="btn-secondary" onClick={() => format(kind)}>{t(kind)}</button>)}
      <button type="button" className="btn-secondary" aria-expanded={panel === 'link'} onClick={() => open('link')}>{t('link')}</button>
      <button type="button" className="btn-secondary" aria-expanded={panel === 'emoji'} onClick={() => open('emoji')}>{t('emoji')}</button>
      <button type="button" className="btn-secondary" aria-pressed={preview !== null} onClick={() => setPreview(preview === null ? ref.current?.value ?? '' : null)}>{t('preview')}</button>
    </div>
    {panel === 'link' && <div role="group" aria-label={t('link')} className="grid gap-3 rounded-xl border p-4">
      <label className="label">{t('linkText')}<input className="field" value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => {if(e.key === 'Enter'){e.preventDefault();insertLink();}}}/></label>
      <label className="label">{t('linkAddress')}<input className="field" inputMode="url" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => {if(e.key === 'Enter'){e.preventDefault();insertLink();}}}/></label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={insertLink}>{t('insertLink')}</button>
        <button type="button" className="btn-secondary" onClick={() => {setPanel(null);setError('');ref.current?.focus();}}>{t('cancel')}</button>
      </div>
    </div>}
    {panel === 'emoji' && <div role="group" aria-label={t('emoji')} className="flex flex-wrap gap-2">
      {['😊', '🙏', '✨', '🌿', '❤️', '☀️', '🧘', '💃'].map(emoji => <button key={emoji} type="button" className="rounded-lg border bg-white p-3 text-xl" onClick={() => insert(emoji)}>{emoji}</button>)}
      <button type="button" className="btn-secondary" onClick={() => setPanel(null)}>{t('cancel')}</button>
    </div>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <p className="mb-2 text-sm text-soul-ink">{t('hint')}</p>
    <textarea ref={ref} id="description" name="description" required minLength={20} maxLength={8000} rows={8} defaultValue={defaultValue} className="field" placeholder={tf('descriptionPlaceholder')} onInput={() => {setPreview(null);setPanel(null);setError('');}}/>
    {preview !== null && <section aria-label={t('preview')} className="rounded-xl border p-4"><EventDescription text={preview}/></section>}
  </>;
}
