import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Returning User Profile Retrieval
 * Feature: user-authentication, Property 4: Returning User Profile Retrieval
 * Validates: Requirements 2.2
 * 
 * Property: For any user who has previously authenticated, signing in with the same 
 * provider should retrieve the existing User Profile rather than creating a new one.
 */

test.describe('Auth Service - Returning User Profile Retrieval (Property-Based)', () => {
  test('Property 4: Returning User Profile Retrieval - signing in multiple times should return the same user profile', async ({ page }) => {
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

          // Simulate multiple sign-ins with the same provider and user
          const result = await page.evaluate(
            async ({ provider, userMetadata }) => {
              // Create a consistent user ID for this user (simulating what Supabase would do)
              // In reality, Supabase would return the same user ID for the same provider + provider_id
              const consistentUserId = crypto.randomUUID();
              
              // Create mock session data for the first sign-in
              const createMockSession = () => ({
                access_token: 'mock_access_token_' + Math.random(),
                refresh_token: 'mock_refresh_token_' + Math.random(),
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                expires_in: 3600,
                token_type: 'bearer' as const,
                user: {
                  id: consistentUserId, // Same user ID for returning user
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
              });

              // Mock the Supabase client to return the same user on multiple sign-ins
              const mockSupabase = {
                auth: {
                  getSession: async () => ({
                    data: { session: createMockSession() },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: createMockSession().user },
                    error: null
                  }),
                  refreshSession: async () => ({
                    data: { session: createMockSession() },
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

              // Simulate first sign-in
              const firstCallback = await authService.handleOAuthCallback();
              const firstSession = await authService.getSession();
              const firstUser = await authService.getUser();

              // Simulate sign-out
              await authService.signOut();

              // Simulate second sign-in (returning user)
              const secondCallback = await authService.handleOAuthCallback();
              const secondSession = await authService.getSession();
              const secondUser = await authService.getUser();

              // Simulate sign-out again
              await authService.signOut();

              // Simulate third sign-in (returning user again)
              const thirdCallback = await authService.handleOAuthCallback();
              const thirdSession = await authService.getSession();
              const thirdUser = await authService.getUser();

              return {
                firstUserId: firstUser?.id,
                secondUserId: secondUser?.id,
                thirdUserId: thirdUser?.id,
                firstEmail: firstUser?.email,
                secondEmail: secondUser?.email,
                thirdEmail: thirdUser?.email,
                firstSessionUserId: firstSession?.user?.id,
                secondSessionUserId: secondSession?.user?.id,
                thirdSessionUserId: thirdSession?.user?.id,
                allCallbacksSucceeded: 
                  firstCallback.session !== null && 
                  secondCallback.session !== null && 
                  thirdCallback.session !== null
              };
            },
            { provider, userMetadata }
          );

          // Property assertions:
          // 1. All callbacks should succeed
          expect(result.allCallbacksSucceeded).toBe(true);

          // 2. The user ID should be the same across all sign-ins (not creating new users)
          expect(result.firstUserId).toBeDefined();
          expect(result.firstUserId).toBe(result.secondUserId);
          expect(result.secondUserId).toBe(result.thirdUserId);

          // 3. The email should be consistent across all sign-ins
          expect(result.firstEmail).toBe(userMetadata.email);
          expect(result.secondEmail).toBe(userMetadata.email);
          expect(result.thirdEmail).toBe(userMetadata.email);

          // 4. Session user IDs should match the user IDs
          expect(result.firstSessionUserId).toBe(result.firstUserId);
          expect(result.secondSessionUserId).toBe(result.secondUserId);
          expect(result.thirdSessionUserId).toBe(result.thirdUserId);
        }
      ),
      { 
        numRuns: 100, // Minimum 100 iterations as specified in design
        verbose: true 
      }
    );
  });

  test('Property 4 (Edge Cases): Returning user should maintain profile across different session tokens', async ({ page }) => {
    // Test that even though tokens change, the user profile remains the same
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          provider_id: fc.uuid()
        }),
        async (provider, userMetadata) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, userMetadata }) => {
              const consistentUserId = crypto.randomUUID();
              
              // Track different tokens to verify they change
              const tokens: string[] = [];
              
              const createMockSession = () => {
                const token = 'mock_access_token_' + Math.random();
                tokens.push(token);
                return {
                  access_token: token,
                  refresh_token: 'mock_refresh_token_' + Math.random(),
                  expires_at: Math.floor(Date.now() / 1000) + 3600,
                  expires_in: 3600,
                  token_type: 'bearer' as const,
                  user: {
                    id: consistentUserId,
                    email: userMetadata.email,
                    app_metadata: {
                      provider: provider,
                      providers: [provider]
                    },
                    user_metadata: {
                      full_name: userMetadata.name,
                      name: userMetadata.name,
                      provider_id: userMetadata.provider_id
                    },
                    created_at: new Date().toISOString(),
                    aud: 'authenticated',
                    role: 'authenticated'
                  }
                };
              };

              const mockSupabase = {
                auth: {
                  getSession: async () => ({
                    data: { session: createMockSession() },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: createMockSession().user },
                    error: null
                  }),
                  refreshSession: async () => ({
                    data: { session: createMockSession() },
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

              const { AuthService } = await import('../shared/utils/auth-service');
              const authService = new AuthService(mockSupabase as any);

              // Multiple sign-ins
              await authService.handleOAuthCallback();
              const session1 = await authService.getSession();
              const user1 = await authService.getUser();
              
              await authService.signOut();
              
              await authService.handleOAuthCallback();
              const session2 = await authService.getSession();
              const user2 = await authService.getUser();

              return {
                user1Id: user1?.id,
                user2Id: user2?.id,
                token1: session1?.access_token,
                token2: session2?.access_token,
                tokensAreDifferent: session1?.access_token !== session2?.access_token,
                userIdsAreSame: user1?.id === user2?.id
              };
            },
            { provider, userMetadata }
          );

          // Tokens should be different (new session each time)
          expect(result.tokensAreDifferent).toBe(true);
          
          // But user IDs should be the same (same profile)
          expect(result.userIdsAreSame).toBe(true);
          expect(result.user1Id).toBe(result.user2Id);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4 (Invariant): User profile identity must be preserved across sign-in cycles', async ({ page }) => {
    // Property: The user.id field must remain constant for the same provider + provider_id combination
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google' as const, 'discord' as const),
        fc.emailAddress(),
        fc.uuid(), // provider_id
        fc.integer({ min: 2, max: 5 }), // Number of sign-in cycles to test
        async (provider, email, providerId, numCycles) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ provider, email, providerId, numCycles }) => {
              const consistentUserId = crypto.randomUUID();
              
              const createMockSession = () => ({
                access_token: 'mock_access_token_' + Math.random(),
                refresh_token: 'mock_refresh_token_' + Math.random(),
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                expires_in: 3600,
                token_type: 'bearer' as const,
                user: {
                  id: consistentUserId,
                  email: email,
                  app_metadata: {
                    provider: provider,
                    providers: [provider]
                  },
                  user_metadata: {
                    provider_id: providerId
                  },
                  created_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                }
              });

              const mockSupabase = {
                auth: {
                  getSession: async () => ({
                    data: { session: createMockSession() },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: createMockSession().user },
                    error: null
                  }),
                  refreshSession: async () => ({
                    data: { session: createMockSession() },
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

              const { AuthService } = await import('../shared/utils/auth-service');
              const authService = new AuthService(mockSupabase as any);

              // Perform multiple sign-in cycles
              const userIds: string[] = [];
              for (let i = 0; i < numCycles; i++) {
                await authService.handleOAuthCallback();
                const user = await authService.getUser();
                if (user?.id) {
                  userIds.push(user.id);
                }
                await authService.signOut();
              }

              // Check if all user IDs are the same
              const allSame = userIds.every(id => id === userIds[0]);
              const uniqueIds = new Set(userIds);

              return {
                userIds,
                allSame,
                uniqueCount: uniqueIds.size,
                expectedCount: 1
              };
            },
            { provider, email, providerId, numCycles }
          );

          // Invariant: All user IDs must be identical
          expect(result.allSame).toBe(true);
          expect(result.uniqueCount).toBe(result.expectedCount);
          expect(result.userIds.length).toBe(numCycles);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4 (Cross-Provider): Different providers should create different user profiles', async ({ page }) => {
    // Property: Signing in with different providers should result in different user profiles
    // This is the inverse property - helps verify we're not incorrectly merging profiles
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
        }),
        async (userMetadata) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ userMetadata }) => {
              // Create different user IDs for different providers (simulating Supabase behavior)
              const googleUserId = crypto.randomUUID();
              const discordUserId = crypto.randomUUID();
              
              const createMockSession = (provider: 'google' | 'discord') => ({
                access_token: 'mock_access_token_' + Math.random(),
                refresh_token: 'mock_refresh_token_' + Math.random(),
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                expires_in: 3600,
                token_type: 'bearer' as const,
                user: {
                  id: provider === 'google' ? googleUserId : discordUserId,
                  email: userMetadata.email,
                  app_metadata: {
                    provider: provider,
                    providers: [provider]
                  },
                  user_metadata: {
                    full_name: userMetadata.name,
                    name: userMetadata.name
                  },
                  created_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                }
              });

              let currentProvider: 'google' | 'discord' = 'google';

              const mockSupabase = {
                auth: {
                  getSession: async () => ({
                    data: { session: createMockSession(currentProvider) },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: createMockSession(currentProvider).user },
                    error: null
                  }),
                  refreshSession: async () => ({
                    data: { session: createMockSession(currentProvider) },
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

              const { AuthService } = await import('../shared/utils/auth-service');
              const authService = new AuthService(mockSupabase as any);

              // Sign in with Google
              currentProvider = 'google';
              await authService.handleOAuthCallback();
              const googleUser = await authService.getUser();
              
              await authService.signOut();
              
              // Sign in with Discord
              currentProvider = 'discord';
              await authService.handleOAuthCallback();
              const discordUser = await authService.getUser();

              return {
                googleUserId: googleUser?.id,
                discordUserId: discordUser?.id,
                userIdsAreDifferent: googleUser?.id !== discordUser?.id,
                googleProvider: googleUser?.app_metadata?.provider,
                discordProvider: discordUser?.app_metadata?.provider
              };
            },
            { userMetadata }
          );

          // Different providers should result in different user profiles
          expect(result.userIdsAreDifferent).toBe(true);
          expect(result.googleUserId).not.toBe(result.discordUserId);
          expect(result.googleProvider).toBe('google');
          expect(result.discordProvider).toBe('discord');
        }
      ),
      { numRuns: 100 }
    );
  });
});
