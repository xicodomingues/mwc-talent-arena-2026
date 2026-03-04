import { test, expect } from '@playwright/test';
import { loadApp } from './helpers/setup';
import { DAY3_COUNT, DAY4_COUNT, TOTAL_SESSIONS, LS_HIGHLIGHTED, LS_HIDDEN } from './helpers/constants';

test.describe('ICS export prompt', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page, { hash: 'view=list' });
  });

  test('clicking export link opens prompt', async ({ page }) => {
    await page.locator('a.export-trigger').click();
    const prompt = page.locator('#exportPrompt');
    await expect(prompt).toHaveClass(/open/);
    await expect(page.locator('#exportSummary')).toContainText('sessions matching current filters');
  });

  test('prompt shows correct session counts for day 3', async ({ page }) => {
    // Default day is 3 (unless today is Mar 4+)
    await page.evaluate(() => {
      (window as any).__test.setDayFilter('3');
      (window as any).applyFilters();
    });
    await page.locator('a.export-trigger').click();
    const buttons = page.locator('#exportButtons .export-btn');
    await expect(buttons).toHaveCount(3);
    // Both days button should show total
    const bothBtn = buttons.nth(2);
    await expect(bothBtn).toContainText('Both days');
  });

  test('prompt shows 3 day buttons: Mar 3, Mar 4, Both days', async ({ page }) => {
    await page.locator('a.export-trigger').click();
    const buttons = page.locator('#exportButtons .export-btn');
    await expect(buttons.nth(0)).toContainText('Mar 3');
    await expect(buttons.nth(1)).toContainText('Mar 4');
    await expect(buttons.nth(2)).toContainText('Both days');
  });

  test('current day button is highlighted', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__test.setDayFilter('4');
      (window as any).applyFilters();
    });
    await page.locator('a.export-trigger').click();
    const mar4Btn = page.locator('#exportButtons .export-btn').nth(1);
    await expect(mar4Btn).toHaveClass(/current/);
    const mar3Btn = page.locator('#exportButtons .export-btn').nth(0);
    await expect(mar3Btn).not.toHaveClass(/current/);
  });

  test('Escape dismisses prompt', async ({ page }) => {
    await page.locator('a.export-trigger').click();
    await expect(page.locator('#exportPrompt')).toHaveClass(/open/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#exportPrompt')).not.toHaveClass(/open/);
  });

  test('clicking outside dismisses prompt', async ({ page }) => {
    await page.locator('a.export-trigger').click();
    await expect(page.locator('#exportPrompt')).toHaveClass(/open/);
    // Click on the content area (away from prompt)
    await page.locator('#content').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#exportPrompt')).not.toHaveClass(/open/);
  });

  test('clicking export link again toggles prompt closed', async ({ page }) => {
    const trigger = page.locator('a.export-trigger');
    await trigger.click();
    await expect(page.locator('#exportPrompt')).toHaveClass(/open/);
    await trigger.click();
    await expect(page.locator('#exportPrompt')).not.toHaveClass(/open/);
  });

  test('prompt shows "starred only" context when starred mode active', async ({ page }) => {
    // Star a session and enable starred-only
    await page.evaluate(() => {
      (window as any).toggleHighlight(0);
      (window as any).toggleShowHighlightedOnly();
    });
    await page.locator('a.export-trigger').click();
    await expect(page.locator('#exportSummary')).toContainText('starred only');
  });

  test('prompt shows "hidden included" when show hidden is active', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).toggleHide(0);
      (window as any).toggleShowHidden();
    });
    await page.locator('a.export-trigger').click();
    await expect(page.locator('#exportSummary')).toContainText('hidden included');
  });
});

test.describe('ICS file download', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page, { hash: 'view=list' });
  });

  test('clicking a day button triggers ICS download', async ({ page }) => {
    await page.locator('a.export-trigger').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#exportButtons .export-btn').nth(2).click(); // Both days
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('mwc-talent-arena-all.ics');
  });

  test('Mar 3 download has correct filename', async ({ page }) => {
    await page.locator('a.export-trigger').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#exportButtons .export-btn').nth(0).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('mwc-talent-arena-mar3.ics');
  });

  test('Mar 4 download has correct filename', async ({ page }) => {
    await page.locator('a.export-trigger').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#exportButtons .export-btn').nth(1).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('mwc-talent-arena-mar4.ics');
  });

  test('downloaded ICS has valid VCALENDAR structure', async ({ page }) => {
    await page.locator('a.export-trigger').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#exportButtons .export-btn').nth(0).click();
    const download = await downloadPromise;

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const content = Buffer.concat(chunks).toString('utf-8');

    expect(content).toContain('BEGIN:VCALENDAR');
    expect(content).toContain('END:VCALENDAR');
    expect(content).toContain('BEGIN:VTIMEZONE');
    expect(content).toContain('BEGIN:VEVENT');
    expect(content).toContain('DTSTART;TZID=Europe/Madrid:');
    expect(content).toContain('END:VEVENT');
  });

  test('prompt closes after download', async ({ page }) => {
    await page.locator('a.export-trigger').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#exportButtons .export-btn').nth(2).click();
    await downloadPromise;
    await expect(page.locator('#exportPrompt')).not.toHaveClass(/open/);
  });

  test('starred-only export only includes starred sessions', async ({ page }) => {
    // Star exactly 1 session on day 3
    await page.evaluate(() => {
      (window as any).toggleHighlight(0);
      (window as any).toggleShowHighlightedOnly();
    });
    await page.locator('a.export-trigger').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#exportButtons .export-btn').nth(2).click();
    const download = await downloadPromise;

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const content = Buffer.concat(chunks).toString('utf-8');

    const eventCount = (content.match(/BEGIN:VEVENT/g) || []).length;
    expect(eventCount).toBe(1);
  });
});
