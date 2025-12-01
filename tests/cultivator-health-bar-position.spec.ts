/**
 * Cultivator Health Bar Position Tests
 * 
 * IMPORTANT: This test targets the GAME application on port 5173, NOT the admin tool on 5177.
 * The default Playwright config uses baseURL 5177 for admin tests.
 * These tests explicitly use http://localhost:5173 for the game.
 * 
 * Purpose: RCA investigation for health bar positioning issue.
 * The health bar must be positioned WITHIN the 30px cultivator cell, not extending below it.
 */

import { test, expect } from '@playwright/test';

// Game runs on port 5173, NOT 5177 (admin)
const GAME_URL = 'http://localhost:5173';

test.describe('Cultivator Health Bar Position RCA', () => {
  
  test('investigate health bar DOM structure and computed styles', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.waitForTimeout(2000);
    
    // Handle auth screen - click "Play as Guest"
    const guestButton = page.locator('button:has-text("Play as Guest")');
    if (await guestButton.count() > 0) {
      await guestButton.click();
      await page.waitForTimeout(2000);
      console.log('Clicked Play as Guest');
    }
    
    // Select a map - find any map button (they contain emoji like 🗺️)
    const mapButtons = page.locator('button').filter({ hasText: /🗺️/ });
    const mapCount = await mapButtons.count();
    console.log('Found map buttons:', mapCount);
    
    if (mapCount > 0) {
      await mapButtons.first().click();
      await page.waitForTimeout(2000);
      console.log('Clicked map button');
    }
    
    // Take screenshot of game board before deploying
    await page.screenshot({ path: 'test-results/game-board-ready.png', fullPage: true });
    
    // Get viewport size to calculate click positions
    const viewport = page.viewportSize();
    console.log('Viewport:', viewport);
    
    // Debug: List all buttons on the page
    const allButtons = page.locator('button');
    const allButtonCount = await allButtons.count();
    console.log('Total buttons on page:', allButtonCount);
    
    for (let i = 0; i < Math.min(allButtonCount, 10); i++) {
      const btnText = await allButtons.nth(i).textContent();
      console.log(`Button ${i}: "${btnText?.substring(0, 50)}"`);
    }
    
    // Look for cultivator selection buttons in the bottom panel
    const cultivatorButtons = page.locator('button').filter({ hasText: /⚡/ });
    const buttonCount = await cultivatorButtons.count();
    console.log('Found cultivator buttons with ⚡:', buttonCount);
    
    if (buttonCount > 0 && viewport) {
      // Click first cultivator type to select it
      await cultivatorButtons.first().click();
      await page.waitForTimeout(500);
      console.log('Selected cultivator type');
      
      // Take screenshot to see current state
      await page.screenshot({ path: 'test-results/after-cultivator-select.png', fullPage: true });
      
      // Click in the deployment zone (bottom area of game board)
      // The game board is in the center, deployment zone is bottom 40%
      const deployX = viewport.width * 0.4;
      const deployY = viewport.height * 0.55;
      console.log('Clicking to deploy at:', { deployX, deployY });
      await page.mouse.click(deployX, deployY);
      await page.waitForTimeout(1000);
      
      // Take screenshot after first deploy attempt
      await page.screenshot({ path: 'test-results/after-first-deploy.png', fullPage: true });
      
      // Check if any cultivators appeared
      const groupElements = await page.locator('.group.absolute').count();
      console.log('Group elements after deploy:', groupElements);
      
      // Deploy a second cultivator directly below
      await cultivatorButtons.first().click();
      await page.waitForTimeout(300);
      const deployY2 = viewport.height * 0.65;
      await page.mouse.click(deployX, deployY2);
      await page.waitForTimeout(1000);
      
      // Take screenshot after second deploy
      await page.screenshot({ path: 'test-results/after-second-deploy.png', fullPage: true });
    }
    
    // Take screenshot after deploying
    await page.screenshot({ path: 'test-results/game-cultivators-deployed.png', fullPage: true });
    
    // Now analyze the DOM structure
    const domAnalysis = await page.evaluate(() => {
      // Find cultivator containers - they have 'group' class and absolute positioning
      const allGroups = document.querySelectorAll('.group.absolute');
      const results: any[] = [];
      
      allGroups.forEach((container, index) => {
        const containerRect = container.getBoundingClientRect();
        const containerComputed = window.getComputedStyle(container);
        
        // Skip if not a cultivator container (check for transform)
        if (!containerComputed.transform || containerComputed.transform === 'none') return;
        if (containerRect.width < 10 || containerRect.height < 10) return;
        
        // Find health bar (bg-red-900) within this container
        const healthBar = container.querySelector('.bg-red-900');
        let healthBarData = null;
        
        if (healthBar) {
          const healthBarRect = healthBar.getBoundingClientRect();
          const healthBarComputed = window.getComputedStyle(healthBar);
          
          healthBarData = {
            className: (healthBar as HTMLElement).className,
            rect: {
              top: healthBarRect.top,
              bottom: healthBarRect.bottom,
              left: healthBarRect.left,
              width: healthBarRect.width,
              height: healthBarRect.height
            },
            computed: {
              position: healthBarComputed.position,
              top: healthBarComputed.top,
              bottom: healthBarComputed.bottom,
              left: healthBarComputed.left,
              transform: healthBarComputed.transform,
            },
            exceedsContainer: healthBarRect.bottom > containerRect.bottom,
            excessPixels: healthBarRect.bottom - containerRect.bottom
          };
        }
        
        // Find XP bar (bg-gray-700) - this is at -bottom-4 which is OUTSIDE container
        const xpBar = container.querySelector('.bg-gray-700');
        let xpBarData = null;
        
        if (xpBar) {
          const xpBarRect = xpBar.getBoundingClientRect();
          xpBarData = {
            className: (xpBar as HTMLElement).className,
            rect: {
              top: xpBarRect.top,
              bottom: xpBarRect.bottom,
            },
            exceedsContainer: xpBarRect.bottom > containerRect.bottom,
            excessPixels: xpBarRect.bottom - containerRect.bottom
          };
        }
        
        results.push({
          index,
          container: {
            className: container.className,
            rect: {
              top: containerRect.top,
              bottom: containerRect.bottom,
              left: containerRect.left,
              width: containerRect.width,
              height: containerRect.height
            },
            computed: {
              position: containerComputed.position,
              top: containerComputed.top,
              left: containerComputed.left,
              width: containerComputed.width,
              height: containerComputed.height,
              transform: containerComputed.transform,
            }
          },
          healthBar: healthBarData,
          xpBar: xpBarData
        });
      });
      
      return results;
    });
    
    console.log('=== CULTIVATOR DOM ANALYSIS ===');
    console.log(JSON.stringify(domAnalysis, null, 2));
    
    // Verify no violations - both health bar and XP bar must be inside container
    for (const cult of domAnalysis) {
      if (cult.healthBar?.exceedsContainer) {
        console.log(`VIOLATION: Container ${cult.index} health bar exceeds by ${cult.healthBar.excessPixels.toFixed(2)}px`);
      }
      if (cult.xpBar?.exceedsContainer) {
        console.log(`VIOLATION: Container ${cult.index} XP bar exceeds by ${cult.xpBar.excessPixels.toFixed(2)}px`);
      }
      
      // Assert health bar is inside container
      expect(cult.healthBar?.exceedsContainer).toBe(false);
      // Assert XP bar is inside container  
      expect(cult.xpBar?.exceedsContainer).toBe(false);
    }
    
    console.log('✓ All UI elements are within the 30px cell bounds');
  });

});
