/** Conserve les paragraphes voulus mais supprime les grands vides accidentels. */
export function normalizeDescriptionSpacing(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
