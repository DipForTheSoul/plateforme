import { expect, test } from "@playwright/test";

test("les interactions tactiles essentielles restent actives", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/experiences", { waitUntil: "networkidle" });

  const consent = page.getByRole("complementary", {
    name: /Google Analytics/,
  });
  await expect(consent).toBeVisible();
  await consent
    .getByRole("button", { name: /Refuser|Refuse|Ablehnen/ })
    .click();
  await expect(consent).toBeHidden();

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

  await page.getByRole("button", { name: "EUR" }).click();
  await expect(page.getByRole("button", { name: "EUR" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.getByRole("button", { name: /^de$/i }).click();
  await expect(page).toHaveURL(/\/de\/experiences/);

  const from = page.locator("#date-from");
  await from.fill("2026-11-01");
  await expect(page).toHaveURL(/du=2026-11-01/);

  const noHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
  expect(noHorizontalOverflow).toBe(true);
  expect(runtimeErrors).toEqual([]);
});

test("l’acceptation Analytics reste cliquable", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const consent = page.getByRole("complementary", {
    name: /Google Analytics/,
  });
  await consent
    .getByRole("button", { name: /Accepter|Accept|Akzeptieren/ })
    .click();
  await expect(consent).toBeHidden();
});
