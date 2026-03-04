import { test, expect } from '@playwright/test';
import { loadApp } from './helpers/setup';

test.describe('Responsive layout (mobile)', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page, { hash: 'view=list' });
  });

  test('view labels hidden (icon-only)', async ({ page }) => {
    const labels = page.locator('.view-label');
    const count = await labels.count();
    for (let i = 0; i < count; i++) {
      await expect(labels.nth(i)).toBeHidden();
    }
  });

  test('filter trigger label hidden', async ({ page }) => {
    await expect(page.locator('.filter-trigger-label')).toBeHidden();
  });

  test('search bar full width', async ({ page }) => {
    const search = page.locator('.topbar-search');
    const box = await search.boundingBox();
    const viewport = page.viewportSize();
    if (box && viewport) {
      // Should be close to viewport width (minus padding)
      expect(box.width).toBeGreaterThan(viewport.width * 0.8);
    }
  });

  test('all buttons 32px height', async ({ page }) => {
    const dayBtn = page.locator('.day-indicator');
    const height = await dayBtn.evaluate(el => getComputedStyle(el).height);
    expect(parseInt(height)).toBe(32);
  });

  test('filter panel single column', async ({ page }) => {
    await page.locator('#filterToggleBtn').click();
    const panel = page.locator('#filterPanel');
    const direction = await panel.evaluate(el => getComputedStyle(el).flexDirection);
    expect(direction).toBe('column');
  });

  test('modal slides from bottom (align-items: flex-end)', async ({ page }) => {
    await page.locator('.card').first().click();
    const backdrop = page.locator('#modalBackdrop');
    const alignItems = await backdrop.evaluate(el => getComputedStyle(el).alignItems);
    expect(alignItems).toBe('flex-end');
  });
});
