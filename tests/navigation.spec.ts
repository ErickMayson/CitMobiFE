import { test, expect } from '@playwright/test';

test.describe('CitMobi Sidebar Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate prior to navigation tests
    await page.goto('/login');
    await page.locator('input[name="login"]').fill('admin');
    await page.locator('input[name="senha"]').fill('amarelo1');
    await page.locator('button.login-button').click();
    await expect(page).toHaveURL(/.*home/, { timeout: 10000 });
  });

  test('should navigate between all primary modules using sidebar', async ({ page }) => {
    // Navigate to Linhas
    await page.locator('.nav-item', { hasText: 'Linhas' }).click();
    await expect(page).toHaveURL(/.*linhas/, { timeout: 5000 });

    // Navigate to Veículos
    await page.locator('.nav-item', { hasText: 'Veículos' }).click();
    await expect(page).toHaveURL(/.*veiculos/, { timeout: 5000 });

    // Navigate to Motoristas
    await page.locator('.nav-item', { hasText: 'Motoristas' }).click();
    await expect(page).toHaveURL(/.*motoristas/, { timeout: 5000 });

    // Return to Menu Inicial (Home)
    await page.locator('.nav-item', { hasText: 'Menu Inicial' }).click();
    await expect(page).toHaveURL(/.*home/, { timeout: 5000 });
    await expect(page.locator('.page-title')).toHaveText('Dashboard');
  });
});
