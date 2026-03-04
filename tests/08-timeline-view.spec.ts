import { test, expect } from '@playwright/test';
import { loadApp } from './helpers/setup';
import { STAGE_ORDER } from './helpers/constants';

test.describe('Timeline view', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page, { hash: 'view=timeline' });
  });

  test('stage row labels with colored dots', async ({ page }) => {
    const labels = page.locator('.tl-row-label');
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);
    expect(await page.locator('.tl-label-dot').count()).toBe(count);
  });

  test('stage label width is 110px', async ({ page }) => {
    const width = await page.locator('.tl-row-label').first().evaluate(el => el.style.width);
    expect(width).toContain('110');
  });

  test('event blocks positioned absolutely', async ({ page }) => {
    expect(await page.locator('.tl-ev').count()).toBeGreaterThan(0);
    const pos = await page.locator('.tl-ev').first().evaluate(el => getComputedStyle(el).position);
    expect(pos).toBe('absolute');
  });

  test('event width proportional to duration (ppm=5)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const t = (window as any).__test;
      for (const idx of t.filteredIndices) {
        const s = t.SESSIONS[idx];
        const [start, end] = s.time.split('-');
        const duration = t.parseTime(end) - t.parseTime(start);
        if (duration === 30) {
          const el = document.querySelector(`.tl-ev[onclick="showModal(${idx})"]`) as HTMLElement;
          if (el) return { width: parseInt(el.style.width), expected: Math.max(30 * 5 - 4, 20) };
        }
      }
      return null;
    });
    if (result) expect(result.width).toBe(result.expected);
  });

  test('event click opens modal', async ({ page }) => {
    await page.locator('.tl-ev').first().click();
    await expect(page.locator('#modalBackdrop')).toHaveClass(/open/);
  });

  test('stage label click hides stage row', async ({ page }) => {
    await page.locator('.tl-row-label').first().click();
    expect(await page.evaluate(() => (window as any).__test.calHiddenStages.size)).toBe(1);
  });

  test('legend lists all stages for the day', async ({ page }) => {
    expect(await page.locator('.tl-legend-item').count()).toBeGreaterThan(0);
  });

  test('legend order matches STAGE_ORDER', async ({ page }) => {
    const legendTexts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.tl-legend-item')).map(el => el.textContent?.trim() || '')
    );
    const presentStages = STAGE_ORDER.filter(s => legendTexts.includes(s));
    const legendFiltered = legendTexts.filter(t => STAGE_ORDER.includes(t));
    expect(legendFiltered).toEqual(presentStages);
  });

  test('legend click toggles stage visibility', async ({ page }) => {
    const firstLegend = page.locator('.tl-legend-item').first();
    const stageName = (await firstLegend.textContent())?.trim();
    await firstLegend.click();
    expect(await page.evaluate((name) => (window as any).__test.calHiddenStages.has(name), stageName)).toBe(true);
    await expect(page.locator('.tl-legend-hidden').first()).toBeVisible();
  });

  test('hidden legend items stay in place with strikethrough', async ({ page }) => {
    const beforeTexts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.tl-legend-item')).map(el => el.textContent?.trim())
    );
    await page.locator('.tl-legend-item').first().click();
    const afterTexts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.tl-legend-item')).map(el => el.textContent?.trim())
    );
    expect(afterTexts).toEqual(beforeTexts);
  });

  test('alternating row backgrounds', async ({ page }) => {
    const rows = page.locator('.tl-row');
    if (await rows.count() >= 2) {
      const bg0 = await rows.nth(0).evaluate(el => el.style.background);
      const bg1 = await rows.nth(1).evaluate(el => el.style.background);
      expect(bg0).not.toBe(bg1);
    }
  });

  test('timeline positioning: left = padLeft + (startM - tlStart) * ppm', async ({ page }) => {
    const result = await page.evaluate(() => {
      const t = (window as any).__test;
      const ppm = 5, padLeft = 10;
      let minT = 1440;
      for (const idx of t.filteredIndices) {
        const [start] = t.SESSIONS[idx].time.split('-');
        const s = t.parseTime(start);
        if (s < minT) minT = s;
      }
      const now = t.nowInBarcelona();
      const nowM = now.hours * 60 + now.minutes;
      if (now.month === 3 && now.year === 2026 && now.day === parseInt(t.dayFilter) && nowM < minT) minT = nowM;
      minT = Math.floor(minT / 30) * 30;
      for (const idx of t.filteredIndices) {
        const [start] = t.SESSIONS[idx].time.split('-');
        const startM = t.parseTime(start);
        const expectedLeft = padLeft + (startM - minT) * ppm;
        const el = document.querySelector(`.tl-ev[onclick="showModal(${idx})"]`) as HTMLElement;
        if (el) return { actualLeft: parseInt(el.style.left), expectedLeft };
      }
      return null;
    });
    if (result) expect(result.actualLeft).toBe(result.expectedLeft);
  });
});
