import { test } from '@playwright/test';

test('should check detail panel content', async ({ page }) => {
  await page.goto('http://localhost:5177');
  await page.waitForTimeout(1000);
  
  // Take full page screenshot
  await page.screenshot({ path: 'test-results/admin-full-page.png', fullPage: true });
  
  console.log('\n=== CHECKING DETAIL PANEL ===\n');
  
  // Check for the detail panel
  const detailPanel = page.locator('.flex-1.space-y-6');
  console.log('Detail panel count:', await detailPanel.count());
  
  // Check for the header in detail panel
  const detailHeader = page.locator('h2.text-3xl');
  console.log('Detail header count:', await detailHeader.count());
  if (await detailHeader.count() > 0) {
    console.log('Detail header text:', await detailHeader.first().textContent());
  }
  
  // Check for form inputs
  const formInputs = page.locator('input[type="text"], input[type="number"]');
  console.log('Form inputs count:', await formInputs.count());
  
  // Check for textareas
  const textareas = page.locator('textarea');
  console.log('Textareas count:', await textareas.count());
  
  // Check for buttons
  const buttons = page.locator('button');
  console.log('Total buttons count:', await buttons.count());
  
  // Get all labels
  const labels = page.locator('label');
  console.log('Labels count:', await labels.count());
  for (let i = 0; i < Math.min(await labels.count(), 10); i++) {
    console.log(`  Label ${i}:`, await labels.nth(i).textContent());
  }
  
  // Check for the master list items
  const masterListItems = page.locator('.w-64 .space-y-2 > *');
  console.log('\nMaster list items:', await masterListItems.count());
  for (let i = 0; i < Math.min(await masterListItems.count(), 5); i++) {
    const text = await masterListItems.nth(i).textContent();
    console.log(`  Item ${i}:`, text?.trim());
  }
  
  // Check the grid layout
  const gridLayout = page.locator('.grid.grid-cols-1.md\\:grid-cols-2');
  console.log('\nGrid layout exists:', await gridLayout.count());
  
  // Get viewport dimensions
  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  console.log('\nViewport:', viewport);
  
  // Check if elements are actually visible (not just in DOM)
  const visibleCheck = await page.evaluate(() => {
    const checkVisible = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return { exists: false, visible: false };
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      return {
        exists: true,
        visible: computed.display !== 'none' && computed.visibility !== 'hidden' && computed.opacity !== '0',
        inViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
        dimensions: { width: rect.width, height: rect.height },
        position: { top: rect.top, left: rect.left },
      };
    };
    
    return {
      header: checkVisible('header'),
      sidebar: checkVisible('aside'),
      main: checkVisible('main'),
      detailPanel: checkVisible('.flex-1.space-y-6'),
      masterList: checkVisible('.w-64'),
    };
  });
  
  console.log('\nVisibility check:');
  console.log(JSON.stringify(visibleCheck, null, 2));
  
  // Scroll down to see if there's content below
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/admin-scrolled.png', fullPage: true });
  
  // Get the actual HTML of the detail panel
  const detailHTML = await page.evaluate(() => {
    const detail = document.querySelector('.flex-1.space-y-6');
    return detail?.innerHTML.substring(0, 500);
  });
  console.log('\nDetail panel HTML preview:');
  console.log(detailHTML);
});
