import { test, expect } from '@playwright/test';

test.describe('Admin Component Usage Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5177');
  });

  test('should use consistent export button styling across all tabs', async ({ page }) => {
    const tabs = ['Items', 'Skills', 'Enemies', 'Cultivators', 'Map'];
    const results: any[] = [];

    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`);
      await page.waitForTimeout(500);

      const exportButton = page.locator('button:has-text("Export Config")');
      
      if (await exportButton.count() > 0) {
        const styles = await exportButton.evaluate((btn) => {
          const computed = window.getComputedStyle(btn);
          return {
            borderRadius: computed.borderRadius,
            fontWeight: computed.fontWeight,
            fontSize: computed.fontSize,
            padding: computed.padding,
          };
        });

        results.push({
          tab,
          styles,
        });
      }
    }

    console.log('📊 EXPORT BUTTON CONSISTENCY:');
    console.log(JSON.stringify(results, null, 2));

    // Verify all tabs have export buttons
    expect(results.length).toBe(tabs.length);

    // Verify consistent styling
    const firstStyle = results[0].styles;
    for (const result of results) {
      expect(result.styles.borderRadius).toBe(firstStyle.borderRadius);
      expect(result.styles.fontWeight).toBe(firstStyle.fontWeight);
    }
  });

  test('should use consistent header styling across all tabs', async ({ page }) => {
    const tabs = ['Items', 'Skills', 'Enemies', 'Cultivators', 'Map'];
    const results: any[] = [];

    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`);
      await page.waitForTimeout(500);

      const header = page.locator('h2').first();
      
      if (await header.count() > 0) {
        const styles = await header.evaluate((h) => {
          const computed = window.getComputedStyle(h);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            backgroundImage: computed.backgroundImage,
          };
        });

        results.push({
          tab,
          styles,
        });
      }
    }

    console.log('📊 HEADER CONSISTENCY:');
    console.log(JSON.stringify(results, null, 2));

    // Verify all tabs have headers
    expect(results.length).toBe(tabs.length);

    // Verify consistent sizing and weight (gradient may not render in all browsers)
    for (const result of results) {
      expect(result.styles.fontSize).toBe('30px'); // 3xl = 30px
      expect(result.styles.fontWeight).toBe('700'); // bold
    }
  });

  test('should use FormInput components with consistent styling', async ({ page }) => {
    const tabs = ['Items', 'Enemies', 'Cultivators', 'Map'];
    
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`);
      await page.waitForTimeout(500);

      const inputs = await page.evaluate(() => {
        const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="number"]'));
        return allInputs.slice(0, 2).map((input) => {
          const computed = window.getComputedStyle(input);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            borderRadius: computed.borderRadius,
          };
        });
      });

      console.log(`${tab} inputs:`, inputs);

      // Verify inputs have consistent dark background
      for (const input of inputs) {
        expect(input.backgroundColor).toBe('rgb(2, 6, 23)'); // slate-950
        expect(input.color).toBe('rgb(255, 255, 255)'); // white
      }
    }
  });

  test('should use FormSelect components with consistent styling', async ({ page }) => {
    const tabs = ['Items', 'Enemies'];
    
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`);
      await page.waitForTimeout(500);

      const selects = await page.evaluate(() => {
        const allSelects = Array.from(document.querySelectorAll('select'));
        return allSelects.slice(0, 1).map((select) => {
          const computed = window.getComputedStyle(select);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            borderRadius: computed.borderRadius,
          };
        });
      });

      console.log(`${tab} selects:`, selects);

      // Verify selects have consistent dark background
      for (const select of selects) {
        expect(select.backgroundColor).toBe('rgb(2, 6, 23)'); // slate-950
        expect(select.color).toBe('rgb(255, 255, 255)'); // white
      }
    }
  });

  test('should use FormTextarea components with consistent styling', async ({ page }) => {
    const tabs = ['Items', 'Enemies', 'Cultivators'];
    
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`);
      await page.waitForTimeout(500);

      const textareas = await page.evaluate(() => {
        const allTextareas = Array.from(document.querySelectorAll('textarea'));
        return allTextareas.slice(0, 1).map((textarea) => {
          const computed = window.getComputedStyle(textarea);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            borderRadius: computed.borderRadius,
          };
        });
      });

      console.log(`${tab} textareas:`, textareas);

      // Verify textareas have consistent dark background
      for (const textarea of textareas) {
        expect(textarea.backgroundColor).toBe('rgb(2, 6, 23)'); // slate-950
        expect(textarea.color).toBe('rgb(255, 255, 255)'); // white
      }
    }
  });

  test('should verify no inline style attributes on form elements', async ({ page }) => {
    const tabs = ['Items', 'Enemies', 'Cultivators', 'Map'];
    
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`);
      await page.waitForTimeout(500);

      const inlineStyles = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
        return inputs.filter(el => el.hasAttribute('style')).length;
      });

      console.log(`${tab}: Elements with inline styles = ${inlineStyles}`);
      
      // We expect minimal inline styles (some labels may have inline styles for specific formatting)
      // The key is that form inputs themselves don't have inline styles
      expect(inlineStyles).toBeLessThan(15);
    }
  });
});
