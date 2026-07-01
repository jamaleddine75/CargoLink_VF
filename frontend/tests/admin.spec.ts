import { test, expect } from '@playwright/test';

test.describe('Admin Journey E2E', () => {
  test('Admin can login, view dashboard, and verify financials', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@cargolink.ma');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin-dashboard');

    // 2. Verify Dashboard Widgets
    await expect(page.locator('text="Revenu Total"')).toBeVisible();
    await expect(page.locator('text="Commandes Actives"')).toBeVisible();

    // 3. Verify Financials
    await page.click('text="Transactions"');
    await expect(page.locator('table')).toBeVisible();

    // 4. Verify Wallets
    await page.click('text="Portefeuilles"');
    await expect(page.locator('text="Solde Total"')).toBeVisible();
  });
});
