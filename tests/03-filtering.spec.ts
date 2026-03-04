import { test, expect } from '@playwright/test';
import { loadApp, getState } from './helpers/setup';
import { DAY3_COUNT, DAY4_COUNT, EMPTY_LANG_SESSION_IDX, NO_TAGS_SESSION_IDX } from './helpers/constants';

test.describe('Filtering pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page, { hash: 'view=list' });
  });

  test('day filter: day 4 shows only day 4 sessions', async ({ page }) => {
    const state = await getState(page);
    expect(state.dayFilter).toBe('4');
    expect(state.filteredCount).toBe(DAY4_COUNT);
  });

  test('day filter: switching to day 3 shows day 3 sessions', async ({ page }) => {
    await page.evaluate(() => (window as any).switchDay());
    const count = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    expect(count).toBe(DAY3_COUNT);
  });

  test('hidden filter: hidden sessions excluded when showHidden=false', async ({ page }) => {
    await page.evaluate(() => {
      const t = (window as any).__test;
      t.hiddenSessions.add(100);
      t.hiddenSessions.add(101);
      t.hiddenSessions.add(102);
      t.saveHidden();
      (window as any).applyFilters();
    });
    const count = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    expect(count).toBe(DAY4_COUNT - 3);
  });

  test('hidden filter: hidden sessions included when showHidden=true', async ({ page }) => {
    await page.evaluate(() => {
      const t = (window as any).__test;
      t.hiddenSessions.add(100);
      t.hiddenSessions.add(101);
      t.setShowHidden(true);
      (window as any).applyFilters();
    });
    const count = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    expect(count).toBe(DAY4_COUNT);
  });

  test('starred filter: list view hard-filters to starred only', async ({ page }) => {
    await page.evaluate(() => {
      const t = (window as any).__test;
      t.highlightedSessions.add(100);
      t.highlightedSessions.add(105);
      (window as any).toggleShowHighlightedOnly();
    });
    const count = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    expect(count).toBe(2);
  });

  test('starred filter: calendar keeps all in filteredIndices', async ({ page }) => {
    await page.evaluate(() => {
      const t = (window as any).__test;
      t.highlightedSessions.add(100);
      (window as any).setView('calendar');
      (window as any).toggleShowHighlightedOnly();
    });
    const count = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    expect(count).toBe(DAY4_COUNT);
  });

  test('language filter: deactivating English removes English sessions', async ({ page }) => {
    const before = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    await page.evaluate(() => (window as any).toggleLang('English'));
    const after = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    expect(after).toBeLessThan(before);
  });

  test('language filter: sessions with empty lang always pass', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).switchDay(); // to day 3
      // Deactivate all languages
      (window as any).toggleLang('English');
      (window as any).toggleLang('Spanish');
      (window as any).toggleLang('Catalan');
    });
    const indices: number[] = await page.evaluate(() => [...(window as any).__test.filteredIndices]);
    expect(indices).toContain(EMPTY_LANG_SESSION_IDX);
  });

  test('stage filter: deactivating a stage removes its sessions', async ({ page }) => {
    const before = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    await page.evaluate(() => (window as any).toggleStage('XPRO stage'));
    const after = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    expect(after).toBeLessThan(before);
  });

  test('tag filter: deactivating all tags keeps only tagless sessions', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).switchDay(); // to day 3
      const t = (window as any).__test;
      for (const tag of t.ALL_TAGS) (window as any).toggleTag(tag);
    });
    const allNoTags = await page.evaluate(() => {
      const t = (window as any).__test;
      return t.filteredIndices.every((i: number) => !t.SESSIONS[i].tags.length);
    });
    expect(allNoTags).toBe(true);
  });

  test('tag filter: sessions with no tags always pass', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).switchDay(); // day 3
      // Keep only one tag active (toggle all off then one on)
      const t = (window as any).__test;
      for (const tag of t.ALL_TAGS) (window as any).toggleTag(tag);
      (window as any).toggleTag('Artificial Intelligence');
    });
    const indices: number[] = await page.evaluate(() => [...(window as any).__test.filteredIndices]);
    expect(indices).toContain(NO_TAGS_SESSION_IDX);
  });

  test('search filter: case-insensitive match', async ({ page }) => {
    // Switch to day 3 which has "quantum" sessions
    await page.evaluate(() => {
      (window as any).switchDay();
      (document.getElementById('searchBox') as HTMLInputElement).value = 'quantum';
      (window as any).applyFilters();
    });
    const count = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    expect(count).toBeGreaterThan(0);
  });

  test('search filter: empty search shows all', async ({ page }) => {
    await page.evaluate(() => {
      (document.getElementById('searchBox') as HTMLInputElement).value = '';
      (window as any).applyFilters();
    });
    const count = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    expect(count).toBe(DAY4_COUNT);
  });

  test('search filter: no match shows empty state', async ({ page }) => {
    await page.evaluate(() => {
      (document.getElementById('searchBox') as HTMLInputElement).value = 'zzzznonexistentzzzz';
      (window as any).applyFilters();
    });
    const count = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    expect(count).toBe(0);
    await expect(page.locator('#content p')).toContainText('No sessions match');
  });

  test('combined filters: multiple active simultaneously', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).toggleStage('XPRO stage');
      (window as any).toggleStage('Gaming');
      (document.getElementById('searchBox') as HTMLInputElement).value = 'ai';
      (window as any).applyFilters();
    });
    const count1 = await page.evaluate(() => (window as any).__test.filteredIndices.length);

    await page.evaluate(() => {
      (document.getElementById('searchBox') as HTMLInputElement).value = '';
      (window as any).applyFilters();
    });
    const count2 = await page.evaluate(() => (window as any).__test.filteredIndices.length);
    expect(count2).toBeGreaterThanOrEqual(count1);
  });
});
