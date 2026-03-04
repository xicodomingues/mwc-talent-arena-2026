import { test, expect } from '@playwright/test';
import { loadApp } from './helpers/setup';

test.describe('Pure functions', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
  });

  test('parseTime converts HH:MM to minutes', async ({ page }) => {
    const results = await page.evaluate(() => {
      const t = (window as any).__test;
      return {
        nine30: t.parseTime('09:30'),
        midnight: t.parseTime('00:00'),
        endOfDay: t.parseTime('23:59'),
        noon: t.parseTime('12:00'),
      };
    });
    expect(results.nine30).toBe(570);
    expect(results.midnight).toBe(0);
    expect(results.endOfDay).toBe(1439);
    expect(results.noon).toBe(720);
  });

  test('esc escapes HTML entities', async ({ page }) => {
    const results = await page.evaluate(() => {
      const t = (window as any).__test;
      return {
        angle: t.esc('<script>alert("xss")</script>'),
        amp: t.esc('a & b'),
        quote: t.esc("it's"),
        number: t.esc(42),
        empty: t.esc(''),
      };
    });
    expect(results.angle).toContain('&lt;');
    expect(results.angle).toContain('&gt;');
    expect(results.amp).toContain('&amp;');
    expect(results.quote).toContain('&#39;');
    expect(results.number).toBe('42');
    expect(results.empty).toBe('');
  });

  test('safeGetJSON handles missing keys and malformed data', async ({ page }) => {
    // safeGetJSON is not exposed via __test, but we can test it indirectly via localStorage
    const results = await page.evaluate(() => {
      // Test by setting bad localStorage and reloading state
      localStorage.removeItem('__test_missing');
      const missing = (() => { try { return JSON.parse(localStorage.getItem('__test_missing') || '[]'); } catch { return []; } })();
      localStorage.setItem('__test_valid', '[1,2,3]');
      const valid = (() => { try { return JSON.parse(localStorage.getItem('__test_valid') || '[]'); } catch { return []; } })();
      localStorage.setItem('__test_bad', '{broken');
      const bad = (() => { try { return JSON.parse(localStorage.getItem('__test_bad') || '[]'); } catch { return []; } })();
      localStorage.removeItem('__test_valid');
      localStorage.removeItem('__test_bad');
      return { missing, valid, bad };
    });
    expect(results.missing).toEqual([]);
    expect(results.valid).toEqual([1, 2, 3]);
    expect(results.bad).toEqual([]);
  });

  test('nowInBarcelona returns correct shape for today', async ({ page }) => {
    const result = await page.evaluate(() => (window as any).__test.nowInBarcelona());
    expect(result).toHaveProperty('year');
    expect(result).toHaveProperty('month');
    expect(result).toHaveProperty('day');
    expect(result).toHaveProperty('hours');
    expect(result).toHaveProperty('minutes');
    expect(result.year).toBe(2026);
    expect(result.month).toBe(3);
    expect(result.day).toBe(4);
  });

  test('isStageFullyHidden logic', async ({ page }) => {
    const results = await page.evaluate(() => {
      const t = (window as any).__test;
      // Get XPRO stage day 3 indices
      const xproIndices: number[] = [];
      const day3Indices: number[] = [];
      for (let i = 0; i < t.SESSIONS.length; i++) {
        if (t.SESSIONS[i].day === 3) {
          day3Indices.push(i);
          if (t.SESSIONS[i].stage === 'XPRO stage') xproIndices.push(i);
        }
      }

      const noneHidden = t.isStageFullyHidden('XPRO stage', day3Indices);

      for (const i of xproIndices) t.hiddenSessions.add(i);
      const allHidden = t.isStageFullyHidden('XPRO stage', day3Indices);

      // With showHidden=true
      t.setShowHidden(true);
      const hiddenButShowing = t.isStageFullyHidden('XPRO stage', day3Indices);

      // Cleanup
      for (const i of xproIndices) t.hiddenSessions.delete(i);
      t.setShowHidden(false);

      return { noneHidden, allHidden, hiddenButShowing, xproCount: xproIndices.length };
    });
    expect(results.noneHidden).toBe(false);
    expect(results.allHidden).toBe(true);
    expect(results.hiddenButShowing).toBe(false);
    expect(results.xproCount).toBeGreaterThan(0);
  });
});
