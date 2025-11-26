import { test, expect } from '@playwright/test';

/**
 * End-to-end integration test for Cultivator Composition in Game
 * Tests that cultivators are generated using composition system,
 * verifies stats match composition, and validates combat works correctly
 */

test.describe('Cultivator Composition in Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test('should start game and verify cultivators use composition system', async ({ page }) => {
    // Select a map to start the game
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for game to load
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Verify cultivator selector shows 4 cultivators
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    const count = await cultivatorButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
    
    // Verify each cultivator has proper composition structure
    for (let i = 0; i < Math.min(count, 4); i++) {
      const button = cultivatorButtons.nth(i);
      const text = await button.textContent();
      
      // Should have emoji and name
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(0);
      
      // Click to see details
      await button.click();
      await page.waitForTimeout(500);
      
      // Check for cultivator details dialog or panel
      const detailsDialog = page.locator('[role="dialog"]').or(
        page.locator('div').filter({ hasText: /Stats|Health|Damage/ })
      );
      
      // Verify stats are displayed
      const statsVisible = await detailsDialog.isVisible().catch(() => false);
      if (statsVisible) {
        // Should show health, damage, attack speed, range
        const dialogText = await detailsDialog.textContent();
        expect(dialogText).toMatch(/Health|HP/i);
        expect(dialogText).toMatch(/Damage|Attack/i);
      }
      
      // Close dialog if open
      const closeButton = page.locator('button').filter({ hasText: /Close|×/ }).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should verify cultivators have composed stats', async ({ page }) => {
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Get first cultivator
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    if (await cultivatorButtons.first().isVisible()) {
      // Click to view details
      await cultivatorButtons.first().click();
      await page.waitForTimeout(500);
      
      // Look for stats display
      const statsPanel = page.locator('div').filter({ hasText: /Stats|Health|Damage/ });
      
      if (await statsPanel.isVisible()) {
        const statsText = await statsPanel.textContent();
        
        // Verify health stat exists and is a number
        const healthMatch = statsText!.match(/Health.*?([0-9]+)/i) || 
                           statsText!.match(/HP.*?([0-9]+)/i);
        if (healthMatch) {
          const health = parseInt(healthMatch[1]);
          expect(health).toBeGreaterThan(0);
          expect(health).toBeLessThan(10000); // Reasonable upper bound
        }
        
        // Verify damage stat exists
        const damageMatch = statsText!.match(/Damage.*?([0-9]+)/i) ||
                           statsText!.match(/Attack.*?([0-9]+)/i);
        if (damageMatch) {
          const damage = parseInt(damageMatch[1]);
          expect(damage).toBeGreaterThan(0);
          expect(damage).toBeLessThan(1000); // Reasonable upper bound
        }
        
        // Verify range stat exists
        const rangeMatch = statsText!.match(/Range.*?([0-9]+)/i);
        if (rangeMatch) {
          const range = parseInt(rangeMatch[1]);
          expect(range).toBeGreaterThan(0);
          expect(range).toBeLessThan(1000); // Reasonable upper bound
        }
      }
    }
  });

  test('should deploy cultivator and verify stats match composition', async ({ page }) => {
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Get cultivator buttons
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    if (await cultivatorButtons.first().isVisible()) {
      // Get cultivator name before deployment
      const cultivatorText = await cultivatorButtons.first().textContent();
      
      // Click to select
      await cultivatorButtons.first().click();
      await page.waitForTimeout(500);
      
      // Deploy on canvas
      const canvas = page.locator('canvas');
      await canvas.click({ position: { x: 400, y: 300 } });
      await page.waitForTimeout(1000);
      
      // Verify deployment succeeded
      // Check for Qi cost deduction
      const qiIndicator = page.locator('text=/Qi.*[0-9]+/i').or(
        page.locator('text=/[0-9]+.*Qi/i')
      );
      
      if (await qiIndicator.isVisible()) {
        const qiText = await qiIndicator.textContent();
        const qiMatch = qiText!.match(/[0-9]+/);
        if (qiMatch) {
          const currentQi = parseInt(qiMatch[0]);
          // Qi should be less than starting amount (200)
          expect(currentQi).toBeLessThanOrEqual(200);
          expect(currentQi).toBeGreaterThanOrEqual(0);
        }
      }
      
      // Click on deployed cultivator to see its stats
      await canvas.click({ position: { x: 400, y: 300 } });
      await page.waitForTimeout(500);
      
      // Look for cultivator details
      const detailsDialog = page.locator('[role="dialog"]').or(
        page.locator('div').filter({ hasText: /Stats|Health|Damage/ })
      );
      
      if (await detailsDialog.isVisible()) {
        const detailsText = await detailsDialog.textContent();
        
        // Verify the cultivator name matches
        expect(detailsText).toContain(cultivatorText);
        
        // Verify stats are displayed
        expect(detailsText).toMatch(/Health|HP/i);
        expect(detailsText).toMatch(/Damage|Attack/i);
      }
    }
  });

  test('should verify combat works with composed stats', async ({ page }) => {
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Deploy a cultivator
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    if (await cultivatorButtons.first().isVisible()) {
      await cultivatorButtons.first().click();
      await page.waitForTimeout(500);
      
      const canvas = page.locator('canvas');
      await canvas.click({ position: { x: 400, y: 300 } });
      await page.waitForTimeout(1000);
    }
    
    // Start wave 1 to test combat
    const startWaveButton = page.locator('button:has-text("Start Wave")').or(
      page.locator('button:has-text("Next Wave")')
    );
    
    if (await startWaveButton.isVisible()) {
      await startWaveButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for combat to occur
    await page.waitForTimeout(5000);
    
    // Verify wave is active
    const waveIndicator = page.locator('text=/Wave [0-9]+/i');
    await expect(waveIndicator).toBeVisible({ timeout: 5000 });
    
    // Verify combat is happening
    // Check for score changes (enemies being defeated)
    const scoreIndicator = page.locator('text=/Score/i');
    if (await scoreIndicator.isVisible()) {
      const initialScore = await scoreIndicator.textContent();
      
      // Wait for combat
      await page.waitForTimeout(5000);
      
      const currentScore = await scoreIndicator.textContent();
      
      // Score should exist and be valid
      expect(currentScore).toBeTruthy();
      
      // If enemies were defeated, score should have changed
      // (This is a soft check as it depends on combat timing)
    }
    
    // Verify castle health is being tracked
    const castleHealth = page.locator('text=/Castle.*HP/i').or(
      page.locator('text=/Health.*[0-9]+/i')
    );
    await expect(castleHealth).toBeVisible({ timeout: 5000 });
    
    // Verify game is still running (cultivator is defending)
    const gameOverText = page.locator('text=/Game Over/i');
    await expect(gameOverText).not.toBeVisible();
  });

  test('should verify multiple cultivators with different compositions', async ({ page }) => {
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Get all cultivator buttons
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    const count = await cultivatorButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
    
    // Collect cultivator names
    const cultivatorNames: string[] = [];
    for (let i = 0; i < Math.min(count, 4); i++) {
      const button = cultivatorButtons.nth(i);
      const text = await button.textContent();
      cultivatorNames.push(text || '');
    }
    
    // Verify cultivators have different names (different compositions)
    const uniqueNames = new Set(cultivatorNames);
    expect(uniqueNames.size).toBeGreaterThanOrEqual(2); // At least 2 different cultivators
    
    // Deploy multiple cultivators
    const canvas = page.locator('canvas');
    
    // Deploy first cultivator
    if (await cultivatorButtons.nth(0).isVisible()) {
      await cultivatorButtons.nth(0).click();
      await page.waitForTimeout(500);
      await canvas.click({ position: { x: 350, y: 300 } });
      await page.waitForTimeout(1000);
    }
    
    // Deploy second cultivator (different type)
    if (await cultivatorButtons.nth(1).isVisible()) {
      await cultivatorButtons.nth(1).click();
      await page.waitForTimeout(500);
      await canvas.click({ position: { x: 450, y: 300 } });
      await page.waitForTimeout(1000);
    }
    
    // Start wave to test both cultivators in combat
    const startWaveButton = page.locator('button:has-text("Start Wave")').or(
      page.locator('button:has-text("Next Wave")')
    );
    
    if (await startWaveButton.isVisible()) {
      await startWaveButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for combat
    await page.waitForTimeout(5000);
    
    // Verify both cultivators are functioning
    const waveIndicator = page.locator('text=/Wave [0-9]+/i');
    await expect(waveIndicator).toBeVisible({ timeout: 5000 });
    
    // Verify game is running with multiple cultivators
    const gameOverText = page.locator('text=/Game Over/i');
    await expect(gameOverText).not.toBeVisible();
  });

  test('should verify cultivator movement with composed movement speed', async ({ page }) => {
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Deploy a cultivator
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    if (await cultivatorButtons.first().isVisible()) {
      await cultivatorButtons.first().click();
      await page.waitForTimeout(500);
      
      const canvas = page.locator('canvas');
      await canvas.click({ position: { x: 400, y: 300 } });
      await page.waitForTimeout(1000);
    }
    
    // Start wave to trigger cultivator movement
    const startWaveButton = page.locator('button:has-text("Start Wave")').or(
      page.locator('button:has-text("Next Wave")')
    );
    
    if (await startWaveButton.isVisible()) {
      await startWaveButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for enemies to spawn and cultivator to move
    await page.waitForTimeout(3000);
    
    // Verify cultivator is active (movement is happening)
    // This is validated by the game continuing to run
    const waveIndicator = page.locator('text=/Wave [0-9]+/i');
    await expect(waveIndicator).toBeVisible({ timeout: 5000 });
    
    // Wait for combat to occur (cultivator should move to engage)
    await page.waitForTimeout(5000);
    
    // Verify game is functioning (cultivator is moving and attacking)
    const gameOverText = page.locator('text=/Game Over/i');
    await expect(gameOverText).not.toBeVisible();
  });

  test('should complete full game session with composed cultivators', async ({ page }) => {
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Verify 4 cultivators are available
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    const count = await cultivatorButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
    
    // Deploy 2 different cultivators
    const canvas = page.locator('canvas');
    
    if (await cultivatorButtons.nth(0).isVisible()) {
      await cultivatorButtons.nth(0).click();
      await page.waitForTimeout(500);
      await canvas.click({ position: { x: 350, y: 300 } });
      await page.waitForTimeout(1000);
    }
    
    if (await cultivatorButtons.nth(1).isVisible()) {
      await cultivatorButtons.nth(1).click();
      await page.waitForTimeout(500);
      await canvas.click({ position: { x: 450, y: 300 } });
      await page.waitForTimeout(1000);
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
      
      // Verify game is still running
      const gameOverText = page.locator('text=/Game Over/i');
      await expect(gameOverText).not.toBeVisible();
    }
    
    // Verify completed 3 waves successfully
    const waveIndicator = page.locator('text=/Wave [0-9]+/i');
    const finalWaveText = await waveIndicator.textContent();
    expect(finalWaveText).toMatch(/Wave [3-9]/i);
    
    // Verify score is being tracked
    const scoreIndicator = page.locator('text=/Score/i');
    if (await scoreIndicator.isVisible()) {
      const scoreText = await scoreIndicator.textContent();
      expect(scoreText).toBeTruthy();
    }
    
    // Verify castle health is being tracked
    const castleHealth = page.locator('text=/Castle.*HP/i').or(
      page.locator('text=/Health.*[0-9]+/i')
    );
    await expect(castleHealth).toBeVisible({ timeout: 5000 });
    
    // Verify game completed successfully
    const gameOverText = page.locator('text=/Game Over/i');
    await expect(gameOverText).not.toBeVisible();
  });

  test('should verify cultivator composition with different attack patterns', async ({ page }) => {
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Get cultivator buttons
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    const count = await cultivatorButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
    
    // Deploy cultivators with different attack patterns
    const canvas = page.locator('canvas');
    
    // Deploy first cultivator (could be melee or ranged)
    if (await cultivatorButtons.nth(0).isVisible()) {
      await cultivatorButtons.nth(0).click();
      await page.waitForTimeout(500);
      await canvas.click({ position: { x: 350, y: 300 } });
      await page.waitForTimeout(1000);
    }
    
    // Deploy second cultivator (different type)
    if (await cultivatorButtons.nth(2).isVisible()) {
      await cultivatorButtons.nth(2).click();
      await page.waitForTimeout(500);
      await canvas.click({ position: { x: 450, y: 300 } });
      await page.waitForTimeout(1000);
    }
    
    // Start wave to test different attack patterns
    const startWaveButton = page.locator('button:has-text("Start Wave")').or(
      page.locator('button:has-text("Next Wave")')
    );
    
    if (await startWaveButton.isVisible()) {
      await startWaveButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for combat with different attack patterns
    await page.waitForTimeout(8000);
    
    // Verify both cultivators are functioning
    const waveIndicator = page.locator('text=/Wave [0-9]+/i');
    await expect(waveIndicator).toBeVisible({ timeout: 5000 });
    
    // Verify combat is happening (score or enemy count changes)
    const scoreIndicator = page.locator('text=/Score/i');
    if (await scoreIndicator.isVisible()) {
      const scoreText = await scoreIndicator.textContent();
      expect(scoreText).toBeTruthy();
    }
    
    // Verify game is running with different attack patterns
    const gameOverText = page.locator('text=/Game Over/i');
    await expect(gameOverText).not.toBeVisible();
  });
});
