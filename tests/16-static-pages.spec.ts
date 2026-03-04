import { test, expect } from '@playwright/test';

test.describe('Static pages & footer', () => {
  test('footer links present: Export, Help, About', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('.site-footer');
    await expect(footer.locator('a.export-trigger')).toBeVisible();
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

  test('export trigger opens prompt instead of downloading', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(
      () => (window as any).__test && (window as any).__test.SESSIONS.length > 0,
      null,
      { timeout: 10000 }
    );
    const trigger = page.locator('a.export-trigger');
    await expect(trigger).toHaveAttribute('href', '#');
    await trigger.click();
    await expect(page.locator('#exportPrompt')).toHaveClass(/open/);
  });
});
