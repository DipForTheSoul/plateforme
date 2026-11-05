// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("reprend dans l'image de partage la promesse de la page d'accueil", () => {
  const source = readFileSync(
    new URL("../app/[locale]/opengraph-image.tsx", import.meta.url),
    "utf8"
  );
  expect(source).toContain("getTranslations({locale,namespace:'home'})");
  expect(source).toContain("t('heroTitle')");
  expect(source).toContain("t('heroSubtitle')");
  expect(source).not.toContain("Expériences conscientes en Suisse, choisies avec cœur");
});
