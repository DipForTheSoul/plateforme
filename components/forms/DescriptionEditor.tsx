"use client";
import {useRef,useState} from 'react';
import {useTranslations} from 'next-intl';
import {EventDescription} from '@/components/EventDescription';

export function DescriptionEditor({defaultValue=''}:{defaultValue?:string}) {
  const t=useTranslations('descriptionEditor');const tf=useTranslations('eventForm');
  const ref=useRef<HTMLTextAreaElement>(null);const [preview,setPreview]=useState<string|null>(null);
  function format(kind:'bold'|'list'|'link'){
    const field=ref.current;if(!field)return;
    const selection=field.value.slice(field.selectionStart,field.selectionEnd)||t('sample');
    const replacement=kind==='bold'?`**${selection}**`:kind==='link'?`[${selection}](https://example.ch)`:`${field.selectionStart>0&&field.value[field.selectionStart-1]!=='\n'?'\n':''}${selection.split('\n').map(line=>`- ${line}`).join('\n')}`;
    if(field.value.length-(field.selectionEnd-field.selectionStart)+replacement.length>8000)return;
    field.setRangeText(replacement,field.selectionStart,field.selectionEnd,'select');
    field.dispatchEvent(new Event('input',{bubbles:true}));setPreview(null);field.focus();
  }
  return <>
    <div role="group" aria-label={t('toolbar')} className="mb-2 flex flex-wrap gap-2">
      <button type="button" className="btn-secondary" onClick={()=>format('bold')}>{t('bold')}</button>
      <button type="button" className="btn-secondary" onClick={()=>format('list')}>{t('list')}</button>
      <button type="button" className="btn-secondary" onClick={()=>format('link')}>{t('link')}</button>
      <button type="button" className="btn-secondary" onClick={()=>setPreview(preview===null?ref.current?.value??'':null)}>{t('preview')}</button>
    </div>
    <p className="mb-2 text-xs text-soul-bronze">{t('hint')}</p>
    <textarea ref={ref} id="description" name="description" required minLength={20} maxLength={8000} rows={8} defaultValue={defaultValue} className="field" placeholder={tf('descriptionPlaceholder')} onInput={()=>setPreview(null)}/>
    {preview!==null&&<section aria-label={t('preview')} className="rounded-xl border p-4"><EventDescription text={preview}/></section>}
  </>;
}
