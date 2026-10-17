import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Veículos (Fleet) Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/veiculos');
    await expect(page).toHaveURL(/.*veiculos/);
  });

  test('should render vehicle management header and create button', async ({ page }) => {
    await expect(page.locator('.page-title')).toHaveText('Gerenciamento de Veículos');
    const createBtn = page.locator('button.btn-create');
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toContainText('Novo Veículo');
  });

  test('should open and close the Add Vehicle modal dialog', async ({ page }) => {
    // Open modal
    await page.locator('button.btn-create').click();

    const modal = page.locator('.modal-add-vehicle');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.modal-title')).toHaveText('Adicionar Veículo');

    // Check Placa input is visible
    const placaInput = modal.locator('input[placeholder*="ABC-1234"]');
    await expect(placaInput).toBeVisible();

    // Close modal via close button
    await modal.locator('.btn-close').click();
    await expect(modal).not.toBeVisible();
  });

  test('should toggle search box if vehicle fleet is present', async ({ page }) => {
    const searchToggle = page.locator('.btn-search-toggle');
    if (await searchToggle.isVisible()) {
      await searchToggle.click();
      const searchInput = page.locator('#search-veiculos-input');
      await expect(searchInput).toBeVisible();
      await searchInput.fill('ABC');
      await expect(searchInput).toHaveValue('ABC');
    }
  });
});
