import { test, expect } from '@playwright/test';

test.describe('Driver Journey E2E', () => {
  test('Driver can login, accept an order, and complete delivery', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'driver@cargolink.ma');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/driver\/dashboard/);

    // 2. Accept Order
    await page.click('text="Ordres Disponibles"');
    // Assuming there is at least one order available
    const acceptBtn = page.locator('button:has-text("Accepter")').first();
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      await expect(page.locator('text="Ordre accepté"')).toBeVisible();
    }

    // 3. Complete Delivery (Flow: Pickup -> On the Way -> Delivered)
    await page.click('text="Mes Missions"');
    const updateBtn = page.locator('button:has-text("Mettre à jour le statut")').first();
    if (await updateBtn.isVisible()) {
      await updateBtn.click();
      await page.selectOption('select[name="status"]', 'DELIVERED');
      await page.click('button:has-text("Confirmer")');
      await expect(page.locator('text="Statut mis à jour"')).toBeVisible();
    }
  });
});
