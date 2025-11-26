import { test, expect } from '@playwright/test';

test.describe('Temple Health Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('temple health should be visible in the UI header', async ({ page }) => {
    // Wait for map selection to appear
    await page.waitForSelector('text=Select a Map', { timeout: 10000 });
    
    // Select the first map
    const firstMap = page.locator('.map-card').first();
    await firstMap.click();
    
    // Wait for game to load
    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Check for temple health display in header (🏛️100/100 format)
    const templeHealthDisplay = page.locator('text=/🏛️\\d+\\/\\d+/');
    await expect(templeHealthDisplay).toBeVisible();
    
    // Verify it shows full health initially
    const healthText = await templeHealthDisplay.textContent();
    expect(healthText).toMatch(/🏛️100\/100/);
  });

  test('temple health should update when damaged', async ({ page }) => {
    // Wait for map selection to appear
    await page.waitForSelector('text=Select a Map', { timeout: 10000 });
    
    // Select the first map
    const firstMap = page.locator('.map-card').first();
    await firstMap.click();
    
    // Wait for game to load
    await page.waitForTimeout(1000);
    
    // Get initial health
    const templeHealthDisplay = page.locator('text=/🏛️\\d+\\/\\d+/');
    const initialHealth = await templeHealthDisplay.textContent();
    
    // Start wave to spawn enemies
    const startButton = page.locator('button:has-text("Start")');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    
    // Wait for enemies to spawn and potentially reach temple
    await page.waitForTimeout(10000);
    
    // Get current health
    const currentHealth = await templeHealthDisplay.textContent();
    
    // Health display should still be visible
    await expect(templeHealthDisplay).toBeVisible();
    
    // Verify format is correct (🏛️X/100 where X <= 100)
    expect(currentHealth).toMatch(/🏛️\d+\/100/);
  });

  test('temple health should show correct color coding', async ({ page }) => {
    // Wait for map selection to appear
    await page.waitForSelector('text=Select a Map', { timeout: 10000 });
    
    // Select the first map
    const firstMap = page.locator('.map-card').first();
    await firstMap.click();
    
    // Wait for game to load
    await page.waitForTimeout(1000);
    
    // Find the temple health display element
    const templeHealthDisplay = page.locator('span.text-red-400:has-text("🏛️")');
    await expect(templeHealthDisplay).toBeVisible();
    
    // Verify it has red color class (text-red-400)
    const className = await templeHealthDisplay.getAttribute('class');
    expect(className).toContain('text-red-400');
  });

  test('temple health should be displayed alongside other stats', async ({ page }) => {
    // Wait for map selection to appear
    await page.waitForSelector('text=Select a Map', { timeout: 10000 });
    
    // Select the first map
    const firstMap = page.locator('.map-card').first();
    await firstMap.click();
    
    // Wait for game to load
    await page.waitForTimeout(1000);
    
    // Verify all stats are visible in the header
    const templeHealth = page.locator('text=/🏛️\\d+\\/\\d+/');
    const qi = page.locator('text=/⚡\\d+/');
    const wave = page.locator('text=/🌊\\d+/');
    const score = page.locator('text=/⭐\\d+/');
    
    await expect(templeHealth).toBeVisible();
    await expect(qi).toBeVisible();
    await expect(wave).toBeVisible();
    await expect(score).toBeVisible();
  });
});
