import { test, expect } from '@playwright/test';

test.describe('CitMobi Authentication & Session Flow', () => {
  test('should successfully log in with seeded admin credentials and log out', async ({ page }) => {
    await page.goto('/login');

    // Fill seeded dev credentials (from AGENTS.md)
    await page.locator('input[name="login"]').fill('admin');
    await page.locator('input[name="senha"]').fill('amarelo1');
    await page.locator('button.login-button').click();

    // Verify successful redirection to dashboard /home
    await expect(page).toHaveURL(/.*home/, { timeout: 10000 });

    // Verify dashboard elements are rendered
    await expect(page.locator('.page-title')).toHaveText('Dashboard');
    await expect(page.locator('.kpi-label', { hasText: 'Motoristas Ativos' })).toBeVisible();

    // Verify sidebar shows CitMobi branding
    await expect(page.locator('.sidebar .logo-text')).toContainText('CitMobi');

    // Test Logout
    const logoutButton = page.locator('.nav-item-logout');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Should return to login page
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    await expect(page.locator('.welcome-title')).toBeVisible();
  });
});
