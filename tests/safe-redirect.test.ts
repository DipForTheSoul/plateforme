import { expect,it } from 'vitest';
import { safeRedirectPath } from '@/lib/safe-redirect';
it.each(['//evil.test','/\\evil.test','/%2fevil.test','/%5cevil.test','https://evil.test','javascript:alert(1)','/%zz','/\n/evil.test'])('bloque %s',value=>expect(safeRedirectPath(value)).toBe('/'));
it('conserve un retour local traduit et ses paramètres',()=>expect(safeRedirectPath('/de/espace-praticien?achat=annule')).toBe('/de/espace-praticien?achat=annule'));
