"use client";
import {useLocale} from 'next-intl';
import {formValidationCopy} from '@/lib/form-field-errors';

export function FormFieldErrors({errors}:{errors?:Record<string,string>}) {
  const locale=useLocale();
  if(!errors||!Object.keys(errors).length) return null;
  return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
    <p className="font-medium">{formValidationCopy(locale).summary}</p>
    <ul className="mt-2 list-inside list-disc space-y-1">{Object.entries(errors).map(([field,message])=><li key={field}><a href={`#${field}`} className="underline">{message}</a></li>)}</ul>
  </div>;
}
