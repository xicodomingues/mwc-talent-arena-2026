import { test, expect } from '@playwright/test';
import { loadApp } from './helpers/setup';

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page, { hash: 'view=list' });
  });

  test('buildSearchIndex indexes title, stage, speakers', async ({ page }) => {
    const result = await page.evaluate(() => {
      const t = (window as any).__test;
      const idx0 = t.searchIndex[0];
      const s = t.SESSIONS[0];
      return {
        hasTitle: idx0.includes(s.title.toLowerCase()),
        hasStage: idx0.includes(s.stage.toLowerCase()),
        hasSpeaker: idx0.includes(s.speakers[0].name.toLowerCase()),
      };
    });
    expect(result.hasTitle).toBe(true);
    expect(result.hasStage).toBe(true);
    expect(result.hasSpeaker).toBe(true);
  });

  test('company extraction: "at Vueling" indexes company', async ({ page }) => {
    const result = await page.evaluate(() => (window as any).__test.searchIndex[0].includes('vueling'));
    expect(result).toBe(true);
  });

  test('search for company name works', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).switchDay(); // day 3
      (document.getElementById('searchBox') as HTMLInputElement).value = 'vueling';
      (window as any).applyFilters();
    });
    expect(await page.evaluate(() => (window as any).__test.filteredIndices.length)).toBeGreaterThan(0);
  });

  test('search for speaker name works', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).switchDay(); // day 3
      (document.getElementById('searchBox') as HTMLInputElement).value = 'omar';
      (window as any).applyFilters();
    });
    const indices = await page.evaluate(() => [...(window as any).__test.filteredIndices]);
    expect(indices).toContain(0);
  });

  test('real-time filtering on input', async ({ page }) => {
    // Switch to day 3 which has "quantum" sessions
    await page.evaluate(() => (window as any).switchDay());
    await page.locator('#searchBox').fill('quantum');
    await page.waitForTimeout(100);
    const count = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(100);
  });

  test('clear button appears when text present', async ({ page }) => {
    await page.locator('#searchBox').fill('test');
    await expect(page.locator('#searchClear')).toBeVisible();
  });

  test('clear button clears input and re-filters', async ({ page }) => {
    await page.locator('#searchBox').fill('quantum');
    await page.waitForTimeout(100);
    const countBefore = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    await page.locator('#searchClear').click();
    expect(await page.locator('#searchBox').inputValue()).toBe('');
    const countAfter = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    expect(countAfter).toBeGreaterThan(countBefore);
  });

  test('partial matches work', async ({ page }) => {
    await page.evaluate(() => {
      (document.getElementById('searchBox') as HTMLInputElement).value = 'quant';
      (window as any).applyFilters();
    });
    expect(await page.evaluate(() => (window as any).__test.filteredIndices.length)).toBeGreaterThan(0);
  });
});
