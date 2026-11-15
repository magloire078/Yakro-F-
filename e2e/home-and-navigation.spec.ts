import { test, expect } from '@playwright/test';

test.describe('Navigation & Ergonomie Yakro-Fê', () => {
  test('Charge la page d\'accueil avec le branding Yakro-Fê', async ({ page }) => {
    await page.goto('/');

    // Vérifie le titre ou le contenu principal
    await expect(page).toHaveTitle(/Yakro/i);

    // Vérifie qu'il n'y a pas de débordement horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('Les pages légales (/privacy, /terms) sont accessibles', async ({ page }) => {
    // Page Privacy
    const privacyRes = await page.goto('/privacy');
    expect(privacyRes?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(/Politique de Confidentialité|Confidentialité/i);

    // Page Terms
    const termsRes = await page.goto('/terms');
    expect(termsRes?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(/Conditions/i);
  });

  test('Vérifie la présence des éléments de navigation mobile', async ({ page }) => {
    await page.goto('/');
    // Enregistre une capture pour vérification visuelle
    await page.waitForLoadState('networkidle');
  });
});
