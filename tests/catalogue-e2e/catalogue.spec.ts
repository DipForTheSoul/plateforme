import {test,expect,type Page,type Locator} from '@playwright/test';
import {readFileSync,readdirSync} from 'node:fs';

const tile = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#dbedd2"/><path d="M0 90L256 160M80 0L180 256" stroke="#fff" stroke-width="16"/><text x="15" y="30" font-size="15">Tuile synthétique QA</text></svg>';
async function isolate(page:Page) {
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='tile.openstreetmap.org')return route.fulfill({contentType:'image/svg+xml',body:tile});
    if(!['localhost','127.0.0.1'].includes(url.hostname))return route.abort();
    return route.continue();
  });
}
async function activate(locator:Locator){if(test.info().project.use.hasTouch)await locator.tap();else await locator.click();}
async function openFilters(page:Page){await activate(page.locator('summary').filter({hasText:'Filtres'}));}
test.beforeEach(async({page})=>{await isolate(page);});

test('tactile à froid: filtres, carte rendue, reset et absence de débordement',async({page,browser},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/experiences');
  await openFilters(page);
  await page.getByRole('combobox',{name:'Langue',exact:true}).selectOption('fr');
  await expect(page.locator('section')).toContainText('1 expérience');
  await page.getByRole('combobox',{name:'Pays',exact:true}).selectOption('CH');
  await page.getByRole('combobox',{name:'Canton',exact:true}).selectOption('VD');
  await activate(page.getByRole('link',{name:'Carte',exact:true}));
  const map=page.locator('.leaflet-container');
  await expect(map).toBeVisible();
  await expect.poll(()=>map.locator('img.leaflet-tile').evaluateAll(images=>images.filter(image=>(image as HTMLImageElement).naturalWidth>0).length)).toBeGreaterThan(0);
  await expect(map.locator('.leaflet-marker-icon')).toHaveCount(1);
  await activate(map.locator('.leaflet-marker-icon').first());
  await expect(map.locator('.leaflet-popup')).toContainText('Expérience synthétique fr');
  await expect.poll(()=>map.locator('.leaflet-popup').evaluate(element=>{
    const popup=element.getBoundingClientRect(),zoom=element.closest('.leaflet-container')!.querySelector('.leaflet-control-zoom')!.getBoundingClientRect();
    return popup.bottom<=zoom.top || popup.top>=zoom.bottom || popup.left>=zoom.right || popup.right<=zoom.left;
  })).toBe(true);
  await expect.poll(()=>map.locator('.leaflet-popup').evaluate(element=>{
    const popup=element.getBoundingClientRect(),box=element.closest('.leaflet-container')!.getBoundingClientRect();
    return popup.left>=box.left && popup.right<=box.right;
  })).toBe(true);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await map.screenshot({path:info.outputPath('map-rendered.png')});
  const viewport=page.viewportSize()!;
  await page.setViewportSize({width:viewport.height,height:viewport.width});
  await expect(map).toBeVisible();
  await expect.poll(()=>map.locator('.leaflet-marker-icon').first().evaluate(element=>{
    const marker=element.getBoundingClientRect(), box=element.closest('.leaflet-container')!.getBoundingClientRect();
    return marker.left>=box.left && marker.right<=box.right && marker.top>=box.top && marker.bottom<=box.bottom;
  })).toBe(true);
  await page.setViewportSize(viewport);
  await expect.poll(()=>map.locator('.leaflet-popup').evaluate(element=>{
    const popup=element.getBoundingClientRect(),box=element.closest('.leaflet-container')!.getBoundingClientRect();
    return popup.left>=box.left && popup.right<=box.right;
  })).toBe(true);
  await activate(page.getByRole('link',{name:'Réinitialiser',exact:true}));
  await expect(page).toHaveURL(/\/experiences$/);
  await expect(page.locator('section')).toContainText('2 expériences');
  await expect(page.getByRole('combobox',{name:'Langue',exact:true})).toHaveValue('');
  expect(errors).toEqual([]);
  await info.attach('environment',{body:JSON.stringify({url:page.url(),browser:browser.version(),project:info.project.name}),contentType:'application/json'});
});

test('avant hydratation retardée: sélection native conservée après chargement',async({page})=>{
  let release!:()=>void;
  const hydration=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/_next/**/*.js*',async route=>{await hydration;await route.fallback();});
  try {
    await page.goto('/experiences?langue=fr',{waitUntil:'commit'});
    await openFilters(page);
    await page.getByRole('combobox',{name:'Langue',exact:true}).selectOption('de');
    await page.getByRole('button',{name:'Filtrer',exact:true}).last().click({noWaitAfter:true});
    await expect(page.locator('section')).toContainText('Expérience synthétique de');
  } finally { release(); }
  await openFilters(page);
  await expect(page.getByRole('combobox',{name:'Langue',exact:true})).toHaveValue('de');
  await page.getByRole('link',{name:'Réinitialiser',exact:true}).click();
  await expect(page.locator('section')).toContainText('2 expériences');
});

