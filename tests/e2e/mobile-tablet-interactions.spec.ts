import { devices, expect, test } from "@playwright/test";

test("les interactions tactiles essentielles restent actives", async ({ page, baseURL }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/experiences", { waitUntil: "networkidle" });

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
  await from.fill("2026-11-01");
  await expect(from).toHaveValue("2026-11-01");
  await from.locator("xpath=ancestor::form").getByRole("button").click();
  await expect(page).toHaveURL(/du=2026-11-01/);

  await page.getByRole("link", { name: /mois suivant|next month|nächster monat/i }).click();
  const calendarDay = page.locator('a[href*="du="]').filter({ hasText: /^15$/ }).first();
  await calendarDay.click();
  await expect(page).toHaveURL(/du=/);

  const noHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
  expect(noHorizontalOverflow).toBe(true);
  expect(runtimeErrors).toEqual([]);
});

test("le parcours essentiel fonctionne même sans JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    ...devices["iPad Mini"],
    baseURL,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto("/experiences");

  const consent = page.getByRole("complementary", { name: /Google Analytics/ });
  if (await consent.isVisible()) {
    await consent.getByRole("button", { name: /Refuser|Refuse|Ablehnen/ }).click();
    await expect(consent).toBeHidden();
  }

  await page.getByRole("button", { name: "Menu" }).click();
  await expect(
    page.getByRole("banner").locator('a[href$="/a-propos"]').last(),
  ).toBeVisible();

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
  await page.locator("#date-from").locator("xpath=ancestor::form").getByRole("button").click();
  await expect(page).toHaveURL(/du=2026-11-01/);

  await page.getByRole("link", { name: /mois suivant|next month|nächster monat/i }).click();
  await expect(page).toHaveURL(/calendrier=/);
  await page.locator('a[href*="du="]').filter({ hasText: /^15$/ }).first().click();
  await expect(page).toHaveURL(/du=/);
  await context.close();
});

test("l’acceptation Analytics reste cliquable", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
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
