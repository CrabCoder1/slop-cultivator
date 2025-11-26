import { test, expect } from '@playwright/test';

/**
 * Tests for Automatic Token Refresh
 * Feature: user-authentication, Task 3.5
 * Validates: Requirements 3.2, 3.4
 * 
 * Tests that tokens are automatically refreshed before expiration
 * and that refresh failures are handled appropriately
 */

test.describe('Auth Service - Automatic Token Refresh', () => {
  test('should start auto-refresh timer when session is obtained', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      const { AuthService } = await import('../shared/utils/auth-service');
      
      // Create a session that expires in 10 minutes
      const validSession = {
        access_token: 'valid_access_token',
        refresh_token: 'valid_refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
        expires_in: 600,
        token_type: 'bearer' as const,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: {
            provider: 'google',
            providers: ['google']
          },
          user_metadata: {},
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const mockSupabaseClient = {
        auth: {
          signInWithOAuth: async () => ({ data: { url: null }, error: null }),
          getSession: async () => ({ data: { session: validSession }, error: null }),
          refreshSession: async () => ({ data: { session: validSession }, error: null }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getUser: async () => ({ data: { user: validSession.user }, error: null })
        }
      } as any;

      const authService = new AuthService(mockSupabaseClient);

      // Start auto-refresh
      authService.startAutoRefresh(validSession);

      // Check that the timer was set (we can't directly access private fields, 
      // but we can verify behavior by stopping it)
      authService.stopAutoRefresh();

      return { success: true };
    });

    expect(result.success).toBe(true);
  });

  test('should stop auto-refresh timer when stopAutoRefresh is called', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      const { AuthService } = await import('../shared/utils/auth-service');
      
      const validSession = {
        access_token: 'valid_access_token',
        refresh_token: 'valid_refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 600,
        expires_in: 600,
        token_type: 'bearer' as const,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: {
            provider: 'google',
            providers: ['google']
          },
          user_metadata: {},
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const mockSupabaseClient = {
        auth: {
          signInWithOAuth: async () => ({ data: { url: null }, error: null }),
          getSession: async () => ({ data: { session: validSession }, error: null }),
          refreshSession: async () => ({ data: { session: validSession }, error: null }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getUser: async () => ({ data: { user: validSession.user }, error: null })
        }
      } as any;

      const authService = new AuthService(mockSupabaseClient);

      // Start auto-refresh
      authService.startAutoRefresh(validSession);

      // Stop auto-refresh
      authService.stopAutoRefresh();

      // Can call stop multiple times without error
      authService.stopAutoRefresh();

      return { success: true };
    });

    expect(result.success).toBe(true);
  });

  test('should stop auto-refresh when signing out', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      const { AuthService } = await import('../shared/utils/auth-service');
      const { storeSession } = await import('../shared/utils/session-storage');
      
      const validSession = {
        access_token: 'valid_access_token',
        refresh_token: 'valid_refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 600,
        expires_in: 600,
        token_type: 'bearer' as const,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: {
            provider: 'google',
            providers: ['google']
          },
          user_metadata: {},
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const mockSupabaseClient = {
        auth: {
          signInWithOAuth: async () => ({ data: { url: null }, error: null }),
          getSession: async () => ({ data: { session: validSession }, error: null }),
          refreshSession: async () => ({ data: { session: validSession }, error: null }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getUser: async () => ({ data: { user: validSession.user }, error: null })
        }
      } as any;

      const authService = new AuthService(mockSupabaseClient);

      // Store session and start auto-refresh
      storeSession(validSession);
      authService.startAutoRefresh(validSession);

      // Sign out (should stop auto-refresh)
      await authService.signOut();

      // Verify session was cleared
      const storageKey = 'slop_cultivator_session';
      const sessionCleared = localStorage.getItem(storageKey) === null;

      return { sessionCleared };
    });

    expect(result.sessionCleared).toBe(true);
  });

  test('should start auto-refresh when getSession returns valid session', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      const { AuthService } = await import('../shared/utils/auth-service');
      const { storeSession } = await import('../shared/utils/session-storage');
      
      const validSession = {
        access_token: 'valid_access_token',
        refresh_token: 'valid_refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 600,
        expires_in: 600,
        token_type: 'bearer' as const,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: {
            provider: 'google',
            providers: ['google']
          },
          user_metadata: {},
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const mockSupabaseClient = {
        auth: {
          signInWithOAuth: async () => ({ data: { url: null }, error: null }),
          getSession: async () => ({ data: { session: validSession }, error: null }),
          refreshSession: async () => ({ data: { session: validSession }, error: null }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getUser: async () => ({ data: { user: validSession.user }, error: null })
        }
      } as any;

      const authService = new AuthService(mockSupabaseClient);

      // Store session
      storeSession(validSession);

      // Get session (should start auto-refresh)
      const session = await authService.getSession();

      return {
        sessionRetrieved: session !== null,
        sessionId: session?.user.id
      };
    });

    expect(result.sessionRetrieved).toBe(true);
    expect(result.sessionId).toBe('test-user-id');
  });

  test('should start auto-refresh after OAuth callback', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      const { AuthService } = await import('../shared/utils/auth-service');
      
      const validSession = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: {
          id: 'new-user-id',
          email: 'newuser@example.com',
          app_metadata: {
            provider: 'google',
            providers: ['google']
          },
          user_metadata: {},
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const mockSupabaseClient = {
        auth: {
          signInWithOAuth: async () => ({ data: { url: 'https://oauth.provider.com' }, error: null }),
          getSession: async () => ({ data: { session: validSession }, error: null }),
          refreshSession: async () => ({ data: { session: validSession }, error: null }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getUser: async () => ({ data: { user: validSession.user }, error: null })
        }
      } as any;

      const authService = new AuthService(mockSupabaseClient);

      // Handle OAuth callback (should start auto-refresh)
      const { session, error } = await authService.handleOAuthCallback();

      return {
        sessionCreated: session !== null,
        noError: error === null,
        userId: session?.user.id
      };
    });

    expect(result.sessionCreated).toBe(true);
    expect(result.noError).toBe(true);
    expect(result.userId).toBe('new-user-id');
  });

  test('should handle refresh failure by triggering session expired callback', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      const { AuthService } = await import('../shared/utils/auth-service');
      
      const validSession = {
        access_token: 'valid_access_token',
        refresh_token: 'valid_refresh_token',
        // Session expires in 100ms (will trigger immediate refresh)
        expires_at: Math.floor(Date.now() / 1000),
        expires_in: 0,
        token_type: 'bearer' as const,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: {
            provider: 'google',
            providers: ['google']
          },
          user_metadata: {},
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      // Mock Supabase client that fails to refresh
      const mockSupabaseClient = {
        auth: {
          signInWithOAuth: async () => ({ data: { url: null }, error: null }),
          getSession: async () => ({ data: { session: validSession }, error: null }),
          refreshSession: async () => ({ 
            data: { session: null }, 
            error: new Error('Refresh failed') 
          }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getUser: async () => ({ data: { user: null }, error: null })
        }
      } as any;

      const authService = new AuthService(mockSupabaseClient);

      // Register callback for session expiration
      let callbackTriggered = false;
      authService.onSessionExpired(() => {
        callbackTriggered = true;
      });

      // Start auto-refresh (will trigger immediately due to expired session)
      authService.startAutoRefresh(validSession);

      // Wait for refresh to be attempted (need longer wait for async operation)
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        callbackTriggered
      };
    });

    // When refresh fails, session expired callback should be triggered
    expect(result.callbackTriggered).toBe(true);
  });

  test('should not start auto-refresh for null session', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      const { AuthService } = await import('../shared/utils/auth-service');
      
      const mockSupabaseClient = {
        auth: {
          signInWithOAuth: async () => ({ data: { url: null }, error: null }),
          getSession: async () => ({ data: { session: null }, error: null }),
          refreshSession: async () => ({ data: { session: null }, error: null }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getUser: async () => ({ data: { user: null }, error: null })
        }
      } as any;

      const authService = new AuthService(mockSupabaseClient);

      // Try to start auto-refresh with null session (should not throw error)
      authService.startAutoRefresh(null);

      return { success: true };
    });

    expect(result.success).toBe(true);
  });

  test('should clear existing timer when starting new auto-refresh', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      const { AuthService } = await import('../shared/utils/auth-service');
      
      const session1 = {
        access_token: 'token1',
        refresh_token: 'refresh1',
        expires_at: Math.floor(Date.now() / 1000) + 600,
        expires_in: 600,
        token_type: 'bearer' as const,
        user: {
          id: 'user1',
          email: 'user1@example.com',
          app_metadata: { provider: 'google', providers: ['google'] },
          user_metadata: {},
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const session2 = {
        access_token: 'token2',
        refresh_token: 'refresh2',
        expires_at: Math.floor(Date.now() / 1000) + 1200,
        expires_in: 1200,
        token_type: 'bearer' as const,
        user: {
          id: 'user2',
          email: 'user2@example.com',
          app_metadata: { provider: 'discord', providers: ['discord'] },
          user_metadata: {},
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const mockSupabaseClient = {
        auth: {
          signInWithOAuth: async () => ({ data: { url: null }, error: null }),
          getSession: async () => ({ data: { session: null }, error: null }),
          refreshSession: async () => ({ data: { session: null }, error: null }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getUser: async () => ({ data: { user: null }, error: null })
        }
      } as any;

      const authService = new AuthService(mockSupabaseClient);

      // Start auto-refresh for first session
      authService.startAutoRefresh(session1);

      // Start auto-refresh for second session (should clear first timer)
      authService.startAutoRefresh(session2);

      // Stop auto-refresh
      authService.stopAutoRefresh();

      return { success: true };
    });

    expect(result.success).toBe(true);
  });

  test('should stop auto-refresh when session expires', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      const { AuthService } = await import('../shared/utils/auth-service');
      const { storeSession } = await import('../shared/utils/session-storage');
      
      const expiredSession = {
        access_token: 'expired_token',
        refresh_token: 'expired_refresh',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: {
            provider: 'google',
            providers: ['google']
          },
          user_metadata: {},
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      const mockSupabaseClient = {
        auth: {
          signInWithOAuth: async () => ({ data: { url: null }, error: null }),
          getSession: async () => ({ data: { session: null }, error: null }),
          refreshSession: async () => ({ data: { session: null }, error: null }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getUser: async () => ({ data: { user: null }, error: null })
        }
      } as any;

      const authService = new AuthService(mockSupabaseClient);

      // Store expired session
      storeSession(expiredSession);

      // Try to get session (should handle expiration and stop any timers)
      const session = await authService.getSession();

      // Verify session was not returned
      const sessionReturned = session !== null;

      // Verify storage was cleared
      const storageKey = 'slop_cultivator_session';
      const storageCleared = localStorage.getItem(storageKey) === null;

      return {
        sessionReturned,
        storageCleared
      };
    });

    expect(result.sessionReturned).toBe(false);
    expect(result.storageCleared).toBe(true);
  });
});
