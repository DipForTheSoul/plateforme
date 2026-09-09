"use client";
import {useCallback, useRef, useState, type ClipboardEvent, type KeyboardEvent, type MouseEvent} from 'react';
import {Bold, Italic, Link, List, Smile, Underline} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {webUrlSchema} from '@/lib/web-url';
import {editorToMarkdown, markdownToEditorHtml} from './description-editor-markdown';

const MAX_LENGTH = 8000;
type Panel = 'link' | 'emoji' | null;
type Command = 'bold' | 'italic' | 'underline' | 'insertUnorderedList';

export function DescriptionEditor({defaultValue = ''}: {defaultValue?: string}) {
  const t = useTranslations('descriptionEditor');
  const tf = useTranslations('eventForm');
  const initialValue = defaultValue.slice(0, MAX_LENGTH);
  const editorRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const savedRange = useRef<Range | null>(null);
  const savedOffsets = useRef({start: 0, end: 0});
  const linkSelectionText = useRef('');
  const lastValid = useRef(initialValue);
  const syncingField = useRef(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [active, setActive] = useState<Record<Command, boolean>>({
    bold: false, italic: false, underline: false, insertUnorderedList: false,
  });
  const initializeEditor = useCallback((node: HTMLDivElement | null) => {
    editorRef.current = node;
    if (node) node.innerHTML = markdownToEditorHtml(defaultValue.slice(0, MAX_LENGTH));
  }, [defaultValue]);

  function selectionBelongsToEditor(range: Range) {
    const editor = editorRef.current;
    const container = range.commonAncestorContainer;
    return Boolean(editor && (container === editor || editor.contains(container)));
  }

  function rememberSelection() {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!selectionBelongsToEditor(range)) return;
    savedRange.current = range.cloneRange();
    const beforeStart = document.createRange();
    beforeStart.selectNodeContents(editorRef.current!);
    beforeStart.setEnd(range.startContainer, range.startOffset);
    const beforeEnd = document.createRange();
    beforeEnd.selectNodeContents(editorRef.current!);
    beforeEnd.setEnd(range.endContainer, range.endOffset);
    savedOffsets.current = {start: beforeStart.toString().length, end: beforeEnd.toString().length};
    if (typeof document.queryCommandState === 'function') {
      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      });
    }
  }

  function restoreSelection() {
    const editor = editorRef.current;
    if (!editor) return null;
    const selection = window.getSelection();
    let range = savedRange.current;
    if (!range || !selectionBelongsToEditor(range)) {
      range = document.createRange();
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      let offset = 0;
      let started = false;
      let ended = false;
      while ((node = walker.nextNode())) {
        const length = node.textContent?.length ?? 0;
        if (!started && savedOffsets.current.start <= offset + length) {
          range.setStart(node, Math.max(0, savedOffsets.current.start - offset));
          started = true;
        }
        if (started && savedOffsets.current.end <= offset + length) {
          range.setEnd(node, Math.max(0, savedOffsets.current.end - offset));
          ended = true;
          break;
        }
        offset += length;
      }
      if (!started) {
        range.selectNodeContents(editor);
        range.collapse(false);
      } else if (!ended) {
        range.setEnd(editor, editor.childNodes.length);
      }
    }
    selection?.removeAllRanges();
    selection?.addRange(range);
    return range;
  }

  function updateField(markdown: string) {
    const field = fieldRef.current;
    if (!field) return;
    syncingField.current = true;
    field.value = markdown;
    field.dispatchEvent(new Event('input', {bubbles: true}));
    syncingField.current = false;
  }

  function syncEditor() {
    const editor = editorRef.current;
    if (!editor) return false;
    const markdown = editorToMarkdown(editor);
    if (markdown.length > MAX_LENGTH) {
      editor.innerHTML = markdownToEditorHtml(lastValid.current);
      updateField(lastValid.current);
      setError(t('tooLong'));
      editor.focus();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      savedRange.current = range.cloneRange();
      return false;
    }
    lastValid.current = markdown;
    updateField(markdown);
    setError('');
    rememberSelection();
    return true;
  }

  function fallbackCommand(command: Command, range: Range) {
    if (command === 'insertUnorderedList') {
      const editor = editorRef.current!;
      const origin = range.startContainer instanceof HTMLElement ? range.startContainer : range.startContainer.parentElement;
      const block = origin?.closest('div, p, li');
      if (block && block !== editor && block.tagName.toLowerCase() !== 'li') {
        const list = document.createElement('ul');
        const item = document.createElement('li');
        item.append(...Array.from(block.childNodes));
        list.append(item);
        block.replaceWith(list);
        range.selectNodeContents(item);
        return;
      }
      const text = range.toString() || t('sample');
      const list = document.createElement('ul');
      text.split('\n').forEach(line => {
        const item = document.createElement('li');
        item.textContent = line;
        list.append(item);
      });
      range.deleteContents();
      range.insertNode(list);
      range.selectNodeContents(list);
      return;
    }
    if (range.collapsed) range.insertNode(document.createTextNode(t('sample')));
    const tag = command === 'bold' ? 'strong' : command === 'italic' ? 'em' : 'u';
    const wrapper = document.createElement(tag);
    try { range.surroundContents(wrapper); }
    catch {
      wrapper.append(range.extractContents());
      range.insertNode(wrapper);
    }
    range.selectNodeContents(wrapper);
  }

  function format(command: Command) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const range = restoreSelection();
    if (!range) return;
    if (typeof document.execCommand === 'function') document.execCommand(command, false);
    else fallbackCommand(command, range);
    syncEditor();
  }

  function insertNode(node: Node) {
    const editor = editorRef.current;
    if (!editor) return false;
    editor.focus();
    const range = restoreSelection();
    if (!range) return false;
    range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    savedRange.current = range.cloneRange();
    return syncEditor();
  }

  function open(kind: Exclude<Panel, null>) {
    rememberSelection();
    setError('');
    if (kind === 'link') {
      linkSelectionText.current = savedRange.current?.toString() || '';
      setLabel(linkSelectionText.current || t('sample'));
      setUrl('');
    }
    setPanel(panel === kind ? null : kind);
  }

  function insertLink() {
    const parsed = webUrlSchema.safeParse(url);
    if (!parsed.success || !parsed.data || parsed.data.length > 2048 || !label.trim() || /[\[\]\n]/.test(label)) {
      setError(t('invalidLink'));
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = parsed.data;
    anchor.textContent = label.trim();
    // Opening inputs may invalidate a DOM Range after React renders the panel.
    // Rebuild it from the selected text before replacing that text with the link.
    if (linkSelectionText.current && editorRef.current) {
      const text = editorRef.current.textContent ?? '';
      let start = savedOffsets.current.start;
      if (text.slice(start, start + linkSelectionText.current.length) !== linkSelectionText.current) {
        start = text.indexOf(linkSelectionText.current);
      }
      if (start >= 0) {
        savedOffsets.current = {start, end: start + linkSelectionText.current.length};
        savedRange.current = null;
      }
    }
    if (insertNode(anchor)) setPanel(null);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    insertNode(document.createTextNode(event.clipboardData.getData('text/plain')));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const command = event.key.toLowerCase() === 'b' ? 'bold'
      : event.key.toLowerCase() === 'i' ? 'italic'
      : event.key.toLowerCase() === 'u' ? 'underline' : null;
    if (!command) return;
    event.preventDefault();
    rememberSelection();
    format(command);
  }

  const preventSelectionLoss = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();
  const tools = [
    {command: 'bold' as const, label: t('bold'), icon: Bold},
    {command: 'italic' as const, label: t('italic'), icon: Italic},
    {command: 'underline' as const, label: t('underline'), icon: Underline},
    {command: 'insertUnorderedList' as const, label: t('list'), icon: List},
  ];

  return <>
    <div role="toolbar" aria-label={t('toolbar')} className="mb-2 flex flex-wrap gap-1">
      {tools.map(({command, label: toolLabel, icon: Icon}) =>
        <button key={command} type="button" aria-label={toolLabel} title={toolLabel}
          aria-pressed={active[command]} onMouseDown={preventSelectionLoss} onClick={() => format(command)}
          className={`inline-flex size-9 items-center justify-center rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-soul-bronze/30 ${active[command]
            ? 'border-soul-violet bg-soul-violet text-white hover:bg-soul-violet-dark'
            : 'border-soul-brown/30 bg-white text-soul-brown hover:border-soul-brown hover:bg-soul-sand/40'}`}>
          <Icon aria-hidden="true" size={17}/>
        </button>)}
      <button type="button" aria-label={t('link')} title={t('link')} aria-expanded={panel === 'link'}
        onMouseDown={preventSelectionLoss} onClick={() => open('link')}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-soul-brown/30 bg-white text-soul-brown transition hover:border-soul-brown hover:bg-soul-sand/40 focus:outline-none focus:ring-2 focus:ring-soul-bronze/30">
        <Link aria-hidden="true" size={17}/>
      </button>
      <button type="button" aria-label={t('emoji')} title={t('emoji')} aria-expanded={panel === 'emoji'}
        onMouseDown={preventSelectionLoss} onClick={() => open('emoji')}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-soul-brown/30 bg-white text-soul-brown transition hover:border-soul-brown hover:bg-soul-sand/40 focus:outline-none focus:ring-2 focus:ring-soul-bronze/30">
        <Smile aria-hidden="true" size={17}/>
      </button>
    </div>
    {panel === 'link' && <div role="group" aria-label={t('link')} className="mb-2 grid gap-3 rounded-xl border p-4">
      <label className="label">{t('linkText')}<input className="field" value={label} onChange={event => setLabel(event.target.value)} onKeyDown={event => {if(event.key === 'Enter'){event.preventDefault();insertLink();}}}/></label>
      <label className="label">{t('linkAddress')}<input className="field" inputMode="url" value={url} onChange={event => setUrl(event.target.value)} onKeyDown={event => {if(event.key === 'Enter'){event.preventDefault();insertLink();}}}/></label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={insertLink}>{t('insertLink')}</button>
        <button type="button" className="btn-secondary" onClick={() => {setPanel(null);setError('');editorRef.current?.focus();}}>{t('cancel')}</button>
      </div>
    </div>}
    {panel === 'emoji' && <div role="group" aria-label={t('emoji')} className="mb-2 flex flex-wrap gap-1">
      {['😊', '🙏', '✨', '🌿', '❤️', '☀️', '🧘', '💃'].map(emoji =>
        <button key={emoji} type="button" aria-label={emoji} className="inline-flex size-10 items-center justify-center rounded-lg border bg-white text-xl"
          onClick={() => {if(insertNode(document.createTextNode(emoji))) setPanel(null);}}>{emoji}</button>)}
      <button type="button" className="btn-secondary" onClick={() => {setPanel(null);editorRef.current?.focus();}}>{t('cancel')}</button>
    </div>}
    {error && <p role="alert" className="mb-2 text-sm text-red-700">{error}</p>}
    <p className="mb-2 text-sm text-soul-ink">{t('hint')}</p>
    <div ref={initializeEditor} contentEditable role="textbox" aria-multiline="true" aria-label={t('editorLabel')}
      data-placeholder={tf('descriptionPlaceholder')} suppressContentEditableWarning
      className="field min-h-48 overflow-y-auto whitespace-pre-wrap empty:before:pointer-events-none empty:before:text-soul-bronze/50 empty:before:content-[attr(data-placeholder)] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6"
      onInput={() => {setPanel(null);syncEditor();}} onBlur={rememberSelection} onMouseUp={rememberSelection} onKeyUp={rememberSelection}
      onKeyDown={handleKeyDown} onPaste={handlePaste}
      onClick={event => {if ((event.target as HTMLElement).closest('a')) event.preventDefault();}}/>
    <textarea ref={fieldRef} id="description" name="description" required minLength={20} maxLength={MAX_LENGTH}
      data-rich-editor-backing="true"
      defaultValue={initialValue} tabIndex={-1} aria-hidden="true" className="sr-only"
      onFocus={() => editorRef.current?.focus()}
      onInput={event => {
        if (syncingField.current) return;
        const markdown = event.currentTarget.value.slice(0, MAX_LENGTH);
        lastValid.current = markdown;
        if (editorRef.current) editorRef.current.innerHTML = markdownToEditorHtml(markdown);
      }}/>
  </>;
}
