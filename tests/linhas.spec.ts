import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Linhas (Routes) Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/linhas');
    await expect(page).toHaveURL(/.*linhas/);
  });

  test('should render the lines management header and create button', async ({ page }) => {
    await expect(page.locator('.page-title')).toHaveText('Gerenciamento de Linhas');
    const createBtn = page.locator('button.btn-create');
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toContainText('Nova Linha');
  });

  test('should toggle the search input and allow text entry', async ({ page }) => {
    // Wait for lines to finish loading
    await expect(page.locator('.section-title').first()).toBeVisible();

    const searchToggleBtn = page.locator('.btn-search-toggle').first();
    await expect(searchToggleBtn).toBeVisible();

    // Open search
    await searchToggleBtn.click();
    const searchInput = page.locator('.search-input').first();
    await expect(searchInput).toBeVisible();

    // Type a query
    await searchInput.fill('1178');
    await expect(searchInput).toHaveValue('1178');

    // Clear search button should appear and function
    const clearBtn = page.locator('.btn-clear-search').first();
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(searchInput).toHaveValue('');
  });

  test('should open the "Nova Linha" wizard and return back to list', async ({ page }) => {
    // Click Nova Linha
    await page.locator('button.btn-create').click();

    // Verify wizard view
    await expect(page.locator('.edit-title')).toHaveText('Nova Linha');
    await expect(page.locator('.wizard-card-title')).toContainText('Informações Gerais');
    await expect(page.locator('button.btn-wizard-next')).toBeVisible();

    // Click Voltar
    await page.locator('button.btn-back').click();

    // Verify returned to list view
    await expect(page.locator('.page-title')).toHaveText('Gerenciamento de Linhas');
  });
});
