import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { LegalPage } from "@/components/LegalPage";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

it("conserve visuellement les retours à la ligne des coordonnées", () => {
  const html = renderToStaticMarkup(
    <LegalPage
      title="Mentions"
      blocks={[
        {
          t: "p",
          x: "ForTheSoul.ch\nDidier Picamoles\nSuisse\nwelcome@forthesoul.ch",
        },
      ]}
    />
  );

  expect(html).toContain("whitespace-pre-line");
  expect(html).toContain("ForTheSoul.ch\nDidier Picamoles\nSuisse\nwelcome@forthesoul.ch");
});
