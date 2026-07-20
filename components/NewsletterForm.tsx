"use client";

import { useActionState } from "react";
import {
  subscribeToNewsletter,
  type NewsletterState,
} from "@/app/actions/newsletter";

interface Props {
  placeholder: string;
  consentLabel: string;
  buttonLabel: string;
  successMessage: string;
  errorMessage: string;
  /** Tag d'intérêt à associer (ex. slug d'événement) — optionnel. */
  interest?: string;
}

export function NewsletterForm({
  placeholder,
  consentLabel,
  buttonLabel,
  successMessage,
  errorMessage,
  interest,
}: Props) {
  const [state, formAction, pending] = useActionState<NewsletterState, FormData>(
    subscribeToNewsletter,
    { status: "idle" }
  );

  if (state.status === "success") {
    return <p className="text-sm text-soul-amber">{successMessage}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {/* Pot-de-miel anti-spam : invisible pour les humains. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      {interest && <input type="hidden" name="interests" value={interest} />}
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder={placeholder}
          className="w-full rounded-full border-0 bg-soul-cream/15 px-4 py-2.5 text-sm text-soul-cream placeholder:text-soul-sand/50 focus:outline-none focus:ring-2 focus:ring-soul-amber/50"
        />
        <button type="submit" disabled={pending} className="btn-accent shrink-0 !py-2.5">
          {buttonLabel}
        </button>
      </div>
      <label className="flex items-start gap-2 text-xs text-soul-sand/70">
        <input type="checkbox" name="consent" required className="mt-0.5" />
        {consentLabel}
      </label>
      {state.status === "error" && (
        <p className="text-xs text-soul-terracotta">{errorMessage}</p>
      )}
    </form>
  );
}
