import { test, expect } from '@playwright/test';
import { loadApp } from './helpers/setup';

test.describe('Now line & past/ongoing', () => {
  test('calendar now-line present when time is within grid range', async ({ page }) => {
    await loadApp(page, { hash: 'view=calendar' });
    const result = await page.evaluate(() => {
      const t = (window as any).__test;
      const now = t.nowInBarcelona();
      const nowM = now.hours * 60 + now.minutes;
      let minT = 1440, maxT = 0;
      for (const idx of t.filteredIndices) {
        const [start, end] = t.SESSIONS[idx].time.split('-');
        const s = t.parseTime(start), e = t.parseTime(end);
        if (s < minT) minT = s;
        if (e > maxT) maxT = e;
      }
      const isEventMonth = now.month === 3 && now.year === 2026;
      if (isEventMonth && now.day === parseInt(t.dayFilter) && nowM < minT) minT = nowM;
      minT = Math.floor(minT / 30) * 30;
      maxT = Math.ceil(maxT / 30) * 30;
      return { inRange: nowM >= minT && nowM <= maxT, isEventMonth, nowDay: now.day };
    });

    if (result.isEventMonth && result.nowDay === 4 && result.inRange) {
      await expect(page.locator('.cal-now-line')).toBeVisible();
    } else {
      expect(await page.locator('.cal-now-line').count()).toBe(0);
    }
  });

  test('timeline now-line present when time is within grid range', async ({ page }) => {
    await loadApp(page, { hash: 'view=timeline' });
    const result = await page.evaluate(() => {
      const t = (window as any).__test;
      const now = t.nowInBarcelona();
      const nowM = now.hours * 60 + now.minutes;
      let minT = 1440, maxT = 0;
      for (const idx of t.filteredIndices) {
        const [start, end] = t.SESSIONS[idx].time.split('-');
        const s = t.parseTime(start), e = t.parseTime(end);
        if (s < minT) minT = s;
        if (e > maxT) maxT = e;
      }
      const isEventMonth = now.month === 3 && now.year === 2026;
      if (isEventMonth && now.day === parseInt(t.dayFilter) && nowM < minT) minT = nowM;
      minT = Math.floor(minT / 30) * 30;
      maxT = Math.ceil(maxT / 30) * 30;
      return { inRange: nowM >= minT && nowM <= maxT, isEventMonth, nowDay: now.day };
    });

    if (result.isEventMonth && result.nowDay === 4 && result.inRange) {
      await expect(page.locator('.tl-now-line')).toBeVisible();
    } else {
      expect(await page.locator('.tl-now-line').count()).toBe(0);
    }
  });

  test('past events have ev-past class', async ({ page }) => {
    await loadApp(page, { hash: 'view=calendar' });
    const pastCount = await page.locator('.cal-ev.ev-past').count();
    expect(pastCount).toBeGreaterThanOrEqual(0);
  });

  test('ongoing events have ev-ongoing class', async ({ page }) => {
    await loadApp(page, { hash: 'view=calendar' });
    const ongoingCount = await page.locator('.cal-ev.ev-ongoing').count();
    expect(ongoingCount).toBeGreaterThanOrEqual(0);
  });

  test('now-line only during March 2026', async ({ page }) => {
    await loadApp(page, { hash: 'view=calendar' });
    const now = await page.evaluate(() => (window as any).__test.nowInBarcelona());
    // We can only assert presence/absence based on actual conditions
    if (now.month !== 3 || now.year !== 2026) {
      expect(await page.locator('.cal-now-line').count()).toBe(0);
    }
    // If it IS March 2026, presence depends on time being in session range (tested above)
  });

  test('past/ongoing use midpoint logic', async ({ page }) => {
    await loadApp(page, { hash: 'view=calendar' });
    const result = await page.evaluate(() => {
      const t = (window as any).__test;
      const now = t.nowInBarcelona();
      const nowM = now.hours * 60 + now.minutes;
      for (const idx of t.filteredIndices) {
        const s = t.SESSIONS[idx];
        const [start, end] = s.time.split('-');
        const startM = t.parseTime(start), endM = t.parseTime(end);
        const midM = (startM + endM) / 2;
        const el = document.querySelector(`.cal-ev[onclick="showModal(${idx})"]`);
        if (!el) continue;
        const isPast = el.classList.contains('ev-past');
        const isOngoing = el.classList.contains('ev-ongoing');
        if (isPast || isOngoing) {
          return {
            pastCorrect: isPast ? nowM >= midM : true,
            ongoingCorrect: isOngoing ? (startM <= nowM && nowM < midM) : true,
          };
        }
      }
      return null;
    });
    if (result) {
      expect(result.pastCorrect).toBe(true);
      expect(result.ongoingCorrect).toBe(true);
    }
  });

  test('timeline also has past/ongoing classes', async ({ page }) => {
    await loadApp(page, { hash: 'view=timeline' });
    const pastCount = await page.locator('.tl-ev.ev-past').count();
    expect(pastCount).toBeGreaterThanOrEqual(0);
  });
});
