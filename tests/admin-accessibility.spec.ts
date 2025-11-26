import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Admin Tool Accessibility Tests', () => {
  test('should not have color contrast violations on homepage', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();
    
    // Filter for color contrast issues
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    if (contrastViolations.length > 0) {
      console.log('\n❌ COLOR CONTRAST VIOLATIONS FOUND:');
      contrastViolations.forEach(violation => {
        console.log(`\n  Issue: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        violation.nodes.forEach(node => {
          console.log(`  - Element: ${node.html}`);
          console.log(`    Failure: ${node.failureSummary}`);
        });
      });
    }
    
    expect(contrastViolations).toHaveLength(0);
  });

  test('should not have color contrast violations on Items tab', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    // Click Items tab
    await page.getByRole('button', { name: /Items/ }).click();
    await page.waitForTimeout(500);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();
    
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    if (contrastViolations.length > 0) {
      console.log('\n❌ COLOR CONTRAST VIOLATIONS ON ITEMS TAB:');
      contrastViolations.forEach(violation => {
        console.log(`\n  Issue: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        violation.nodes.forEach(node => {
          console.log(`  - Element: ${node.html}`);
          console.log(`    Failure: ${node.failureSummary}`);
        });
      });
    }
    
    expect(contrastViolations).toHaveLength(0);
  });

  test('should not have color contrast violations on Enemies tab', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    // Click Enemies tab
    await page.getByRole('button', { name: /Enemies/ }).click();
    await page.waitForTimeout(500);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();
    
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    if (contrastViolations.length > 0) {
      console.log('\n❌ COLOR CONTRAST VIOLATIONS ON ENEMIES TAB:');
      contrastViolations.forEach(violation => {
        console.log(`\n  Issue: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        violation.nodes.forEach(node => {
          console.log(`  - Element: ${node.html}`);
          console.log(`    Failure: ${node.failureSummary}`);
        });
      });
    }
    
    expect(contrastViolations).toHaveLength(0);
  });

  test('should generate full accessibility report', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();
    
    console.log('\n📊 ACCESSIBILITY SUMMARY:');
    console.log(`  Violations: ${accessibilityScanResults.violations.length}`);
    console.log(`  Passes: ${accessibilityScanResults.passes.length}`);
    console.log(`  Incomplete: ${accessibilityScanResults.incomplete.length}`);
    
    if (accessibilityScanResults.violations.length > 0) {
      console.log('\n⚠️  ALL VIOLATIONS:');
      accessibilityScanResults.violations.forEach(violation => {
        console.log(`\n  ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Affected elements: ${violation.nodes.length}`);
      });
    }
  });

  test('should check input field text visibility on Cultivators tab', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    // Cultivators tab is default, no need to click
    await page.waitForTimeout(500);
    
    // Check all input fields for contrast
    const inputContrast = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      const issues: string[] = [];
      
      inputs.forEach((input) => {
        const styles = window.getComputedStyle(input);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        
        // Check if colors are too similar (both white or both very light)
        const bgRgb = bgColor.match(/\d+/g)?.map(Number) || [];
        const textRgb = textColor.match(/\d+/g)?.map(Number) || [];
        
        if (bgRgb.length === 3 && textRgb.length === 3) {
          // Calculate brightness (simple formula)
          const bgBrightness = (bgRgb[0] * 299 + bgRgb[1] * 587 + bgRgb[2] * 114) / 1000;
          const textBrightness = (textRgb[0] * 299 + textRgb[1] * 587 + textRgb[2] * 114) / 1000;
          
          // If both are bright (>200) or difference is too small
          if (bgBrightness > 200 && textBrightness > 200) {
            issues.push(`${input.tagName}: bg=${bgColor}, text=${textColor} (both too bright)`);
          } else if (Math.abs(bgBrightness - textBrightness) < 50) {
            issues.push(`${input.tagName}: bg=${bgColor}, text=${textColor} (insufficient contrast)`);
          }
        }
      });
      
      return issues;
    });
    
    if (inputContrast.length > 0) {
      console.log('\n❌ CULTIVATORS TAB INPUT CONTRAST ISSUES:');
      inputContrast.forEach(issue => console.log(`  - ${issue}`));
    }
    
    expect(inputContrast).toHaveLength(0);
  });

  test('should check input field text visibility on Items tab', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    // Click Items tab
    await page.getByRole('button', { name: /Items/ }).click();
    await page.waitForTimeout(500);
    
    // Check all input fields for contrast
    const inputContrast = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      const issues: string[] = [];
      
      inputs.forEach((input) => {
        const styles = window.getComputedStyle(input);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        
        // Check if colors are too similar (both white or both very light)
        const bgRgb = bgColor.match(/\d+/g)?.map(Number) || [];
        const textRgb = textColor.match(/\d+/g)?.map(Number) || [];
        
        if (bgRgb.length === 3 && textRgb.length === 3) {
          // Calculate brightness (simple formula)
          const bgBrightness = (bgRgb[0] * 299 + bgRgb[1] * 587 + bgRgb[2] * 114) / 1000;
          const textBrightness = (textRgb[0] * 299 + textRgb[1] * 587 + textRgb[2] * 114) / 1000;
          
          // If both are bright (>200) or difference is too small
          if (bgBrightness > 200 && textBrightness > 200) {
            issues.push(`${input.tagName}: bg=${bgColor}, text=${textColor} (both too bright)`);
          } else if (Math.abs(bgBrightness - textBrightness) < 50) {
            issues.push(`${input.tagName}: bg=${bgColor}, text=${textColor} (insufficient contrast)`);
          }
        }
      });
      
      return issues;
    });
    
    if (inputContrast.length > 0) {
      console.log('\n❌ INPUT FIELD CONTRAST ISSUES:');
      inputContrast.forEach(issue => console.log(`  - ${issue}`));
    }
    
    expect(inputContrast).toHaveLength(0);
  });
});
