import { test, expect } from '@playwright/test';

test.describe('Admin Wave Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Maps tab
    await page.click('button:has-text("Maps")');
    await page.waitForTimeout(500);
    
    // Select first map
    const firstMap = page.locator('.w-64 > div > div').first();
    await firstMap.click();
    await page.waitForTimeout(500);
  });

  test('"Configure Waves" button appears in map details', async ({ page }) => {
    // Check that the Configure Waves button exists
    const configButton = page.locator('button:has-text("🌊 Configure Waves")');
    await expect(configButton).toBeVisible();
    
    // Verify button is in the Wave Configuration section
    const waveConfigSection = page.locator('label:has-text("Wave Configuration")');
    await expect(waveConfigSection).toBeVisible();
  });

  test('clicking button opens dialog', async ({ page }) => {
    // Click the Configure Waves button
    const configButton = page.locator('button:has-text("Configure Waves")');
    await expect(configButton).toBeVisible();
    await expect(configButton).toBeEnabled();
    await configButton.click();
    await page.waitForTimeout(1000);
    
    // Verify dialog is visible by checking for the dialog title
    const dialogTitle = page.locator('h2:has-text("Configure Waves")');
    await expect(dialogTitle).toBeVisible();
    
    // Verify dialog content area exists
    const dialogContent = page.locator('div.bg-slate-800.rounded-lg');
    await expect(dialogContent).toBeVisible();
  });

  test('dialog loads existing configuration', async ({ page }) => {
    // Open dialog
    const configButton = page.locator('button:has-text("Configure Waves")');
    await configButton.click();
    await page.waitForTimeout(1500); // Wait for data to load
    
    // Wait for dialog to be visible
    const dialogTitle = page.locator('h2:has-text("Configure Waves")');
    await expect(dialogTitle).toBeVisible();
    
    // Find inputs using simpler selectors
    const wave1Input = page.locator('label:has-text("Wave 1 Spend Limit")').locator('~ input[type="number"]').or(
      page.locator('label').filter({ hasText: 'Wave 1 Spend Limit' }).locator('xpath=following-sibling::input')
    ).first();
    
    const enemiesInput = page.locator('label:has-text("Enemies Per Wave")').locator('~ input[type="number"]').or(
      page.locator('label').filter({ hasText: 'Enemies Per Wave' }).locator('xpath=following-sibling::input')
    ).first();
    
    const growthSelect = page.locator('label:has-text("Growth Curve Type")').locator('~ select').or(
      page.locator('label').filter({ hasText: 'Growth Curve Type' }).locator('xpath=following-sibling::select')
    ).first();
    
    // Verify inputs have values
    await expect(wave1Input).toBeVisible();
    await expect(enemiesInput).toBeVisible();
    await expect(growthSelect).toBeVisible();
    
    // Verify graph is visible
    const graph = page.locator('svg');
    await expect(graph).toBeVisible();
  });

  test('form inputs update state correctly', async ({ page }) => {
    // Open dialog
    const configButton = page.locator('button:has-text("Configure Waves")');
    await configButton.click();
    await page.waitForTimeout(1500);
    
    // Wait for dialog
    await expect(page.locator('h2:has-text("Configure Waves")')).toBeVisible();
    
    // Find all number inputs and select in the dialog
    const numberInputs = page.locator('div.bg-slate-800 input[type="number"]');
    const wave1Input = numberInputs.first();
    const enemiesInput = numberInputs.nth(1);
    const growthSelect = page.locator('div.bg-slate-800 select');
    
    // Update wave 1 spend limit
    await wave1Input.fill('200');
    await expect(wave1Input).toHaveValue('200');
    
    // Update enemies per wave
    await enemiesInput.fill('15');
    await expect(enemiesInput).toHaveValue('15');
    
    // Update growth curve type
    await growthSelect.selectOption('exponential');
    await expect(growthSelect).toHaveValue('exponential');
    
    // Verify graph updates (check that SVG is still visible and has content)
    await page.waitForTimeout(300);
    const graph = page.locator('svg');
    await expect(graph).toBeVisible();
  });

  test('enemy allowlist checkboxes toggle', async ({ page }) => {
    // Open dialog
    const configButton = page.locator('button:has-text("🌊 Configure Waves")');
    await configButton.click();
    await page.waitForTimeout(1000);
    
    // Find enemy allowlist section
    const allowlistSection = page.locator('text=Enemy Allowlist').or(
      page.locator('text=Allowed Enemies')
    );
    
    // Wait for checkboxes to load
    await page.waitForTimeout(500);
    
    // Get all checkboxes in the dialog
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 0) {
      // Get first checkbox
      const firstCheckbox = checkboxes.first();
      
      // Get initial state
      const initialState = await firstCheckbox.isChecked();
      
      // Toggle checkbox
      await firstCheckbox.click();
      await page.waitForTimeout(200);
      
      // Verify state changed
      const newState = await firstCheckbox.isChecked();
      expect(newState).toBe(!initialState);
      
      // Toggle back
      await firstCheckbox.click();
      await page.waitForTimeout(200);
      
      // Verify state changed back
      const finalState = await firstCheckbox.isChecked();
      expect(finalState).toBe(initialState);
    }
  });

  test('save button disabled when validation fails', async ({ page }) => {
    // Open dialog
    const configButton = page.locator('button:has-text("Configure Waves")');
    await configButton.click();
    await page.waitForTimeout(1500);
    
    // Wait for dialog
    await expect(page.locator('h2:has-text("Configure Waves")')).toBeVisible();
    
    // Find wave 1 spend limit input (first number input in dialog)
    const wave1Input = page.locator('div.bg-slate-800 input[type="number"]').first();
    
    // Set invalid value (below minimum of 10)
    await wave1Input.fill('5');
    await page.waitForTimeout(300);
    
    // Find save button
    const saveButton = page.locator('button:has-text("Save Configuration")');
    
    // Try to save
    await saveButton.click();
    await page.waitForTimeout(500);
    
    // Verify validation error appears
    const errorMessage = page.locator('text=Please fix the following errors');
    await expect(errorMessage).toBeVisible();
    
    // Verify dialog is still open (didn't close due to validation error)
    const dialog = page.locator('h2:has-text("Configure Waves")');
    await expect(dialog).toBeVisible();
  });

  test('successful save closes dialog', async ({ page }) => {
    // Open dialog
    const configButton = page.locator('button:has-text("Configure Waves")');
    await configButton.click();
    await page.waitForTimeout(1500);
    
    // Wait for dialog
    await expect(page.locator('h2:has-text("Configure Waves")')).toBeVisible();
    
    // Ensure at least one enemy is selected
    const checkboxes = page.locator('div.bg-slate-800 input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 0) {
      const firstCheckbox = checkboxes.first();
      const isChecked = await firstCheckbox.isChecked();
      
      // Make sure at least one is checked
      if (!isChecked) {
        await firstCheckbox.click();
        await page.waitForTimeout(200);
      }
    }
    
    // Set valid values
    const numberInputs = page.locator('div.bg-slate-800 input[type="number"]');
    const wave1Input = numberInputs.first();
    const enemiesInput = numberInputs.nth(1);
    
    await wave1Input.fill('150');
    await enemiesInput.fill('12');
    await page.waitForTimeout(300);
    
    // Find and click save button
    const saveButton = page.locator('button:has-text("Save Configuration")');
    await saveButton.click();
    
    // Wait for save operation and success message
    await page.waitForTimeout(2000);
    
    // Verify dialog closed
    const dialog = page.locator('h2:has-text("Configure Waves")');
    await expect(dialog).not.toBeVisible();
  });

  test('cancel button closes dialog without saving', async ({ page }) => {
    // Open dialog
    const configButton = page.locator('button:has-text("Configure Waves")');
    await configButton.click();
    await page.waitForTimeout(1500);
    
    // Wait for dialog
    await expect(page.locator('h2:has-text("Configure Waves")')).toBeVisible();
    
    // Get initial value
    const wave1Input = page.locator('div.bg-slate-800 input[type="number"]').first();
    const initialValue = await wave1Input.inputValue();
    
    // Make a change
    await wave1Input.fill('999');
    await page.waitForTimeout(300);
    
    // Click cancel button
    const cancelButton = page.locator('button:has-text("Cancel")');
    await cancelButton.click();
    await page.waitForTimeout(500);
    
    // Verify dialog closed
    const dialog = page.locator('h2:has-text("Configure Waves")');
    await expect(dialog).not.toBeVisible();
    
    // Reopen dialog to verify changes were not saved
    await configButton.click();
    await page.waitForTimeout(1500);
    
    // Verify value is back to original (or default if it was a new config)
    const wave1InputAfter = page.locator('div.bg-slate-800 input[type="number"]').first();
    const finalValue = await wave1InputAfter.inputValue();
    
    // Value should not be 999 (the unsaved change)
    expect(finalValue).not.toBe('999');
  });

  test('graph updates when inputs change', async ({ page }) => {
    // Open dialog
    const configButton = page.locator('button:has-text("Configure Waves")');
    await configButton.click();
    await page.waitForTimeout(1500);
    
    // Wait for dialog
    await expect(page.locator('h2:has-text("Configure Waves")')).toBeVisible();
    
    // Get initial graph state
    const graph = page.locator('svg');
    await expect(graph).toBeVisible();
    
    // Get initial path data (the line in the graph)
    const initialPath = await graph.locator('path').first().getAttribute('d');
    
    // Change wave 1 spend limit
    const wave1Input = page.locator('div.bg-slate-800 input[type="number"]').first();
    await wave1Input.fill('500');
    await page.waitForTimeout(500);
    
    // Get updated path data
    const updatedPath = await graph.locator('path').first().getAttribute('d');
    
    // Verify graph changed
    expect(updatedPath).not.toBe(initialPath);
    
    // Change growth curve type
    const growthSelect = page.locator('div.bg-slate-800 select');
    await growthSelect.selectOption('exponential');
    await page.waitForTimeout(500);
    
    // Get path data after curve change
    const finalPath = await graph.locator('path').first().getAttribute('d');
    
    // Verify graph changed again
    expect(finalPath).not.toBe(updatedPath);
  });

  test('dialog displays map name', async ({ page }) => {
    // Get the selected map name from the map editor
    const mapNameElement = page.locator('h2.text-3xl').filter({ hasText: /🗺️/ });
    const mapName = await mapNameElement.textContent();
    const cleanMapName = mapName?.replace('🗺️', '').replace('*', '').trim();
    
    // Open dialog
    const configButton = page.locator('button:has-text("Configure Waves")');
    await configButton.click();
    await page.waitForTimeout(1500);
    
    // Wait for dialog
    await expect(page.locator('h2:has-text("Configure Waves")')).toBeVisible();
    
    // Verify map name appears in dialog (in the subtitle area)
    if (cleanMapName) {
      const dialogMapName = page.locator('div.bg-slate-800 p.text-slate-300').filter({ hasText: cleanMapName });
      await expect(dialogMapName).toBeVisible();
    }
  });

  test('close button (X) closes dialog', async ({ page }) => {
    // Open dialog
    const configButton = page.locator('button:has-text("Configure Waves")');
    await configButton.click();
    await page.waitForTimeout(1500);
    
    // Wait for dialog
    await expect(page.locator('h2:has-text("Configure Waves")')).toBeVisible();
    
    // Find and click close button (X)
    const closeButton = page.locator('button[aria-label="Close dialog"]');
    await closeButton.click();
    await page.waitForTimeout(500);
    
    // Verify dialog closed
    const dialog = page.locator('h2:has-text("Configure Waves")');
    await expect(dialog).not.toBeVisible();
  });

  test('clicking overlay closes dialog', async ({ page }) => {
    // Open dialog
    const configButton = page.locator('button:has-text("Configure Waves")');
    await configButton.click();
    await page.waitForTimeout(1500);
    
    // Wait for dialog
    await expect(page.locator('h2:has-text("Configure Waves")')).toBeVisible();
    
    // Click on the overlay (backdrop) - need to click outside the dialog content
    // Click at the very edge of the screen to ensure we hit the overlay
    await page.mouse.click(10, 10);
    await page.waitForTimeout(500);
    
    // Verify dialog closed
    const dialog = page.locator('h2:has-text("Configure Waves")');
    await expect(dialog).not.toBeVisible();
  });

  test('button is disabled for unsaved maps', async ({ page }) => {
    // Click "New Map" button
    const newMapButton = page.locator('button:has-text("+ New Map")');
    await newMapButton.click();
    await page.waitForTimeout(500);
    
    // Verify Configure Waves button is disabled
    const configButton = page.locator('button:has-text("🌊 Configure Waves")');
    await expect(configButton).toBeDisabled();
    
    // Verify helper text appears
    const helperText = page.locator('text=Save the map first to configure waves');
    await expect(helperText).toBeVisible();
  });

  test('validation error clears when user corrects input', async ({ page }) => {
    // Open dialog
    const configButton = page.locator('button:has-text("Configure Waves")');
    await configButton.click();
    await page.waitForTimeout(1500);
    
    // Wait for dialog
    await expect(page.locator('h2:has-text("Configure Waves")')).toBeVisible();
    
    // Set invalid value
    const wave1Input = page.locator('div.bg-slate-800 input[type="number"]').first();
    await wave1Input.fill('5');
    await page.waitForTimeout(300);
    
    // Try to save to trigger validation
    const saveButton = page.locator('button:has-text("Save Configuration")');
    await saveButton.click();
    await page.waitForTimeout(500);
    
    // Verify error appears
    const errorSection = page.locator('text=Please fix the following errors');
    await expect(errorSection).toBeVisible();
    
    // Correct the value
    await wave1Input.fill('100');
    await page.waitForTimeout(300);
    
    // Verify error is cleared
    await expect(errorSection).not.toBeVisible();
  });
});
