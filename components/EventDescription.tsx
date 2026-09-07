/** Keep user-entered separators and long URLs inside a narrow mobile viewport. */
export function EventDescription({text}: {text: string}) {
  return <div className="prose mt-8 max-w-none whitespace-pre-line [overflow-wrap:anywhere] text-soul-ink/90">{text}</div>;
}
