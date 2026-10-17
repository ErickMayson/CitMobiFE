import { Page, expect } from '@playwright/test';

/**
 * Reusable login helper using seeded credentials.
 * Defaults to system admin credentials ('admin' / 'amarelo1').
 */
export async function loginAsAdmin(page: Page, login = 'admin', password = 'amarelo1') {
  await page.goto('/login');
  await page.locator('input[name="login"]').fill(login);
  await page.locator('input[name="senha"]').fill(password);
  await page.locator('button.login-button').click();
  await expect(page).toHaveURL(/.*home/, { timeout: 10000 });
}
