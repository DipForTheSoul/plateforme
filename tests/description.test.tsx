import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {EventDescription} from '@/components/EventDescription';
import {descriptionText} from '@/lib/description-text';
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