test('réseau lent: choix cumulés, saisie puis reset, historique cohérent',async({page})=>{
  await page.route('**/experiences?**',async route=>{
    if(route.request().headers()['rsc'])await new Promise(resolve=>setTimeout(resolve,500));
    await route.fallback();
  });
  await page.goto('/experiences');await openFilters(page);
  await page.getByRole('searchbox').fill('synthétique');
  await page.getByRole('combobox',{name:'Langue',exact:true}).selectOption('fr');
  await expect(page.getByRole('combobox',{name:'Langue',exact:true})).toHaveValue('fr');
  await page.getByRole('combobox',{name:'Pays',exact:true}).selectOption('CH');
  await page.getByRole('link',{name:'Carte',exact:true}).click();
  await expect.poll(()=>Object.fromEntries(new URL(page.url()).searchParams)).toMatchObject({q:'synthétique',langue:'fr',pays:'CH',vue:'carte'});
  await page.getByRole('searchbox').fill('aucun résultat');
  await page.getByRole('link',{name:'Réinitialiser',exact:true}).click();
  await expect(page).toHaveURL(/\/experiences$/);
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await expect(page.locator('section')).toContainText('2 expériences');
  // Next integrates native history entries; an old draft must not overwrite them.
  await page.evaluate(()=>history.pushState(null,'','?q=fr'));
  await expect(page.getByRole('searchbox')).toHaveValue('fr');
  await page.evaluate(()=>history.pushState(null,'','?q=de'));
  await expect(page.getByRole('searchbox')).toHaveValue('de');
  await page.goBack();
  await expect(page.getByRole('searchbox')).toHaveValue('fr');
  await expect(page).toHaveURL(/q=fr$/);
});

for(const mode of ['disabled','blocked'] as const)test(`sans JS (${mode}): sélection, reset et vraie carte SSR`,async({browser},info)=>{
  const context=await browser.newContext({...info.project.use,locale:'fr-FR',javaScriptEnabled:mode!=='disabled'});
  const page=await context.newPage();await isolate(page);
  if(mode==='blocked')await page.route('**/_next/**/*.js*',route=>route.abort());
  await page.goto('http://localhost:3102/experiences?vue=carte&langue=fr');
  await expect(page.getByTestId('static-map')).toBeVisible();
  const staticMap=page.getByTestId('static-map');
  await expect(staticMap.locator('image')).not.toHaveCount(0);
  await expect(staticMap.locator('circle')).toHaveCount(1);
  await staticMap.screenshot({path:info.outputPath(`map-${mode}.png`)});
  await openFilters(page);
  await page.getByRole('combobox',{name:'Langue',exact:true}).selectOption('de');
  await page.getByRole('button',{name:'Filtrer',exact:true}).last().click();
  await expect(page.locator('section')).toContainText('Expérience synthétique de');
  await expect(page.locator('section')).not.toContainText('Expérience synthétique fr');
  await page.getByRole('link',{name:'Réinitialiser',exact:true}).click();
  await expect(page).toHaveURL(/\/experiences$/);
  await expect(page.locator('section')).toContainText('2 expériences');
  await context.close();
});

test('tuiles bloquées: erreur explicite et fiches accessibles',async({page})=>{
  await page.route('https://tile.openstreetmap.org/**',route=>route.abort());
  await page.goto('/experiences?vue=carte');
  await expect(page.getByRole('status')).toContainText('chargement de la carte est incomplet');
  await expect(page.getByTestId('static-map')).toBeVisible();
  await expect(page.locator('section').getByRole('link',{name:/Expérience synthétique fr/}).first()).toBeVisible();
});

test('module Leaflet bloqué: carte SSR conservée sans exception non traitée',async({page})=>{
  const chunks=readdirSync('.next/static/chunks').filter(file=>file.endsWith('.js') && readFileSync(`.next/static/chunks/${file}`,'utf8').includes('leaflet-pane'));
  expect(chunks).toHaveLength(1);
  await page.route(`**/_next/static/chunks/${chunks[0]}`,route=>route.abort());
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/experiences?vue=carte');
  await expect(page.getByTestId('static-map')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('chargement de la carte est incomplet');
  expect(errors).toEqual([]);
});

test('réponse rapide: la recherche différée conserve le filtre déjà appliqué',async({page})=>{
  await page.goto('/experiences');await openFilters(page);
  await page.getByRole('searchbox').fill('synthétique');
  await page.getByRole('combobox',{name:'Langue',exact:true}).selectOption('fr');
  await expect.poll(()=>Object.fromEntries(new URL(page.url()).searchParams)).toMatchObject({q:'synthétique',langue:'fr'});
  await expect(page.locator('section')).toContainText('1 expérience');
});
