import { test, expect } from '@playwright/test';

test.describe('Admin Maps Tab - Visual Preview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.click('button:has-text("Maps")');
    await page.waitForTimeout(500);
  });

  test('should display map preview with grid tiles', async ({ page }) => {
    // Check that map preview section exists
    const preview = page.locator('text=Map Preview').first();
    await expect(preview).toBeVisible();

    // Verify grid is rendered (should have multiple tile elements with absolute positioning)
    const gridContainer = page.locator('.relative.mx-auto').first();
    const tiles = gridContainer.locator('.absolute.border');
    const tileCount = await tiles.count();
    
    // 15 cols × 20 rows = 300 tiles
    expect(tileCount).toBeGreaterThan(200); // Allow some flexibility
  });

  test('should show tile information on hover', async ({ page }) => {
    // Find a tile in the grid and hover over it
    const gridContainer = page.locator('.relative.mx-auto').first();
    const firstTile = gridContainer.locator('.absolute.border').first();
    await firstTile.hover();
    
    // Should show tile type label in the tile info section
    const tileInfo = page.locator('.mt-4.text-center').first();
    await expect(tileInfo.locator('text=/🏰 Castle|👹 Spawn|⚔️ Deploy Zone|🛤️ Path/')).toBeVisible();
    
    // Should show tile coordinates in new format (Col x, Row y)
    await expect(tileInfo.locator('text=/Col \\d+, Row \\d+/')).toBeVisible();
  });

  test('should display legend with all tile types', async ({ page }) => {
    // Check legend items in the legend section specifically
    const legend = page.locator('.mt-4.grid.grid-cols-2').first();
    await expect(legend.locator('text=Castle')).toBeVisible();
    await expect(legend.locator('text=Spawn Point')).toBeVisible();
    await expect(legend.locator('text=Deploy Zone')).toBeVisible();
    await expect(legend.locator('text=Enemy Path')).toBeVisible();
  });

  test('should highlight tiles on hover with visual feedback', async ({ page }) => {
    // Get a deployment zone tile (bottom area)
    const gridContainer = page.locator('.relative.mx-auto').first();
    const deployTile = gridContainer.locator('.absolute.border').nth(250); // Near bottom
    
    // Get class list before hover
    const beforeClasses = await deployTile.getAttribute('class');
    
    // Hover and check classes changed
    await deployTile.hover();
    await page.waitForTimeout(200); // Wait for transition
    
    const afterClasses = await deployTile.getAttribute('class');
    
    // Classes should be different (hover state applied)
    expect(beforeClasses).not.toBe(afterClasses);
    
    // Verify tile info is shown in new format
    const tileInfo = page.locator('.mt-4.text-center').first();
    await expect(tileInfo.locator('text=/Col \\d+, Row \\d+/')).toBeVisible();
  });

  test('should show correct tile types in correct positions', async ({ page }) => {
    const gridContainer = page.locator('.relative.mx-auto').first();
    
    // Hover over top-left area (should be spawn point)
    const topLeftTile = gridContainer.locator('.absolute.border').first();
    await topLeftTile.hover();
    await expect(page.locator('text=👹 Spawn')).toBeVisible();
    
    // Hover over bottom area (should be deployment zone)
    const bottomTile = gridContainer.locator('.absolute.border').nth(280);
    await bottomTile.hover();
    await expect(page.locator('text=⚔️ Deploy Zone')).toBeVisible();
  });

  test('should display map stats correctly', async ({ page }) => {
    // Check preview controls section
    await expect(page.locator('text=Preview Controls')).toBeVisible();
    await expect(page.locator('text=/Grid Dimensions:/')).toBeVisible();
    await expect(page.locator('text=/Aspect Ratio:/')).toBeVisible();
    await expect(page.locator('text=/Castle Position:/')).toBeVisible();
    await expect(page.locator('text=/Spawn Points:/')).toBeVisible();
    await expect(page.locator('text=/Deploy Zones:/')).toBeVisible();
  });

  test('should have export config button', async ({ page }) => {
    const exportButton = page.locator('button:has-text("💾 Export Config")');
    await expect(exportButton).toBeVisible();
    
    // Button should be disabled initially (no changes)
    await expect(exportButton).toBeDisabled();
  });
});
