"use client";
import type { InputHTMLAttributes } from 'react';
import { normalizeWebUrl } from '@/lib/web-url';

export function WebUrlInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} type="text" inputMode="url" autoCapitalize="none" autoCorrect="off"
    onBlur={e => { e.currentTarget.value = normalizeWebUrl(e.currentTarget.value) ?? ''; props.onBlur?.(e); }} />;
}
