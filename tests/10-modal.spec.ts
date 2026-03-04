import { test, expect } from '@playwright/test';
import { loadApp } from './helpers/setup';

test.describe('Modal', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page, { hash: 'view=list' });
  });

  test('showModal renders stage badge, title, time', async ({ page }) => {
    await page.locator('.card').first().click();
    const modal = page.locator('#modalBody');
    await expect(modal.locator('.modal-stage')).toBeVisible();
    await expect(modal.locator('.modal-title')).toBeVisible();
    await expect(modal.locator('.modal-time')).toBeVisible();
  });

  test('modal shows description and tags', async ({ page }) => {
    const idx = await page.evaluate(() => {
      const t = (window as any).__test;
      for (const i of t.filteredIndices) {
        if (t.SESSIONS[i].description && t.SESSIONS[i].tags.length) return i;
      }
      return t.filteredIndices[0];
    });
    await page.evaluate((i) => (window as any).showModal(i), idx);
    await expect(page.locator('#modalBody .modal-desc')).toBeVisible();
    await expect(page.locator('#modalBody .modal-meta')).toBeVisible();
  });

  test('action buttons: star/hide in top-right', async ({ page }) => {
    await page.locator('.card').first().click();
    await expect(page.locator('#modalStarBtn')).toBeVisible();
    await expect(page.locator('#modalHideBtn')).toBeVisible();
  });

  test('star button reflects off state by default', async ({ page }) => {
    await page.locator('.card').first().click();
    await expect(page.locator('#modalStarBtn')).not.toHaveClass(/\bon\b/);
  });

  test('star button reflects on state when starred', async ({ page }) => {
    const idx = await page.evaluate(() => (window as any).__test.filteredIndices[0]);
    await page.evaluate((i) => (window as any).__test.highlightedSessions.add(i), idx);
    await page.evaluate((i) => (window as any).showModal(i), idx);
    await expect(page.locator('#modalStarBtn')).toHaveClass(/\bon\b/);
  });

  test('star button click: toggles, closes modal, shows toast', async ({ page }) => {
    await page.locator('.card').first().click();
    await page.locator('#modalStarBtn').click();
    await expect(page.locator('#modalBackdrop')).not.toHaveClass(/open/);
    await expect(page.locator('#toast')).toHaveClass(/show/);
    await expect(page.locator('#toast')).toContainText('starred');
  });

  test('hide button click: toggles, closes modal, shows toast', async ({ page }) => {
    await page.locator('.card').first().click();
    await page.locator('#modalHideBtn').click();
    await expect(page.locator('#modalBackdrop')).not.toHaveClass(/open/);
    await expect(page.locator('#toast')).toHaveClass(/show/);
    await expect(page.locator('#toast')).toContainText('hidden');
  });

  test('close via X button', async ({ page }) => {
    await page.locator('.card').first().click();
    await page.locator('.modal-x').click();
    await expect(page.locator('#modalBackdrop')).not.toHaveClass(/open/);
  });

  test('close via backdrop click', async ({ page }) => {
    await page.locator('.card').first().click();
    await page.locator('#modalBackdrop').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#modalBackdrop')).not.toHaveClass(/open/);
  });

  test('close via Escape key', async ({ page }) => {
    await page.locator('.card').first().click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#modalBackdrop')).not.toHaveClass(/open/);
  });

  test('toast: correct text for star/unstar', async ({ page }) => {
    const idx = await page.evaluate(() => (window as any).__test.filteredIndices[0]);
    await page.evaluate((i) => (window as any).showModal(i), idx);
    await page.locator('#modalStarBtn').click();
    await expect(page.locator('#toast')).toContainText('Session starred');

    await page.evaluate((i) => (window as any).showModal(i), idx);
    await page.locator('#modalStarBtn').click();
    await expect(page.locator('#toast')).toContainText('Session unstarred');
  });

  test('toast: correct text for hide/restore', async ({ page }) => {
    const idx = await page.evaluate(() => (window as any).__test.filteredIndices[0]);
    await page.evaluate((i) => (window as any).showModal(i), idx);
    await page.locator('#modalHideBtn').click();
    await expect(page.locator('#toast')).toContainText('Session hidden');

    await page.evaluate(() => {
      const t = (window as any).__test;
      t.setShowHidden(true);
      (window as any).applyFilters();
    });
    await page.evaluate((i) => (window as any).showModal(i), idx);
    await page.locator('#modalHideBtn').click();
    await expect(page.locator('#toast')).toContainText('Session restored');
  });

  test('modal state accuracy: star on/off', async ({ page }) => {
    const idx = await page.evaluate(() => (window as any).__test.filteredIndices[0]);
    await page.evaluate((i) => (window as any).toggleHighlight(i), idx);
    await page.evaluate((i) => (window as any).showModal(i), idx);
    await expect(page.locator('#modalStarBtn')).toHaveClass(/\bon\b/);
    await page.locator('.modal-x').click();

    await page.evaluate((i) => (window as any).toggleHighlight(i), idx);
    await page.evaluate((i) => (window as any).showModal(i), idx);
    await expect(page.locator('#modalStarBtn')).not.toHaveClass(/\bon\b/);
  });
});
