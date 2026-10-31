"use client";
import {useState,type TextareaHTMLAttributes} from 'react';
import {useLocale} from 'next-intl';
import {formValidationCopy} from '@/lib/form-field-errors';

/** Never truncate pasted text or an existing biography; explain the limit. */
export function BiographyInput({limit,hint,error,defaultValue,...props}:TextareaHTMLAttributes<HTMLTextAreaElement>&{limit:number;hint?:string;error?:string}) {
  const locale=useLocale();
  const [count,setCount]=useState(String(defaultValue??'').length);
  const t=formValidationCopy(locale);
  const over=count>limit;
  return <>
    <textarea {...props} data-character-count="true" defaultValue={defaultValue} aria-invalid={over||!!error} aria-describedby={`${props.id}-hint`}
      onInput={event=>{setCount(event.currentTarget.value.length);props.onInput?.(event);}}/>
    <p id={`${props.id}-hint`} className={`mt-1 text-xs ${over||error?'text-red-700':'text-soul-bronze'}`}>
      {hint??`${t.maximum} ${limit.toLocaleString(locale)} ${t.characters}.`} {count.toLocaleString(locale)} / {limit.toLocaleString(locale)} {t.characters}.
      {error&&<span className="block">{error}</span>}
    </p>
  </>;
}
