import { test, expect } from '@playwright/test';
import { loadApp, getState } from './helpers/setup';
import { LS_HIGHLIGHTED, LS_HIDDEN } from './helpers/constants';

test.describe('Top bar', () => {
  test('day indicator shows Mar 4 by default', async ({ page }) => {
    await loadApp(page);
    await expect(page.locator('#dayIndicatorText')).toHaveText('Mar 4');
  });

  test('day indicator click toggles to Mar 3', async ({ page }) => {
    await loadApp(page);
    await page.locator('#dayIndicator').click();
    await expect(page.locator('#dayIndicatorText')).toHaveText('Mar 3');
  });

  test('day indicator double-click returns to Mar 4', async ({ page }) => {
    await loadApp(page);
    await page.locator('#dayIndicator').click();
    await page.locator('#dayIndicator').click();
    await expect(page.locator('#dayIndicatorText')).toHaveText('Mar 4');
  });

  test('view switcher: clicking each button switches view', async ({ page }) => {
    await loadApp(page);
    await page.locator('button[data-view="list"]').click();
    expect((await getState(page)).currentView).toBe('list');

    await page.locator('button[data-view="calendar"]').click();
    expect((await getState(page)).currentView).toBe('calendar');

    await page.locator('button[data-view="timeline"]').click();
    expect((await getState(page)).currentView).toBe('timeline');
  });

  test('view switcher: active button has active class', async ({ page }) => {
    await loadApp(page, { hash: 'view=list' });
    await expect(page.locator('button[data-view="list"]')).toHaveClass(/active/);
    await expect(page.locator('button[data-view="calendar"]')).not.toHaveClass(/active/);
  });

  test('star button: badge count per day', async ({ page }) => {
    await loadApp(page, { localStorage: { [LS_HIGHLIGHTED]: '[0,100,105]' } });
    // Day 4 (default) should show 2
    await expect(page.locator('#starBadge')).toHaveText('2');

    await page.locator('#dayIndicator').click(); // day 3
    await expect(page.locator('#starBadge')).toHaveText('1');
  });

  test('star button: active-star class when toggled', async ({ page }) => {
    await loadApp(page, { localStorage: { [LS_HIGHLIGHTED]: '[100]' } });
    await page.locator('#showHighlightedBtn').click();
    await expect(page.locator('#showHighlightedBtn')).toHaveClass(/active-star/);
  });

  test('hidden button: badge count per day', async ({ page }) => {
    await loadApp(page, { localStorage: { [LS_HIDDEN]: '[0,100,105]' } });
    await expect(page.locator('#hiddenBadge')).toHaveText('2');

    await page.locator('#dayIndicator').click(); // day 3
    await expect(page.locator('#hiddenBadge')).toHaveText('1');
  });

  test('hidden button: active-hidden class when toggled', async ({ page }) => {
    await loadApp(page, { localStorage: { [LS_HIDDEN]: '[100]' } });
    await page.locator('#showHiddenBtn').click();
    await expect(page.locator('#showHiddenBtn')).toHaveClass(/active-hidden/);
  });

  test('filter button: toggles panel open/close', async ({ page }) => {
    await loadApp(page);
    await expect(page.locator('#filterPanel')).not.toHaveClass(/open/);
    await page.locator('#filterToggleBtn').click();
    await expect(page.locator('#filterPanel')).toHaveClass(/open/);
    await page.locator('#filterToggleBtn').click();
    await expect(page.locator('#filterPanel')).not.toHaveClass(/open/);
  });

  test('filter button: active class when panel open', async ({ page }) => {
    await loadApp(page);
    await page.locator('#filterToggleBtn').click();
    await expect(page.locator('#filterToggleBtn')).toHaveClass(/active/);
  });

  test('filter dot: appears when filter is non-default', async ({ page }) => {
    await loadApp(page);
    await expect(page.locator('#filterDot')).not.toHaveClass(/\bon\b/);
    await page.evaluate(() => {
      const t = (window as any).__test;
      t.activeStages.delete('Gaming');
      t.updateFilterDot();
    });
    await expect(page.locator('#filterDot')).toHaveClass(/\bon\b/);
  });
});
