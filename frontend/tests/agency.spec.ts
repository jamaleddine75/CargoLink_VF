import { test, expect } from '@playwright/test';

test.describe('Agency Journey E2E', () => {
  test('Agency can login, view orders, and monitor tracking', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'agency@cargolink.ma');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/agency-dashboard');

    // 2. View Orders
    await page.click('text="Gestion des Commandes"');
    await expect(page.locator('table')).toBeVisible();

    // 3. Monitor Tracking
    const viewBtn = page.locator('button[title="Voir détails"]').first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await expect(page.locator('text="Historique de Suivi"')).toBeVisible();
    }
  });
});
