import { test, expect } from '@playwright/test';

test.describe('Admin People Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
  });

  test('should display People tab in navigation', async ({ page }) => {
    const peopleTab = page.locator('button:has-text("People")');
    await expect(peopleTab).toBeVisible();
  });

  test('should navigate to People tab when clicked', async ({ page }) => {
    const peopleTab = page.locator('button:has-text("People")');
    await peopleTab.click();
    
    // Wait for the tab to be active
    await expect(peopleTab).toHaveClass(/from-purple-900/);
    
    // Check for People tab content
    await expect(page.locator('text=Person Types')).toBeVisible();
    await expect(page.locator('button:has-text("New Person Type")')).toBeVisible();
  });

  test('should display person types list', async ({ page }) => {
    // Navigate to People tab
    await page.click('button:has-text("People")');
    await page.waitForTimeout(500);
    
    // Check for loading state or content
    const loadingText = page.locator('text=Loading person types...');
    const personTypesList = page.locator('text=Person Types');
    
    // Either loading or list should be visible
    await expect(loadingText.or(personTypesList)).toBeVisible();
  });

  test('should show search and filter controls', async ({ page }) => {
    // Navigate to People tab
    await page.click('button:has-text("People")');
    await page.waitForTimeout(1000);
    
    // Check for search input
    const searchInput = page.locator('input[placeholder="Search..."]');
    await expect(searchInput).toBeVisible();
    
    // Check for filter buttons
    await expect(page.locator('button:has-text("All")')).toBeVisible();
  });

  test('should display person type editor when person type is selected', async ({ page }) => {
    // Navigate to People tab
    await page.click('button:has-text("People")');
    await page.waitForTimeout(1000);
    
    // Wait for person types to load
    await page.waitForSelector('text=Person Types', { timeout: 5000 });
    
    // Check for editor sections
    const basicProperties = page.locator('text=Basic Properties');
    const baseStats = page.locator('text=Base Stats');
    const roleConfig = page.locator('text=Role Configuration');
    
    // At least one should be visible if a person type is selected
    const anyEditorSection = basicProperties.or(baseStats).or(roleConfig);
    await expect(anyEditorSection).toBeVisible({ timeout: 5000 });
  });

  test('should have role mode toggle buttons', async ({ page }) => {
    // Navigate to People tab
    await page.click('button:has-text("People")');
    await page.waitForTimeout(1000);
    
    // Wait for content to load
    await page.waitForSelector('text=Role Configuration', { timeout: 5000 });
    
    // Check for role mode buttons
    await expect(page.locator('button:has-text("Defender Only")')).toBeVisible();
    await expect(page.locator('button:has-text("Attacker Only")')).toBeVisible();
    await expect(page.locator('button:has-text("Both Roles")')).toBeVisible();
  });

  test('should display save button', async ({ page }) => {
    // Navigate to People tab
    await page.click('button:has-text("People")');
    await page.waitForTimeout(1000);
    
    // Check for save button
    const saveButton = page.locator('button:has-text("Save Changes")');
    await expect(saveButton).toBeVisible({ timeout: 5000 });
  });

  test('should allow creating new person type', async ({ page }) => {
    // Navigate to People tab
    await page.click('button:has-text("People")');
    await page.waitForTimeout(1000);
    
    // Check for create button
    const createButton = page.locator('button:has-text("New Person Type")');
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeEnabled();
  });
});
