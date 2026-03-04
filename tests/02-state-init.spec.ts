import { test, expect } from '@playwright/test';
import { loadApp, getState } from './helpers/setup';
import { TOTAL_SESSIONS, STAGE_ORDER, ALL_TAGS, ALL_LANGS, LS_HIDDEN, LS_HIGHLIGHTED, LS_CAL_STAGES } from './helpers/constants';

test.describe('State initialization', () => {
  test('default day is 4 (today is March 4)', async ({ page }) => {
    await loadApp(page);
    const state = await getState(page);
    expect(state.dayFilter).toBe('4');
  });

  test('default view is timeline on desktop', async ({ page }) => {
    await loadApp(page);
    const state = await getState(page);
    expect(state.currentView).toBe('timeline');
  });

  test('URL hash overrides default view', async ({ page }) => {
    await loadApp(page, { hash: 'view=list' });
    const state = await getState(page);
    expect(state.currentView).toBe('list');
  });

  test('URL hash overrides default view to calendar', async ({ page }) => {
    await loadApp(page, { hash: 'view=calendar' });
    const state = await getState(page);
    expect(state.currentView).toBe('calendar');
  });

  test('all filters default to full sets', async ({ page }) => {
    await loadApp(page);
    const state = await getState(page);
    expect(state.activeStagesCount).toBe(STAGE_ORDER.length);
    expect(state.activeTagsCount).toBe(ALL_TAGS.length);
    expect(state.activeLangsCount).toBe(ALL_LANGS.length);
  });

  test('updateHash uses replaceState (no history entries)', async ({ page }) => {
    await loadApp(page, { hash: 'view=timeline' });
    const historyBefore = await page.evaluate(() => history.length);
    await page.evaluate(() => (window as any).setView('list'));
    const historyAfter = await page.evaluate(() => history.length);
    expect(historyAfter).toBe(historyBefore);
  });

  test('localStorage restores hidden sessions', async ({ page }) => {
    await loadApp(page, { localStorage: { [LS_HIDDEN]: '[0,1,2]' } });
    const count = await page.evaluate(() => (window as any).__test.hiddenSessions.size);
    expect(count).toBe(3);
  });

  test('localStorage restores highlighted sessions', async ({ page }) => {
    await loadApp(page, { localStorage: { [LS_HIGHLIGHTED]: '[5,10]' } });
    const count = await page.evaluate(() => (window as any).__test.highlightedSessions.size);
    expect(count).toBe(2);
  });

  test('localStorage restores calHiddenStages and syncs activeStages', async ({ page }) => {
    await loadApp(page, { localStorage: { [LS_CAL_STAGES]: '["Gaming","Robotics"]' } });
    const result = await page.evaluate(() => {
      const t = (window as any).__test;
      return {
        calHidden: [...t.calHiddenStages],
        gamingActive: t.activeStages.has('Gaming'),
        roboticsActive: t.activeStages.has('Robotics'),
      };
    });
    expect(result.calHidden).toContain('Gaming');
    expect(result.calHidden).toContain('Robotics');
    expect(result.gamingActive).toBe(false);
    expect(result.roboticsActive).toBe(false);
  });

  test('malformed localStorage does not crash app', async ({ page }) => {
    await loadApp(page, {
      localStorage: {
        [LS_HIDDEN]: '{not valid json',
        [LS_HIGHLIGHTED]: 'null',
        [LS_CAL_STAGES]: '42',
      },
    });
    const state = await getState(page);
    expect(state.filteredCount).toBeGreaterThan(0);
  });

  test('sessions are loaded', async ({ page }) => {
    await loadApp(page);
    const count = await page.evaluate(() => (window as any).__test.SESSIONS.length);
    expect(count).toBe(TOTAL_SESSIONS);
  });
});
