import { test, expect } from '@playwright/test';

/**
 * End-to-end integration test for Map Wave Configuration System
 * Tests creating, updating, and deleting wave configurations via the admin dialog
 * Verifies validation, graph updates, and enemy allowlist functionality
 */

test.describe('Map Wave Configuration Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Admin Tool
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should create new wave configuration via dialog', async ({ page }) => {
    // Navigate to Maps tab
    const mapsTab = page.locator('button:has-text("Maps")');
    await expect(mapsTab).toBeVisible({ timeout: 10000 });
    await mapsTab.click();
    await page.waitForTimeout(1000);

    // Select the first available map
    const firstMap = page.locator('div:has(span:text("🗺️"))').first();
    await expect(firstMap).toBeVisible({ timeout: 5000 });
    await firstMap.click();
    await page.waitForTimeout(1000);

    // Click "Configure Waves" button
    const configureWavesButton = page.locator('button:has-text("Configure Waves")');
    await expect(configureWavesButton).toBeVisible({ timeout: 5000 });
    await configureWavesButton.click();

    // Verify dialog opened and wait for loading to complete
    const dialog = page.locator('text=🌊 Configure Waves');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    
    // Wait for the loading state to disappear (if present)
    const loadingText = page.locator('text=/Loading wave configuration/i');
    if (await loadingText.isVisible().catch(() => false)) {
      await expect(loadingText).not.toBeVisible({ timeout: 10000 });
    }
    
    // Wait for form fields to be visible and ready
    await page.waitForTimeout(2000);

    // Fill in wave configuration
    const wave1SpendInput = page.locator('label:has-text("Wave 1 Spend Limit")').locator('..').locator('input');
    await expect(wave1SpendInput).toBeVisible({ timeout: 10000 });
    await wave1SpendInput.fill('150');

    const enemiesPerWaveInput = page.locator('label:has-text("Enemies Per Wave")').locator('..').locator('input');
    await enemiesPerWaveInput.fill('15');

    // Select growth curve type
    const growthCurveSelect = page.locator('label:has-text("Growth Curve Type")').locator('..').locator('select');
    await growthCurveSelect.selectOption('exponential');

    // Wait for graph to update
    await page.waitForTimeout(500);

    // Verify graph is visible
    const graph = page.locator('text=📈 Wave Progression Preview');
    await expect(graph).toBeVisible();

    // Select at least one enemy type
    const enemyCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await enemyCheckboxes.count();
    
    if (checkboxCount > 0) {
      // Select the first enemy type
      await enemyCheckboxes.first().check();
      await page.waitForTimeout(300);
    }

    // Save the configuration
    const saveButton = page.locator('button:has-text("Save Configuration")');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await page.waitForTimeout(2000);

    // Verify success message appears
    const successMessage = page.locator('text=/saved successfully/i');
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Dialog should close after save
    await page.waitForTimeout(2000);
    await expect(dialog).not.toBeVisible();
  });

  test('should update existing wave configuration', async ({ page }) => {
    // Navigate to Maps tab
    await page.click('button:has-text("Maps")');
    await page.waitForTimeout(1000);

    // Select the first available map
    const firstMap = page.locator('div:has(span:text("🗺️"))').first();
    await expect(firstMap).toBeVisible({ timeout: 5000 });
    await firstMap.click();
    await page.waitForTimeout(1000);

    // Open wave config dialog
    await page.click('button:has-text("Configure Waves")');

    // Verify dialog opened and wait for loading to complete
    await expect(page.locator('text=🌊 Configure Waves')).toBeVisible({ timeout: 10000 });
    
    // Wait for the loading state to disappear (if present)
    const loadingText = page.locator('text=/Loading wave configuration/i');
    if (await loadingText.isVisible().catch(() => false)) {
      await expect(loadingText).not.toBeVisible({ timeout: 10000 });
    }
    
    // Wait for form fields to be visible and ready
    await page.waitForTimeout(2000);

    // Update wave 1 spend limit
    const wave1SpendInput = page.locator('label:has-text("Wave 1 Spend Limit")').locator('..').locator('input');
    await expect(wave1SpendInput).toBeVisible({ timeout: 10000 });
    await wave1SpendInput.fill('200');

    // Update enemies per wave
    const enemiesPerWaveInput = page.locator('label:has-text("Enemies Per Wave")').locator('..').locator('input');
    await enemiesPerWaveInput.fill('20');

    // Change growth curve to logarithmic
    const growthCurveSelect = page.locator('label:has-text("Growth Curve Type")').locator('..').locator('select');
    await growthCurveSelect.selectOption('logarithmic');

    await page.waitForTimeout(500);

    // Ensure at least one enemy is selected
    const enemyCheckboxes = page.locator('input[type="checkbox"]');
    const firstCheckbox = enemyCheckboxes.first();
    const isChecked = await firstCheckbox.isChecked();
    
    if (!isChecked) {
      await firstCheckbox.check();
      await page.waitForTimeout(300);
    }

    // Save the updated configuration
    const saveButton = page.locator('button:has-text("Save Configuration")');
    await saveButton.click();
    await page.waitForTimeout(2000);

    // Verify success message
    await expect(page.locator('text=/saved successfully/i')).toBeVisible({ timeout: 5000 });

    // Reopen dialog to verify changes persisted
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Configure Waves")');
    
    // Wait for dialog to reload
    await expect(page.locator('text=🌊 Configure Waves')).toBeVisible({ timeout: 10000 });
    const loadingText2 = page.locator('text=/Loading wave configuration/i');
    if (await loadingText2.isVisible().catch(() => false)) {
      await expect(loadingText2).not.toBeVisible({ timeout: 10000 });
    }
    await page.waitForTimeout(2000);

    // Verify updated values
    const updatedWave1Spend = await page.locator('label:has-text("Wave 1 Spend Limit")').locator('..').locator('input').inputValue();
    expect(updatedWave1Spend).toBe('200');

    const updatedEnemiesPerWave = await page.locator('label:has-text("Enemies Per Wave")').locator('..').locator('input').inputValue();
    expect(updatedEnemiesPerWave).toBe('20');

    const updatedGrowthCurve = await page.locator('label:has-text("Growth Curve Type")').locator('..').locator('select').inputValue();
    expect(updatedGrowthCurve).toBe('logarithmic');

    // Close dialog
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);
  });

  test('should display validation errors for invalid inputs', async ({ page }) => {
    // Navigate to Maps tab
    await page.click('button:has-text("Maps")');
    await page.waitForTimeout(1000);

    // Select the first available map
    const firstMap = page.locator('div:has(span:text("🗺️"))').first();
    await expect(firstMap).toBeVisible({ timeout: 5000 });
    await firstMap.click();
    await page.waitForTimeout(1000);

    // Open wave config dialog
    await page.click('button:has-text("Configure Waves")');

    // Wait for dialog to load completely
    await expect(page.locator('text=🌊 Configure Waves')).toBeVisible({ timeout: 10000 });
    
    // Wait for the loading state to disappear (if present)
    const loadingText = page.locator('text=/Loading wave configuration/i');
    if (await loadingText.isVisible().catch(() => false)) {
      await expect(loadingText).not.toBeVisible({ timeout: 10000 });
    }
    
    // Wait for form fields to be visible and ready
    await page.waitForTimeout(2000);

    // Test validation: Wave 1 spend limit too low
    const wave1SpendInput = page.locator('label:has-text("Wave 1 Spend Limit")').locator('..').locator('input');
    await expect(wave1SpendInput).toBeVisible({ timeout: 10000 });
    await wave1SpendInput.fill('5');

    // Test validation: Enemies per wave too low
    const enemiesPerWaveInput = page.locator('label:has-text("Enemies Per Wave")').locator('..').locator('input');
    await enemiesPerWaveInput.fill('0');

    // Uncheck all enemy types to trigger validation error
    const enemyCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await enemyCheckboxes.count();
    
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = enemyCheckboxes.nth(i);
      if (await checkbox.isChecked()) {
        await checkbox.uncheck();
      }
    }

    await page.waitForTimeout(500);

    // Try to save (should show validation errors)
    const saveButton = page.locator('button:has-text("Save Configuration")');
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Verify validation error messages appear
    const validationErrorSection = page.locator('text=/Please fix the following errors/i');
    await expect(validationErrorSection).toBeVisible({ timeout: 5000 });

    // Check for specific error messages
    await expect(page.locator('text=/Wave 1 spend limit must be at least 10/i')).toBeVisible();
    await expect(page.locator('text=/Enemies per wave must be at least 1/i')).toBeVisible();
    await expect(page.locator('text=/At least one enemy type must be selected/i')).toBeVisible();

    // Verify save button is disabled or dialog stays open
    const dialogStillOpen = await page.locator('text=🌊 Configure Waves').isVisible();
    expect(dialogStillOpen).toBe(true);

    // Close dialog
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);
  });

  test('should update graph when inputs change', async ({ page }) => {
    // Navigate to Maps tab
    await page.click('button:has-text("Maps")');
    await page.waitForTimeout(1000);

    // Select the first available map
    const firstMap = page.locator('div:has(span:text("🗺️"))').first();
    await expect(firstMap).toBeVisible({ timeout: 5000 });
    await firstMap.click();
    await page.waitForTimeout(1000);

    // Open wave config dialog
    await page.click('button:has-text("Configure Waves")');

    // Wait for dialog to load completely
    await expect(page.locator('text=🌊 Configure Waves')).toBeVisible({ timeout: 10000 });
    
    // Wait for the loading state to disappear (if present)
    const loadingText = page.locator('text=/Loading wave configuration/i');
    if (await loadingText.isVisible().catch(() => false)) {
      await expect(loadingText).not.toBeVisible({ timeout: 10000 });
    }
    
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Verify graph is visible
    const graph = page.locator('text=📈 Wave Progression Preview');
    await expect(graph).toBeVisible({ timeout: 10000 });

    // Verify graph shows growth curve type
    await expect(page.locator('text=/linear curve/i')).toBeVisible();

    // Change wave 1 spend limit
    const wave1SpendInput = page.locator('label:has-text("Wave 1 Spend Limit")').locator('..').locator('input');
    await wave1SpendInput.fill('300');
    await page.waitForTimeout(500);

    // Graph should still be visible (it updates in real-time)
    await expect(graph).toBeVisible();

    // Change growth curve type to exponential
    const growthCurveSelect = page.locator('label:has-text("Growth Curve Type")').locator('..').locator('select');
    await growthCurveSelect.selectOption('exponential');
    await page.waitForTimeout(500);

    // Verify graph updates to show exponential curve
    await expect(page.locator('text=/exponential curve/i')).toBeVisible();

    // Change to logarithmic
    await growthCurveSelect.selectOption('logarithmic');
    await page.waitForTimeout(500);

    // Verify graph updates to show logarithmic curve
    await expect(page.locator('text=/logarithmic curve/i')).toBeVisible();

    // Verify SVG graph element exists
    const svgGraph = page.locator('svg');
    await expect(svgGraph).toBeVisible();

    // Close dialog
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);
  });

  test('should handle enemy allowlist checkbox toggles', async ({ page }) => {
    // Navigate to Maps tab
    await page.click('button:has-text("Maps")');
    await page.waitForTimeout(1000);

    // Select the first available map
    const firstMap = page.locator('div:has(span:text("🗺️"))').first();
    await expect(firstMap).toBeVisible({ timeout: 5000 });
    await firstMap.click();
    await page.waitForTimeout(1000);

    // Open wave config dialog
    await page.click('button:has-text("Configure Waves")');

    // Wait for dialog to load completely
    await expect(page.locator('text=🌊 Configure Waves')).toBeVisible({ timeout: 10000 });
    
    // Wait for the loading state to disappear (if present)
    const loadingText = page.locator('text=/Loading wave configuration/i');
    if (await loadingText.isVisible().catch(() => false)) {
      await expect(loadingText).not.toBeVisible({ timeout: 10000 });
    }
    
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Verify enemy allowlist section is visible
    const allowlistSection = page.locator('text=Allowed Enemy Types');
    await expect(allowlistSection).toBeVisible({ timeout: 10000 });

    // Get all enemy checkboxes
    const enemyCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await enemyCheckboxes.count();

    if (checkboxCount > 0) {
      // Test checking first enemy
      const firstCheckbox = enemyCheckboxes.first();
      await firstCheckbox.check();
      await page.waitForTimeout(300);
      expect(await firstCheckbox.isChecked()).toBe(true);

      // Test checking second enemy if available
      if (checkboxCount > 1) {
        const secondCheckbox = enemyCheckboxes.nth(1);
        await secondCheckbox.check();
        await page.waitForTimeout(300);
        expect(await secondCheckbox.isChecked()).toBe(true);

        // Verify selection count updates
        const selectionCount = page.locator('text=/[0-9]+ of [0-9]+ selected/i');
        await expect(selectionCount).toBeVisible();

        // Test unchecking first enemy
        await firstCheckbox.uncheck();
        await page.waitForTimeout(300);
        expect(await firstCheckbox.isChecked()).toBe(false);

        // Second should still be checked
        expect(await secondCheckbox.isChecked()).toBe(true);
      }

      // Uncheck all to trigger validation warning
      for (let i = 0; i < checkboxCount; i++) {
        const checkbox = enemyCheckboxes.nth(i);
        if (await checkbox.isChecked()) {
          await checkbox.uncheck();
        }
      }

      await page.waitForTimeout(500);

      // Verify validation warning appears
      const validationWarning = page.locator('text=/At least one enemy type must be selected/i');
      await expect(validationWarning).toBeVisible();
    }

    // Close dialog
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);
  });

  test('should complete full wave configuration workflow', async ({ page }) => {
    // Step 1: Navigate to Maps tab
    await page.click('button:has-text("Maps")');
    await page.waitForTimeout(1000);

    // Step 2: Select the first available map
    const firstMap = page.locator('div:has(span:text("🗺️"))').first();
    await expect(firstMap).toBeVisible({ timeout: 5000 });
    await firstMap.click();
    await page.waitForTimeout(1000);

    // Step 3: Open wave configuration dialog
    await page.click('button:has-text("Configure Waves")');

    // Wait for dialog to load completely
    await expect(page.locator('text=🌊 Configure Waves')).toBeVisible({ timeout: 10000 });
    
    // Wait for the loading state to disappear (if present)
    const loadingText = page.locator('text=/Loading wave configuration/i');
    if (await loadingText.isVisible().catch(() => false)) {
      await expect(loadingText).not.toBeVisible({ timeout: 10000 });
    }
    
    // Wait for form fields to be visible and ready
    await page.waitForTimeout(2000);

    // Step 4: Configure wave settings
    const wave1SpendInput = page.locator('label:has-text("Wave 1 Spend Limit")').locator('..').locator('input');
    await expect(wave1SpendInput).toBeVisible({ timeout: 10000 });
    await wave1SpendInput.fill('250');
    await page.locator('label:has-text("Enemies Per Wave")').locator('..').locator('input').fill('25');
    await page.locator('label:has-text("Growth Curve Type")').locator('..').locator('select').selectOption('exponential');
    await page.waitForTimeout(500);

    // Step 5: Verify graph updates
    await expect(page.locator('text=📈 Wave Progression Preview')).toBeVisible();
    await expect(page.locator('text=/exponential curve/i')).toBeVisible();

    // Step 6: Select enemy types
    const enemyCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await enemyCheckboxes.count();
    
    if (checkboxCount > 0) {
      // Select first two enemies
      await enemyCheckboxes.first().check();
      if (checkboxCount > 1) {
        await enemyCheckboxes.nth(1).check();
      }
      await page.waitForTimeout(300);
    }

    // Step 7: Save configuration
    await page.click('button:has-text("Save Configuration")');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/saved successfully/i')).toBeVisible({ timeout: 5000 });

    // Step 8: Verify dialog closes
    await page.waitForTimeout(2000);
    await expect(page.locator('text=🌊 Configure Waves')).not.toBeVisible();

    // Step 9: Reopen and verify persistence
    await page.click('button:has-text("Configure Waves")');
    
    // Wait for dialog to reload
    await expect(page.locator('text=🌊 Configure Waves')).toBeVisible({ timeout: 10000 });
    const loadingText2 = page.locator('text=/Loading wave configuration/i');
    if (await loadingText2.isVisible().catch(() => false)) {
      await expect(loadingText2).not.toBeVisible({ timeout: 10000 });
    }
    await page.waitForTimeout(2000);

    const wave1Spend = await page.locator('label:has-text("Wave 1 Spend Limit")').locator('..').locator('input').inputValue();
    expect(wave1Spend).toBe('250');

    const enemiesPerWave = await page.locator('label:has-text("Enemies Per Wave")').locator('..').locator('input').inputValue();
    expect(enemiesPerWave).toBe('25');

    const growthCurve = await page.locator('label:has-text("Growth Curve Type")').locator('..').locator('select').inputValue();
    expect(growthCurve).toBe('exponential');

    // Verify at least one enemy is selected
    const checkedCheckboxes = page.locator('input[type="checkbox"]:checked');
    const checkedCount = await checkedCheckboxes.count();
    expect(checkedCount).toBeGreaterThan(0);

    // Close dialog
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);
  });
});
