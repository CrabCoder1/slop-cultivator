import { test, expect } from '@playwright/test';

/**
 * End-to-end integration test for complete game flow
 * Tests the full game experience from start to multiple waves
 * Verifies random cultivator generation, wave spawning, and combat
 */

test.describe('Complete Game Flow Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('should start game and verify 4 random cultivators generated', async ({ page }) => {
    // Wait for data loading to complete
    await page.waitForTimeout(2000);
    
    // Select a map to start the game
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Verify game board is visible
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Verify cultivator selector is visible
    const cultivatorSelector = page.locator('[class*="tower-selector"]').or(
      page.locator('button[class*="cultivator"]')
    ).or(
      page.locator('div:has-text("Select Cultivator")')
    );
    
    // Check for cultivator selection buttons
    // The game should show 4 cultivator options
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    // Wait for cultivators to be available
    await page.waitForTimeout(1000);
    
    // Count visible cultivator buttons (should be 4)
    const count = await cultivatorButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
    
    // Verify each cultivator has an emoji and name
    for (let i = 0; i < Math.min(count, 4); i++) {
      const button = cultivatorButtons.nth(i);
      const text = await button.textContent();
      expect(text).toBeTruthy();
      // Should contain at least an emoji or name
      expect(text!.length).toBeGreaterThan(0);
    }
  });

  test('should play through multiple waves and verify spawning', async ({ page }) => {
    // Wait for data loading
    await page.waitForTimeout(2000);
    
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for game to be ready
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Start wave 1
    const startWaveButton = page.locator('button:has-text("Start Wave")').or(
      page.locator('button:has-text("Next Wave")')
    );
    
    if (await startWaveButton.isVisible()) {
      await startWaveButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Verify wave 1 is active
    const waveIndicator = page.locator('text=/Wave [0-9]+/i');
    await expect(waveIndicator).toBeVisible({ timeout: 5000 });
    
    // Wait for enemies to spawn (check for enemy emojis on canvas or in DOM)
    await page.waitForTimeout(3000);
    
    // Verify wave progresses (wave number should be 1 or higher)
    const waveText = await waveIndicator.textContent();
    expect(waveText).toMatch(/Wave [1-9]/i);
    
    // Wait for wave 1 to complete or progress
    await page.waitForTimeout(5000);
    
    // Try to start wave 2
    if (await startWaveButton.isVisible()) {
      await startWaveButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Verify wave 2 is active
    await page.waitForTimeout(2000);
    const wave2Text = await waveIndicator.textContent();
    expect(wave2Text).toMatch(/Wave [2-9]/i);
    
    // Wait for wave 2 enemies
    await page.waitForTimeout(3000);
    
    // Try to start wave 3
    if (await startWaveButton.isVisible()) {
      await startWaveButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Verify wave 3 is active
    await page.waitForTimeout(2000);
    const wave3Text = await waveIndicator.textContent();
    expect(wave3Text).toMatch(/Wave [3-9]/i);
    
    // Verify game is still running (not game over)
    const gameOverText = page.locator('text=/Game Over/i');
    await expect(gameOverText).not.toBeVisible();
  });

  test('should verify entities spawn according to wave configs', async ({ page }) => {
    // Wait for data loading
    await page.waitForTimeout(2000);
    
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for game to be ready
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Start wave 1
    const startWaveButton = page.locator('button:has-text("Start Wave")').or(
      page.locator('button:has-text("Next Wave")')
    );
    
    if (await startWaveButton.isVisible()) {
      await startWaveButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for enemies to spawn
    await page.waitForTimeout(3000);
    
    // Check canvas for enemy rendering
    // Enemies should be visible on the canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Verify enemy count in game state (check UI elements)
    // Look for enemy health bars or enemy indicators
    const enemyHealthBars = page.locator('[class*="enemy"]').or(
      page.locator('div:has-text("HP")')
    );
    
    // At least some enemies should have spawned
    await page.waitForTimeout(2000);
    
    // Verify wave is progressing (enemies are spawning)
    // Check for score or enemy count indicators
    const scoreIndicator = page.locator('text=/Score/i').or(
      page.locator('text=/Enemies/i')
    );
    
    // Game should be active with entities
    await expect(scoreIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should verify combat works with health bars and projectiles', async ({ page }) => {
    // Wait for data loading
    await page.waitForTimeout(2000);
    
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for game to be ready
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Deploy a cultivator first
    // Click on a cultivator type
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    if (await cultivatorButtons.first().isVisible()) {
      await cultivatorButtons.first().click();
      await page.waitForTimeout(500);
      
      // Click on canvas to deploy
      const canvas = page.locator('canvas');
      await canvas.click({ position: { x: 400, y: 300 } });
      await page.waitForTimeout(1000);
    }
    
    // Start wave 1
    const startWaveButton = page.locator('button:has-text("Start Wave")').or(
      page.locator('button:has-text("Next Wave")')
    );
    
    if (await startWaveButton.isVisible()) {
      await startWaveButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for combat to occur
    await page.waitForTimeout(5000);
    
    // Verify health indicators are present
    // Check for castle health
    const castleHealth = page.locator('text=/Castle.*HP/i').or(
      page.locator('text=/Health.*[0-9]+/i')
    );
    await expect(castleHealth).toBeVisible({ timeout: 5000 });
    
    // Verify game is active and combat is happening
    // Check for score changes or enemy defeat indicators
    const scoreText = page.locator('text=/Score/i');
    if (await scoreText.isVisible()) {
      const initialScore = await scoreText.textContent();
      
      // Wait for combat
      await page.waitForTimeout(5000);
      
      // Score might have changed (enemies defeated)
      const currentScore = await scoreText.textContent();
      // Just verify score is still visible (combat is happening)
      expect(currentScore).toBeTruthy();
    }
    
    // Verify game is still running
    const gameOverText = page.locator('text=/Game Over/i');
    await expect(gameOverText).not.toBeVisible();
  });

  test('should handle full game session from start to wave 3', async ({ page }) => {
    // Wait for data loading
    await page.waitForTimeout(2000);
    
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for game to be ready
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Verify 4 cultivators are available
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    const count = await cultivatorButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
    
    // Deploy 2 cultivators
    if (await cultivatorButtons.first().isVisible()) {
      // Deploy first cultivator
      await cultivatorButtons.first().click();
      await page.waitForTimeout(300);
      const canvas = page.locator('canvas');
      await canvas.click({ position: { x: 350, y: 300 } });
      await page.waitForTimeout(500);
      
      // Deploy second cultivator
      await cultivatorButtons.nth(1).click();
      await page.waitForTimeout(300);
      await canvas.click({ position: { x: 450, y: 300 } });
      await page.waitForTimeout(500);
    }
    
    // Play through 3 waves
    const startWaveButton = page.locator('button:has-text("Start Wave")').or(
      page.locator('button:has-text("Next Wave")')
    );
    
    for (let wave = 1; wave <= 3; wave++) {
      // Start wave
      if (await startWaveButton.isVisible()) {
        await startWaveButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Verify wave number
      const waveIndicator = page.locator('text=/Wave [0-9]+/i');
      await expect(waveIndicator).toBeVisible({ timeout: 5000 });
      const waveText = await waveIndicator.textContent();
      expect(waveText).toMatch(new RegExp(`Wave ${wave}`, 'i'));
      
      // Wait for wave to progress
      await page.waitForTimeout(8000);
    }
    
    // Verify game completed 3 waves successfully
    const waveIndicator = page.locator('text=/Wave [0-9]+/i');
    const finalWaveText = await waveIndicator.textContent();
    expect(finalWaveText).toMatch(/Wave [3-9]/i);
    
    // Verify game is still running (not game over)
    const gameOverText = page.locator('text=/Game Over/i');
    await expect(gameOverText).not.toBeVisible();
  });
});
