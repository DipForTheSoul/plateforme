import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

vi.mock("@/app/actions/settings", () => ({
  updateSettings: vi.fn(),
}));

import { PractitionerNavigation } from "@/components/PractitionerNavigation";
import { SettingNumberForm } from "@/components/admin/SettingNumberForm";

describe("mise en page mobile des espaces authentifiés", () => {
  it("affiche tous les liens praticien dans un menu qui revient à la ligne", () => {
    const html = renderToStaticMarkup(
      <PractitionerNavigation items={[
        { href: "/espace-praticien", label: "Tableau de bord" },
        { href: "/espace-praticien/evenements", label: "Mes expériences" },
        { href: "/espace-praticien/profil", label: "Ma fiche", badge: true },
        { href: "/espace-praticien/credits", label: "Mes crédits" },
      ]} />
    );

    expect(html).toContain("grid grid-cols-2 gap-3 md:flex md:flex-col");
    expect(html).not.toContain("overflow-x-auto");
    expect(html).toContain("Mes expériences");
    expect(html).toContain("Mes crédits");
  });

  it("empile proprement la sauvegarde d’un nombre sur petit écran", () => {
    const html = renderToStaticMarkup(
      <SettingNumberForm
        settingKey="pack_default_valid_days"
        label="Durée"
        defaultValue="365"
        suffix="jours"
        saveLabel="Enregistrer"
      />
    );

    expect(html).toContain("flex flex-col gap-2 sm:flex-row sm:items-center");
    expect(html).toContain("shrink-0 text-sm text-soul-bronze");
    expect(html).toContain("btn-secondary w-full !py-2 sm:w-auto");
  });
});
