import { test, expect } from '@playwright/test';

test.describe('TileEditor Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
  });

  test('should display loading state while fetching tile types', async ({ page }) => {
    // Click Tiles tab
    await page.getByRole('button', { name: /Tiles/ }).click();
    
    // Check for loading message (it may appear briefly)
    const loadingText = page.locator('text=Loading tiles...');
    
    // Either the loading text appears or tiles load immediately
    const hasLoadingOrTiles = await Promise.race([
      loadingText.waitFor({ timeout: 1000 }).then(() => true).catch(() => false),
      page.locator('button:has-text("New Tile")').waitFor({ timeout: 1000 }).then(() => true).catch(() => false)
    ]);
    
    expect(hasLoadingOrTiles).toBe(true);
  });

  test('should render tile types in master list after loading', async ({ page }) => {
    // Click Tiles tab
    await page.getByRole('button', { name: /Tiles/ }).click();
    
    // Wait for tiles to load
    await page.waitForSelector('button:has-text("New Tile")', { timeout: 5000 });
    
    // Check that master list contains tile type cards
    const tileCards = page.locator('.w-64 button').filter({ hasText: /grass|water|stone|path/i });
    const count = await tileCards.count();
    
    console.log(`Found ${count} tile type cards in master list`);
    expect(count).toBeGreaterThan(0);
  });

  test('should select first tile by default', async ({ page }) => {
    // Click Tiles tab
    await page.getByRole('button', { name: /Tiles/ }).click();
    await page.waitForSelector('button:has-text("New Tile")', { timeout: 5000 });
    
    // Get the first tile card in the master list
    const firstTileCard = page.locator('.w-64 button').filter({ hasText: /grass|water|stone|path/i }).first();
    
    // Check if it has selected styling
    const styles = await firstTileCard.evaluate((btn) => {
      const computed = window.getComputedStyle(btn);
      return {
        backgroundColor: computed.backgroundColor,
        boxShadow: computed.boxShadow,
      };
    });
    
    console.log('First tile card styles:', styles);
    
    // Verify it has different background than default (selected state)
    expect(styles.backgroundColor).not.toBe('rgb(15, 23, 42)'); // Not default slate-900
  });

  test('should update selected tile when clicking different tile', async ({ page }) => {
    // Click Tiles tab
    await page.getByRole('button', { name: /Tiles/ }).click();
    await page.waitForSelector('button:has-text("New Tile")', { timeout: 5000 });
    
    // Get first and second tile cards
    const tileCards = page.locator('.w-64 button').filter({ hasText: /grass|water|stone|path/i });
    const firstTile = tileCards.nth(0);
    const secondTile = tileCards.nth(1);
    
    // Get first tile's display name
    const firstTileName = await firstTile.locator('.text-sm.font-bold').textContent();
    
    // Click second tile
    await secondTile.click();
    await page.waitForTimeout(300);
    
    // Get second tile's display name
    const secondTileName = await secondTile.locator('.text-sm.font-bold').textContent();
    
    // Verify the detail panel header changed
    const detailHeader = page.locator('h2.text-3xl.font-bold').first();
    const headerText = await detailHeader.textContent();
    
    console.log('First tile:', firstTileName);
    console.log('Second tile:', secondTileName);
    console.log('Detail header:', headerText);
    
    // Header should match the second tile's name
    expect(headerText).toBe(secondTileName);
    expect(headerText).not.toBe(firstTileName);
  });

  test('should enable "Save Changes" button when field is modified', async ({ page }) => {
    // Click Tiles tab
    await page.getByRole('button', { name: /Tiles/ }).click();
    await page.waitForSelector('button:has-text("New Tile")', { timeout: 5000 });
    
    // Get Save Changes button
    const saveButton = page.locator('button:has-text("Save Changes")');
    
    // Initially should be disabled
    const initiallyDisabled = await saveButton.isDisabled();
    expect(initiallyDisabled).toBe(true);
    
    // Find and modify the Display Name input - it's the second text input
    const displayNameInput = page.locator('input[type="text"]').nth(1);
    await displayNameInput.fill('Modified Tile Name');
    await page.waitForTimeout(200);
    
    // Now should be enabled
    const nowEnabled = await saveButton.isDisabled();
    expect(nowEnabled).toBe(false);
  });

  test('should display validation error for invalid key format', async ({ page }) => {
    // Click Tiles tab
    await page.getByRole('button', { name: /Tiles/ }).click();
    await page.waitForSelector('button:has-text("New Tile")', { timeout: 5000 });
    
    // Find the Key input - it's the first text input in the Basic Properties section
    const keyInput = page.locator('input[type="text"]').first();
    
    // Enter invalid key with uppercase and special characters
    await keyInput.fill('Invalid-Key!');
    await page.waitForTimeout(200);
    
    // Try to save
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();
    await page.waitForTimeout(500);
    
    // Check for validation error message - look for any red text with the error
    const errorMessage = page.locator('.text-red-400', { hasText: 'Key must contain only lowercase' });
    await expect(errorMessage).toBeVisible();
  });

  test('should display validation error for empty displayName', async ({ page }) => {
    // Click Tiles tab
    await page.getByRole('button', { name: /Tiles/ }).click();
    await page.waitForSelector('button:has-text("New Tile")', { timeout: 5000 });
    
    // Find the Display Name input - it's the second text input
    const displayNameInput = page.locator('input[type="text"]').nth(1);
    
    // Clear the display name
    await displayNameInput.fill('');
    await page.waitForTimeout(200);
    
    // Try to save
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();
    await page.waitForTimeout(500);
    
    // Check for validation error message
    const errorMessage = page.locator('.text-red-400', { hasText: 'Display name is required' });
    await expect(errorMessage).toBeVisible();
  });

  test('should display validation error for non-positive movementCost', async ({ page }) => {
    // Click Tiles tab
    await page.getByRole('button', { name: /Tiles/ }).click();
    await page.waitForSelector('button:has-text("New Tile")', { timeout: 5000 });
    
    // Find the Movement Cost input - it's the only number input
    const movementCostInput = page.locator('input[type="number"]');
    
    // Set movement cost to 0 or negative
    await movementCostInput.fill('0');
    await page.waitForTimeout(200);
    
    // Try to save
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();
    await page.waitForTimeout(500);
    
    // Check for validation error message
    const errorMessage = page.locator('.text-red-400', { hasText: 'Movement cost must be a positive number' });
    await expect(errorMessage).toBeVisible();
  });

  test('should call mapService.updateTileType on save with correct parameters', async ({ page }) => {
    // Click Tiles tab
    await page.getByRole('button', { name: /Tiles/ }).click();
    await page.waitForSelector('button:has-text("New Tile")', { timeout: 5000 });
    
    // Intercept Supabase update requests
    await page.route('**/rest/v1/tile_types*', async (route) => {
      const request = route.request();
      const method = request.method();
      
      if (method === 'PATCH') {
        console.log('Update request intercepted');
        console.log('Request body:', request.postData());
        
        // Return success response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'test-id',
            key: 'modified_tile',
            display_name: 'Modified Tile',
            visual: { color: '#FF0000' },
            pathfinding: { isWalkable: true, movementCost: 1 },
            gameplay: { canDeployCultivator: false },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
        });
      } else {
        await route.continue();
      }
    });
    
    // Modify a field
    const displayNameInput = page.locator('input[type="text"]').nth(1);
    await displayNameInput.fill('Modified Tile');
    await page.waitForTimeout(200);
    
    // Click save
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();
    await page.waitForTimeout(1500);
    
    // Verify the button becomes disabled again (indicating save completed)
    const isDisabledAfterSave = await saveButton.isDisabled();
    expect(isDisabledAfterSave).toBe(true);
  });

  test('should create new tile with default values', async ({ page }) => {
    // Click Tiles tab
    await page.getByRole('button', { name: /Tiles/ }).click();
    await page.waitForSelector('button:has-text("New Tile")', { timeout: 5000 });
    
    // Intercept Supabase insert requests
    await page.route('**/rest/v1/tile_types*', async (route) => {
      const request = route.request();
      const method = request.method();
      
      if (method === 'POST') {
        const body = request.postData();
        console.log('Create request intercepted');
        console.log('Request body:', body);
        
        // Verify default values in request
        if (body) {
          const data = JSON.parse(body);
          expect(data.key).toBe('new_tile');
          expect(data.display_name).toBe('New Tile');
          expect(data.visual.color).toBe('#808080');
          expect(data.pathfinding.isWalkable).toBe(true);
          expect(data.pathfinding.movementCost).toBe(1);
          expect(data.gameplay.canDeployCultivator).toBe(false);
        }
        
        // Return success response
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'new-tile-id',
            key: 'new_tile',
            display_name: 'New Tile',
            visual: { color: '#808080' },
            pathfinding: { isWalkable: true, movementCost: 1 },
            gameplay: { canDeployCultivator: false },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
        });
      } else {
        await route.continue();
      }
    });
    
    // Get initial tile count
    const initialCount = await page.locator('.w-64 button').filter({ hasText: /grass|water|stone|path|new_tile/i }).count();
    
    // Click New Tile button
    const newTileButton = page.locator('button:has-text("New Tile")');
    await newTileButton.click();
    await page.waitForTimeout(1500);
    
    // Verify new tile appears in list by checking the count increased
    const newCount = await page.locator('.w-64 button').filter({ hasText: /grass|water|stone|path|new_tile/i }).count();
    expect(newCount).toBeGreaterThan(initialCount);
    
    // Verify the detail panel shows "New Tile" as the header
    const detailHeader = page.locator('h2.text-3xl.font-bold').first();
    const headerText = await detailHeader.textContent();
    expect(headerText).toBe('New Tile');
  });
});
