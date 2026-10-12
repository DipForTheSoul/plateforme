import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {EventDescription} from '@/components/EventDescription';
import {descriptionText} from '@/lib/description-text';
import {normalizeDescriptionSpacing} from '@/lib/description-spacing';
it('rend italique et souligné imbriqués et les retire du texte des agendas',()=>{
  const text='**Important et *doux*** __Souligné__ 😊';
  const html=renderToStaticMarkup(<EventDescription text={text}/>);
  expect(html).toContain('<strong>Important et <em>doux</em></strong>');
  expect(html).toContain('<u>Souligné</u>');
  expect(descriptionText(text)).toBe('Important et doux Souligné 😊');
});
it('retire les marqueurs dans les cartes et agendas en conservant le lien',()=>{
  expect(descriptionText('**Important**\n- Tapis\n[Inscription](www.example.ch)')).toBe('Important\n• Tapis\nInscription (www.example.ch)');
  expect(descriptionText(null)).toBe('');
});
it('affiche gras, listes et lien externe sans interpréter du HTML',()=>{
  const html=renderToStaticMarkup(<EventDescription text={'**Important**\n- Tapis\n- Eau\n[Inscription](www.example.ch)\n<script>alert(1)</script>'}/>);
  expect(html).toContain('<strong>Important</strong>');expect(html).toContain('<li>Tapis</li>');expect(html).toContain('href="https://www.example.ch/"');expect(html).not.toContain('<script>');
});
it('ne rend jamais cliquables les protocoles dangereux ni les identifiants dans une URL',()=>{
  const html=renderToStaticMarkup(<EventDescription text={'[clic](javascript:alert(1)) [clic](https://user:password@example.ch) <img src=x onerror=alert(1)>'}/>);
  expect(html).not.toContain('href=');expect(html).not.toContain('<img');
});
it('limite les espaces entre paragraphes sans supprimer les paragraphes voulus',()=>{
  expect(normalizeDescriptionSpacing('Premier\n\n\n\nDeuxième  \n')).toBe('Premier\n\nDeuxième');
  const html=renderToStaticMarkup(<EventDescription text={'Premier\n\n\n\nDeuxième'}/>);
  expect(html.match(/<p/g)).toHaveLength(2);
  expect(html).not.toContain('min-h');
});
it('répare les anciens marqueurs de gras séparés sans afficher d’étoiles',()=>{
  const legacy='**Ein Ort zum Ankommen.\n**\n\n**Gemeinsam wachsen.\n**\n**\nTexte normal';
  expect(normalizeDescriptionSpacing(legacy)).toBe('**Ein Ort zum Ankommen.**\n\n**Gemeinsam wachsen.**\nTexte normal');
  const html=renderToStaticMarkup(<EventDescription text={legacy}/>);
  expect(html).toContain('<strong>Ein Ort zum Ankommen.</strong>');
  expect(html).toContain('<strong>Gemeinsam wachsen.</strong>');
  expect(html).not.toContain('**');
  expect(descriptionText(legacy)).toBe('Ein Ort zum Ankommen.\n\nGemeinsam wachsen.\nTexte normal');
});
it('répare aussi la fermeture placée au début du paragraphe suivant',()=>{
  const legacy='**Innehalten. Spüren. Klarer sehen.\n**Manchmal vient le texte suivant.';
  expect(normalizeDescriptionSpacing(legacy)).toBe('**Innehalten. Spüren. Klarer sehen.**\nManchmal vient le texte suivant.');
  const html=renderToStaticMarkup(<EventDescription text={legacy}/>);
  expect(html).toContain('<strong>Innehalten. Spüren. Klarer sehen.</strong>');
  expect(html).toContain('Manchmal vient le texte suivant.');
  expect(html).not.toContain('**');
  expect(descriptionText(legacy)).not.toContain('**');
});
