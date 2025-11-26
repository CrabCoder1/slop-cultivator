import { test, expect } from '@playwright/test';

test.describe('Admin Skills Detail Pane', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForTimeout(1000);
    
    // Navigate to Skills tab
    await page.locator('button').filter({ hasText: 'Skills' }).click();
    await page.waitForTimeout(500);
  });

  test('should display skill detail form fields', async ({ page }) => {
    // Select first skill
    const firstSkill = page.locator('.w-64.flex-shrink-0 button').first();
    await firstSkill.click();
    await page.waitForTimeout(500);
    
    // Check for form fields
    const nameInput = page.locator('input[type="text"]').filter({ has: page.locator('label:has-text("Name")') });
    await expect(nameInput.first()).toBeVisible();
    
    const iconInput = page.locator('input[type="text"]').filter({ has: page.locator('label:has-text("Icon")') });
    await expect(iconInput.first()).toBeVisible();
    
    const typeSelect = page.locator('select').filter({ has: page.locator('label:has-text("Type")') });
    await expect(typeSelect.first()).toBeVisible();
    
    const descriptionTextarea = page.locator('textarea').filter({ has: page.locator('label:has-text("Description")') });
    await expect(descriptionTextarea.first()).toBeVisible();
  });

  test('should display compatible cultivator type toggles', async ({ page }) => {
    // Select first skill
    const firstSkill = page.locator('.w-64.flex-shrink-0 button').first();
    await firstSkill.click();
    await page.waitForTimeout(500);
    
    // Check for compatible types section
    const compatibleTypesLabel = page.locator('label:has-text("Compatible Cultivator Types")');
    await expect(compatibleTypesLabel).toBeVisible();
    
    // Check for type buttons
    const typeButtons = page.locator('button').filter({ hasText: /^(Sword|Palm|Arrow|Lightning)$/ });
    const count = await typeButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
    
    // Verify buttons are styled correctly
    const firstTypeButton = typeButtons.first();
    const styles = await firstTypeButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        borderWidth: computed.borderWidth,
      };
    });
    
    // Should have background color and border
    expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(parseFloat(styles.borderWidth)).toBeGreaterThan(0);
  });

  test('should display effects section with add button', async ({ page }) => {
    // Select first skill
    const firstSkill = page.locator('.w-64.flex-shrink-0 button').first();
    await firstSkill.click();
    await page.waitForTimeout(500);
    
    // Check for Effects label
    const effectsLabel = page.locator('label:has-text("Effects")');
    await expect(effectsLabel).toBeVisible();
    
    // Check for Add Effect button
    const addButton = page.locator('button:has-text("+ Add Effect")');
    await expect(addButton).toBeVisible();
  });

  test('should display existing skill effects', async ({ page }) => {
    // Select first skill (should have at least one effect)
    const firstSkill = page.locator('.w-64.flex-shrink-0 button').first();
    await firstSkill.click();
    await page.waitForTimeout(500);
    
    // Check for effect cards
    const effectCards = page.locator('.bg-slate-800.rounded-lg.p-3');
    const count = await effectCards.count();
    
    if (count > 0) {
      // Verify effect card structure
      const firstEffect = effectCards.first();
      await expect(firstEffect).toBeVisible();
      
      // Check for effect number label
      const effectLabel = firstEffect.locator('span:has-text("Effect")');
      await expect(effectLabel).toBeVisible();
      
      // Check for Remove button
      const removeButton = firstEffect.locator('button:has-text("✕ Remove")');
      await expect(removeButton).toBeVisible();
      
      // Check for stat select
      const statSelect = firstEffect.locator('select').first();
      await expect(statSelect).toBeVisible();
    }
  });

  test('should enable export button when changes are made', async ({ page }) => {
    // Select first skill
    const firstSkill = page.locator('.w-64.flex-shrink-0 button').first();
    await firstSkill.click();
    await page.waitForTimeout(500);
    
    // Export button should be disabled initially
    const exportButton = page.locator('button:has-text("💾 Export Config")');
    await expect(exportButton).toBeVisible();
    const initialDisabled = await exportButton.isDisabled();
    expect(initialDisabled).toBe(true);
    
    // Make a change to the name field
    const nameInput = page.locator('label:has-text("Name")').locator('..').locator('input');
    await nameInput.fill('Test Skill Name');
    await page.waitForTimeout(300);
    
    // Export button should now be enabled
    const nowDisabled = await exportButton.isDisabled();
    expect(nowDisabled).toBe(false);
  });

  test('should display conditional fields based on skill type', async ({ page }) => {
    // Select first skill
    const firstSkill = page.locator('.w-64.flex-shrink-0 button').first();
    await firstSkill.click();
    await page.waitForTimeout(500);
    
    // Change type to active
    const typeSelect = page.locator('label:has-text("Type")').locator('..').locator('select');
    await typeSelect.selectOption('active');
    await page.waitForTimeout(300);
    
    // Should show cooldown field
    const cooldownLabel = page.locator('label:has-text("Cooldown")');
    await expect(cooldownLabel).toBeVisible();
    
    // Change type to aura
    await typeSelect.selectOption('aura');
    await page.waitForTimeout(300);
    
    // Should show range field
    const rangeLabel = page.locator('label:has-text("Range (pixels)")');
    await expect(rangeLabel).toBeVisible();
  });

  test('should maintain master-detail layout consistency', async ({ page }) => {
    // Check for master list
    const masterList = page.locator('.w-64.flex-shrink-0.border-r').first();
    await expect(masterList).toBeVisible();
    
    // Check for detail panel
    const detailPanel = page.locator('.flex-1.space-y-6.overflow-y-auto').first();
    await expect(detailPanel).toBeVisible();
    
    // Check layout is flex
    const layoutContainer = page.locator('.flex.gap-6.p-6').first();
    const display = await layoutContainer.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('flex');
  });

  test('should display skill type badges in master list', async ({ page }) => {
    // Get all skill cards
    const skillCards = page.locator('.w-64.flex-shrink-0 button');
    const firstCard = skillCards.first();
    
    // Check for type badge
    const typeBadge = firstCard.locator('.text-xs.px-2.py-0\\.5.rounded');
    await expect(typeBadge).toBeVisible();
    
    // Verify badge has background color
    const bgColor = await typeBadge.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('should take screenshot for visual verification', async ({ page }) => {
    // Select first skill
    const firstSkill = page.locator('.w-64.flex-shrink-0 button').first();
    await firstSkill.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'test-results/admin-skills-detail.png', 
      fullPage: true 
    });
    
    console.log('Screenshot saved to test-results/admin-skills-detail.png');
  });
});
