import { test, expect } from '@playwright/test';

test.describe('Admin Master-Detail Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForTimeout(1000);
  });

  test('should have tabs in header', async ({ page }) => {
    // Check header exists
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check tabs are in header
    const tabsInHeader = header.locator('button');
    const tabCount = await tabsInHeader.count();
    console.log('Tabs in header:', tabCount);
    expect(tabCount).toBe(5); // 5 tabs: Cultivators, Enemies, Items, Skills, Maps
    
    // Verify tab labels
    const tabTexts = await tabsInHeader.allTextContents();
    console.log('Tab labels:', tabTexts);
    expect(tabTexts.some(t => t.includes('Cultivators'))).toBeTruthy();
    expect(tabTexts.some(t => t.includes('Enemies'))).toBeTruthy();
    expect(tabTexts.some(t => t.includes('Items'))).toBeTruthy();
    expect(tabTexts.some(t => t.includes('Skills'))).toBeTruthy();
    expect(tabTexts.some(t => t.includes('Maps'))).toBeTruthy();
  });

  test('should have master list with vertical border', async ({ page }) => {
    // Check for master list container
    const masterList = page.locator('.w-64.flex-shrink-0.border-r').first();
    await expect(masterList).toBeVisible();
    
    // Verify border styling
    const borderStyle = await masterList.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        borderRight: computed.borderRight,
        paddingRight: computed.paddingRight,
        marginRight: computed.marginRight,
      };
    });
    console.log('Master list border styles:', borderStyle);
    
    // Should have right border
    expect(borderStyle.borderRight).not.toBe('');
    expect(borderStyle.borderRight).not.toBe('0px none rgb(0, 0, 0)');
  });

  test('should have scrollable master list', async ({ page }) => {
    const masterList = page.locator('.w-64.flex-shrink-0.overflow-y-auto').first();
    await expect(masterList).toBeVisible();
    
    // Check overflow property
    const overflowY = await masterList.evaluate((el) => {
      return window.getComputedStyle(el).overflowY;
    });
    console.log('Master list overflow-y:', overflowY);
    expect(overflowY).toBe('auto');
  });

  test('should not scale cards when selected', async ({ page }) => {
    // Get all selectable cards
    const cards = page.locator('button').filter({ hasText: /Sword|Palm|Arrow|Lightning/ });
    const firstCard = cards.first();
    
    // Get initial dimensions
    const initialBox = await firstCard.boundingBox();
    console.log('Initial card dimensions:', initialBox);
    
    // Click to select
    await firstCard.click();
    await page.waitForTimeout(500); // Wait for transition
    
    // Get dimensions after selection
    const selectedBox = await firstCard.boundingBox();
    console.log('Selected card dimensions:', selectedBox);
    
    // Dimensions should be the same (no scaling)
    expect(selectedBox?.width).toBe(initialBox?.width);
    expect(selectedBox?.height).toBe(initialBox?.height);
    
    // Check for scale transform
    const transform = await firstCard.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
    console.log('Card transform:', transform);
    
    // Should not have scale transform (or should be scale(1))
    expect(transform === 'none' || transform.includes('matrix(1, 0, 0, 1')).toBeTruthy();
  });

  test('should have proper spacing between cards and border', async ({ page }) => {
    const masterList = page.locator('.w-64.flex-shrink-0').first();
    
    // Check padding and margin
    const spacing = await masterList.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        paddingRight: computed.paddingRight,
        marginRight: computed.marginRight,
      };
    });
    console.log('Master list spacing:', spacing);
    
    // Should have padding-right (pr-6 = 1.5rem = 24px)
    expect(parseFloat(spacing.paddingRight)).toBeGreaterThan(0);
    
    // Should have margin-right (mr-2 = 0.5rem = 8px)
    expect(parseFloat(spacing.marginRight)).toBeGreaterThan(0);
  });

  test('should display detail panel next to master list', async ({ page }) => {
    // Check for two-column layout
    const layoutContainer = page.locator('.flex.gap-6.p-6').first();
    await expect(layoutContainer).toBeVisible();
    
    // Check flex display
    const display = await layoutContainer.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    console.log('Layout display:', display);
    expect(display).toBe('flex');
    
    // Check for detail panel (flex-1)
    const detailPanel = page.locator('.flex-1.space-y-6.overflow-y-auto').first();
    await expect(detailPanel).toBeVisible();
  });

  test('should show selected card with ring and no clipping', async ({ page }) => {
    const cards = page.locator('button').filter({ hasText: /Sword|Palm|Arrow|Lightning/ });
    const firstCard = cards.first();
    
    await firstCard.click();
    await page.waitForTimeout(500);
    
    // Check for ring styling
    const styles = await firstCard.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        boxShadow: computed.boxShadow,
        border: computed.border,
      };
    });
    console.log('Selected card styles:', styles);
    
    // Should have box shadow (ring effect)
    expect(styles.boxShadow).not.toBe('none');
    
    // Check if card is within bounds (not clipping)
    const cardBox = await firstCard.boundingBox();
    const masterList = page.locator('.w-64.flex-shrink-0').first();
    const masterBox = await masterList.boundingBox();
    
    console.log('Card box:', cardBox);
    console.log('Master list box:', masterBox);
    
    if (cardBox && masterBox) {
      // Card should not extend beyond master list right edge
      expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(masterBox.x + masterBox.width + 5); // 5px tolerance
    }
  });

  test('should switch between tabs and maintain layout', async ({ page }) => {
    // Click Items tab
    await page.locator('button').filter({ hasText: 'Items' }).click();
    await page.waitForTimeout(500);
    
    // Check master list still exists
    let masterList = page.locator('.w-64.flex-shrink-0.border-r').first();
    await expect(masterList).toBeVisible();
    
    // Check detail panel still exists
    let detailPanel = page.locator('.flex-1.space-y-6').first();
    await expect(detailPanel).toBeVisible();
    
    // Click Enemies tab
    await page.locator('button').filter({ hasText: 'Enemies' }).click();
    await page.waitForTimeout(500);
    
    // Check layout persists
    masterList = page.locator('.w-64.flex-shrink-0.border-r').first();
    await expect(masterList).toBeVisible();
    
    detailPanel = page.locator('.flex-1.space-y-6').first();
    await expect(detailPanel).toBeVisible();
  });

  test('should take screenshots for visual verification', async ({ page }) => {
    // Default view (Cultivators)
    await page.screenshot({ 
      path: 'test-results/admin-layout-cultivators.png', 
      fullPage: true 
    });
    
    // Click a card to show selection
    const firstCard = page.locator('button').filter({ hasText: /Sword/ }).first();
    await firstCard.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'test-results/admin-layout-selected-card.png', 
      fullPage: true 
    });
    
    // Switch to Items tab
    await page.locator('button').filter({ hasText: 'Items' }).click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'test-results/admin-layout-items.png', 
      fullPage: true 
    });
    
    console.log('Screenshots saved to test-results/');
  });
});
