import { test, expect } from '@playwright/test';

test.describe('Item Selector Visual Test', () => {
  test('should show selected item with distinct styling', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    // Click Items tab
    await page.getByRole('button', { name: /Items/ }).click();
    await page.waitForTimeout(500);
    
    // Get ACTUAL computed styles for all item buttons
    const itemStyles = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent?.includes('Jade Ring') || 
        btn.textContent?.includes('Silk Sash') ||
        btn.textContent?.includes('Dragon Fang')
      );
      
      return items.slice(0, 3).map((item, i) => {
        const computed = window.getComputedStyle(item);
        const htmlEl = item as HTMLElement;
        return {
          index: i,
          name: item.textContent?.split('\n')[0]?.trim(),
          classes: item.className,
          inlineStyle: htmlEl.style.cssText,
          backgroundColor: computed.backgroundColor,
          backgroundImage: computed.backgroundImage,
          color: computed.color,
          border: computed.border,
          boxShadow: computed.boxShadow,
          transform: computed.transform,
          outline: computed.outline
        };
      });
    });
    
    console.log('\n📊 ACTUAL RENDERED STYLES:');
    console.log(JSON.stringify(itemStyles, null, 2));
    
    // Check if first item (selected) has different styling than others
    const selected = itemStyles[0];
    const unselected = itemStyles[1];
    
    console.log('\n🔍 COMPARISON:');
    console.log('Selected bg:', selected?.backgroundColor);
    console.log('Unselected bg:', unselected?.backgroundColor);
    console.log('Selected has shadow:', selected?.boxShadow !== 'none');
    console.log('Selected has transform:', selected?.transform !== 'none');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/item-selector-detail.png',
      fullPage: false 
    });
    
    // Verify selected item has different background
    expect(selected?.backgroundColor).not.toBe(unselected?.backgroundColor);
  });
});
