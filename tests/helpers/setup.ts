import { Page } from '@playwright/test';
import { LS_HIDDEN, LS_HIGHLIGHTED, LS_CAL_STAGES, LS_SHOW_HIDDEN } from './constants';

const ALL_LS_KEYS = [LS_HIDDEN, LS_HIGHLIGHTED, LS_CAL_STAGES, LS_SHOW_HIDDEN];

/**
 * Navigate to the app, optionally seed localStorage and set URL hash.
 * Waits for SESSIONS to be loaded before returning.
 */
export async function loadApp(
  page: Page,
  options?: {
    localStorage?: Record<string, string>;
    hash?: string;
  }
) {
  // Seed localStorage before navigation by visiting first
  if (options?.localStorage) {
    await page.goto('/');
    for (const [key, value] of Object.entries(options.localStorage)) {
      await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
    }
  }

  const hash = options?.hash || '';
  await page.goto('/' + (hash ? `#${hash}` : ''));
  await page.waitForFunction(
    () => (window as any).__test && (window as any).__test.SESSIONS.length > 0,
    null,
    { timeout: 10000 }
  );
}

/**
 * Clear all app localStorage keys and reload.
 */
export async function resetState(page: Page) {
  await page.evaluate((keys) => {
    for (const k of keys) localStorage.removeItem(k);
  }, ALL_LS_KEYS);
  await page.reload();
  await page.waitForFunction(
    () => (window as any).__test && (window as any).__test.SESSIONS.length > 0,
    null,
    { timeout: 10000 }
  );
}

/**
 * Snapshot all global JS state variables via __test bridge.
 */
export async function getState(page: Page) {
  return page.evaluate(() => {
    const t = (window as any).__test;
    return {
      currentView: t.currentView,
      dayFilter: t.dayFilter,
      searchQuery: t.searchQuery,
      filteredCount: t.filteredIndices.length,
      hiddenCount: t.hiddenSessions.size,
      highlightedCount: t.highlightedSessions.size,
      calHiddenStagesCount: t.calHiddenStages.size,
      showHidden: t.showHidden,
      showHighlightedOnly: t.showHighlightedOnly,
      activeStagesCount: t.activeStages.size,
      activeTagsCount: t.activeTags.size,
      activeLangsCount: t.activeLangs.size,
    };
  });
}

/**
 * Wait for the content div to have children (a view has rendered).
 */
export async function waitForRender(page: Page) {
  await page.waitForFunction(() => {
    const el = document.getElementById('content');
    return el && el.children.length > 0;
  });
}
