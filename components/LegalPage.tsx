import type { ReactNode } from "react";

type Block = { t: "h2" | "h3" | "li" | "p"; x: string };

/**
 * Rendu d'une page légale (CGU / Politique de confidentialité) à partir du contenu
 * fourni par le client (content/legal/*.json). Texte VERBATIM — on ne réécrit rien.
 */
export function LegalPage({
  title,
  updated,
  blocks,
}: {
  title: string;
  updated?: string;
  blocks: Block[];
}) {
  const nodes: ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: string) => {
    if (list.length === 0) return;
    nodes.push(
      <ul key={key} className="ml-5 list-disc space-y-1 text-soul-ink/85">
        {list.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    );
    list = [];
  };

  blocks.forEach((b, i) => {
    if (b.t === "li") {
      list.push(b.x);
      return;
    }
    flushList(`ul-${i}`);
    if (b.t === "h2") {
      nodes.push(
        <h2 key={i} className="mt-6 font-serif text-xl text-soul-brown">
          {b.x}
        </h2>
      );
    } else if (b.t === "h3") {
      nodes.push(
        <h3 key={i} className="mt-4 font-semibold text-soul-brown">
          {b.x}
        </h3>
      );
    } else {
      nodes.push(
        <p key={i} className="leading-relaxed text-soul-ink/85">
          {b.x}
        </p>
      );
    }
  });
  flushList("ul-end");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-soul-brown sm:text-4xl">{title}</h1>
      {updated && (
        <p className="mt-2 text-sm text-soul-bronze">Dernière mise à jour : {updated}</p>
      )}
      <div className="mt-8 flex flex-col gap-3">{nodes}</div>
    </div>
  );
}
