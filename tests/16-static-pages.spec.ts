import { test, expect } from '@playwright/test';

test.describe('Static pages & footer', () => {
  test('footer links present: ICS, Help, About', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('.site-footer');
    await expect(footer.locator('a[href="mwc_talent_arena_full.ics"]')).toBeVisible();
    await expect(footer.locator('a[href="help.html"]')).toBeVisible();
    await expect(footer.locator('a[href="about.html"]')).toBeVisible();
  });

  test('help.html loads independently', async ({ page }) => {
    const response = await page.goto('/help.html');
    expect(response?.status()).toBe(200);
    // Should have some content (self-contained CSS)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('about.html loads independently', async ({ page }) => {
    const response = await page.goto('/about.html');
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('ICS file link has download attribute', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('a[href="mwc_talent_arena_full.ics"]');
    await expect(link).toHaveAttribute('download', '');
  });
});
