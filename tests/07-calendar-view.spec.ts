import { test, expect } from '@playwright/test';
import { loadApp } from './helpers/setup';

test.describe('Calendar view', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page, { hash: 'view=calendar' });
  });

  test('grid structure: time column and stage columns', async ({ page }) => {
    await expect(page.locator('.cal-wrapper')).toBeVisible();
    await expect(page.locator('.cal-header')).toBeVisible();
    await expect(page.locator('.cal-header-corner')).toBeVisible();
    expect(await page.locator('.cal-stage-hdr').count()).toBeGreaterThan(0);
  });

  test('sticky header', async ({ page }) => {
    const position = await page.locator('.cal-header').evaluate(el => getComputedStyle(el).position);
    expect(position).toBe('sticky');
  });

  test('event blocks positioned absolutely', async ({ page }) => {
    const events = page.locator('.cal-ev');
    expect(await events.count()).toBeGreaterThan(0);
    const style = await events.first().evaluate(el => {
      const cs = getComputedStyle(el);
      return { position: cs.position, top: cs.top, left: cs.left };
    });
    expect(style.position).toBe('absolute');
    expect(parseInt(style.top)).toBeGreaterThanOrEqual(0);
  });

  test('event height proportional to duration (ppm=3)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const t = (window as any).__test;
      for (const idx of t.filteredIndices) {
        const s = t.SESSIONS[idx];
        const [start, end] = s.time.split('-');
        const duration = t.parseTime(end) - t.parseTime(start);
        if (duration === 30) {
          const el = document.querySelector(`.cal-ev[onclick="showModal(${idx})"]`) as HTMLElement;
          if (el) return { height: parseInt(el.style.height), expected: 30 * 3 - 2 };
        }
      }
      return null;
    });
    if (result) expect(result.height).toBe(result.expected);
  });

  test('event click opens modal', async ({ page }) => {
    await page.locator('.cal-ev').first().click();
    await expect(page.locator('#modalBackdrop')).toHaveClass(/open/);
  });

  test('stage header click hides stage', async ({ page }) => {
    await page.locator('.cal-stage-hdr').first().click();
    const hidden = await page.evaluate(() => (window as any).__test.calHiddenStages.size);
    expect(hidden).toBe(1);
  });

  test('star dimmed mode', async ({ page }) => {
    await page.evaluate(() => {
      const t = (window as any).__test;
      t.highlightedSessions.add(t.filteredIndices[0]);
      (window as any).toggleShowHighlightedOnly();
    });
    expect(await page.locator('.cal-ev.star-dimmed').count()).toBeGreaterThan(0);
  });

  test('drag-to-scroll: large movement suppresses click', async ({ page }) => {
    const wrapper = page.locator('.cal-wrapper');
    const box = await wrapper.boundingBox();
    if (!box) return;

    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 50, y + 50);
    await page.mouse.up();
    await expect(page.locator('#modalBackdrop')).not.toHaveClass(/open/);
  });

  test('pixel positioning: top = (startM - dayStartM) * ppm + padTop', async ({ page }) => {
    const result = await page.evaluate(() => {
      const t = (window as any).__test;
      const ppm = 3, padTop = 14;
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
        const expectedTop = (startM - minT) * ppm + padTop;
        const el = document.querySelector(`.cal-ev[onclick="showModal(${idx})"]`) as HTMLElement;
        if (el) return { actualTop: parseInt(el.style.top), expectedTop };
      }
      return null;
    });
    if (result) expect(result.actualTop).toBe(result.expectedTop);
  });
});
