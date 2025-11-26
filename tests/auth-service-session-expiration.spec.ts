import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';

/**
 * Tests for Session Expiration Handling
 * Feature: user-authentication, Task 3.3
 * Feature: user-authentication, Property 8: Expired Session Handling
 * Validates: Requirements 3.3
 * 
 * Tests that expired sessions are detected, cleared, and trigger re-authentication flow
 * 
 * Property 8: For any expired session, attempting to use it should fail and require re-authentication.
 */

test.describe('Auth Service - Session Expiration Handling', () => {
  test('should detect expired session and return null', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      // Create an expired session
      const expiredSession = {
        access_token: 'expired_access_token',
        refresh_token: 'expired_refresh_token',
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

      // Store the expired session
      const { storeSession } = await import('../shared/utils/session-storage');
      storeSession(expiredSession);

      // Check storage before getSession
      const storageKey = 'slop_cultivator_session';
      const hasStorageBeforeGet = localStorage.getItem(storageKey) !== null;

      // Create auth service and try to get session
      const { AuthService } = await import('../shared/utils/auth-service');
      
      // Create a mock Supabase client that returns null session
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
      const session = await authService.getSession();

      // Check if storage was cleared after getSession
      const hasStorageAfterGet = localStorage.getItem(storageKey) !== null;

      return {
        sessionReturned: session !== null,
        hasStorageBeforeGet,
        hasStorageAfterGet,
        storageCleared: !hasStorageAfterGet
      };
    });

    // Expired session should return null
    expect(result.sessionReturned).toBe(false);
    
    // Storage should exist before getSession
    expect(result.hasStorageBeforeGet).toBe(true);
    
    // Expired session should be cleared from storage after getSession
    expect(result.storageCleared).toBe(true);
  });

  test('should trigger re-authentication callback when session expires', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      // Create auth service first
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

      // Register callback for session expiration BEFORE storing expired session
      let callbackTriggered = false;
      authService.onSessionExpired(() => {
        callbackTriggered = true;
      });

      // Now create and store an expired session
      const expiredSession = {
        access_token: 'expired_access_token',
        refresh_token: 'expired_refresh_token',
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

      const { storeSession } = await import('../shared/utils/session-storage');
      storeSession(expiredSession);

      // Try to get the expired session (should trigger callback)
      await authService.getSession();

      return {
        callbackTriggered
      };
    });

    // Callback should be triggered when expired session is detected
    expect(result.callbackTriggered).toBe(true);
  });

  test('should allow unsubscribing from session expiration callbacks', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      const { AuthService } = await import('../shared/utils/auth-service');
      const { storeSession } = await import('../shared/utils/session-storage');
      
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

      // Register callback
      let callbackCount = 0;
      const unsubscribe = authService.onSessionExpired(() => {
        callbackCount++;
      });

      // Create expired session
      const expiredSession = {
        access_token: 'expired_access_token',
        refresh_token: 'expired_refresh_token',
        expires_at: Math.floor(Date.now() / 1000) - 3600,
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: { provider: 'google', providers: ['google'] },
          user_metadata: {},
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };

      // Store and trigger expiration (should call callback)
      storeSession(expiredSession);
      await authService.getSession();
      const countAfterFirst = callbackCount;

      // Unsubscribe
      unsubscribe();

      // Store another expired session and trigger expiration again (should NOT call callback)
      storeSession(expiredSession);
      await authService.getSession();
      const countAfterSecond = callbackCount;

      return {
        countAfterFirst,
        countAfterSecond
      };
    });

    // First call should trigger callback
    expect(result.countAfterFirst).toBe(1);
    
    // Second call should not trigger callback after unsubscribe
    expect(result.countAfterSecond).toBe(1);
  });

  test('should correctly identify expired sessions via isSessionExpired method', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      const { AuthService } = await import('../shared/utils/auth-service');
      const { storeSession } = await import('../shared/utils/session-storage');
      
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

      // Test with no session
      const isExpiredNoSession = await authService.isSessionExpired();

      // Test with expired session
      const expiredSession = {
        access_token: 'expired_access_token',
        refresh_token: 'expired_refresh_token',
        expires_at: Math.floor(Date.now() / 1000) - 3600,
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: { provider: 'google', providers: ['google'] },
          user_metadata: {},
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };
      storeSession(expiredSession);
      const isExpiredWithExpiredSession = await authService.isSessionExpired();

      // Test with valid session
      const validSession = {
        ...expiredSession,
        expires_at: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
      };
      storeSession(validSession);
      const isExpiredWithValidSession = await authService.isSessionExpired();

      return {
        isExpiredNoSession,
        isExpiredWithExpiredSession,
        isExpiredWithValidSession
      };
    });

    // No session should be considered expired
    expect(result.isExpiredNoSession).toBe(true);
    
    // Expired session should be detected as expired
    expect(result.isExpiredWithExpiredSession).toBe(true);
    
    // Valid session should not be expired
    expect(result.isExpiredWithValidSession).toBe(false);
  });

  test('should clear expired session data from storage', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      const { storeSession } = await import('../shared/utils/session-storage');
      const { AuthService } = await import('../shared/utils/auth-service');

      // Create auth service first
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

      // Store an expired session
      const expiredSession = {
        access_token: 'expired_access_token',
        refresh_token: 'expired_refresh_token',
        expires_at: Math.floor(Date.now() / 1000) - 3600,
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: { provider: 'google', providers: ['google'] },
          user_metadata: {},
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated'
        }
      };
      storeSession(expiredSession);

      // Verify session is in storage
      const storageKey = 'slop_cultivator_session';
      const hasStorageBeforeGet = localStorage.getItem(storageKey) !== null;

      // Get session (should clear expired session)
      await authService.getSession();

      // Check if storage was cleared
      const hasStorageAfterGet = localStorage.getItem(storageKey) !== null;

      return {
        hasStorageBeforeGet,
        hasStorageAfterGet
      };
    });

    // Session should be in storage before getSession
    expect(result.hasStorageBeforeGet).toBe(true);
    
    // Session should be cleared from storage after getSession detects expiration
    expect(result.hasStorageAfterGet).toBe(false);
  });
});


