import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Sign-Out Behavior
 * Feature: user-authentication, Property 9, 10, 11: Sign-Out Behavior
 * Validates: Requirements 4.1, 4.2, 4.4
 * 
 * Property 9: For any authenticated user, signing out should terminate the session and set it to null.
 * Property 10: For any authenticated user, signing out should clear all session credentials from browser storage.
 * Property 11: For any user who has signed out, attempting to access authenticated features should be denied.
 */

test.describe('Auth Service - Sign-Out Behavior (Property-Based)', () => {
  test('Property 9: Sign-Out Terminates Session - signing out should set session to null', async ({ page }) => {
    // Property-based test with 100 iterations as specified in design
    await fc.assert(
      fc.asyncProperty(
        // Generate random OAuth providers (google or discord)
        fc.constantFrom('google' as const, 'discord' as const),
        // Generate random user data
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          userId: fc.uuid()
        }),
        async (provider, userData) => {
          // Navigate to the game
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, userData }) => {
              // Create mock session data
              const mockSession = {
                access_token: 'mock_access_token_' + Math.random(),
                refresh_token: 'mock_refresh_token_' + Math.random(),
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                expires_in: 3600,
                token_type: 'bearer' as const,
                user: {
                  id: userData.userId,
                  email: userData.email,
                  app_metadata: {
                    provider: provider,
                    providers: [provider]
                  },
                  user_metadata: {
                    full_name: userData.name,
                    name: userData.name
                  },
                  created_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                }
              };

              let currentSession: typeof mockSession | null = mockSession;
              let signOutCalled = false;

              // Mock the Supabase client
              const mockSupabase = {
                auth: {
                  getSession: async () => ({
                    data: { session: currentSession },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: currentSession?.user || null },
                    error: null
                  }),
                  refreshSession: async () => ({
                    data: { session: currentSession },
                    error: null
                  }),
                  signOut: async () => {
                    signOutCalled = true;
                    currentSession = null;
                    return { error: null };
                  },
                  onAuthStateChange: (callback: any) => ({
                    data: {
                      subscription: {
                        unsubscribe: () => {}
                      }
                    }
                  }),
                  signInWithOAuth: async () => ({
                    data: { url: 'https://mock-oauth-url.com' },
                    error: null
                  })
                }
              };

              // Import and test the auth service with dependency injection
              const { AuthService } = await import('../shared/utils/auth-service');
              const authService = new AuthService(mockSupabase as any);

              // Verify we have a session before sign out
              const sessionBefore = await authService.getSession();

              // Sign out
              const signOutResult = await authService.signOut();

              // Get session after sign out
              const sessionAfter = await authService.getSession();

              return {
                hadSessionBefore: sessionBefore !== null,
                signOutError: signOutResult.error ? signOutResult.error.message : null,
                sessionAfter: sessionAfter,
                signOutWasCalled: signOutCalled
              };
            },
            { provider, userData }
          );

          // Property 9 assertions:
          // 1. Should have had a session before sign out
          expect(result.hadSessionBefore).toBe(true);

          // 2. Sign out should not return an error
          expect(result.signOutError).toBeNull();

          // 3. Session should be null after sign out
          expect(result.sessionAfter).toBeNull();

          // 4. Sign out method should have been called
          expect(result.signOutWasCalled).toBe(true);
        }
      ),
      { 
        numRuns: 100, // Minimum 100 iterations as specified in design
        verbose: true 
      }
    );
  });

  test('Property 10: Sign-Out Clears Storage - signing out should clear session credentials from browser storage', async ({ page, context }) => {
    // Property-based test with 100 iterations
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          userId: fc.uuid()
        }),
        async (provider, userData) => {
          // Navigate to the game
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, userData }) => {
              // Create mock session data
              const mockSession = {
                access_token: 'mock_access_token_' + Math.random(),
                refresh_token: 'mock_refresh_token_' + Math.random(),
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                expires_in: 3600,
                token_type: 'bearer' as const,
                user: {
                  id: userData.userId,
                  email: userData.email,
                  app_metadata: {
                    provider: provider,
                    providers: [provider]
                  },
                  user_metadata: {
                    full_name: userData.name,
                    name: userData.name
                  },
                  created_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                }
              };

              // Store session in localStorage to simulate Supabase behavior
              const storageKey = 'slop_cultivator_session';
              const sessionData = {
                session: mockSession,
                storedAt: Date.now()
              };
              localStorage.setItem(storageKey, JSON.stringify(sessionData));

              let currentSession: typeof mockSession | null = mockSession;

              // Mock the Supabase client
              const mockSupabase = {
                auth: {
                  getSession: async () => ({
                    data: { session: currentSession },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: currentSession?.user || null },
                    error: null
                  }),
                  refreshSession: async () => ({
                    data: { session: currentSession },
                    error: null
                  }),
                  signOut: async () => {
                    currentSession = null;
                    return { error: null };
                  },
                  onAuthStateChange: (callback: any) => ({
                    data: {
                      subscription: {
                        unsubscribe: () => {}
                      }
                    }
                  }),
                  signInWithOAuth: async () => ({
                    data: { url: 'https://mock-oauth-url.com' },
                    error: null
                  })
                }
              };

              // Import and test the auth service with dependency injection
              const { AuthService } = await import('../shared/utils/auth-service');
              const authService = new AuthService(mockSupabase as any);

              // Verify storage has session data before sign out
              const storageBefore = localStorage.getItem(storageKey);

              // Sign out
              await authService.signOut();

              // Check storage after sign out
              const storageAfter = localStorage.getItem(storageKey);
              const sessionStorageLength = sessionStorage.length;

              return {
                hadStorageBefore: storageBefore !== null,
                storageAfter: storageAfter,
                sessionStorageCleared: sessionStorageLength === 0
              };
            },
            { provider, userData }
          );

          // Property 10 assertions:
          // 1. Should have had storage before sign out
          expect(result.hadStorageBefore).toBe(true);

          // 2. Storage should be cleared after sign out
          expect(result.storageAfter).toBeNull();

          // 3. Session storage should also be cleared
          expect(result.sessionStorageCleared).toBe(true);
        }
      ),
      { 
        numRuns: 100,
        verbose: true 
      }
    );
  });

  test('Property 11: Sign-Out Blocks Protected Access - after sign out, authenticated features should be denied', async ({ page }) => {
    // Property-based test with 100 iterations
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          userId: fc.uuid()
        }),
        async (provider, userData) => {
          // Navigate to the game
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, userData }) => {
              // Create mock session data
              const mockSession = {
                access_token: 'mock_access_token_' + Math.random(),
                refresh_token: 'mock_refresh_token_' + Math.random(),
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                expires_in: 3600,
                token_type: 'bearer' as const,
                user: {
                  id: userData.userId,
                  email: userData.email,
                  app_metadata: {
                    provider: provider,
                    providers: [provider]
                  },
                  user_metadata: {
                    full_name: userData.name,
                    name: userData.name
                  },
                  created_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                }
              };

              let currentSession: any = mockSession;

              // Mock the Supabase client
              const mockSupabase = {
                auth: {
                  getSession: async () => ({
                    data: { session: currentSession },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: currentSession?.user || null },
                    error: currentSession ? null : new Error('Not authenticated')
                  }),
                  refreshSession: async () => ({
                    data: { session: currentSession },
                    error: currentSession ? null : new Error('No session to refresh')
                  }),
                  signOut: async () => {
                    currentSession = null;
                    return { error: null };
                  },
                  onAuthStateChange: (callback: any) => ({
                    data: {
                      subscription: {
                        unsubscribe: () => {}
                      }
                    }
                  }),
                  signInWithOAuth: async () => ({
                    data: { url: 'https://mock-oauth-url.com' },
                    error: null
                  })
                }
              };

              // Import and test the auth service with dependency injection
              const { AuthService } = await import('../shared/utils/auth-service');
              const authService = new AuthService(mockSupabase as any);

              // Verify we can access authenticated features before sign out
              const userBefore = await authService.getUser();
              const sessionBefore = await authService.getSession();

              // Sign out
              await authService.signOut();

              // Try to access authenticated features after sign out
              const userAfter = await authService.getUser();
              const sessionAfter = await authService.getSession();

              // Try to refresh session (should fail)
              const refreshResult = await authService.refreshSession();

              return {
                hadAccessBefore: userBefore !== null && sessionBefore !== null,
                userAfter: userAfter,
                sessionAfter: sessionAfter,
                refreshAfter: refreshResult,
                accessDenied: userAfter === null && sessionAfter === null && refreshResult === null
              };
            },
            { provider, userData }
          );

          // Property 11 assertions:
          // 1. Should have had access before sign out
          expect(result.hadAccessBefore).toBe(true);

          // 2. User should be null after sign out
          expect(result.userAfter).toBeNull();

          // 3. Session should be null after sign out
          expect(result.sessionAfter).toBeNull();

          // 4. Refresh should fail after sign out
          expect(result.refreshAfter).toBeNull();

          // 5. Overall access should be denied
          expect(result.accessDenied).toBe(true);
        }
      ),
      { 
        numRuns: 100,
        verbose: true 
      }
    );
  });

  test('Property 9 (Idempotence): Multiple sign-out calls should be safe', async ({ page }) => {
    // Property: Signing out multiple times should not cause errors
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.emailAddress(),
        async (provider, email) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, email }) => {
              const mockUserId = crypto.randomUUID();
              const mockSession = {
                access_token: 'mock_access_token_' + Math.random(),
                refresh_token: 'mock_refresh_token_' + Math.random(),
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                expires_in: 3600,
                token_type: 'bearer' as const,
                user: {
                  id: mockUserId,
                  email: email,
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

              let currentSession: any = mockSession;

              // Mock the Supabase client
              const mockSupabase = {
                auth: {
                  getSession: async () => ({
                    data: { session: currentSession },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: currentSession?.user || null },
                    error: null
                  }),
                  refreshSession: async () => ({
                    data: { session: currentSession },
                    error: null
                  }),
                  signOut: async () => {
                    currentSession = null;
                    return { error: null };
                  },
                  onAuthStateChange: (callback: any) => ({
                    data: {
                      subscription: {
                        unsubscribe: () => {}
                      }
                    }
                  }),
                  signInWithOAuth: async () => ({
                    data: { url: 'https://mock-oauth-url.com' },
                    error: null
                  })
                }
              };

              // Import and test the auth service with dependency injection
              const { AuthService } = await import('../shared/utils/auth-service');
              const authService = new AuthService(mockSupabase as any);

              // Sign out multiple times
              const result1 = await authService.signOut();
              const result2 = await authService.signOut();
              const result3 = await authService.signOut();

              return {
                error1: result1.error,
                error2: result2.error,
                error3: result3.error,
                allSuccessful: result1.error === null && result2.error === null && result3.error === null
              };
            },
            { provider, email }
          );

          // Idempotence: Multiple sign-outs should not cause errors
          expect(result.error1).toBeNull();
          expect(result.error2).toBeNull();
          expect(result.error3).toBeNull();
          expect(result.allSuccessful).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10 (Edge Cases): Sign-out should handle various storage states', async ({ page }) => {
    // Test sign-out with different storage scenarios
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.record({
          email: fc.emailAddress(),
          userId: fc.uuid(),
          hasLocalStorage: fc.boolean(),
          hasSessionStorage: fc.boolean()
        }),
        async (provider, testData) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, testData }) => {
              const mockSession = {
                access_token: 'mock_access_token_' + Math.random(),
                refresh_token: 'mock_refresh_token_' + Math.random(),
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                expires_in: 3600,
                token_type: 'bearer' as const,
                user: {
                  id: testData.userId,
                  email: testData.email,
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

              // Clear all storage first to ensure clean state
              localStorage.clear();
              sessionStorage.clear();

              // Set up storage based on test data
              const storageKey = 'slop_cultivator_session';
              if (testData.hasLocalStorage) {
                const sessionData = {
                  session: mockSession,
                  storedAt: Date.now()
                };
                localStorage.setItem(storageKey, JSON.stringify(sessionData));
                localStorage.setItem('test.data', 'some value');
              }
              if (testData.hasSessionStorage) {
                sessionStorage.setItem('test.session', 'session value');
              }

              let currentSession: any = mockSession;

              // Mock the Supabase client
              const mockSupabase = {
                auth: {
                  getSession: async () => ({
                    data: { session: currentSession },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: currentSession?.user || null },
                    error: null
                  }),
                  refreshSession: async () => ({
                    data: { session: currentSession },
                    error: null
                  }),
                  signOut: async () => {
                    currentSession = null;
                    return { error: null };
                  },
                  onAuthStateChange: (callback: any) => ({
                    data: {
                      subscription: {
                        unsubscribe: () => {}
                      }
                    }
                  }),
                  signInWithOAuth: async () => ({
                    data: { url: 'https://mock-oauth-url.com' },
                    error: null
                  })
                }
              };

              // Import and test the auth service with dependency injection
              const { AuthService } = await import('../shared/utils/auth-service');
              const authService = new AuthService(mockSupabase as any);

              // Sign out
              const signOutResult = await authService.signOut();

              // Check storage after sign out
              const authTokenAfter = localStorage.getItem(storageKey);
              // Check if the test session storage item is still there (it should be - we only clear auth session)
              const testSessionItem = sessionStorage.getItem('test.session');

              return {
                signOutError: signOutResult.error,
                authTokenCleared: authTokenAfter === null,
                // Session storage should NOT be cleared - only the auth session in localStorage
                testSessionItemPreserved: testData.hasSessionStorage ? testSessionItem !== null : true
              };
            },
            { provider, testData }
          );

          // Should handle all storage states without errors
          expect(result.signOutError).toBeNull();
          // Auth token should always be cleared (or remain null if never set)
          expect(result.authTokenCleared).toBe(true);
          // Other session storage items should be preserved (sign-out only clears auth session)
          expect(result.testSessionItemPreserved).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11 (Invariant): Sign-out should consistently block all authenticated operations', async ({ page }) => {
    // Property: After sign-out, ALL authenticated operations should fail consistently
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.emailAddress(),
        async (provider, email) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, email }) => {
              const mockUserId = crypto.randomUUID();
              const mockSession = {
                access_token: 'mock_access_token_' + Math.random(),
                refresh_token: 'mock_refresh_token_' + Math.random(),
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                expires_in: 3600,
                token_type: 'bearer' as const,
                user: {
                  id: mockUserId,
                  email: email,
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

              let currentSession: any = mockSession;

              // Mock the Supabase client
              const mockSupabase = {
                auth: {
                  getSession: async () => ({
                    data: { session: currentSession },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: currentSession?.user || null },
                    error: null
                  }),
                  refreshSession: async () => ({
                    data: { session: currentSession },
                    error: null
                  }),
                  signOut: async () => {
                    currentSession = null;
                    return { error: null };
                  },
                  onAuthStateChange: (callback: any) => ({
                    data: {
                      subscription: {
                        unsubscribe: () => {}
                      }
                    }
                  }),
                  signInWithOAuth: async () => ({
                    data: { url: 'https://mock-oauth-url.com' },
                    error: null
                  })
                }
              };

              // Import and test the auth service with dependency injection
              const { AuthService } = await import('../shared/utils/auth-service');
              const authService = new AuthService(mockSupabase as any);

              // Sign out
              await authService.signOut();

              // Try multiple authenticated operations
              const session1 = await authService.getSession();
              const session2 = await authService.getSession();
              const user1 = await authService.getUser();
              const user2 = await authService.getUser();
              const refresh1 = await authService.refreshSession();
              const refresh2 = await authService.refreshSession();

              return {
                allSessionsNull: session1 === null && session2 === null,
                allUsersNull: user1 === null && user2 === null,
                allRefreshesNull: refresh1 === null && refresh2 === null,
                consistentlyBlocked: 
                  session1 === null && session2 === null &&
                  user1 === null && user2 === null &&
                  refresh1 === null && refresh2 === null
              };
            },
            { provider, email }
          );

          // Invariant: All authenticated operations should consistently return null
          expect(result.allSessionsNull).toBe(true);
          expect(result.allUsersNull).toBe(true);
          expect(result.allRefreshesNull).toBe(true);
          expect(result.consistentlyBlocked).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
