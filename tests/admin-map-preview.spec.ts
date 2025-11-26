import { test, expect } from '@playwright/test';

test.describe('Admin Map Preview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Maps tab
    await page.click('button:has-text("Maps")');
    await page.waitForTimeout(500);
    
    // Select first map
    const firstMap = page.locator('.w-64 > div > div').first();
    await firstMap.click();
    await page.waitForTimeout(500);
  });

  test('map preview container has fixed height', async ({ page }) => {
    const preview = page.locator('div:has(> div.grid.gap-0)').first();
    const box = await preview.boundingBox();
    
    expect(box).not.toBeNull();
    // Allow 2px tolerance for border rendering differences
    expect(box!.height).toBeGreaterThanOrEqual(498);
    expect(box!.height).toBeLessThanOrEqual(500);
  });

  test('map preview renders grid with correct dimensions', async ({ page }) => {
    // Get the grid container
    const grid = page.locator('div.grid.gap-0').first();
    
    // Check grid exists
    await expect(grid).toBeVisible();
    
    // Get grid styles
    const gridStyles = await grid.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        gridTemplateColumns: computed.gridTemplateColumns,
        gridTemplateRows: computed.gridTemplateRows,
      };
    });
    
    expect(gridStyles.display).toBe('grid');
    // Grid template columns/rows should contain px values (browsers expand repeat())
    expect(gridStyles.gridTemplateColumns).toContain('px');
    expect(gridStyles.gridTemplateRows).toContain('px');
  });

  test('map preview tiles are square', async ({ page }) => {
    // Get first tile
    const firstTile = page.locator('div.grid.gap-0 > div').first();
    
    const box = await firstTile.boundingBox();
    expect(box).not.toBeNull();
    
    // Tiles should be square (width === height)
    expect(Math.abs(box!.width - box!.height)).toBeLessThan(1);
  });

  test('toolbar appears on hover', async ({ page }) => {
    const preview = page.locator('div:has(> div.grid.gap-0)').first();
    const toolbar = page.locator('div.absolute.top-2').first();
    
    // Initially toolbar should be hidden or have low opacity
    const initialOpacity = await toolbar.evaluate((el) => 
      window.getComputedStyle(el).opacity
    );
    expect(parseFloat(initialOpacity)).toBeLessThanOrEqual(0.1);
    
    // Hover over preview
    await preview.hover();
    await page.waitForTimeout(300); // Wait for transition
    
    // Toolbar should be visible
    const hoverOpacity = await toolbar.evaluate((el) => 
      window.getComputedStyle(el).opacity
    );
    expect(parseFloat(hoverOpacity)).toBeGreaterThan(0.9);
  });

  test('toolbar contains zoom controls', async ({ page }) => {
    const preview = page.locator('div:has(> div.grid.gap-0)').first();
    await preview.hover();
    await page.waitForTimeout(300);
    
    // Check for zoom buttons using title attribute
    const zoomOut = page.locator('button[title="Zoom Out"]');
    const zoomIn = page.locator('button[title="Zoom In"]');
    const reset = page.locator('button[title="Reset View"]');
    
    await expect(zoomOut).toBeVisible();
    await expect(zoomIn).toBeVisible();
    await expect(reset).toBeVisible();
    
    // Check for zoom percentage display
    const zoomPercent = page.locator('span.text-xs.text-slate-400:has-text("%")');
    await expect(zoomPercent).toBeVisible();
  });

  test('zoom in increases scale', async ({ page }) => {
    const preview = page.locator('div:has(> div.grid.gap-0)').first();
    await preview.hover();
    await page.waitForTimeout(300);
    
    // Get initial zoom percentage
    const zoomPercent = page.locator('span.text-xs.text-slate-400:has-text("%")');
    const initialZoom = await zoomPercent.textContent();
    
    // Click zoom in
    const zoomIn = page.locator('button[title="Zoom In"]');
    await zoomIn.click();
    await page.waitForTimeout(200);
    
    // Get new zoom percentage
    const newZoom = await zoomPercent.textContent();
    
    expect(parseInt(newZoom!)).toBeGreaterThan(parseInt(initialZoom!));
  });

  test('zoom out decreases scale', async ({ page }) => {
    const preview = page.locator('div:has(> div.grid.gap-0)').first();
    await preview.hover();
    await page.waitForTimeout(300);
    
    // First zoom in to have room to zoom out
    const zoomIn = page.locator('button[title="Zoom In"]');
    await zoomIn.click();
    await page.waitForTimeout(200);
    
    // Get zoom percentage after zoom in
    const zoomPercent = page.locator('span.text-xs.text-slate-400:has-text("%")');
    const beforeZoomOut = await zoomPercent.textContent();
    
    // Click zoom out
    const zoomOut = page.locator('button[title="Zoom Out"]');
    await zoomOut.click();
    await page.waitForTimeout(200);
    
    // Get new zoom percentage
    const afterZoomOut = await zoomPercent.textContent();
    
    expect(parseInt(afterZoomOut!)).toBeLessThan(parseInt(beforeZoomOut!));
  });

  test('reset button restores default view', async ({ page }) => {
    const preview = page.locator('div:has(> div.grid.gap-0)').first();
    await preview.hover();
    await page.waitForTimeout(300);
    
    const zoomPercent = page.locator('span.text-xs.text-slate-400:has-text("%")');
    const initialZoom = await zoomPercent.textContent();
    
    // Zoom in multiple times
    const zoomIn = page.locator('button[title="Zoom In"]');
    await zoomIn.click();
    await page.waitForTimeout(100);
    await zoomIn.click();
    await page.waitForTimeout(100);
    
    // Click reset
    const reset = page.locator('button[title="Reset View"]');
    await reset.click();
    await page.waitForTimeout(200);
    
    // Should be back to initial zoom
    const finalZoom = await zoomPercent.textContent();
    expect(finalZoom).toBe(initialZoom);
  });

  test('map preview has no scrollbars', async ({ page }) => {
    const preview = page.locator('div:has(> div.grid.gap-0)').first();
    
    const hasScrollbars = await preview.evaluate((el) => {
      return {
        hasHorizontalScroll: el.scrollWidth > el.clientWidth,
        hasVerticalScroll: el.scrollHeight > el.clientHeight,
        overflowX: window.getComputedStyle(el).overflowX,
        overflowY: window.getComputedStyle(el).overflowY,
      };
    });
    
    expect(hasScrollbars.overflowX).not.toBe('scroll');
    expect(hasScrollbars.overflowY).not.toBe('scroll');
  });

  test('info text displays active brush', async ({ page }) => {
    const infoText = page.locator('div.absolute.bottom-2 p').last();
    
    await expect(infoText).toBeVisible();
    await expect(infoText).toContainText('Active:');
  });

  test('changing map dimensions updates grid', async ({ page }) => {
    // Get initial grid dimensions
    const grid = page.locator('div.grid.gap-0').first();
    const initialCols = await grid.evaluate((el) => 
      window.getComputedStyle(el).gridTemplateColumns
    );
    
    // Change width
    const widthInput = page.locator('input[type="number"]').filter({ hasText: /Width/ }).or(
      page.locator('label:has-text("Width")').locator('..').locator('input')
    );
    await widthInput.fill('25');
    await page.waitForTimeout(500);
    
    // Check grid updated
    const newCols = await grid.evaluate((el) => 
      window.getComputedStyle(el).gridTemplateColumns
    );
    
    expect(newCols).not.toBe(initialCols);
  });

  test('viewport centers the grid', async ({ page }) => {
    const viewport = page.locator('div.w-full.h-full.overflow-hidden').first();
    const grid = page.locator('div.grid.gap-0').first();
    
    const viewportBox = await viewport.boundingBox();
    const gridBox = await grid.boundingBox();
    
    expect(viewportBox).not.toBeNull();
    expect(gridBox).not.toBeNull();
    
    // Grid should be roughly centered in viewport
    const viewportCenterX = viewportBox!.x + viewportBox!.width / 2;
    const gridCenterX = gridBox!.x + gridBox!.width / 2;
    
    // Allow some tolerance for centering
    expect(Math.abs(viewportCenterX - gridCenterX)).toBeLessThan(50);
  });

  test('tiles have proper border styling', async ({ page }) => {
    const firstTile = page.locator('div.grid.gap-0 > div').first();
    
    // Hover over the map preview to ensure we're not in panning mode
    const preview = page.locator('div:has(> div.grid.gap-0)').first();
    await preview.hover({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(200);
    
    const styles = await firstTile.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        borderWidth: computed.borderWidth,
        cursor: computed.cursor,
      };
    });
    
    expect(styles.borderWidth).not.toBe('0px');
    expect(styles.cursor).toMatch(/crosshair|default/); // May be default or crosshair depending on state
  });

  test('container has proper background and border', async ({ page }) => {
    const container = page.locator('div.bg-slate-900.rounded-lg.border.border-purple-900').first();
    
    const styles = await container.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        borderRadius: computed.borderRadius,
        borderColor: computed.borderColor,
      };
    });
    
    expect(styles.backgroundColor).toBe('rgb(15, 23, 42)'); // slate-900
    expect(parseFloat(styles.borderRadius)).toBeGreaterThan(0);
  });
});
