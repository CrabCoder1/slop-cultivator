import { test, expect } from '@playwright/test';

test.describe('Admin Tool Layout', () => {
  test('should display header and navigation', async ({ page }) => {
    await page.goto('http://localhost:5177');
    
    // Wait a bit for React to mount
    await page.waitForTimeout(1000);
    
    // Take a screenshot to see what's actually rendered
    await page.screenshot({ path: 'test-results/admin-initial.png', fullPage: true });
    
    // Check if header exists
    const header = page.locator('header');
    console.log('Header exists:', await header.count());
    
    // Check for title
    const title = page.locator('h1');
    console.log('Title count:', await title.count());
    if (await title.count() > 0) {
      console.log('Title text:', await title.textContent());
    }
    
    // Check for sidebar
    const sidebar = page.locator('aside');
    console.log('Sidebar exists:', await sidebar.count());
    
    // Check for navigation buttons
    const navButtons = page.locator('nav button');
    console.log('Nav button count:', await navButtons.count());
    
    // Get all text content on the page
    const bodyText = await page.locator('body').textContent();
    console.log('Body text length:', bodyText?.length);
    console.log('Body text preview:', bodyText?.substring(0, 200));
    
    // Check for main content area
    const main = page.locator('main');
    console.log('Main exists:', await main.count());
    
    // Check for any error messages in console
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    await page.waitForTimeout(500);
    console.log('Console messages:', consoleMessages);
    
    // Get computed styles of body
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        backgroundColor: computed.backgroundColor,
      };
    });
    console.log('Body styles:', bodyStyles);
    
    // Check if React root exists
    const rootExists = await page.evaluate(() => {
      return !!document.getElementById('root');
    });
    console.log('Root element exists:', rootExists);
    
    // Get root innerHTML length
    const rootHTML = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root?.innerHTML.length || 0;
    });
    console.log('Root innerHTML length:', rootHTML);
    
    // Assertions
    expect(await header.count()).toBeGreaterThan(0);
  });

  test('should display cultivator editor by default', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForTimeout(1000);
    
    // Check for cultivator-specific content
    const cultivatorText = page.getByText(/cultivator/i);
    console.log('Cultivator text count:', await cultivatorText.count());
    
    // Check for loading state
    const loadingText = page.getByText(/loading/i);
    console.log('Loading text count:', await loadingText.count());
    if (await loadingText.count() > 0) {
      console.log('Loading text:', await loadingText.first().textContent());
    }
    
    // Check for master list
    const masterList = page.locator('.w-64');
    console.log('Master list exists:', await masterList.count());
    
    // Check for detail panel
    const detailPanel = page.locator('.flex-1');
    console.log('Detail panel count:', await detailPanel.count());
    
    // Get all visible elements
    const visibleElements = await page.evaluate(() => {
      const all = document.querySelectorAll('*');
      let visible = 0;
      all.forEach(el => {
        const computed = window.getComputedStyle(el);
        if (computed.display !== 'none' && computed.visibility !== 'hidden') {
          visible++;
        }
      });
      return visible;
    });
    console.log('Visible elements:', visibleElements);
  });

  test('should check for JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:5177');
    await page.waitForTimeout(2000);
    
    console.log('JavaScript errors:', errors);
    
    if (errors.length > 0) {
      console.log('ERRORS FOUND:');
      errors.forEach(err => console.log('  -', err));
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-with-errors.png', fullPage: true });
  });

  test('should inspect DOM structure', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForTimeout(1000);
    
    const structure = await page.evaluate(() => {
      const root = document.getElementById('root');
      if (!root) return 'No root element';
      
      const getStructure = (el: Element, depth = 0): string => {
        if (depth > 5) return '';
        const indent = '  '.repeat(depth);
        const tag = el.tagName.toLowerCase();
        const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
        const id = el.id ? `#${el.id}` : '';
        let result = `${indent}${tag}${id}${classes}\n`;
        
        Array.from(el.children).slice(0, 10).forEach(child => {
          result += getStructure(child, depth + 1);
        });
        
        return result;
      };
      
      return getStructure(root);
    });
    
    console.log('DOM Structure:');
    console.log(structure);
  });
});
