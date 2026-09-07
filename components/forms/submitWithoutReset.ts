"use client";
import { startTransition, type FormEvent } from 'react';

/** Preserve the mounted form on validation errors; never persist credentials. */
export function submitWithoutReset(action: (data: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  };
}
