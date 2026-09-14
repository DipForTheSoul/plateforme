import {expect,it} from 'vitest';
import {parseContactCsv,csvCell,normalizeContactRows} from '@/lib/contact-csv';
it('importe noms avec virgules, guillemets et retours à la ligne',()=>{
  expect(parseContactCsv('email,name,last_name\r\ntest@example.test,"Didier, Victor","Nom ""cité""\nsuite"')).toEqual([['email','name','last_name'],['test@example.test','Didier, Victor','Nom "cité"\nsuite']]);
});
it('accepte CSV Excel avec point-virgule et BOM',()=>expect(parseContactCsv('\uFEFFtest@example.test;Didier;Picamoles;yoga|danse')).toEqual([['test@example.test','Didier','Picamoles','yoga|danse']]));
it('refuse un fichier incomplet',()=>expect(()=>parseContactCsv('test@example.test,"texte')).toThrow());
it('neutralise les formules de tableur et échappe les guillemets',()=>{expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');expect(csvCell('Nom "cité"')).toBe('"Nom ""cité"""');});
it('reconnaît les colonnes principales d’un export Wix dans un ordre quelconque',()=>{
  const rows=parseContactCsv('Last Name,Labels,Email,First Name\nPicamoles,"danse,meditation",DIDIER@example.test,Didier');
  expect(normalizeContactRows(rows)).toEqual([{email:'didier@example.test',firstName:'Didier',lastName:'Picamoles',interests:['danse','meditation']}]);
});
it('conserve le format simple sans en-tête et ignore les lignes sans e-mail valide',()=>{
  expect(normalizeContactRows(parseContactCsv('test@example.test;Marie;Dupont;yoga|danse\npas-un-email;X'))).toEqual([
    {email:'test@example.test',firstName:'Marie',lastName:'Dupont',interests:['yoga','danse']},
  ]);
});
