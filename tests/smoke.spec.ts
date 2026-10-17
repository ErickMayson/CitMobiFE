import { test, expect } from '@playwright/test';

test.describe('CitMobi Smoke & Security Tests', () => {
  test('should load the login page with all required elements', async ({ page }) => {
    await page.goto('/');

    // Check page title and welcome header
    await expect(page.locator('.welcome-title')).toContainText('Bem-vindo');
    await expect(page.locator('.tagline')).toContainText('Simplifique seu');

    // Check login form inputs
    const loginInput = page.locator('input[name="login"]');
    const passwordInput = page.locator('input[name="senha"]');
    const submitButton = page.locator('button.login-button');

    await expect(loginInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveText('Entrar');
  });

  test('should redirect unauthenticated users from protected routes to login', async ({ page }) => {
    // Attempt to access protected dashboard directly without logging in
    await page.goto('/home');
    await expect(page).toHaveURL(/.*login/);

    // Attempt to access protected Linhas directly
    await page.goto('/linhas');
    await expect(page).toHaveURL(/.*login/);

    // Attempt to access protected Veículos directly
    await page.goto('/veiculos');
    await expect(page).toHaveURL(/.*login/);

    // Attempt to access protected Motoristas directly
    await page.goto('/motoristas');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should display error message on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[name="login"]').fill('usuario_invalido_teste');
    await page.locator('input[name="senha"]').fill('senha_errada_123');
    await page.locator('button.login-button').click();

    // The login screen should display the error banner
    const errorBanner = page.locator('.error-banner');
    await expect(errorBanner).toBeVisible({ timeout: 5000 });
  });
});
