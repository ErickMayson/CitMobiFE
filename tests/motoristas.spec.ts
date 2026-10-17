import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Motoristas (Drivers) Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/motoristas');
    await expect(page).toHaveURL(/.*motoristas/);
  });

  test('should render driver management header and create button', async ({ page }) => {
    await expect(page.locator('.page-title')).toHaveText('Gerenciamento de Motoristas');
    const createBtn = page.locator('button.btn-create');
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toContainText('Novo Motorista');
  });

  test('should open and close the Add Driver modal', async ({ page }) => {
    // Click Novo Motorista
    await page.locator('button.btn-create').click();

    // Verify modal appears
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Adicionar Motorista');

    // Verify name and CPF fields are visible
    const nameInput = modal.locator('input[placeholder*="Carlos Eduardo"]');
    await expect(nameInput).toBeVisible();

    // Close via Cancel button
    const cancelBtn = modal.locator('button.btn-secondary', { hasText: 'Cancelar' });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    await expect(modal).not.toBeVisible();
  });

  test('should toggle search box if driver list is present', async ({ page }) => {
    const searchToggle = page.locator('.btn-search-toggle');
    if (await searchToggle.isVisible()) {
      await searchToggle.click();
      const searchInput = page.locator('#search-motoristas-input');
      await expect(searchInput).toBeVisible();
      await searchInput.fill('Silva');
      await expect(searchInput).toHaveValue('Silva');
    }
  });
});
