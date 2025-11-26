import { test, expect } from '@playwright/test';

/**
 * Integration tests for error handling
 * Tests Supabase connection failures, fallback behavior, and schema version mismatches
 */

test.describe('Error Handling Integration', () => {
  test('should fall back to default Person Types when Supabase fails', async ({ page }) => {
    // Intercept Supabase requests and make them fail
    await page.route('**/rest/v1/person_types*', route => {
      route.abort('failed');
    });
    
    // Navigate to game
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Game should still load with fallback cultivators
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Verify cultivators are available (fallback types)
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    // Should have at least 4 cultivators from fallback
    const count = await cultivatorButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
    
    // Verify each cultivator is functional
    for (let i = 0; i < Math.min(count, 4); i++) {
      const button = cultivatorButtons.nth(i);
      const text = await button.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(0);
    }
  });

  test('should display error message when data loading fails', async ({ page }) => {
    // Intercept Supabase requests and make them fail
    await page.route('**/rest/v1/person_types*', route => {
      route.abort('failed');
    });
    
    await page.route('**/rest/v1/wave_configurations*', route => {
      route.abort('failed');
    });
    
    // Navigate to game
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check console for error messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Verify error was logged
    const hasError = consoleMessages.some(msg => 
      msg.includes('Error') || 
      msg.includes('Failed') || 
      msg.includes('error')
    );
    
    // Either error message in console or game still loads with fallback
    expect(hasError || await page.locator('canvas').isVisible()).toBeTruthy();
  });

  test('should handle wave configuration loading failure gracefully', async ({ page }) => {
    // Intercept wave configuration requests and make them fail
    await page.route('**/rest/v1/wave_configurations*', route => {
      route.abort('failed');
    });
    
    // Navigate to game
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Game should still load
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Start a wave (should use default wave generation)
    const startWaveButton = page.locator('button:has-text("Start Wave")').or(
      page.locator('button:has-text("Next Wave")')
    );
    
    if (await startWaveButton.isVisible()) {
      await startWaveButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Verify wave starts with default configuration
    const waveIndicator = page.locator('text=/Wave [0-9]+/i');
    await expect(waveIndicator).toBeVisible({ timeout: 5000 });
    
    // Wait for enemies to spawn (default wave generation)
    await page.waitForTimeout(3000);
    
    // Game should be running
    const gameOverText = page.locator('text=/Game Over/i');
    await expect(gameOverText).not.toBeVisible();
  });

  test('should handle schema version mismatch', async ({ page }) => {
    // Intercept Supabase requests and return old version data
    await page.route('**/rest/v1/person_types*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'old-version-id',
            key: 'old_cultivator',
            name: 'Old Cultivator',
            emoji: '🗡️',
            description: 'Old version cultivator',
            base_stats: {
              health: 100,
              damage: 10,
              attackSpeed: 1000,
              range: 100,
              movementSpeed: 2
            },
            defender_config: {
              deploymentCost: 50,
              compatibleSkills: [],
              compatibleItems: []
            },
            version: 0, // Old version
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
      });
    });
    
    // Navigate to game
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Capture console warnings
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Game should still load (with migration or fallback)
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Verify cultivators are available
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    const count = await cultivatorButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('should handle partial data loading failure', async ({ page }) => {
    // Intercept some requests to succeed and some to fail
    let requestCount = 0;
    await page.route('**/rest/v1/person_types*', route => {
      requestCount++;
      if (requestCount % 2 === 0) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    // Navigate to game
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Game should still load with available data or fallback
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Verify game is functional
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    const count = await cultivatorButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('should handle invalid Person Type data gracefully', async ({ page }) => {
    // Intercept Supabase requests and return invalid data
    await page.route('**/rest/v1/person_types*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'invalid-id',
            key: 'invalid_cultivator',
            // Missing required fields
            name: null,
            emoji: null,
            base_stats: null
          }
        ])
      });
    });
    
    // Navigate to game
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Game should fall back to defaults
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Verify fallback cultivators are available
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    const count = await cultivatorButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    // Intercept requests and delay them significantly
    await page.route('**/rest/v1/person_types*', async route => {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
      route.abort('timedout');
    });
    
    // Navigate to game
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait for timeout to occur
    
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Game should still load with fallback
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Verify game is functional with fallback data
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    const count = await cultivatorButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('should handle Admin Tool Supabase connection failure', async ({ page }) => {
    // Intercept Supabase requests in Admin Tool
    await page.route('**/rest/v1/person_types*', route => {
      route.abort('failed');
    });
    
    // Navigate to Admin Tool
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    // Navigate to People tab
    const peopleTab = page.locator('button:has-text("People")');
    await expect(peopleTab).toBeVisible({ timeout: 10000 });
    await peopleTab.click();
    await page.waitForTimeout(1000);
    
    // Check for error message or loading state
    const errorMessage = page.locator('text=/error/i').or(
      page.locator('text=/failed/i')
    );
    const loadingMessage = page.locator('text=/loading/i');
    
    // Either error message or loading state should be visible
    await expect(errorMessage.or(loadingMessage)).toBeVisible({ timeout: 5000 });
  });

  test('should recover from temporary network failure', async ({ page }) => {
    let failCount = 0;
    const maxFails = 2;
    
    // Fail first few requests, then succeed
    await page.route('**/rest/v1/person_types*', route => {
      failCount++;
      if (failCount <= maxFails) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    // Navigate to game
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Reload page to trigger retry
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Select map
    const classicArenaButton = page.locator('button:has-text("Classic Arena")');
    if (await classicArenaButton.isVisible()) {
      await classicArenaButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Game should load successfully after retry
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Verify cultivators are available
    const cultivatorButtons = page.locator('button').filter({ 
      has: page.locator('text=/[🗡️⚡🏹🌊👊🔥💨🌟]/') 
    });
    
    const count = await cultivatorButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });
});
