import { describe, expect, it } from "vitest";
import fr from "@/messages/fr.json";
import de from "@/messages/de.json";
import en from "@/messages/en.json";

describe.each([
  ["fr", fr, "Site internet :", "Nom et téléphone de contact", "ne seront pas publiés"],
  ["de", de, "Webseite:", "Kontaktname und Telefonnummer", "werden nicht veröffentlicht"],
  ["en", en, "Website:", "Contact name and phone number", "will not be published"],
] as const)("proposition de lieu — %s", (_locale, messages, website, privateContact, privacy) => {
  it("demande un contact privé avec sa finalité et sa non-publication explicites", () => {
    const proposal = messages.venues.proposal;
    expect(proposal.emailBody).toContain(website);
    expect(proposal.emailBody).toContain(privateContact);
    expect(proposal.emailBody).toContain(privacy);
    expect(proposal.emailBody).toContain("CHF 49.– / 12");
    const url = new URL(`mailto:welcome@forthesoul.ch?subject=${encodeURIComponent(proposal.emailSubject)}&body=${encodeURIComponent(proposal.emailBody)}`);
    expect(url.pathname).toBe("welcome@forthesoul.ch");
    expect(url.searchParams.get("subject")).toBe(proposal.emailSubject);
    expect(url.searchParams.get("body")).toBe(proposal.emailBody);
  });
});
