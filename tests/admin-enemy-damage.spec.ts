import { test, expect } from '@playwright/test';

test.describe('Admin Enemy Damage Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
  });

  test('enemy editor should display damage field', async ({ page }) => {
    // Navigate to Enemies tab
    await page.click('button:has-text("Enemies")');
    await page.waitForTimeout(500);
    
    // Select first enemy (Crimson Demon)
    const firstEnemy = page.locator('.selectable-card').first();
    await firstEnemy.click();
    await page.waitForTimeout(300);
    
    // Verify damage input field exists
    const damageLabel = page.locator('label:has-text("Damage (per attack)")');
    await expect(damageLabel).toBeVisible();
    
    // Get the damage input
    const damageInput = page.locator('input[type="number"]').filter({ 
      has: page.locator('xpath=preceding-sibling::label[contains(text(), "Damage")]') 
    }).first();
    
    // Verify damage input has a value greater than 0
    const damageValue = await damageInput.inputValue();
    expect(parseInt(damageValue)).toBeGreaterThan(0);
  });

  test('all enemies should have damage values configured', async ({ page }) => {
    // Navigate to Enemies tab
    await page.click('button:has-text("Enemies")');
    await page.waitForTimeout(500);
    
    // Get all enemy cards
    const enemyCards = page.locator('.selectable-card');
    const enemyCount = await enemyCards.count();
    
    // Check each enemy has damage configured
    for (let i = 0; i < enemyCount; i++) {
      await enemyCards.nth(i).click();
      await page.waitForTimeout(300);
      
      // Find damage input by looking for the label first
      const damageLabel = page.locator('label:has-text("Damage (per attack)")');
      await expect(damageLabel).toBeVisible();
      
      // Get damage value from the input following the label
      const damageInput = damageLabel.locator('xpath=following-sibling::input').first();
      const damageValue = await damageInput.inputValue();
      
      expect(parseInt(damageValue)).toBeGreaterThan(0);
    }
  });

  test('damage field should be editable', async ({ page }) => {
    // Navigate to Enemies tab
    await page.click('button:has-text("Enemies")');
    await page.waitForTimeout(500);
    
    // Select first enemy
    const firstEnemy = page.locator('.selectable-card').first();
    await firstEnemy.click();
    await page.waitForTimeout(300);
    
    // Find and edit damage input
    const damageLabel = page.locator('label:has-text("Damage (per attack)")');
    const damageInput = damageLabel.locator('xpath=following-sibling::input').first();
    
    // Clear and set new value
    await damageInput.fill('15');
    await page.waitForTimeout(200);
    
    // Verify value changed
    const newValue = await damageInput.inputValue();
    expect(newValue).toBe('15');
    
    // Verify export button is enabled (indicates changes detected)
    const exportButton = page.locator('button:has-text("Export Config")');
    await expect(exportButton).toBeEnabled();
  });

  test('scaled stats preview should show damage', async ({ page }) => {
    // Navigate to Enemies tab
    await page.click('button:has-text("Enemies")');
    await page.waitForTimeout(500);
    
    // Select first enemy
    const firstEnemy = page.locator('.selectable-card').first();
    await firstEnemy.click();
    await page.waitForTimeout(300);
    
    // Check Wave 10 preview has damage
    const wave10Preview = page.locator('text=Scaled Stats (Wave 10)').locator('..');
    const wave10Damage = wave10Preview.locator('text=Damage:');
    await expect(wave10Damage).toBeVisible();
    
    // Check Wave 20 preview has damage
    const wave20Preview = page.locator('text=Scaled Stats (Wave 20)').locator('..');
    const wave20Damage = wave20Preview.locator('text=Damage:');
    await expect(wave20Damage).toBeVisible();
  });
});
