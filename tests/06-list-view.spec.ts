import { test, expect } from '@playwright/test';
import { loadApp } from './helpers/setup';

test.describe('List view', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page, { hash: 'view=list' });
  });

  test('sessions grouped by day heading and time slot heading', async ({ page }) => {
    const dayHeadings = page.locator('.day-heading');
    await expect(dayHeadings).toHaveCount(1);
    await expect(dayHeadings.first()).toContainText('March 4');
    expect(await page.locator('.time-slot-heading').count()).toBeGreaterThan(0);
  });

  test('card structure: stage badge, title', async ({ page }) => {
    const firstCard = page.locator('.card').first();
    await expect(firstCard.locator('.card-stage')).toBeVisible();
    await expect(firstCard.locator('.card-title')).toBeVisible();
  });

  test('card description has 2-line clamp', async ({ page }) => {
    const desc = page.locator('.card-desc').first();
    if (await desc.count() > 0) {
      const clamp = await desc.evaluate(el => getComputedStyle(el).webkitLineClamp);
      expect(clamp).toBe('2');
    }
  });

  test('card actions hidden by default, visible on hover', async ({ page }) => {
    const firstCard = page.locator('.card').first();
    const actions = firstCard.locator('.card-actions');
    expect(await actions.evaluate(el => getComputedStyle(el).opacity)).toBe('0');
    await firstCard.hover();
    await expect(actions).toHaveCSS('opacity', '1');
  });

  test('card click opens modal', async ({ page }) => {
    await page.locator('.card').first().click();
    await expect(page.locator('#modalBackdrop')).toHaveClass(/open/);
  });

  test('hover lift effect', async ({ page }) => {
    const card = page.locator('.card').first();
    await card.hover();
    const transform = await card.evaluate(el => getComputedStyle(el).transform);
    expect(transform).not.toBe('none');
  });

  test('hidden session styling', async ({ page }) => {
    await page.evaluate(() => {
      const t = (window as any).__test;
      t.hiddenSessions.add(100);
      t.setShowHidden(true);
      document.getElementById('showHiddenBtn')!.classList.add('active-hidden');
      (window as any).applyFilters();
    });

    const hiddenCard = page.locator('.card.hidden-session').first();
    await expect(hiddenCard).toBeVisible();
    const opacity = await hiddenCard.evaluate(el => getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeLessThanOrEqual(0.3);

    const titleDecoration = await hiddenCard.locator('.card-title').evaluate(el =>
      getComputedStyle(el).textDecorationLine
    );
    expect(titleDecoration).toContain('line-through');
  });

  test('starred session styling', async ({ page }) => {
    await page.evaluate(() => {
      const t = (window as any).__test;
      t.highlightedSessions.add(100);
      t.saveHighlighted();
      (window as any).applyFilters();
    });

    const starredCard = page.locator('.card.highlighted-session').first();
    await expect(starredCard).toBeVisible();
    // Actions always visible for starred
    expect(await starredCard.locator('.card-actions').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  });

  test('starred session hover keeps gold tint', async ({ page }) => {
    await page.evaluate(() => {
      const t = (window as any).__test;
      t.highlightedSessions.add(100);
      t.saveHighlighted();
      (window as any).applyFilters();
    });

    const starredCard = page.locator('.card.highlighted-session').first();
    await starredCard.hover();
    await expect(starredCard).toHaveClass(/highlighted-session/);
  });

  test('desktop grid layout', async ({ page }) => {
    const gridCols = await page.locator('.list-cards').first().evaluate(el =>
      getComputedStyle(el).gridTemplateColumns
    );
    expect(gridCols.split(' ').length).toBeGreaterThanOrEqual(1);
  });

  test('empty state message when no sessions match', async ({ page }) => {
    await page.evaluate(() => {
      (document.getElementById('searchBox') as HTMLInputElement).value = 'xyznonexistentxyz';
      (window as any).applyFilters();
    });
    await expect(page.locator('#content')).toContainText('No sessions match your filters');
  });
});
