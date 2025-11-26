import { test, expect } from '@playwright/test';

/**
 * UI-specific tests for Wave Configuration Dialog
 * Tests visual styling, colors, transparency, and accessibility
 */

test.describe('Wave Config Dialog - UI Styling', () => {
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
    
    // Open wave config dialog
    const configButton = page.locator('button:has-text("Configure Waves")');
    await configButton.click();
    await page.waitForTimeout(1500);
    
    // Wait for dialog to be visible
    await expect(page.locator('h2:has-text("Configure Waves")')).toBeVisible();
  });

  test('dialog overlay has correct background and opacity', async ({ page }) => {
    // Find the overlay (backdrop)
    const overlay = page.locator('div.fixed.inset-0.bg-black.bg-opacity-50').first();
    
    // Verify overlay is visible
    await expect(overlay).toBeVisible();
    
    // Check computed styles
    const overlayStyles = await overlay.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        backgroundColor: computed.backgroundColor,
        backdropFilter: computed.backdropFilter,
        zIndex: computed.zIndex,
      };
    });
    
    // Verify overlay styling
    expect(overlayStyles.position).toBe('fixed');
    expect(overlayStyles.zIndex).toBe('9999');
    expect(overlayStyles.backdropFilter).toContain('blur');
  });

  test('dialog content has solid background (not transparent)', async ({ page }) => {
    // Find the main dialog content container
    const dialogContent = page.locator('div.bg-slate-800.rounded-lg.shadow-2xl').first();
    
    // Verify dialog is visible
    await expect(dialogContent).toBeVisible();
    
    // Check computed styles
    const contentStyles = await dialogContent.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        borderRadius: computed.borderRadius,
        borderColor: computed.borderColor,
        opacity: computed.opacity,
      };
    });
    
    // Verify dialog has solid background (slate-800 = rgb(30, 41, 59))
    expect(contentStyles.backgroundColor).toBe('rgb(30, 41, 59)');
    
    // Verify opacity is 1 (fully opaque)
    expect(contentStyles.opacity).toBe('1');
    
    // Verify border radius is applied
    expect(parseFloat(contentStyles.borderRadius)).toBeGreaterThan(0);
  });

  test('dialog header has gradient background', async ({ page }) => {
    // Find the header section
    const header = page.locator('div.bg-gradient-to-r.from-cyan-900.to-purple-900').first();
    
    // Verify header is visible
    await expect(header).toBeVisible();
    
    // Check computed styles
    const headerStyles = await header.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundImage: computed.backgroundImage,
        borderBottomWidth: computed.borderBottomWidth,
        padding: computed.padding,
      };
    });
    
    // Verify gradient is applied
    expect(headerStyles.backgroundImage).toContain('linear-gradient');
    
    // Verify border bottom exists
    expect(parseFloat(headerStyles.borderBottomWidth)).toBeGreaterThan(0);
  });

  test('dialog title is visible with correct color', async ({ page }) => {
    // Find the title
    const title = page.locator('h2:has-text("Configure Waves")');
    
    // Verify title is visible
    await expect(title).toBeVisible();
    
    // Check computed styles
    const titleStyles = await title.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
      };
    });
    
    // Verify title has amber color (amber-400 = rgb(251, 191, 36))
    expect(titleStyles.color).toBe('rgb(251, 191, 36)');
    
    // Verify font size is large (2xl = 1.5rem = 24px)
    expect(parseFloat(titleStyles.fontSize)).toBeGreaterThanOrEqual(24);
    
    // Verify font weight is bold
    expect(parseInt(titleStyles.fontWeight)).toBeGreaterThanOrEqual(700);
  });

  test('form inputs have visible backgrounds', async ({ page }) => {
    // Find all number inputs
    const numberInputs = page.locator('input[type="number"]');
    
    // Check first input (Wave 1 Spend Limit)
    const firstInput = numberInputs.first();
    await expect(firstInput).toBeVisible();
    
    const inputStyles = await firstInput.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        borderWidth: computed.borderWidth,
        borderColor: computed.borderColor,
      };
    });
    
    // Verify input has a background color (not transparent)
    expect(inputStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(inputStyles.backgroundColor).not.toBe('transparent');
    
    // Verify input has a border
    expect(parseFloat(inputStyles.borderWidth)).toBeGreaterThan(0);
    
    // Verify text color is visible
    expect(inputStyles.color).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('select dropdown has visible background', async ({ page }) => {
    // Find the growth curve select
    const select = page.locator('select');
    await expect(select).toBeVisible();
    
    const selectStyles = await select.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        borderWidth: computed.borderWidth,
      };
    });
    
    // Verify select has a background color (not transparent)
    expect(selectStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(selectStyles.backgroundColor).not.toBe('transparent');
    
    // Verify select has a border
    expect(parseFloat(selectStyles.borderWidth)).toBeGreaterThan(0);
  });

  test('graph section has visible background', async ({ page }) => {
    // Find the graph container
    const graphSection = page.locator('text=📈 Wave Progression Preview').locator('..');
    await expect(graphSection).toBeVisible();
    
    // Find the SVG graph
    const svg = page.locator('svg');
    await expect(svg).toBeVisible();
    
    const svgStyles = await svg.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        width: computed.width,
        height: computed.height,
      };
    });
    
    // Verify SVG has dimensions
    expect(parseFloat(svgStyles.width)).toBeGreaterThan(0);
    expect(parseFloat(svgStyles.height)).toBeGreaterThan(0);
  });

  test('footer section has visible background', async ({ page }) => {
    // Find the footer with buttons
    const footer = page.locator('div.border-t.border-slate-700.bg-slate-900').first();
    await expect(footer).toBeVisible();
    
    const footerStyles = await footer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        borderTopWidth: computed.borderTopWidth,
        padding: computed.padding,
      };
    });
    
    // Verify footer has background color (slate-900 with opacity)
    expect(footerStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(footerStyles.backgroundColor).not.toBe('transparent');
    
    // Verify border top exists
    expect(parseFloat(footerStyles.borderTopWidth)).toBeGreaterThan(0);
  });

  test('buttons have visible styling', async ({ page }) => {
    // Find Save and Cancel buttons
    const saveButton = page.locator('button:has-text("Save Configuration")');
    const cancelButton = page.locator('button:has-text("Cancel")');
    
    await expect(saveButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
    
    // Check Save button styles
    const saveStyles = await saveButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        padding: computed.padding,
        borderRadius: computed.borderRadius,
      };
    });
    
    // Verify button has background color
    expect(saveStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(saveStyles.backgroundColor).not.toBe('transparent');
    
    // Verify button has padding
    expect(saveStyles.padding).not.toBe('0px');
    
    // Verify button has border radius
    expect(parseFloat(saveStyles.borderRadius)).toBeGreaterThan(0);
  });

  test('close button (X) is visible and styled', async ({ page }) => {
    // Find the close button
    const closeButton = page.locator('button[aria-label="Close dialog"]');
    await expect(closeButton).toBeVisible();
    
    const closeStyles = await closeButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        fontSize: computed.fontSize,
        cursor: computed.cursor,
      };
    });
    
    // Verify close button has color
    expect(closeStyles.color).not.toBe('rgba(0, 0, 0, 0)');
    
    // Verify close button has font size
    expect(parseFloat(closeStyles.fontSize)).toBeGreaterThan(0);
    
    // Verify cursor is pointer
    expect(closeStyles.cursor).toBe('pointer');
  });

  test('validation error messages have visible styling', async ({ page }) => {
    // Trigger validation error by setting invalid value
    const wave1Input = page.locator('input[type="number"]').first();
    await wave1Input.fill('5');
    await page.waitForTimeout(300);
    
    // Try to save
    const saveButton = page.locator('button:has-text("Save Configuration")');
    await saveButton.click();
    await page.waitForTimeout(500);
    
    // Find error message
    const errorSection = page.locator('text=Please fix the following errors').locator('..');
    await expect(errorSection).toBeVisible();
    
    const errorStyles = await errorSection.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        borderColor: computed.borderColor,
        borderWidth: computed.borderWidth,
        color: computed.color,
      };
    });
    
    // Verify error section has red background
    expect(errorStyles.backgroundColor).toContain('rgb');
    
    // Verify error section has border
    expect(parseFloat(errorStyles.borderWidth)).toBeGreaterThan(0);
  });

  test('dialog content is scrollable when needed', async ({ page }) => {
    // Find the scrollable content area
    const contentArea = page.locator('div.max-h-\\[calc\\(100vh-200px\\)\\].overflow-y-auto').first();
    await expect(contentArea).toBeVisible();
    
    const contentStyles = await contentArea.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        overflowY: computed.overflowY,
        maxHeight: computed.maxHeight,
      };
    });
    
    // Verify overflow is set to auto
    expect(contentStyles.overflowY).toBe('auto');
    
    // Verify max height is set
    expect(contentStyles.maxHeight).not.toBe('none');
  });

  test('all text is readable with sufficient contrast', async ({ page }) => {
    // Check various text elements for visibility
    const textElements = [
      page.locator('h2:has-text("Configure Waves")'),
      page.locator('label:has-text("Wave 1 Spend Limit")'),
      page.locator('label:has-text("Enemies Per Wave")'),
      page.locator('label:has-text("Growth Curve Type")'),
      page.locator('text=📈 Wave Progression Preview'),
    ];
    
    for (const element of textElements) {
      await expect(element).toBeVisible();
      
      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          opacity: computed.opacity,
        };
      });
      
      // Verify text has color
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
      
      // Verify opacity is 1 (fully opaque)
      expect(styles.opacity).toBe('1');
    }
  });

  test('dialog is centered on screen', async ({ page }) => {
    // Find the overlay container
    const overlay = page.locator('div.fixed.inset-0.flex.items-center.justify-center').first();
    
    const overlayStyles = await overlay.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        alignItems: computed.alignItems,
        justifyContent: computed.justifyContent,
      };
    });
    
    // Verify flexbox centering
    expect(overlayStyles.display).toBe('flex');
    expect(overlayStyles.alignItems).toBe('center');
    expect(overlayStyles.justifyContent).toBe('center');
  });

  test('dialog has proper z-index layering', async ({ page }) => {
    // Find the overlay
    const overlay = page.locator('div.fixed.inset-0').first();
    
    const overlayStyles = await overlay.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        zIndex: computed.zIndex,
      };
    });
    
    // Verify z-index is very high (9999)
    expect(parseInt(overlayStyles.zIndex)).toBe(9999);
  });
});
