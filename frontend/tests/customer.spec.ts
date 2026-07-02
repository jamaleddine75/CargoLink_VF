import { test, expect } from '@playwright/test';

test.describe('Customer Journey E2E', () => {
  test('Customer can login, create an order, and view tracking', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'client@cargolink.ma');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/client\/dashboard/);

    // 2. Create Order
    await page.click('text="Nouvelle commande"');
    await expect(page).toHaveURL('/create-order');
    await page.fill('input[name="pickupLat"]', '33.5');
    await page.fill('input[name="pickupLng"]', '-7.5');
    await page.fill('input[name="deliveryLat"]', '33.6');
    await page.fill('input[name="deliveryLng"]', '-7.6');
    await page.click('button:has-text("Confirmer la commande")');

    // 3. View Tracking
    await expect(page.locator('text="Commande créée avec succès"')).toBeVisible();
    await page.click('text="Mes Commandes"');
    await expect(page.locator('table')).toBeVisible();
  });
});
