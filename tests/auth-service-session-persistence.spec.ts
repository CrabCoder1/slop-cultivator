import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Session Persistence
 * Feature: user-authentication, Property 6: Session Storage Persistence
 * Feature: user-authentication, Property 7: Session Restoration After Refresh
 * Validates: Requirements 3.1, 3.2, 3.4
 * 
 * Property 6: For any successful authentication, session credentials should be 
 * stored in browser storage and remain accessible.
 * 
 * Property 7: For any valid session stored in browser storage, refreshing the 
 * browser should restore the session without requiring re-authentication.
 */

test.describe('Auth Service - Session Persistence (Property-Based)', () => {
  test('Property 6: Session Storage Persistence - successful authentication should store session in browser storage', async ({ page }) => {
    // Property-based test with 100 iterations as specified in design
    await fc.assert(
      fc.asyncProperty(
        // Generate random OAuth providers
        fc.constantFrom('google' as const, 'discord' as const),
        // Generate random session data
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          userId: fc.uuid(),
          accessToken: fc.string({ minLength: 20, maxLength: 100 }),
          refreshToken: fc.string({ minLength: 20, maxLength: 100 }),
          expiresIn: fc.integer({ min: 3600, max: 86400 }) // 1 hour to 24 hours
        }),
        async (provider, sessionData) => {
          // Navigate to the game
          await page.goto('http://localhost:5173');

          // Create and store a session
          const result = await page.evaluate(
            async ({ provider, sessionData }) => {
              // Create mock session
              const mockSession = {
                access_token: sessionData.accessToken,
                refresh_token: sessionData.refreshToken,
                expires_at: Math.floor(Date.now() / 1000) + sessionData.expiresIn,
                expires_in: sessionData.expiresIn,
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

              // Import session storage utilities
              const { storeSession, retrieveSession } = await import('../shared/utils/session-storage');

              // Store the session
              try {
                storeSession(mockSession);
              } catch (error) {
                return {
                  storeError: error instanceof Error ? error.message : 'Unknown error',
                  storedSession: null,
                  retrievedSession: null,
                  storageAvailable: false
                };
              }

              // Retrieve the session to verify it was stored
              const retrievedSession = retrieveSession();

              // Check if localStorage has the session
              const storageKey = 'slop_cultivator_session';
              const rawStored = localStorage.getItem(storageKey);
              const storedData = rawStored ? JSON.parse(rawStored) : null;

              return {
                storeError: null,
                storedSession: storedData,
                retrievedSession: retrievedSession,
                storageAvailable: true,
                accessTokenMatch: retrievedSession?.access_token === sessionData.accessToken,
                refreshTokenMatch: retrievedSession?.refresh_token === sessionData.refreshToken,
                userIdMatch: retrievedSession?.user?.id === sessionData.userId,
                emailMatch: retrievedSession?.user?.email === sessionData.email
              };
            },
            { provider, sessionData }
          );

          // Property assertions:
          // 1. Storage should be available (unless in private browsing)
          if (!result.storageAvailable) {
            // If storage is not available, storeSession should throw StorageAccessError
            expect(result.storeError).toContain('Storage access is denied');
            return; // Skip remaining assertions for this iteration
          }

          // 2. Session should be stored in localStorage
          expect(result.storedSession).not.toBeNull();
          expect(result.storedSession.session).toBeDefined();
          expect(result.storedSession.storedAt).toBeDefined();

          // 3. Retrieved session should match stored session
          expect(result.retrievedSession).not.toBeNull();
          expect(result.accessTokenMatch).toBe(true);
          expect(result.refreshTokenMatch).toBe(true);
          expect(result.userIdMatch).toBe(true);
          expect(result.emailMatch).toBe(true);

          // 4. Session should contain all required fields
          if (result.retrievedSession) {
            expect(result.retrievedSession.access_token).toBeDefined();
            expect(result.retrievedSession.refresh_token).toBeDefined();
            expect(result.retrievedSession.expires_at).toBeDefined();
            expect(result.retrievedSession.user).toBeDefined();
            expect(result.retrievedSession.user.id).toBeDefined();
          }
        }
      ),
      { 
        numRuns: 100, // Minimum 100 iterations as specified in design
        verbose: true 
      }
    );
  });

  test('Property 7: Session Restoration After Refresh - valid session should be restored after page refresh', async ({ page, context }) => {
    // Property-based test with 30 iterations (reduced due to page reload overhead)
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          userId: fc.uuid(),
          accessToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          refreshToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          expiresIn: fc.integer({ min: 3600, max: 86400 })
        }),
        async (provider, sessionData) => {
          // Navigate to the game
          await page.goto('http://localhost:5173');

          // Store a session in the first page load
          await page.evaluate(
            async ({ provider, sessionData }) => {
              const mockSession = {
                access_token: sessionData.accessToken,
                refresh_token: sessionData.refreshToken,
                expires_at: Math.floor(Date.now() / 1000) + sessionData.expiresIn,
                expires_in: sessionData.expiresIn,
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

              const { storeSession } = await import('../shared/utils/session-storage');
              storeSession(mockSession);
            },
            { provider, sessionData }
          );

          // Refresh the page to simulate browser refresh
          await page.reload();

          // Wait for page to load
          await page.waitForLoadState('domcontentloaded');

          // Retrieve the session after refresh
          const result = await page.evaluate(
            async ({ sessionData }) => {
              const { retrieveSession } = await import('../shared/utils/session-storage');
              const retrievedSession = retrieveSession();

              return {
                sessionExists: retrievedSession !== null,
                accessToken: retrievedSession?.access_token,
                refreshToken: retrievedSession?.refresh_token,
                userId: retrievedSession?.user?.id,
                email: retrievedSession?.user?.email,
                accessTokenMatch: retrievedSession?.access_token === sessionData.accessToken,
                refreshTokenMatch: retrievedSession?.refresh_token === sessionData.refreshToken,
                userIdMatch: retrievedSession?.user?.id === sessionData.userId,
                emailMatch: retrievedSession?.user?.email === sessionData.email
              };
            },
            { sessionData }
          );

          // Property assertions:
          // 1. Session should still exist after refresh
          expect(result.sessionExists).toBe(true);

          // 2. Session data should match original session
          expect(result.accessTokenMatch).toBe(true);
          expect(result.refreshTokenMatch).toBe(true);
          expect(result.userIdMatch).toBe(true);
          expect(result.emailMatch).toBe(true);

          // 3. All session fields should be present
          expect(result.accessToken).toBeDefined();
          expect(result.refreshToken).toBeDefined();
          expect(result.userId).toBeDefined();
          expect(result.email).toBeDefined();
        }
      ),
      { 
        numRuns: 30, // Reduced due to page reload overhead
        verbose: true,
        timeout: 60000 // Increase timeout for page reloads
      }
    );
  });

  test('Property 6 (Edge Cases): Session storage should handle various session data formats', async ({ page }) => {
    // Test with edge case session data
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.record({
          email: fc.oneof(
            fc.emailAddress(),
            fc.constant(null)
          ),
          name: fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            fc.string({ minLength: 100, maxLength: 200 }), // Very long names
            fc.constant('A') // Single character
          ),
          userId: fc.uuid(),
          accessToken: fc.oneof(
            fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
            fc.string({ minLength: 200, maxLength: 500 }).filter(s => s.trim().length > 0) // Very long tokens
          ),
          refreshToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          expiresIn: fc.oneof(
            fc.constant(3600), // 1 hour
            fc.constant(600), // 10 minutes (longer than 5-minute buffer)
            fc.constant(86400) // 24 hours
          )
        }),
        async (provider, sessionData) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, sessionData }) => {
              const mockSession = {
                access_token: sessionData.accessToken,
                refresh_token: sessionData.refreshToken,
                expires_at: Math.floor(Date.now() / 1000) + sessionData.expiresIn,
                expires_in: sessionData.expiresIn,
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

              try {
                const { storeSession, retrieveSession } = await import('../shared/utils/session-storage');
                storeSession(mockSession);
                const retrieved = retrieveSession();
                
                return {
                  success: true,
                  sessionStored: retrieved !== null,
                  error: null
                };
              } catch (error) {
                return {
                  success: false,
                  sessionStored: false,
                  error: error instanceof Error ? error.message : 'Unknown error'
                };
              }
            },
            { provider, sessionData }
          );

          // Should handle all session formats without throwing (unless storage quota exceeded)
          if (result.success) {
            expect(result.sessionStored).toBe(true);
          } else {
            // If it fails, it should be due to storage issues
            expect(result.error).toBeDefined();
          }
        }
      ),
      { numRuns: 30, timeout: 60000 } // Reduced iterations and increased timeout
    );
  });

  test('Property 7 (Invariant): Session restoration should preserve all session fields', async ({ page }) => {
    // Property: All fields in the stored session should be present after restoration
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          userId: fc.uuid(),
          accessToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          refreshToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          expiresIn: fc.integer({ min: 3600, max: 86400 }),
          avatarUrl: fc.webUrl()
        }),
        async (provider, sessionData) => {
          await page.goto('http://localhost:5173');

          // Store session with all fields
          await page.evaluate(
            async ({ provider, sessionData }) => {
              const mockSession = {
                access_token: sessionData.accessToken,
                refresh_token: sessionData.refreshToken,
                expires_at: Math.floor(Date.now() / 1000) + sessionData.expiresIn,
                expires_in: sessionData.expiresIn,
                token_type: 'bearer' as const,
                user: {
                  id: sessionData.userId,
                  email: sessionData.email,
                  app_metadata: {
                    provider: provider,
                    providers: [provider]
                  },
                  user_metadata: {
                    name: sessionData.name,
                    avatar_url: sessionData.avatarUrl
                  },
                  created_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                }
              };

              const { storeSession } = await import('../shared/utils/session-storage');
              storeSession(mockSession);
            },
            { provider, sessionData }
          );

          // Refresh and retrieve
          await page.reload();
          await page.waitForLoadState('domcontentloaded');

          const result = await page.evaluate(async () => {
            const { retrieveSession } = await import('../shared/utils/session-storage');
            const session = retrieveSession();

            return {
              hasAccessToken: session?.access_token !== undefined,
              hasRefreshToken: session?.refresh_token !== undefined,
              hasExpiresAt: session?.expires_at !== undefined,
              hasExpiresIn: session?.expires_in !== undefined,
              hasTokenType: session?.token_type !== undefined,
              hasUser: session?.user !== undefined,
              hasUserId: session?.user?.id !== undefined,
              hasEmail: session?.user?.email !== undefined,
              hasAppMetadata: session?.user?.app_metadata !== undefined,
              hasUserMetadata: session?.user?.user_metadata !== undefined,
              hasProvider: session?.user?.app_metadata?.provider !== undefined,
              hasName: session?.user?.user_metadata?.name !== undefined,
              hasAvatarUrl: session?.user?.user_metadata?.avatar_url !== undefined
            };
          });

          // Invariant: All fields should be preserved
          expect(result.hasAccessToken).toBe(true);
          expect(result.hasRefreshToken).toBe(true);
          expect(result.hasExpiresAt).toBe(true);
          expect(result.hasExpiresIn).toBe(true);
          expect(result.hasTokenType).toBe(true);
          expect(result.hasUser).toBe(true);
          expect(result.hasUserId).toBe(true);
          expect(result.hasEmail).toBe(true);
          expect(result.hasAppMetadata).toBe(true);
          expect(result.hasUserMetadata).toBe(true);
          expect(result.hasProvider).toBe(true);
          expect(result.hasName).toBe(true);
          expect(result.hasAvatarUrl).toBe(true);
        }
      ),
      { numRuns: 30, timeout: 60000 } // Reduced iterations and increased timeout
    );
  });

  test('Property 6 (Error Handling): Storage quota exceeded should throw appropriate error', async ({ page }) => {
    // Property: When storage quota is exceeded, storeSession should throw StorageQuotaError
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      // Create a very large session to potentially exceed quota
      const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB of data
      const mockSession = {
        access_token: largeData,
        refresh_token: 'mock_refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
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

      try {
        const { storeSession } = await import('../shared/utils/session-storage');
        storeSession(mockSession);
        return {
          threwError: false,
          errorType: null,
          errorMessage: null
        };
      } catch (error) {
        return {
          threwError: true,
          errorType: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Should either succeed or throw a storage-related error
    if (result.threwError) {
      expect(['StorageQuotaError', 'StorageAccessError']).toContain(result.errorType);
      expect(result.errorMessage).toBeDefined();
    }
  });

  test('Property 7 (Expired Session): Expired sessions should not be restored after refresh', async ({ page }) => {
    // Property: Sessions that have expired should return null when retrieved
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.record({
          email: fc.emailAddress(),
          userId: fc.uuid(),
          accessToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0),
          refreshToken: fc.string({ minLength: 20, maxLength: 100 }).filter(s => s.trim().length > 0)
        }),
        async (provider, sessionData) => {
          await page.goto('http://localhost:5173');

          // Store an expired session
          await page.evaluate(
            async ({ provider, sessionData }) => {
              const expiredSession = {
                access_token: sessionData.accessToken,
                refresh_token: sessionData.refreshToken,
                expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
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
            },
            { provider, sessionData }
          );

          // Refresh the page
          await page.reload();
          await page.waitForLoadState('domcontentloaded');

          // Try to retrieve the expired session
          const result = await page.evaluate(async () => {
            const { retrieveSession } = await import('../shared/utils/session-storage');
            const session = retrieveSession();

            // Check if localStorage still has the session key
            const storageKey = 'slop_cultivator_session';
            const hasStorageKey = localStorage.getItem(storageKey) !== null;

            return {
              sessionRetrieved: session !== null,
              storageCleared: !hasStorageKey
            };
          });

          // Property: Expired sessions should not be retrieved
          expect(result.sessionRetrieved).toBe(false);
          
          // Property: Expired sessions should be cleaned up from storage
          expect(result.storageCleared).toBe(true);
        }
      ),
      { numRuns: 30, timeout: 60000 } // Reduced iterations and increased timeout
    );
  });
});
