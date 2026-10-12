/**
 * Répare l'ancien format produit lorsque le gras commençait sur une ligne et
 * que sa fermeture `**` était enregistrée seule sur la ligne suivante.
 * Ces marqueurs ne doivent jamais être affichés au visiteur.
 */
export function normalizeLegacyDescriptionMarkdown(value: string) {
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  const result: string[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (/^\s*\*\*\s*$/.test(line)) continue;

    const opensLegacyBold = /^\s*\*\*(?!\*)/.test(line)
      && (line.match(/\*\*/g) ?? []).length % 2 === 1;
    if (!opensLegacyBold) {
      result.push(line);
      continue;
    }

    let closing = index + 1;
    while (closing < lines.length && !lines[closing].trim()) closing++;
    if (closing < lines.length && /^\s*\*\*/.test(lines[closing])) {
      result.push(`${line}**`);
      const remainder = lines[closing].replace(/^(\s*)\*\*/, "$1");
      if (remainder.trim()) result.push(remainder);
      index = closing;
    } else {
      // Un marqueur réellement orphelin devient du texte normal.
      result.push(line.replace(/^(\s*)\*\*/, "$1"));
    }
  }

  return result.join("\n");
}

/** Conserve les paragraphes voulus mais supprime les grands vides accidentels. */
export function normalizeDescriptionSpacing(value: string) {
  return normalizeLegacyDescriptionMarkdown(value)
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
