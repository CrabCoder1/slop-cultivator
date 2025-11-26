import { test, expect } from '@playwright/test';

test.describe('Achievement Popup Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game (where achievement popup will be used)
    await page.goto('http://localhost:5173');
  });

  test('displays achievement data correctly', async ({ page }) => {
    // Create a test achievement popup by injecting it into the page
    await page.evaluate(() => {
      const testAchievement = {
        id: 'test-achievement-1',
        key: 'test_wave_10',
        name: 'Wave Master',
        emoji: '🏆',
        description: 'Complete wave 10 without losing any health',
        conditions: [],
        rewards: [
          {
            type: 'unlock_species' as const,
            value: 'dragon',
            displayName: 'Unlock Dragon Species'
          },
          {
            type: 'grant_qi' as const,
            value: 500,
            displayName: '500 Qi'
          }
        ],
        sortOrder: 1,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create a container for the popup
      const container = document.createElement('div');
      container.id = 'achievement-popup-test';
      document.body.appendChild(container);

      // Import and render the component
      import('/game/components/achievement-popup.tsx').then(({ AchievementPopup }) => {
        const React = (window as any).React;
        const ReactDOM = (window as any).ReactDOM;
        
        if (React && ReactDOM) {
          const root = ReactDOM.createRoot(container);
          root.render(
            React.createElement(AchievementPopup, {
              achievement: testAchievement,
              isOpen: true,
              onClose: () => {}
            })
          );
        }
      });
    });

    // Wait for the dialog to appear
    await page.waitForSelector('[data-slot="dialog-content"]', { timeout: 5000 });

    // Verify achievement emoji is displayed
    const emojiElement = page.locator('text=🏆').first();
    await expect(emojiElement).toBeVisible();

    // Verify "Achievement Unlocked" header
    await expect(page.locator('text=Achievement Unlocked!')).toBeVisible();

    // Verify achievement name
    await expect(page.locator('text=Wave Master')).toBeVisible();

    // Verify achievement description
    await expect(page.locator('text=Complete wave 10 without losing any health')).toBeVisible();

    // Verify rewards section header
    await expect(page.locator('text=Rewards Granted:')).toBeVisible();

    // Verify first reward
    await expect(page.locator('text=Unlock Dragon Species')).toBeVisible();

    // Verify second reward
    await expect(page.locator('text=500 Qi')).toBeVisible();

    // Verify auto-dismiss hint
    await expect(page.locator('text=This popup will close automatically in 10 seconds')).toBeVisible();
  });

  test('close button functionality', async ({ page }) => {
    // Create a test achievement popup with close tracking
    const closeCallCount = await page.evaluate(() => {
      let closeCount = 0;
      (window as any).achievementCloseCount = 0;

      const testAchievement = {
        id: 'test-achievement-2',
        key: 'test_close',
        name: 'Test Achievement',
        emoji: '⭐',
        description: 'Test close functionality',
        conditions: [],
        rewards: [],
        sortOrder: 1,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const container = document.createElement('div');
      container.id = 'achievement-popup-close-test';
      document.body.appendChild(container);

      import('/game/components/achievement-popup.tsx').then(({ AchievementPopup }) => {
        const React = (window as any).React;
        const ReactDOM = (window as any).ReactDOM;
        
        if (React && ReactDOM) {
          const root = ReactDOM.createRoot(container);
          root.render(
            React.createElement(AchievementPopup, {
              achievement: testAchievement,
              isOpen: true,
              onClose: () => {
                (window as any).achievementCloseCount++;
              }
            })
          );
        }
      });

      return closeCount;
    });

    // Wait for the dialog to appear
    await page.waitForSelector('[data-slot="dialog-content"]', { timeout: 5000 });

    // Find and click the close button (X icon in top right)
    const closeButton = page.locator('[data-slot="dialog-close"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Wait a bit for the close handler to be called
    await page.waitForTimeout(500);

    // Verify onClose was called
    const finalCloseCount = await page.evaluate(() => (window as any).achievementCloseCount);
    expect(finalCloseCount).toBeGreaterThan(0);
  });

  test('auto-dismiss timer', async ({ page }) => {
    // Create a test achievement popup with faster auto-dismiss for testing
    await page.evaluate(() => {
      (window as any).achievementAutoDismissed = false;

      const testAchievement = {
        id: 'test-achievement-3',
        key: 'test_auto_dismiss',
        name: 'Auto Dismiss Test',
        emoji: '⏰',
        description: 'Testing auto-dismiss functionality',
        conditions: [],
        rewards: [],
        sortOrder: 1,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const container = document.createElement('div');
      container.id = 'achievement-popup-timer-test';
      document.body.appendChild(container);

      import('/game/components/achievement-popup.tsx').then(({ AchievementPopup }) => {
        const React = (window as any).React;
        const ReactDOM = (window as any).ReactDOM;
        
        if (React && ReactDOM) {
          const root = ReactDOM.createRoot(container);
          root.render(
            React.createElement(AchievementPopup, {
              achievement: testAchievement,
              isOpen: true,
              onClose: () => {
                (window as any).achievementAutoDismissed = true;
              }
            })
          );
        }
      });
    });

    // Wait for the dialog to appear
    await page.waitForSelector('[data-slot="dialog-content"]', { timeout: 5000 });

    // Verify the popup is visible
    await expect(page.locator('text=Auto Dismiss Test')).toBeVisible();

    // Wait for auto-dismiss (10 seconds + buffer)
    await page.waitForTimeout(11000);

    // Verify onClose was called due to auto-dismiss
    const wasAutoDismissed = await page.evaluate(() => (window as any).achievementAutoDismissed);
    expect(wasAutoDismissed).toBe(true);
  });

  test('multiple rewards display', async ({ page }) => {
    // Create a test achievement with multiple rewards
    await page.evaluate(() => {
      const testAchievement = {
        id: 'test-achievement-4',
        key: 'test_multiple_rewards',
        name: 'Reward Master',
        emoji: '💎',
        description: 'Achievement with multiple rewards',
        conditions: [],
        rewards: [
          {
            type: 'unlock_species' as const,
            value: 'phoenix',
            displayName: 'Unlock Phoenix Species'
          },
          {
            type: 'unlock_dao' as const,
            value: 'fire_dao',
            displayName: 'Unlock Fire Dao'
          },
          {
            type: 'unlock_title' as const,
            value: 'flame_master',
            displayName: 'Unlock Flame Master Title'
          },
          {
            type: 'grant_qi' as const,
            value: 1000,
            displayName: '1000 Qi'
          }
        ],
        sortOrder: 1,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const container = document.createElement('div');
      container.id = 'achievement-popup-rewards-test';
      document.body.appendChild(container);

      import('/game/components/achievement-popup.tsx').then(({ AchievementPopup }) => {
        const React = (window as any).React;
        const ReactDOM = (window as any).ReactDOM;
        
        if (React && ReactDOM) {
          const root = ReactDOM.createRoot(container);
          root.render(
            React.createElement(AchievementPopup, {
              achievement: testAchievement,
              isOpen: true,
              onClose: () => {}
            })
          );
        }
      });
    });

    // Wait for the dialog to appear
    await page.waitForSelector('[data-slot="dialog-content"]', { timeout: 5000 });

    // Verify all four rewards are displayed
    await expect(page.locator('text=Unlock Phoenix Species')).toBeVisible();
    await expect(page.locator('text=Unlock Fire Dao')).toBeVisible();
    await expect(page.locator('text=Unlock Flame Master Title')).toBeVisible();
    await expect(page.locator('text=1000 Qi')).toBeVisible();

    // Verify rewards section is present
    await expect(page.locator('text=Rewards Granted:')).toBeVisible();

    // Count the number of reward items (should be 4)
    const rewardItems = page.locator('text=✨');
    await expect(rewardItems).toHaveCount(4);
  });
});
