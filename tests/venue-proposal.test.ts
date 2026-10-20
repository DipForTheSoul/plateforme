import { describe, expect, it } from "vitest";
import fr from "@/messages/fr.json";
import de from "@/messages/de.json";
import en from "@/messages/en.json";

describe.each([
  ["fr", fr, "Site internet :", "Nom et téléphone de contact"],
  ["de", de, "Webseite:", "Kontaktname und Telefonnummer"],
  ["en", en, "Website:", "Contact name and phone number"],
] as const)("proposition de lieu — %s", (_locale, messages, website, privateContact) => {
  it("demande le site sans demander le nom et le téléphone privés", () => {
    const proposal = messages.venues.proposal;
    expect(proposal.emailBody).toContain(website);
    expect(proposal.emailBody).not.toContain(privateContact);
    expect(proposal.emailBody).toContain("CHF 49.– / 12");
    const url = new URL(`mailto:welcome@forthesoul.ch?subject=${encodeURIComponent(proposal.emailSubject)}&body=${encodeURIComponent(proposal.emailBody)}`);
    expect(url.pathname).toBe("welcome@forthesoul.ch");
    expect(url.searchParams.get("subject")).toBe(proposal.emailSubject);
    expect(url.searchParams.get("body")).toBe(proposal.emailBody);
  });
});
