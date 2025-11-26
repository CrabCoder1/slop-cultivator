import { test, expect } from '@playwright/test';

test.describe('Cultivator Regeneration', () => {
  test('should regenerate cultivators when starting a new game', async ({ page }) => {
    // Navigate to the game
    await page.goto('http://localhost:5173');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Select a map to start the game
    await page.click('button:has-text("Forest Path")');
    
    // Wait for game to load
    await page.waitForTimeout(1000);
    
    // Get the initial cultivator options by checking the tower selector
    const initialCultivators = await page.evaluate(() => {
      // Find all cultivator buttons in the tower selector
      const buttons = Array.from(document.querySelectorAll('[data-testid^="tower-button-"]'));
      return buttons.map(btn => {
        const nameEl = btn.querySelector('[data-testid="tower-name"]');
        const emojiEl = btn.querySelector('[data-testid="tower-emoji"]');
        return {
          name: nameEl?.textContent || '',
          emoji: emojiEl?.textContent || '',
        };
      });
    });
    
    console.log('Initial cultivators:', initialCultivators);
    expect(initialCultivators.length).toBe(4);
    
    // Reset the game
    await page.click('button[aria-label="Settings"]');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Reset Game")');
    await page.waitForTimeout(1000);
    
    // Get the cultivator options after reset
    const regeneratedCultivators = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('[data-testid^="tower-button-"]'));
      return buttons.map(btn => {
        const nameEl = btn.querySelector('[data-testid="tower-name"]');
        const emojiEl = btn.querySelector('[data-testid="tower-emoji"]');
        return {
          name: nameEl?.textContent || '',
          emoji: emojiEl?.textContent || '',
        };
      });
    });
    
    console.log('Regenerated cultivators:', regeneratedCultivators);
    expect(regeneratedCultivators.length).toBe(4);
    
    // Verify that at least some cultivators are different
    // (There's a small chance they could be the same, but very unlikely with random generation)
    const allSame = initialCultivators.every((initial, index) => {
      const regenerated = regeneratedCultivators[index];
      return initial.name === regenerated.name && initial.emoji === regenerated.emoji;
    });
    
    // It's statistically very unlikely that all 4 cultivators would be identical
    // after regeneration, so this should pass
    expect(allSame).toBe(false);
  });
  
  test('should regenerate cultivators when quitting to map and starting new game', async ({ page }) => {
    // Navigate to the game
    await page.goto('http://localhost:5173');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Select a map to start the game
    await page.click('button:has-text("Forest Path")');
    await page.waitForTimeout(1000);
    
    // Get the initial cultivator options
    const initialCultivators = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('[data-testid^="tower-button-"]'));
      return buttons.map(btn => {
        const nameEl = btn.querySelector('[data-testid="tower-name"]');
        const emojiEl = btn.querySelector('[data-testid="tower-emoji"]');
        return {
          name: nameEl?.textContent || '',
          emoji: emojiEl?.textContent || '',
        };
      });
    });
    
    console.log('Initial cultivators:', initialCultivators);
    
    // Quit to map
    await page.click('button[aria-label="Settings"]');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Quit to Map")');
    await page.waitForTimeout(1000);
    
    // Start a new game
    await page.click('button:has-text("Forest Path")');
    await page.waitForTimeout(1000);
    
    // Get the cultivator options after starting new game
    const newGameCultivators = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('[data-testid^="tower-button-"]'));
      return buttons.map(btn => {
        const nameEl = btn.querySelector('[data-testid="tower-name"]');
        const emojiEl = btn.querySelector('[data-testid="tower-emoji"]');
        return {
          name: nameEl?.textContent || '',
          emoji: emojiEl?.textContent || '',
        };
      });
    });
    
    console.log('New game cultivators:', newGameCultivators);
    
    // Verify that at least some cultivators are different
    const allSame = initialCultivators.every((initial, index) => {
      const newGame = newGameCultivators[index];
      return initial.name === newGame.name && initial.emoji === newGame.emoji;
    });
    
    expect(allSame).toBe(false);
  });
});
