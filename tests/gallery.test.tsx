import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ImageGallery } from "@/components/ImageGallery";

it("rend les photos sans recadrage et des contrôles natifs accessibles", () => {
  const html = renderToStaticMarkup(<ImageGallery images={["https://example.ch/a.jpg", "https://example.ch/b.jpg"]} alt="Retraite" />);
  expect(html).toContain("object-contain");
  expect(html).not.toContain("object-cover");
  expect(html).toContain('href="#experience-photo-2"');
  expect(html).toContain('aria-label="Image suivante"');
  expect(html).toContain("min-h-11");
});
