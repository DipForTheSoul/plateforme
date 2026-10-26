import {describe, expect, it} from 'vitest';
import fr from '@/messages/fr.json';
import de from '@/messages/de.json';
import en from '@/messages/en.json';

describe('FAQ accueil : parcours distincts', () => {
  for (const [locale, messages] of Object.entries({fr, de, en})) {
    it(`conserve la question praticien et une question propre au lieu (${locale})`, () => {
      const faq = messages.home.faq;
      expect(faq.items[4].q).toBeTruthy();
      expect(faq.items[4].a).toBeTruthy();
      expect(faq.propose.question).toBeTruthy();
      expect(faq.propose.venue).toBeTruthy();
      expect(faq.propose.venueLink).toBeTruthy();
      expect(faq.propose).not.toHaveProperty('experience');
      expect(faq.propose).not.toHaveProperty('experienceLink');
    });
  }
});
