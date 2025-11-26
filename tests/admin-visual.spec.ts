import { test, expect } from '@playwright/test';

test.describe('Admin Tool Visual Tests', () => {
  test('should capture admin homepage', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/admin-home.png',
      fullPage: true 
    });
  });

  test('should capture Items tab', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    // Click Items tab by button text
    await page.getByRole('button', { name: /Items/ }).click();
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/admin-items.png',
      fullPage: true 
    });
  });

  test('should capture Enemies tab', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    // Click Enemies tab by button text
    await page.getByRole('button', { name: /Enemies/ }).click();
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/admin-enemies.png',
      fullPage: true 
    });
  });

  test('should verify background color is dark', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    // Check body background color
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    console.log('Body background color:', bodyBg);
    
    // Should be dark (not white)
    expect(bodyBg).not.toBe('rgb(255, 255, 255)');
  });
});
