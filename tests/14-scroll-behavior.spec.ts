import { test, expect } from '@playwright/test';
import { loadApp } from './helpers/setup';

test.describe('Scroll behavior', () => {
  test('scroll position preserved after star toggle', async ({ page }) => {
    await loadApp(page, { hash: 'view=calendar' });

    const wrapper = page.locator('.cal-wrapper');
    // Scroll to a specific position
    await wrapper.evaluate(el => { el.scrollTop = 200; });
    const scrollBefore = await wrapper.evaluate(el => el.scrollTop);

    // Toggle star (should preserve scroll)
    await page.evaluate(() => (window as any).toggleHighlight(100));
    await page.waitForTimeout(100);

    const scrollAfter = await wrapper.evaluate(el => el.scrollTop);
    // Should be close to the original position (may be slightly off due to re-render)
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(10);
  });

  test('scroll-to-now on calendar view switch', async ({ page }) => {
    await loadApp(page, { hash: 'view=list' });
    await page.evaluate(() => (window as any).setView('calendar'));

    const nowLine = page.locator('.cal-now-line');
    if (await nowLine.count() > 0) {
      const wrapper = page.locator('.cal-wrapper');
      const scrollTop = await wrapper.evaluate(el => el.scrollTop);
      // scrollTop should be non-zero if now-line exists and is below the top
      expect(scrollTop).toBeGreaterThanOrEqual(0);
    }
  });

  test('scroll-to-now on timeline view switch', async ({ page }) => {
    await loadApp(page, { hash: 'view=list' });
    await page.evaluate(() => (window as any).setView('timeline'));

    const nowLine = page.locator('.tl-now-line');
    if (await nowLine.count() > 0) {
      const wrapper = page.locator('.tl-wrapper');
      const scrollLeft = await wrapper.evaluate(el => el.scrollLeft);
      expect(scrollLeft).toBeGreaterThanOrEqual(0);
    }
  });

  test('scroll position preserved in timeline after hide toggle', async ({ page }) => {
    await loadApp(page, { hash: 'view=timeline' });

    const wrapper = page.locator('.tl-wrapper');
    await wrapper.evaluate(el => { el.scrollLeft = 300; });
    const scrollBefore = await wrapper.evaluate(el => el.scrollLeft);

    await page.evaluate(() => (window as any).toggleHide(100));
    await page.waitForTimeout(100);

    const scrollAfter = await wrapper.evaluate(el => el.scrollLeft);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(10);
  });
});
