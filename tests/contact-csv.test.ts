import {expect,it} from 'vitest';
import {parseContactCsv,csvCell} from '@/lib/contact-csv';
it('importe noms avec virgules, guillemets et retours à la ligne',()=>{
  expect(parseContactCsv('email,name,last_name\r\ntest@example.test,"Didier, Victor","Nom ""cité""\nsuite"')).toEqual([['email','name','last_name'],['test@example.test','Didier, Victor','Nom "cité"\nsuite']]);
});
it('accepte CSV Excel avec point-virgule et BOM',()=>expect(parseContactCsv('\uFEFFtest@example.test;Didier;Picamoles;yoga|danse')).toEqual([['test@example.test','Didier','Picamoles','yoga|danse']]));
it('refuse un fichier incomplet',()=>expect(()=>parseContactCsv('test@example.test,"texte')).toThrow());
it('neutralise les formules de tableur et échappe les guillemets',()=>{expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');expect(csvCell('Nom "cité"')).toBe('"Nom ""cité"""');});
