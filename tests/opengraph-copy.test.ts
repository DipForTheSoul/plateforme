// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("reprend dans l'image de partage la promesse de la page d'accueil", () => {
  const source = readFileSync(
    new URL("../app/[locale]/opengraph-image.tsx", import.meta.url),
    "utf8"
  );
  expect(source).toContain("Des expériences qui nourrissent l’âme");
  expect(source).toContain("Retraites, ateliers et expériences pour le corps, l’esprit et l’âme");
  expect(source).not.toContain("Expériences conscientes en Suisse, choisies avec cœur");
});
