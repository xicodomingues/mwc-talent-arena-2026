import { test, expect } from '@playwright/test';
import { loadApp } from './helpers/setup';

test.describe('Stage hiding', () => {
  test('calendar stage header click hides column', async ({ page }) => {
    await loadApp(page, { hash: 'view=calendar' });
    await page.locator('.cal-stage-hdr').first().click();
    expect(await page.evaluate(() => (window as any).__test.calHiddenStages.size)).toBe(1);
  });

  test('timeline stage label click hides row', async ({ page }) => {
    await loadApp(page, { hash: 'view=timeline' });
    await page.locator('.tl-row-label').first().click();
    expect(await page.evaluate(() => (window as any).__test.calHiddenStages.size)).toBe(1);
  });

  test('timeline legend click toggles stage', async ({ page }) => {
    await loadApp(page, { hash: 'view=timeline' });
    await page.locator('.tl-legend-item').first().click();
    expect(await page.evaluate(() => (window as any).__test.calHiddenStages.size)).toBe(1);
    await page.locator('.tl-legend-item').first().click();
    expect(await page.evaluate(() => (window as any).__test.calHiddenStages.size)).toBe(0);
  });

  test('calHiddenStages persists to localStorage', async ({ page }) => {
    await loadApp(page, { hash: 'view=calendar' });
    await page.locator('.cal-stage-hdr').first().click();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('mwc_cal_hidden_stages') || '[]'));
    expect(stored.length).toBe(1);
  });

  test('auto-hide: all sessions hidden → isStageFullyHidden true', async ({ page }) => {
    await loadApp(page, { hash: 'view=calendar' });
    const result = await page.evaluate(() => {
      const t = (window as any).__test;
      const gamingIndices: number[] = [];
      for (let i = 0; i < t.SESSIONS.length; i++) {
        if (t.SESSIONS[i].day === 4 && t.SESSIONS[i].stage === 'Gaming') gamingIndices.push(i);
      }
      for (const i of gamingIndices) t.hiddenSessions.add(i);
      t.saveHidden();
      (window as any).applyFilters();
      const day4Indices = t.filteredIndices.filter((i: number) => t.SESSIONS[i].day === 4);
      return {
        count: gamingIndices.length,
        isFullyHidden: t.isStageFullyHidden('Gaming', day4Indices),
      };
    });
    expect(result.count).toBeGreaterThan(0);
    expect(result.isFullyHidden).toBe(true);
  });

  test('cross-view sync: hide stage → filter chip deactivates', async ({ page }) => {
    await loadApp(page, { hash: 'view=calendar' });
    await page.evaluate(() => (window as any).toggleCalStage('Gaming'));
    expect(await page.evaluate(() => (window as any).__test.activeStages.has('Gaming'))).toBe(false);
    await page.locator('#filterToggleBtn').click();
    await expect(page.locator('#stageChips .filter-chip').filter({ hasText: 'Gaming' })).not.toHaveClass(/\bon\b/);
  });

  test('cross-view sync: re-enable stage → chip re-activates', async ({ page }) => {
    await loadApp(page, { hash: 'view=calendar' });
    await page.evaluate(() => (window as any).toggleCalStage('Gaming'));
    await page.evaluate(() => (window as any).toggleCalStage('Gaming'));
    const result = await page.evaluate(() => ({
      calHidden: (window as any).__test.calHiddenStages.has('Gaming'),
      active: (window as any).__test.activeStages.has('Gaming'),
    }));
    expect(result.calHidden).toBe(false);
    expect(result.active).toBe(true);
  });
});
