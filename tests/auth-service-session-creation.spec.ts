import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for SSO Authentication Session Creation
 * Feature: user-authentication, Property 2: SSO Authentication Creates Profile and Session
 * Validates: Requirements 1.3
 * 
 * Property: For any successful SSO authentication callback, the system should create 
 * or retrieve a User Profile and establish a valid Session.
 */

test.describe('Auth Service - SSO Authentication Session Creation (Property-Based)', () => {
  test('Property 2: SSO Authentication Creates Profile and Session - successful OAuth callback should create session and profile', async ({ page }) => {
    // Property-based test with 100 iterations as specified in design
    await fc.assert(
      fc.asyncProperty(
        // Generate random OAuth providers (google or discord)
        fc.constantFrom('google' as const, 'discord' as const),
        // Generate random user metadata that would come from OAuth providers
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          avatar_url: fc.webUrl(),
          provider_id: fc.uuid()
        }),
        async (provider, userMetadata) => {
          // Navigate to the game
          await page.goto('http://localhost:5173');

          // Mock the Supabase client to simulate successful OAuth callback
          const result = await page.evaluate(
            async ({ provider, userMetadata }) => {
              // Create mock session data
              const mockUserId = crypto.randomUUID();
              const mockSession = {
                access_token: 'mock_access_token_' + Math.random(),
                refresh_token: 'mock_refresh_token_' + Math.random(),
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                expires_in: 3600,
                token_type: 'bearer' as const,
                user: {
                  id: mockUserId,
                  email: userMetadata.email,
                  app_metadata: {
                    provider: provider,
                    providers: [provider]
                  },
                  user_metadata: {
                    avatar_url: userMetadata.avatar_url,
                    full_name: userMetadata.name,
                    name: userMetadata.name,
                    provider_id: userMetadata.provider_id
                  },
                  created_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                }
              };

              // Create a mock Supabase client using dependency injection
              const mockSupabase = {
                auth: {
                  getSession: async () => ({
                    data: { session: mockSession },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: mockSession.user },
                    error: null
                  }),
                  refreshSession: async () => ({
                    data: { session: mockSession },
                    error: null
                  }),
                  signOut: async () => ({
                    error: null
                  }),
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

              // Import and create auth service with mock client via dependency injection
              const { AuthService } = await import('../shared/utils/auth-service');
              const authService = new AuthService(mockSupabase as any);

              // Call handleOAuthCallback to process the mock session
              const callbackResult = await authService.handleOAuthCallback();

              // Get the session to verify it was created
              const session = await authService.getSession();

              // Get the user to verify profile data
              const user = await authService.getUser();

              return {
                callbackSession: callbackResult.session,
                callbackError: callbackResult.error ? callbackResult.error.message : null,
                currentSession: session,
                currentUser: user
              };
            },
            { provider, userMetadata }
          );

          // Property assertions:
          // 1. The callback should not return an error
          expect(result.callbackError).toBeNull();

          // 2. The callback should return a valid session
          expect(result.callbackSession).not.toBeNull();
          if (result.callbackSession) {
            expect(result.callbackSession.access_token).toBeDefined();
            expect(result.callbackSession.refresh_token).toBeDefined();
            expect(result.callbackSession.user).toBeDefined();
            expect(result.callbackSession.user.id).toBeDefined();
          }

          // 3. The session should be retrievable after callback
          expect(result.currentSession).not.toBeNull();
          if (result.currentSession) {
            expect(result.currentSession.access_token).toBeDefined();
            expect(result.currentSession.user).toBeDefined();
          }

          // 4. The user should be retrievable after callback
          expect(result.currentUser).not.toBeNull();
          if (result.currentUser) {
            expect(result.currentUser.id).toBeDefined();
            expect(result.currentUser.email).toBe(userMetadata.email);
          }

          // 5. Session and user should have matching IDs
          if (result.callbackSession && result.currentUser) {
            expect(result.callbackSession.user.id).toBe(result.currentUser.id);
          }

          // 6. User metadata should be preserved from OAuth provider
          if (result.currentUser && result.currentUser.user_metadata) {
            expect(result.currentUser.user_metadata.name).toBe(userMetadata.name);
          }
        }
      ),
      { 
        numRuns: 100, // Minimum 100 iterations as specified in design
        verbose: true 
      }
    );
  });

  test('Property 2 (Edge Cases): OAuth callback should handle various user metadata formats', async ({ page }) => {
    // Test with edge case user metadata
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.record({
          email: fc.oneof(
            fc.emailAddress(),
            fc.constant(null) // Some providers might not provide email
          ),
          name: fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            fc.constant('User'), // Default name
            fc.string({ minLength: 1, maxLength: 100 }).map(s => s + ' ' + s) // Long names
          ),
          avatar_url: fc.oneof(
            fc.webUrl(),
            fc.constant(null) // No avatar
          ),
          provider_id: fc.uuid()
        }),
        async (provider, userMetadata) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, userMetadata }) => {
              const mockUserId = crypto.randomUUID();
              const mockSession = {
                access_token: 'mock_access_token_' + Math.random(),
                refresh_token: 'mock_refresh_token_' + Math.random(),
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                expires_in: 3600,
                token_type: 'bearer' as const,
                user: {
                  id: mockUserId,
                  email: userMetadata.email,
                  app_metadata: {
                    provider: provider,
                    providers: [provider]
                  },
                  user_metadata: {
                    avatar_url: userMetadata.avatar_url,
                    full_name: userMetadata.name,
                    name: userMetadata.name,
                    provider_id: userMetadata.provider_id
                  },
                  created_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                }
              };

              // Mock the Supabase client
              const mockSupabase = {
                auth: {
                  getSession: async () => ({
                    data: { session: mockSession },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: mockSession.user },
                    error: null
                  }),
                  refreshSession: async () => ({
                    data: { session: mockSession },
                    error: null
                  }),
                  signOut: async () => ({
                    error: null
                  }),
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

              // Import and create auth service with mock client via dependency injection
              const { AuthService } = await import('../shared/utils/auth-service');
              const authService = new AuthService(mockSupabase as any);

              const callbackResult = await authService.handleOAuthCallback();
              const session = await authService.getSession();

              return {
                hasSession: callbackResult.session !== null,
                hasError: callbackResult.error !== null,
                sessionValid: session !== null
              };
            },
            { provider, userMetadata }
          );

          // Should handle all metadata formats without throwing
          expect(result.hasError).toBe(false);
          expect(result.hasSession).toBe(true);
          expect(result.sessionValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2 (Invariant): Session tokens should always be present in successful authentication', async ({ page }) => {
    // Property: A successful OAuth callback must always include access_token and refresh_token
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (provider, email, name) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, email, name }) => {
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
                  user_metadata: {
                    full_name: name,
                    name: name
                  },
                  created_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                }
              };

              // Mock the Supabase client
              const mockSupabase = {
                auth: {
                  getSession: async () => ({
                    data: { session: mockSession },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: mockSession.user },
                    error: null
                  }),
                  refreshSession: async () => ({
                    data: { session: mockSession },
                    error: null
                  }),
                  signOut: async () => ({
                    error: null
                  }),
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

              // Import and create auth service with mock client via dependency injection
              const { AuthService } = await import('../shared/utils/auth-service');
              const authService = new AuthService(mockSupabase as any);

              const callbackResult = await authService.handleOAuthCallback();

              return {
                session: callbackResult.session
              };
            },
            { provider, email, name }
          );

          // Invariant: Session must have both tokens
          if (result.session) {
            expect(result.session.access_token).toBeDefined();
            expect(result.session.access_token.length).toBeGreaterThan(0);
            expect(result.session.refresh_token).toBeDefined();
            expect(result.session.refresh_token.length).toBeGreaterThan(0);
            expect(result.session.token_type).toBe('bearer');
            expect(result.session.user).toBeDefined();
            expect(result.session.user.id).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2 (Idempotence): Multiple calls to getSession should return the same session', async ({ page }) => {
    // Property: Getting the session multiple times should return consistent data
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

              // Mock the Supabase client
              const mockSupabase = {
                auth: {
                  getSession: async () => ({
                    data: { session: mockSession },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: mockSession.user },
                    error: null
                  }),
                  refreshSession: async () => ({
                    data: { session: mockSession },
                    error: null
                  }),
                  signOut: async () => ({
                    error: null
                  }),
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

              // Import and create auth service with mock client via dependency injection
              const { AuthService } = await import('../shared/utils/auth-service');
              const authService = new AuthService(mockSupabase as any);

              // Call handleOAuthCallback first
              await authService.handleOAuthCallback();

              // Get session multiple times
              const session1 = await authService.getSession();
              const session2 = await authService.getSession();
              const session3 = await authService.getSession();

              return {
                session1UserId: session1?.user?.id,
                session2UserId: session2?.user?.id,
                session3UserId: session3?.user?.id,
                session1Token: session1?.access_token,
                session2Token: session2?.access_token,
                session3Token: session3?.access_token
              };
            },
            { provider, email }
          );

          // Idempotence: All calls should return the same session
          expect(result.session1UserId).toBe(result.session2UserId);
          expect(result.session2UserId).toBe(result.session3UserId);
          expect(result.session1Token).toBe(result.session2Token);
          expect(result.session2Token).toBe(result.session3Token);
        }
      ),
      { numRuns: 100 }
    );
  });
});
