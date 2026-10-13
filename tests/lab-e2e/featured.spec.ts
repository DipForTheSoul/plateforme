import {expect,test} from '@playwright/test';

test('panneau tactile, langues, paiement simulé et absence de débordement',async({page},info)=>{
  let requests=0;
  await page.route('**/api/stripe/featured-checkout',async route=>{
    requests++;
    await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Paiement de test indisponible'})});
  });
  await page.goto('/');
  await page.getByLabel('Parcours de test').selectOption('featured');
  for(const locale of ['fr','de','en']){
    await page.getByLabel('Langue de test').selectOption(locale);
    const card=page.getByTestId('featured-corrected');
    const open=card.locator('button[aria-expanded]');
    await open.tap();
    await expect(open).toHaveAttribute('aria-expanded','true');
    expect(requests).toBe(0);
    await expect(card.getByRole('region')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await open.tap();
    await expect(card.getByRole('region')).toHaveCount(0);
  }
  await page.getByLabel('Langue de test').selectOption('fr');
  const card=page.getByTestId('featured-corrected');
  await card.locator('button[aria-expanded]').tap();
  await card.getByRole('button',{name:'Payer avec Stripe'}).tap();
  await expect(card.getByRole('alert')).toHaveText('Paiement de test indisponible');
  await expect(card.getByRole('button',{name:'Payer avec Stripe'})).toBeEnabled();
  expect(requests).toBe(1);
  await card.screenshot({path:`output/featured-${info.project.name}.png`});
});

test('galerie tactile et confirmation newsletter restent visibles',async({page})=>{
  await page.goto('/');
  await page.getByLabel('Parcours de test').selectOption('featured');
  await page.getByLabel('Résultat serveur').selectOption('success');
  await page.locator('#experience-photo-1').getByRole('link',{name:'Image suivante'}).tap();
  await expect(page).toHaveURL(/#experience-photo-2$/);
  await expect.poll(()=>page.locator('#experience-photo-2').evaluate(el=>Math.abs(el.getBoundingClientRect().left-el.parentElement!.getBoundingClientRect().left))).toBeLessThan(2);
  await page.getByPlaceholder('Email de test').fill('synthetic@example.test');
  await page.getByRole('checkbox',{name:'Consentement de test'}).check();
  await page.getByRole('button',{name:'Inscription de test'}).tap();
  const status=page.getByRole('status');
  await expect(status).toHaveText('Inscription simulée confirmée');
  await expect(status).toBeFocused();
  const box=await status.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y+box!.height).toBeLessThanOrEqual(page.viewportSize()!.height+1);
});
