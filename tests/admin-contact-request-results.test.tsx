import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { ContactRequestResults, type ContactRequestRow } from "@/components/admin/ContactRequestResults";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const row: ContactRequestRow = {
  id: "request-mobile",
  created_at: "2026-09-30T18:00:00Z",
  visitor_name: "Marie Mobile",
  visitor_email: "une-adresse-volontairement-longue@example.test",
  visitor_phone: "+41 79 000 00 00",
  message: "Un message assez long qui doit rester lisible sans imposer un tableau horizontal sur téléphone.",
  newsletter_consent: true,
  send_status: "sent",
  practitioner: { name: "Praticien Mobile" },
};

it("présente les demandes sous forme de fiches lisibles sur mobile", () => {
  const html = renderToStaticMarkup(<ContactRequestResults rows={[row]} />);

  expect(html).toContain('class="mt-5 grid gap-3 lg:hidden"');
  expect(html).toContain("Praticien Mobile");
  expect(html).toContain("une-adresse-volontairement-longue@example.test");
  expect(html).toContain(row.message);
  expect(html).toContain('href="/admin/demandes-contact/request-mobile"');
  expect(html).toContain('href="tel:+41 79 000 00 00"');
});

it("conserve le tableau sur les écrans moyens et larges", () => {
  const html = renderToStaticMarkup(<ContactRequestResults rows={[row]} />);

  expect(html).toContain("hidden lg:block");
  expect(html).toContain("<table");
  expect(html).toContain("Voir le message");
  expect(html).toContain("Ouvrir la fiche complète");
  expect(html).toContain("Envoyé");
});

it("affiche un état vide simple sans tableau", () => {
  const html = renderToStaticMarkup(<ContactRequestResults rows={[]} />);

  expect(html).toContain("Aucune demande.");
  expect(html).not.toContain("<table");
});
