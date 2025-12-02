/**
 * Asset Preview Page Visual Regression Tests
 * 
 * Captures screenshots of the preview page for visual validation.
 * Tests at multiple viewport sizes to verify scaling behavior.
 * 
 * Requirements: 10.6
 */

import { test, expect } from '@playwright/test';

// Use game port (5173) for asset preview page
const ASSET_PREVIEW_URL = 'http://localhost:5173/asset-preview';

test.describe('Asset Preview Page Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to asset preview page
    await page.goto(ASSET_PREVIEW_URL);
    
    // Wait for page to fully load
    await page.waitForSelector('[data-testid="asset-preview-page"]');
  });

  test('renders asset preview page with all categories', async ({ page }) => {
    // Verify page header is present
    await expect(page.locator('h1')).toContainText('SVG Asset Preview');
    
    // Verify all category grids are present
    const expectedCategories = [
      'UI Icons',
      'Weapons',
      'Skills',
      'Items',
      'Stats',
      'Species',
      'Combat Effects',
      'Magic Effects',
      'Movement Effects',
      'Status Effects',
      'Level Badges',
    ];
    
    for (const category of expectedCategories) {
      await expect(page.locator(`h2:has-text("${category}")`)).toBeVisible();
    }
  });

  test('displays asset stats in header', async ({ page }) => {
    // Verify stats are displayed in the header section
    const header = page.locator('header');
    await expect(header.getByText('Ready', { exact: true })).toBeVisible();
    await expect(header.getByText('Pending', { exact: true })).toBeVisible();
    await expect(header.getByText('Total', { exact: true })).toBeVisible();
    await expect(header.getByText('Complete', { exact: true })).toBeVisible();
  });

  test('captures screenshot at desktop viewport (1280x720)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Wait for any animations to settle
    await page.waitForTimeout(500);
    
    // Capture full page screenshot
    await expect(page).toHaveScreenshot('asset-preview-desktop.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1, // Allow 10% pixel difference for emoji rendering variations
    });
  });

  test('captures screenshot at tablet viewport (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Wait for any animations to settle
    await page.waitForTimeout(500);
    
    // Capture full page screenshot
    await expect(page).toHaveScreenshot('asset-preview-tablet.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    });
  });

  test('captures screenshot at mobile viewport (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for any animations to settle
    await page.waitForTimeout(500);
    
    // Capture full page screenshot
    await expect(page).toHaveScreenshot('asset-preview-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    });
  });

  test('asset cards display at correct sizes', async ({ page }) => {
    // Find the first asset card
    const firstCard = page.locator('[data-testid^="asset-card-"]').first();
    await expect(firstCard).toBeVisible();
    
    // Verify size labels are present (24, 48, 64)
    await expect(firstCard.locator('text=24')).toBeVisible();
    await expect(firstCard.locator('text=48')).toBeVisible();
    await expect(firstCard.locator('text=64')).toBeVisible();
  });

  test('pending assets have visual distinction', async ({ page }) => {
    // Find a pending asset card (most assets are pending)
    const pendingCard = page.locator('[data-testid^="asset-card-"]').filter({
      has: page.locator('text=pending')
    }).first();
    
    if (await pendingCard.count() > 0) {
      // Verify pending status badge is visible
      await expect(pendingCard.locator('text=pending')).toBeVisible();
      
      // Verify the card has reduced opacity (visual distinction)
      const opacity = await pendingCard.evaluate((el) => {
        return window.getComputedStyle(el).opacity;
      });
      expect(parseFloat(opacity)).toBeLessThan(1);
    }
  });

  test('ready assets have visual distinction', async ({ page }) => {
    // Find a ready asset card (sword, spear, inventory are ready)
    const readyCard = page.locator('[data-testid^="asset-card-"]').filter({
      has: page.locator('text=ready')
    }).first();
    
    if (await readyCard.count() > 0) {
      // Verify ready status badge is visible
      await expect(readyCard.locator('text=ready')).toBeVisible();
      
      // Verify the card has full opacity
      const opacity = await readyCard.evaluate((el) => {
        return window.getComputedStyle(el).opacity;
      });
      expect(parseFloat(opacity)).toBeGreaterThanOrEqual(0.9);
    }
  });

  test('back to game link is present', async ({ page }) => {
    // Verify footer link exists
    await expect(page.locator('a:has-text("Back to Game")')).toBeVisible();
    await expect(page.locator('a:has-text("Back to Game")')).toHaveAttribute('href', '/');
  });
});
