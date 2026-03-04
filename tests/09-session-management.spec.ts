import { test, expect } from '@playwright/test';
import { loadApp } from './helpers/setup';

test.describe('Session management', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page, { hash: 'view=list' });
  });

  test('toggleHide adds/removes from hiddenSessions', async ({ page }) => {
    await page.evaluate(() => (window as any).toggleHide(100));
    expect(await page.evaluate(() => (window as any).__test.hiddenSessions.has(100))).toBe(true);
    await page.evaluate(() => (window as any).toggleHide(100));
    expect(await page.evaluate(() => (window as any).__test.hiddenSessions.has(100))).toBe(false);
  });

  test('toggleHide persists to localStorage', async ({ page }) => {
    await page.evaluate(() => (window as any).toggleHide(100));
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ta_hidden') || '[]'));
    expect(stored).toContain(100);
  });

  test('toggleHighlight adds/removes from highlightedSessions', async ({ page }) => {
    await page.evaluate(() => (window as any).toggleHighlight(100));
    expect(await page.evaluate(() => (window as any).__test.highlightedSessions.has(100))).toBe(true);
    await page.evaluate(() => (window as any).toggleHighlight(100));
    expect(await page.evaluate(() => (window as any).__test.highlightedSessions.has(100))).toBe(false);
  });

  test('toggleHighlight persists to localStorage', async ({ page }) => {
    await page.evaluate(() => (window as any).toggleHighlight(105));
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ta_highlighted') || '[]'));
    expect(stored).toContain(105);
  });

  test('toggleCalStage adds/removes and syncs with activeStages', async ({ page }) => {
    await page.evaluate(() => (window as any).toggleCalStage('Gaming'));
    let result = await page.evaluate(() => ({
      calHidden: (window as any).__test.calHiddenStages.has('Gaming'),
      active: (window as any).__test.activeStages.has('Gaming'),
    }));
    expect(result.calHidden).toBe(true);
    expect(result.active).toBe(false);

    await page.evaluate(() => (window as any).toggleCalStage('Gaming'));
    result = await page.evaluate(() => ({
      calHidden: (window as any).__test.calHiddenStages.has('Gaming'),
      active: (window as any).__test.activeStages.has('Gaming'),
    }));
    expect(result.calHidden).toBe(false);
    expect(result.active).toBe(true);
  });

  test('toggleCalStage persists to localStorage', async ({ page }) => {
    await page.evaluate(() => (window as any).toggleCalStage('Robotics'));
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ta_cal_stages') || '[]'));
    expect(stored).toContain('Robotics');
  });

  test('restoreAll clears all hidden state', async ({ page }) => {
    await page.evaluate(() => {
      const t = (window as any).__test;
      t.hiddenSessions.add(100);
      t.hiddenSessions.add(101);
      t.calHiddenStages.add('Gaming');
      t.setShowHidden(true);
      t.saveHidden();
    });
    await page.evaluate(() => (window as any).restoreAll());
    const result = await page.evaluate(() => {
      const t = (window as any).__test;
      return {
        hidden: t.hiddenSessions.size,
        calHidden: t.calHiddenStages.size,
        showHidden: t.showHidden,
        lsHidden: localStorage.getItem('ta_hidden'),
        lsCalStages: localStorage.getItem('ta_cal_stages'),
        lsShowHidden: localStorage.getItem('showHidden'),
      };
    });
    expect(result.hidden).toBe(0);
    expect(result.calHidden).toBe(0);
    expect(result.showHidden).toBe(false);
    expect(result.lsHidden).toBe('[]');
    expect(result.lsCalStages).toBe('[]');
    expect(result.lsShowHidden).toBe('false');
  });

  test('badge counts update after hide', async ({ page }) => {
    await page.evaluate(() => (window as any).toggleHide(100));
    const badge = await page.locator('#hiddenBadge').textContent();
    expect(parseInt(badge || '0')).toBeGreaterThan(0);
  });

  test('badge counts update after star', async ({ page }) => {
    await page.evaluate(() => (window as any).toggleHighlight(100));
    const badge = await page.locator('#starBadge').textContent();
    expect(parseInt(badge || '0')).toBeGreaterThan(0);
  });

  test('topbar restore button appears when viewing hidden items', async ({ page }) => {
    await expect(page.locator('#restoreAllTopBtn')).toBeHidden();
    await page.evaluate(() => (window as any).toggleHide(100));
    await page.evaluate(() => (window as any).toggleShowHidden());
    await expect(page.locator('#restoreAllTopBtn')).toBeVisible();
    await page.locator('#restoreAllTopBtn').click();
    await expect(page.locator('#restoreAllTopBtn')).toBeHidden();
  });

  test('hidden count includes stage-hidden sessions', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).toggleCalStage('Gaming');
      (window as any).__test.updateHiddenCount();
    });
    const badge = await page.locator('#hiddenBadge').textContent();
    const count = parseInt(badge || '0');
    const gamingDay4 = await page.evaluate(() => {
      const t = (window as any).__test;
      return t.SESSIONS.filter((s: any) => s.day === 4 && s.stage === 'Gaming').length;
    });
    expect(count).toBeGreaterThanOrEqual(gamingDay4);
  });
});
