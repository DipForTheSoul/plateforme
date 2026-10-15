import { devices, expect, test } from "@playwright/test";

test("les interactions tactiles essentielles restent actives", async ({ page, baseURL }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  // Les cartes et images peuvent garder le réseau actif. On attend ensuite
  // chaque contrôle utile, plutôt que l'arrêt de toutes les requêtes.
  await page.goto("/experiences", { waitUntil: "domcontentloaded" });

  const consent = page.getByRole("complementary", {
    name: /Google Analytics/,
  });
  if (await consent.isVisible()) {
    await consent
      .getByRole("button", { name: /Refuser|Refuse|Ablehnen/ })
      .click();
    await expect(consent).toBeHidden();
  }

  const menu = page.getByRole("button", { name: "Menu" });
  const aboutLinks = page
    .getByRole("banner")
    .locator('a[href$="/a-propos"]');
  if (await menu.isVisible()) {
    await menu.click();
    await expect(aboutLinks.last()).toBeVisible();
    await menu.click();
  } else {
    await expect(aboutLinks.first()).toBeVisible();
  }

  const mapLink = page.getByRole("link", { name: /carte|map|karte/i }).first();
  await expect(mapLink).toHaveAttribute("href", /vue=carte/);
  await mapLink.click();
  await expect(page).toHaveURL(/vue=carte/);
  const map = page.locator(".leaflet-container");
  await expect(map).toBeVisible();
  await expect.poll(() => map.locator("img.leaflet-tile").evaluateAll(images => images.filter(image => (image as HTMLImageElement).naturalWidth > 0).length)).toBeGreaterThan(0);
  const mapBox = await map.boundingBox();
  expect(mapBox).not.toBeNull();
  expect(mapBox!.y).toBeLessThan(page.viewportSize()!.height);
  const listLink = page.getByRole("link", { name: /liste|list/i }).first();
  await listLink.click();
  await expect(page).not.toHaveURL(/vue=carte/);

  // Le cookie de devise est Secure en build de production : il ne peut être
  // vérifié que sur une cible HTTPS, pas sur le serveur local HTTP.
  if (baseURL?.startsWith("https://")) {
    await page.getByRole("button", { name: "EUR" }).click();
    await expect(page.getByRole("button", { name: "EUR" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }

  await page.getByRole("link", { name: /^de$/i }).click();
  await expect(page).toHaveURL(/\/de\/experiences/);

  const from = page.locator("#date-from");
  // La soumission doit rester dans le document déjà initialisé, comme les
  // autres filtres, et ne pas relancer le flux HTML/React sur Firefox.
  await expect(page.locator('summary').filter({ hasText: /filtres|filter/i })).toBeVisible();
  await page.evaluate(() => { document.documentElement.dataset.dateNavigation = "ready"; });
  await from.fill("2026-11-01");
  await expect(from).toHaveValue("2026-11-01");
  await from.locator("xpath=ancestor::form").getByRole("button", {name:/filtrer|filter/i}).first().click();
  await expect(page).toHaveURL(/du=2026-11-01/);
  await expect(page.locator("html")).toHaveAttribute("data-date-navigation", "ready");

  const nextMonth = page.getByRole("link", { name: /mois suivant|next month|nächster monat/i });
  if (!await nextMonth.isVisible()) {
    const filtersButton=page.locator('summary').filter({ hasText: /filtres|filter/i });
    await expect(filtersButton).toBeEnabled();
    await filtersButton.click();
  }
  await expect(nextMonth).toBeVisible();
  await nextMonth.click();
  const calendarDay = page.locator('a[href*="du="]').filter({ hasText: /^15$/ }).first();
  const selectedDates = new URL((await calendarDay.getAttribute("href"))!, page.url()).searchParams;
  await calendarDay.click();
  await expect.poll(() => new URL(page.url()).searchParams.get("du")).toBe(selectedDates.get("du"));
  await expect.poll(() => new URL(page.url()).searchParams.get("au")).toBe(selectedDates.get("au"));
  await expect(from).toHaveValue(selectedDates.get("du") ?? "");
  await expect(page.locator("#date-to")).toHaveValue(selectedDates.get("au") ?? "");

  const experienceLink = page.locator('main a[href*="/experiences/"]').first();
  if (await experienceLink.count()) {
    await experienceLink.click();
    const gallery = page.getByTestId("experience-gallery");
    if (await gallery.count()) {
      await expect(gallery.locator("img").first()).toHaveClass(/object-contain/);
      const nextImage = gallery.getByRole("link", { name: /image suivante/i }).first();
      if (await nextImage.count()) {
        const target = await nextImage.getAttribute("href");
        await nextImage.click();
        await expect(page).toHaveURL(new RegExp(`${target!.replace("#", "#")}$`));
      }
    }
  }

  const noHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
  expect(noHorizontalOverflow).toBe(true);
  // WebKit bloque parfois ses propres préchargements RSC sur localhost lors
  // des runs parallèles. Ce bruit de laboratoire n'existe pas en same-origin
  // HTTPS et ne doit pas masquer une vraie erreur d'exécution de l'application.
  const applicationErrors = runtimeErrors.filter((message) =>
    !message.includes("due to access control checks")
  );
  expect(applicationErrors).toEqual([]);
});

test("le parcours essentiel fonctionne même sans JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    ...devices["iPad Mini"],
    baseURL,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto("/experiences", { waitUntil: "domcontentloaded" });

  const consent = page.getByRole("complementary", { name: /Google Analytics/ });
  if (await consent.isVisible()) {
    await consent.getByRole("button", { name: /Refuser|Refuse|Ablehnen/ }).click();
    await expect(consent).toBeHidden();
  }

  await page.getByRole("button", { name: "Menu" }).click();
  await expect(
    page.getByRole("banner").locator('a[href$="/a-propos"]').last(),
  ).toBeVisible();

  const mapLink = page.getByRole("link", { name: /carte|map|karte/i }).first();
  await expect(mapLink).toHaveAttribute("href", /vue=carte/);
  await mapLink.click();
  await expect(page).toHaveURL(/vue=carte/);
  await expect(page.getByTestId('static-map')).toBeVisible();

  if (baseURL?.startsWith("https://")) {
    await page.getByRole("button", { name: "EUR" }).click();
    await expect(page.getByRole("button", { name: "EUR" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }

  await page.getByRole("link", { name: /^de$/i }).click();
  await expect(page).toHaveURL(/\/de\/experiences/);

  await page.locator("#date-from").fill("2026-11-01");
  await page.locator("#date-from").locator("xpath=ancestor::form").getByRole("button", {name:/filtrer|filter/i}).first().click();
  await expect(page).toHaveURL(/du=2026-11-01/);

  await page.locator('summary').filter({hasText:/filtres|filter/i}).click();
  await page.getByRole("link", { name: /mois suivant|next month|nächster monat/i }).click();
  await expect(page).toHaveURL(/calendrier=/);
  await expect(page).toHaveURL(/\/de\/experiences/);
  await page.locator('summary').filter({hasText:/filtres|filter/i}).click();
  await page.locator('a[href*="du="]').filter({ hasText: /^15$/ }).first().click();
  await expect(page).toHaveURL(/du=/);
  await expect(page).toHaveURL(/\/de\/experiences/);
  await context.close();
});

test("l’acceptation Analytics reste cliquable", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const consent = page.getByRole("complementary", {
    name: /Google Analytics/,
  });
  await consent.waitFor({ state: "visible", timeout: 3_000 }).catch(() => undefined);
  test.skip(!(await consent.isVisible()), "Bannière désactivée dans cet environnement");
  await consent
    .getByRole("button", { name: /Accepter|Accept|Akzeptieren/ })
    .click();
  await expect(consent).toBeHidden();
});

test("les dates et les choix Analytics ne se chevauchent pas sur petit mobile", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    ...devices["iPhone SE"],
    baseURL,
    locale: "fr-FR",
  });
  const page = await context.newPage();
  // Un tag analytics autorisé peut maintenir une connexion réseau ouverte :
  // le rendu utile suffit ici, sans attendre un hypothétique network idle.
  await page.goto("/experiences", { waitUntil: "domcontentloaded" });

  const viewportWidth = page.viewportSize()!.width;
  const from = await page.locator("#date-from").boundingBox();
  const to = await page.locator("#date-to").boundingBox();
  expect(from).not.toBeNull();
  expect(to).not.toBeNull();
  expect(from!.x).toBeGreaterThanOrEqual(0);
  expect(to!.x).toBeGreaterThanOrEqual(0);
  expect(from!.x + from!.width).toBeLessThanOrEqual(viewportWidth + 1);
  expect(to!.x + to!.width).toBeLessThanOrEqual(viewportWidth + 1);
  expect(to!.y).toBeGreaterThanOrEqual(from!.y + from!.height);

  const consent = page.getByRole("complementary", { name: /Google Analytics/ });
  if (await consent.isVisible()) {
    const refuse = await consent.getByRole("button", { name: "Refuser" }).boundingBox();
    const accept = await consent.getByRole("button", { name: "Accepter" }).boundingBox();
    expect(refuse).not.toBeNull();
    expect(accept).not.toBeNull();
    expect(Math.abs(refuse!.y - accept!.y)).toBeLessThanOrEqual(1);
    expect(refuse!.x + refuse!.width).toBeLessThanOrEqual(accept!.x);
    expect(accept!.x + accept!.width).toBeLessThanOrEqual(viewportWidth + 1);
  }

  await context.close();
});