/**
 * Property-Based Tests for Expired Session Handling
 * Feature: user-authentication, Property 8: Expired Session Handling
 * Validates: Requirements 3.3
 */

test.describe('Auth Service - Expired Session Handling (Property-Based)', () => {
  test('Property 8: Expired sessions should fail when attempting to use them', async ({ page }) => {
    // Property: For any expired session, attempting to use it should fail and require re-authentication
    await fc.assert(
      fc.asyncProperty(
        // Generate random OAuth providers
        fc.constantFrom('google' as const, 'discord' as const),
        // Generate random session data
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          userId: fc.uuid(),
          accessToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          refreshToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          // Generate various expiration times in the past
          expiredSecondsAgo: fc.integer({ min: 1, max: 86400 }) // 1 second to 24 hours ago
        }),
        async (provider, sessionData) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, sessionData }) => {
              // Create an expired session
              const expiredSession = {
                access_token: sessionData.accessToken,
                refresh_token: sessionData.refreshToken,
                expires_at: Math.floor(Date.now() / 1000) - sessionData.expiredSecondsAgo,
                expires_in: 3600,
                token_type: 'bearer' as const,
                user: {
                  id: sessionData.userId,
                  email: sessionData.email,
                  app_metadata: {
                    provider: provider,
                    providers: [provider]
                  },
                  user_metadata: {
                    name: sessionData.name
                  },
                  created_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                }
              };

              // Store the expired session
              const { storeSession } = await import('../shared/utils/session-storage');
              storeSession(expiredSession);

              // Create auth service with mock Supabase client
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

              // Check if session is expired before attempting to use it
              const isExpired = await authService.isSessionExpired();

              // Attempt to get the expired session
              const retrievedSession = await authService.getSession();

              // Check if storage was cleared
              const storageKey = 'slop_cultivator_session';
              const storageCleared = localStorage.getItem(storageKey) === null;

              return {
                isExpired,
                sessionReturned: retrievedSession !== null,
                storageCleared,
                expiredSecondsAgo: sessionData.expiredSecondsAgo
              };
            },
            { provider, sessionData }
          );

          // Property assertions:
          // 1. Expired session should be detected as expired
          expect(result.isExpired).toBe(true);

          // 2. Attempting to use expired session should fail (return null)
          expect(result.sessionReturned).toBe(false);

          // 3. Expired session should be cleared from storage
          expect(result.storageCleared).toBe(true);
        }
      ),
      { 
        numRuns: 100, // Minimum 100 iterations as specified in design
        verbose: true 
      }
    );
  });

  test('Property 8: Expired sessions should trigger re-authentication callback', async ({ page }) => {
    // Property: For any expired session, the system should trigger re-authentication flow
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.record({
          email: fc.emailAddress(),
          userId: fc.uuid(),
          accessToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          refreshToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          expiredSecondsAgo: fc.integer({ min: 1, max: 86400 })
        }),
        async (provider, sessionData) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, sessionData }) => {
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

              // Register callback for session expiration
              let callbackTriggered = false;
              authService.onSessionExpired(() => {
                callbackTriggered = true;
              });

              // Create and store expired session
              const expiredSession = {
                access_token: sessionData.accessToken,
                refresh_token: sessionData.refreshToken,
                expires_at: Math.floor(Date.now() / 1000) - sessionData.expiredSecondsAgo,
                expires_in: 3600,
                token_type: 'bearer' as const,
                user: {
                  id: sessionData.userId,
                  email: sessionData.email,
                  app_metadata: {
                    provider: provider,
                    providers: [provider]
                  },
                  user_metadata: {},
                  created_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                }
              };

              const { storeSession } = await import('../shared/utils/session-storage');
              storeSession(expiredSession);

              // Attempt to get the expired session (should trigger callback)
              await authService.getSession();

              return {
                callbackTriggered
              };
            },
            { provider, sessionData }
          );

          // Property: Callback should be triggered for expired sessions
          expect(result.callbackTriggered).toBe(true);
        }
      ),
      { 
        numRuns: 100,
        verbose: true 
      }
    );
  });

  test('Property 8: Expired sessions should be rejected regardless of expiration time', async ({ page }) => {
    // Property: Sessions expired by any amount of time should all be rejected
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.record({
          userId: fc.uuid(),
          accessToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          refreshToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          // Test various expiration scenarios
          expiredSecondsAgo: fc.oneof(
            fc.constant(1), // Just expired (1 second ago)
            fc.integer({ min: 2, max: 300 }), // Recently expired (2 seconds to 5 minutes)
            fc.integer({ min: 301, max: 3600 }), // Expired within an hour
            fc.integer({ min: 3601, max: 86400 }), // Expired within a day
            fc.integer({ min: 86401, max: 604800 }) // Expired within a week
          )
        }),
        async (provider, sessionData) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, sessionData }) => {
              const expiredSession = {
                access_token: sessionData.accessToken,
                refresh_token: sessionData.refreshToken,
                expires_at: Math.floor(Date.now() / 1000) - sessionData.expiredSecondsAgo,
                expires_in: 3600,
                token_type: 'bearer' as const,
                user: {
                  id: sessionData.userId,
                  email: 'test@example.com',
                  app_metadata: {
                    provider: provider,
                    providers: [provider]
                  },
                  user_metadata: {},
                  created_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                }
              };

              const { storeSession } = await import('../shared/utils/session-storage');
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

              // Store expired session
              storeSession(expiredSession);

              // Check if detected as expired
              const isExpired = await authService.isSessionExpired();

              // Try to get session
              const session = await authService.getSession();

              return {
                isExpired,
                sessionReturned: session !== null,
                expiredSecondsAgo: sessionData.expiredSecondsAgo
              };
            },
            { provider, sessionData }
          );

          // Property: All expired sessions should be detected as expired
          expect(result.isExpired).toBe(true);

          // Property: All expired sessions should fail to be retrieved
          expect(result.sessionReturned).toBe(false);
        }
      ),
      { 
        numRuns: 100,
        verbose: true 
      }
    );
  });

  test('Property 8 (Invariant): Valid sessions should not be treated as expired', async ({ page }) => {
    // Property: Sessions that are not expired should not be rejected
    // This is the inverse property to ensure we're not over-rejecting
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.record({
          email: fc.emailAddress(),
          userId: fc.uuid(),
          accessToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          refreshToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          // Generate various valid expiration times in the future
          expiresInSeconds: fc.integer({ min: 600, max: 86400 }) // 10 minutes to 24 hours (well beyond 5-minute buffer)
        }),
        async (provider, sessionData) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, sessionData }) => {
              const validSession = {
                access_token: sessionData.accessToken,
                refresh_token: sessionData.refreshToken,
                expires_at: Math.floor(Date.now() / 1000) + sessionData.expiresInSeconds,
                expires_in: sessionData.expiresInSeconds,
                token_type: 'bearer' as const,
                user: {
                  id: sessionData.userId,
                  email: sessionData.email,
                  app_metadata: {
                    provider: provider,
                    providers: [provider]
                  },
                  user_metadata: {},
                  created_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                }
              };

              const { storeSession } = await import('../shared/utils/session-storage');
              const { AuthService } = await import('../shared/utils/auth-service');

              // Mock Supabase client that returns the valid session
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

              // Store valid session
              storeSession(validSession);

              // Check if detected as expired
              const isExpired = await authService.isSessionExpired();

              // Try to get session
              const session = await authService.getSession();

              return {
                isExpired,
                sessionReturned: session !== null,
                expiresInSeconds: sessionData.expiresInSeconds
              };
            },
            { provider, sessionData }
          );

          // Property: Valid sessions should NOT be detected as expired
          expect(result.isExpired).toBe(false);

          // Property: Valid sessions should be successfully retrieved
          expect(result.sessionReturned).toBe(true);
        }
      ),
      { 
        numRuns: 100,
        verbose: true 
      }
    );
  });

  test('Property 8 (Edge Case): Sessions expiring within 5-minute buffer should be treated as expired', async ({ page }) => {
    // Property: Sessions expiring within the 5-minute buffer should be treated as expired
    // This tests the proactive expiration logic
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.record({
          userId: fc.uuid(),
          accessToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          refreshToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          // Generate expiration times within the 5-minute buffer (0 to 300 seconds)
          expiresInSeconds: fc.integer({ min: 0, max: 300 })
        }),
        async (provider, sessionData) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, sessionData }) => {
              const nearExpirySession = {
                access_token: sessionData.accessToken,
                refresh_token: sessionData.refreshToken,
                expires_at: Math.floor(Date.now() / 1000) + sessionData.expiresInSeconds,
                expires_in: sessionData.expiresInSeconds,
                token_type: 'bearer' as const,
                user: {
                  id: sessionData.userId,
                  email: 'test@example.com',
                  app_metadata: {
                    provider: provider,
                    providers: [provider]
                  },
                  user_metadata: {},
                  created_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                }
              };

              const { storeSession } = await import('../shared/utils/session-storage');
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

              // Store session expiring soon
              storeSession(nearExpirySession);

              // Check if detected as expired
              const isExpired = await authService.isSessionExpired();

              return {
                isExpired,
                expiresInSeconds: sessionData.expiresInSeconds
              };
            },
            { provider, sessionData }
          );

          // Property: Sessions within 5-minute buffer should be treated as expired
          expect(result.isExpired).toBe(true);
        }
      ),
      { 
        numRuns: 100,
        verbose: true 
      }
    );
  });
});
