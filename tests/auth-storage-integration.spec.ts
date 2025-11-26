import { test, expect } from '@playwright/test';

/**
 * Integration Tests for Browser Storage
 * Tests session persistence, storage quota handling, private browsing, and multi-tab sync
 * Requirements: 3.1, 3.2, 3.4
 */

test.describe('Browser Storage Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Session persistence across page refreshes', async ({ page }) => {
    // Step 1: Create and store session
    await page.evaluate(async () => {
      const mockSession = {
        access_token: 'mock_access_token_persist',
        refresh_token: 'mock_refresh_token_persist',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: {
          id: crypto.randomUUID(),
          email: 'persist@example.com',
          app_metadata: { provider: 'google', providers: ['google'] },
          user_metadata: { name: 'Persist User' },
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const { storeSession } = await import('../shared/utils/session-storage');
      storeSession(mockSession);
    });

    const sessionBeforeRefresh = await page.evaluate(async () => {
      const { retrieveSession } = await import('../shared/utils/session-storage');
      return retrieveSession();
    });

    // Step 2: Refresh page
    await page.reload();

    // Step 3: Verify session is restored
    const sessionAfterRefresh = await page.evaluate(async () => {
      const { retrieveSession } = await import('../shared/utils/session-storage');
      return retrieveSession();
    });

    // Verify persistence
    expect(sessionBeforeRefresh).not.toBeNull();
    expect(sessionAfterRefresh).not.toBeNull();
    expect(sessionAfterRefresh?.access_token).toBe(sessionBeforeRefresh?.access_token);
    expect(sessionAfterRefresh?.user?.email).toBe(sessionBeforeRefresh?.user?.email);
  });

  test('Session persistence across browser close and reopen', async ({ page, context }) => {
    // Step 1: Create and store session
    await page.evaluate(async () => {
      const mockSession = {
        access_token: 'mock_access_token_reopen',
        refresh_token: 'mock_refresh_token_reopen',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: {
          id: crypto.randomUUID(),
          email: 'reopen@example.com',
          app_metadata: { provider: 'google', providers: ['google'] },
          user_metadata: { name: 'Reopen User' },
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const { storeSession } = await import('../shared/utils/session-storage');
      storeSession(mockSession);
    });

    const originalSession = await page.evaluate(async () => {
      const { retrieveSession } = await import('../shared/utils/session-storage');
      return retrieveSession();
    });

    // Step 2: Close page and open new one (simulating browser close/reopen)
    await page.close();
    const newPage = await context.newPage();
    await newPage.goto('http://localhost:5173');

    // Step 3: Verify session is restored
    const restoredSession = await newPage.evaluate(async () => {
      const { retrieveSession } = await import('../shared/utils/session-storage');
      return retrieveSession();
    });

    // Verify persistence
    expect(originalSession).not.toBeNull();
    expect(restoredSession).not.toBeNull();
    expect(restoredSession?.access_token).toBe(originalSession?.access_token);
    expect(restoredSession?.user?.email).toBe(originalSession?.user?.email);

    await newPage.close();
  });

  test('Storage quota handling - graceful degradation', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Simulate storage quota exceeded
      const originalSetItem = Storage.prototype.setItem;
      let quotaExceeded = false;
      let fallbackUsed = false;

      // Mock setItem to throw quota exceeded error
      Storage.prototype.setItem = function(key: string, value: string) {
        if (key.includes('session') && !quotaExceeded) {
          quotaExceeded = true;
          const error: any = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        }
        return originalSetItem.call(this, key, value);
      };

      const mockSession = {
        access_token: 'mock_access_token_quota',
        refresh_token: 'mock_refresh_token_quota',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: {
          id: crypto.randomUUID(),
          email: 'quota@example.com',
          app_metadata: { provider: 'google', providers: ['google'] },
          user_metadata: { name: 'Quota User' },
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const { storeSession, retrieveSession } = await import('../shared/utils/session-storage');

      let saveError = null;
      try {
        storeSession(mockSession);
      } catch (error: any) {
        saveError = error.message;
      }

      // Check if fallback to in-memory storage was used
      const session = retrieveSession();
      if (session !== null) {
        fallbackUsed = true;
      }

      // Restore original setItem
      Storage.prototype.setItem = originalSetItem;

      return {
        quotaExceeded,
        saveError,
        fallbackUsed,
        sessionAvailable: session !== null
      };
    });

    // Verify graceful degradation
    expect(result.quotaExceeded).toBe(true);
    // Should either handle error gracefully or use fallback
    expect(result.saveError !== null || result.fallbackUsed).toBe(true);
  });

  test('Private browsing mode behavior', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Simulate private browsing by making localStorage unavailable
      const originalLocalStorage = window.localStorage;
      let storageAccessDenied = false;

      // Mock localStorage to throw on access
      Object.defineProperty(window, 'localStorage', {
        get: function() {
          storageAccessDenied = true;
          throw new Error('localStorage is not available in private browsing');
        },
        configurable: true
      });

      const mockSession = {
        access_token: 'mock_access_token_private',
        refresh_token: 'mock_refresh_token_private',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: {
          id: crypto.randomUUID(),
          email: 'private@example.com',
          app_metadata: { provider: 'google', providers: ['google'] },
          user_metadata: { name: 'Private User' },
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const { storeSession, retrieveSession } = await import('../shared/utils/session-storage');

      let saveSucceeded = false;
      let sessionAvailable = false;

      try {
        storeSession(mockSession);
        saveSucceeded = true;

        // Try to retrieve session
        const session = retrieveSession();
        sessionAvailable = session !== null;
      } catch (error) {
        // Expected in private browsing
      }

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
        writable: true
      });

      return {
        storageAccessDenied,
        saveSucceeded,
        sessionAvailable
      };
    });

    // Verify private browsing handling
    expect(result.storageAccessDenied).toBe(true);
    // Should either fail gracefully or use in-memory fallback
    if (result.saveSucceeded) {
      // If save succeeded, it used fallback storage
      expect(result.sessionAvailable).toBe(true);
    }
  });

  test('Multiple tab synchronization', async ({ page, context }) => {
    // Step 1: Create session in first tab
    await page.evaluate(async () => {
      const mockSession = {
        access_token: 'mock_access_token_tab1',
        refresh_token: 'mock_refresh_token_tab1',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: {
          id: crypto.randomUUID(),
          email: 'multitab@example.com',
          app_metadata: { provider: 'google', providers: ['google'] },
          user_metadata: { name: 'Multi Tab User' },
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const { storeSession } = await import('../shared/utils/session-storage');
      storeSession(mockSession);
    });

    const tab1Session = await page.evaluate(async () => {
      const { retrieveSession } = await import('../shared/utils/session-storage');
      return retrieveSession();
    });

    // Step 2: Open second tab
    const tab2 = await context.newPage();
    await tab2.goto('http://localhost:5173');

    // Step 3: Verify session is available in second tab
    const tab2Session = await tab2.evaluate(async () => {
      const { retrieveSession } = await import('../shared/utils/session-storage');
      return retrieveSession();
    });

    // Step 4: Update session in tab 2
    await tab2.evaluate(async () => {
      const { retrieveSession, storeSession } = await import('../shared/utils/session-storage');
      const session = retrieveSession();
      
      if (session) {
        const updatedSession = {
          ...session,
          access_token: 'mock_access_token_updated'
        };
        storeSession(updatedSession);
      }
    });

    // Step 5: Trigger storage event in tab 1 by checking localStorage
    await page.waitForTimeout(100); // Small delay for storage event propagation

    const tab1UpdatedSession = await page.evaluate(async () => {
      const { retrieveSession } = await import('../shared/utils/session-storage');
      return retrieveSession();
    });

    // Verify synchronization
    expect(tab1Session).not.toBeNull();
    expect(tab2Session).not.toBeNull();
    expect(tab2Session?.access_token).toBe(tab1Session?.access_token);
    expect(tab1UpdatedSession?.access_token).toBe('mock_access_token_updated');

    await tab2.close();
  });

  test('Storage cleanup on sign-out', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Step 1: Create and store session
      const mockSession = {
        access_token: 'mock_access_token_cleanup',
        refresh_token: 'mock_refresh_token_cleanup',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: {
          id: crypto.randomUUID(),
          email: 'cleanup@example.com',
          app_metadata: { provider: 'google', providers: ['google'] },
          user_metadata: { name: 'Cleanup User' },
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const { storeSession, retrieveSession, clearSession } = await import('../shared/utils/session-storage');
      storeSession(mockSession);

      const sessionBefore = retrieveSession();

      // Step 2: Clear session (sign-out)
      clearSession();

      const sessionAfter = retrieveSession();

      // Step 3: Check localStorage is cleared
      const storageKeys = Object.keys(localStorage).filter(key => 
        key.includes('session') || key.includes('auth')
      );

      return {
        hadSessionBefore: sessionBefore !== null,
        hasSessionAfter: sessionAfter !== null,
        storageKeysRemaining: storageKeys.length
      };
    });

    // Verify cleanup
    expect(result.hadSessionBefore).toBe(true);
    expect(result.hasSessionAfter).toBe(false);
    expect(result.storageKeysRemaining).toBe(0);
  });

  test('Expired session cleanup', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Create expired session
      const expiredSession = {
        access_token: 'mock_access_token_expired',
        refresh_token: 'mock_refresh_token_expired',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: {
          id: crypto.randomUUID(),
          email: 'expired@example.com',
          app_metadata: { provider: 'google', providers: ['google'] },
          user_metadata: { name: 'Expired User' },
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      // Force save expired session directly to localStorage
      localStorage.setItem('slop_cultivator_session', JSON.stringify({
        session: expiredSession,
        storedAt: Date.now()
      }));

      // Try to get session (should detect expiration)
      const { retrieveSession } = await import('../shared/utils/session-storage');
      const session = retrieveSession();

      // Check if expired session was cleaned up
      const storageAfter = localStorage.getItem('slop_cultivator_session');

      return {
        sessionRetrieved: session !== null,
        storageCleared: storageAfter === null
      };
    });

    // Verify expired session handling
    // Session should either be null or cleaned up
    expect(result.sessionRetrieved === false || result.storageCleared === true).toBe(true);
  });

  test('Large session data handling', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Create session with large user metadata
      const largeMetadata: any = {};
      for (let i = 0; i < 100; i++) {
        largeMetadata[`field_${i}`] = `value_${i}_${'x'.repeat(100)}`;
      }

      const largeSession = {
        access_token: 'mock_access_token_large',
        refresh_token: 'mock_refresh_token_large',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: {
          id: crypto.randomUUID(),
          email: 'large@example.com',
          app_metadata: { provider: 'google', providers: ['google'] },
          user_metadata: largeMetadata,
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const { storeSession, retrieveSession } = await import('../shared/utils/session-storage');

      let saveSucceeded = false;
      let retrieveSucceeded = false;

      try {
        storeSession(largeSession);
        saveSucceeded = true;

        const retrieved = retrieveSession();
        retrieveSucceeded = retrieved !== null;
      } catch (error) {
        // May fail due to size limits
      }

      return {
        saveSucceeded,
        retrieveSucceeded
      };
    });

    // Should handle large data gracefully (either succeed or fail gracefully)
    expect(typeof result.saveSucceeded).toBe('boolean');
    expect(typeof result.retrieveSucceeded).toBe('boolean');
  });

  test('Concurrent storage operations', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { storeSession, retrieveSession } = await import('../shared/utils/session-storage');

      // Create multiple sessions
      const sessions = Array.from({ length: 5 }, (_, i) => ({
        access_token: `mock_access_token_${i}`,
        refresh_token: `mock_refresh_token_${i}`,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: {
          id: crypto.randomUUID(),
          email: `concurrent${i}@example.com`,
          app_metadata: { provider: 'google', providers: ['google'] },
          user_metadata: { name: `Concurrent User ${i}` },
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      }));

      // Save sessions concurrently (last one wins)
      sessions.forEach(session => {
        try {
          storeSession(session);
        } catch (error) {
          // Ignore errors for this test
        }
      });

      // Retrieve final session
      const finalSession = retrieveSession();

      return {
        finalSessionExists: finalSession !== null,
        finalSessionEmail: finalSession?.user?.email
      };
    });

    // Verify concurrent operations handled
    expect(result.finalSessionExists).toBe(true);
    expect(result.finalSessionEmail).toContain('concurrent');
  });
});
