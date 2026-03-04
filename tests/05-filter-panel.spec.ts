import { test, expect } from '@playwright/test';
import { loadApp } from './helpers/setup';
import { STAGE_ORDER, ALL_TAGS, ALL_LANGS } from './helpers/constants';

test.describe('Filter panel', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await page.locator('#filterToggleBtn').click();
  });

  test('panel opens and closes on button click', async ({ page }) => {
    await expect(page.locator('#filterPanel')).toHaveClass(/open/);
    await page.locator('#filterToggleBtn').click();
    await expect(page.locator('#filterPanel')).not.toHaveClass(/open/);
  });

  test('13 stage chips with colored dots', async ({ page }) => {
    await expect(page.locator('#stageChips .filter-chip')).toHaveCount(STAGE_ORDER.length);
    await expect(page.locator('#stageChips .chip-dot')).toHaveCount(STAGE_ORDER.length);
  });

  test('8 topic chips', async ({ page }) => {
    await expect(page.locator('#tagChips .filter-chip')).toHaveCount(ALL_TAGS.length);
  });

  test('3 language chips with flags', async ({ page }) => {
    await expect(page.locator('#langChips .filter-chip')).toHaveCount(ALL_LANGS.length);
  });

  test('stage chip toggle: click toggles .on class and re-filters', async ({ page }) => {
    const firstChip = page.locator('#stageChips .filter-chip').first();
    await expect(firstChip).toHaveClass(/\bon\b/);

    const beforeCount = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    await firstChip.click();
    await expect(firstChip).not.toHaveClass(/\bon\b/);
    const afterCount = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    expect(afterCount).toBeLessThan(beforeCount);

    await firstChip.click();
    await expect(firstChip).toHaveClass(/\bon\b/);
  });

  test('topic chip toggle works', async ({ page }) => {
    const firstChip = page.locator('#tagChips .filter-chip').first();
    await expect(firstChip).toHaveClass(/\bon\b/);
    await firstChip.click();
    await expect(firstChip).not.toHaveClass(/\bon\b/);
  });

  test('language chip toggle works', async ({ page }) => {
    const firstChip = page.locator('#langChips .filter-chip').first();
    await expect(firstChip).toHaveClass(/\bon\b/);
    await firstChip.click();
    await expect(firstChip).not.toHaveClass(/\bon\b/);
  });

  test('filter dot appears when filter is non-default', async ({ page }) => {
    const dot = page.locator('#filterDot');
    await expect(dot).not.toHaveClass(/\bon\b/);
    await page.locator('#stageChips .filter-chip').first().click();
    await expect(dot).toHaveClass(/\bon\b/);
    await page.locator('#stageChips .filter-chip').first().click();
    await expect(dot).not.toHaveClass(/\bon\b/);
  });

  test('restore all button: hidden by default', async ({ page }) => {
    await expect(page.locator('#restoreAllBtn')).toBeHidden();
  });

  test('restore all button: visible with hidden sessions and showHidden on', async ({ page }) => {
    await page.evaluate(() => {
      const t = (window as any).__test;
      t.hiddenSessions.add(100);
      t.saveHidden();
      t.setShowHidden(true);
      t.updateHiddenCount();
    });
    await expect(page.locator('#restoreAllBtn')).toBeVisible();
  });

  test('restore all clears everything', async ({ page }) => {
    await page.evaluate(() => {
      const t = (window as any).__test;
      t.hiddenSessions.add(100);
      t.hiddenSessions.add(101);
      t.calHiddenStages.add('Gaming');
      t.setShowHidden(true);
      t.saveHidden();
      t.updateHiddenCount();
    });

    await page.evaluate(() => (window as any).restoreAll());

    const result = await page.evaluate(() => {
      const t = (window as any).__test;
      return { hidden: t.hiddenSessions.size, calHidden: t.calHiddenStages.size, showHidden: t.showHidden };
    });
    expect(result.hidden).toBe(0);
    expect(result.calHidden).toBe(0);
    expect(result.showHidden).toBe(false);
  });
});
