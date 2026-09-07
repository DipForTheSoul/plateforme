import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {JsonLd} from '@/components/JsonLd';
import {eventApprovedEmail,practitionerRejectedEmail} from '@/lib/email-templates';
it('ne permet pas de fermer la balise JSON-LD avec un titre',()=>{
  const markup=renderToStaticMarkup(<JsonLd data={{name:'</script><img src=x onerror=alert(1)>'}}/>);
  expect(markup.match(/<\/script>/g)).toHaveLength(1);expect(markup).not.toContain('<img');
});
it('échappe les champs utilisateur dans les e-mails de modération',()=>{
  const approved=eventApprovedEmail('<img src=x>','<script>bad</script>','safe-slug','<a href="evil">message</a>');
  expect(approved.html).not.toContain('<script>');expect(approved.html).not.toContain('<img src=x>');expect(approved.html).not.toContain('href="evil"');
  expect(practitionerRejectedEmail('<b>name</b>','<iframe>bad</iframe>').html).not.toContain('<iframe>');
});
