import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import ContactRequestDetail from "@/app/[locale]/admin/demandes-contact/[id]/page";

vi.mock("@/lib/auth", () => ({ requireRole: async () => ({ role: "admin" }) }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({
          data: {
            id: "request-qa",
            visitor_name: "Marie Test",
            visitor_email: "marie@example.test",
            visitor_phone: "+41 79 000 00 00",
            newsletter_consent: true,
            message: "Message complet adressé au praticien, visible par l’administrateur.",
            send_status: "sent",
            send_error: null,
            created_at: "2026-09-29T12:00:00Z",
            practitioner: { name: "Praticien QA" },
          },
          error: null,
        }),
      };
      return query;
    },
  }),
}));

it("permet à l’administrateur d’ouvrir et de lire le message complet", async () => {
  const html = renderToStaticMarkup(
    await ContactRequestDetail({ params: Promise.resolve({ id: "request-qa" }) })
  );

  expect(html).toContain("Message complet adressé au praticien");
  expect(html).toContain("marie@example.test");
  expect(html).toContain("+41 79 000 00 00");
  expect(html).toContain("← Demande aux praticiens");
  expect(html).toContain('href="/admin/demandes-contact"');
});
