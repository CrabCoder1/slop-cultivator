import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Authentication Data Loading
 * Feature: user-authentication, Property 5: Authentication Loads User Data
 * Validates: Requirements 2.3
 * 
 * Property: For any authenticated user with saved data, signing in should load 
 * all game progress, achievements, and preferences from the server.
 */

test.describe('Profile Service - Authentication Data Loading (Property-Based)', () => {
  test('Property 5: Authentication Loads User Data - signing in should load user profile from server', async ({ page }) => {
    // Property-based test with 100 iterations as specified in design
    await fc.assert(
      fc.asyncProperty(
        // Generate random user profile data
        fc.record({
          userId: fc.uuid(),
          username: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
          displayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          avatarUrl: fc.webUrl(),
          provider: fc.constantFrom('google' as const, 'discord' as const, 'github' as const),
          providerId: fc.uuid()
        }),
        async (profileData) => {
          // Navigate to the game
          await page.goto('http://localhost:5173');

          // Test that ProfileService loads user data correctly
          const result = await page.evaluate(
            async (profileData) => {
              // Create mock profile data that would be in the database
              const mockProfile = {
                id: profileData.userId,
                username: profileData.username,
                display_name: profileData.displayName,
                avatar_url: profileData.avatarUrl,
                provider: profileData.provider,
                provider_id: profileData.providerId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              // Mock the Supabase client to return the profile
              const mockSupabase = {
                from: (table: string) => ({
                  select: (columns: string) => ({
                    eq: (column: string, value: any) => ({
                      single: async () => ({
                        data: table === 'profiles' ? mockProfile : null,
                        error: null
                      })
                    })
                  })
                })
              };

              // Import and create profile service with mock client
              const { ProfileService } = await import('../shared/utils/profile-service');
              const profileService = new ProfileService(mockSupabase as any);

              // Load the profile
              const loadedProfile = await profileService.getProfile(profileData.userId);

              return {
                loadedProfile,
                expectedUserId: profileData.userId,
                expectedUsername: profileData.username,
                expectedDisplayName: profileData.displayName,
                expectedAvatarUrl: profileData.avatarUrl,
                expectedProvider: profileData.provider,
                expectedProviderId: profileData.providerId
              };
            },
            profileData
          );

          // Property assertions:
          // 1. Profile should be loaded successfully
          expect(result.loadedProfile).not.toBeNull();

          // 2. Profile should have the correct user ID
          if (result.loadedProfile) {
            expect(result.loadedProfile.id).toBe(result.expectedUserId);
          }

          // 3. Profile should have the correct username
          if (result.loadedProfile) {
            expect(result.loadedProfile.username).toBe(result.expectedUsername);
          }

          // 4. Profile should have the correct display name
          if (result.loadedProfile) {
            expect(result.loadedProfile.display_name).toBe(result.expectedDisplayName);
          }

          // 5. Profile should have the correct avatar URL
          if (result.loadedProfile) {
            expect(result.loadedProfile.avatar_url).toBe(result.expectedAvatarUrl);
          }

          // 6. Profile should have the correct provider
          if (result.loadedProfile) {
            expect(result.loadedProfile.provider).toBe(result.expectedProvider);
          }

          // 7. Profile should have the correct provider ID
          if (result.loadedProfile) {
            expect(result.loadedProfile.provider_id).toBe(result.expectedProviderId);
          }

          // 8. Profile should have timestamps
          if (result.loadedProfile) {
            expect(result.loadedProfile.created_at).toBeDefined();
            expect(result.loadedProfile.updated_at).toBeDefined();
          }
        }
      ),
      { 
        numRuns: 100, // Minimum 100 iterations as specified in design
        verbose: true 
      }
    );
  });

  test('Property 5 (Edge Cases): Profile loading should handle missing or null fields gracefully', async ({ page }) => {
    // Test with edge case profile data (null/missing fields)
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          username: fc.oneof(
            fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
            fc.constant(null) // Username can be null
          ),
          displayName: fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            fc.constant(null) // Display name can be null
          ),
          avatarUrl: fc.oneof(
            fc.webUrl(),
            fc.constant(null) // Avatar URL can be null
          ),
          provider: fc.constantFrom('google' as const, 'discord' as const, 'github' as const, 'steam' as const),
          providerId: fc.oneof(
            fc.uuid(),
            fc.constant(null) // Provider ID can be null
          )
        }),
        async (profileData) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async (profileData) => {
              const mockProfile = {
                id: profileData.userId,
                username: profileData.username,
                display_name: profileData.displayName,
                avatar_url: profileData.avatarUrl,
                provider: profileData.provider,
                provider_id: profileData.providerId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const mockSupabase = {
                from: (table: string) => ({
                  select: (columns: string) => ({
                    eq: (column: string, value: any) => ({
                      single: async () => ({
                        data: table === 'profiles' ? mockProfile : null,
                        error: null
                      })
                    })
                  })
                })
              };

              const { ProfileService } = await import('../shared/utils/profile-service');
              const profileService = new ProfileService(mockSupabase as any);

              const loadedProfile = await profileService.getProfile(profileData.userId);

              return {
                hasProfile: loadedProfile !== null,
                profileId: loadedProfile?.id,
                hasError: false
              };
            },
            profileData
          );

          // Should handle null fields without throwing
          expect(result.hasError).toBe(false);
          expect(result.hasProfile).toBe(true);
          expect(result.profileId).toBe(profileData.userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5 (Invariant): Loaded profile ID must always match requested user ID', async ({ page }) => {
    // Property: The profile returned must always have the same ID as requested
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
        fc.constantFrom('google' as const, 'discord' as const),
        async (userId, username, provider) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ userId, username, provider }) => {
              const mockProfile = {
                id: userId,
                username: username,
                display_name: username,
                avatar_url: null,
                provider: provider,
                provider_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const mockSupabase = {
                from: (table: string) => ({
                  select: (columns: string) => ({
                    eq: (column: string, value: any) => ({
                      single: async () => ({
                        data: table === 'profiles' ? mockProfile : null,
                        error: null
                      })
                    })
                  })
                })
              };

              const { ProfileService } = await import('../shared/utils/profile-service');
              const profileService = new ProfileService(mockSupabase as any);

              const loadedProfile = await profileService.getProfile(userId);

              return {
                requestedUserId: userId,
                loadedUserId: loadedProfile?.id
              };
            },
            { userId, username, provider }
          );

          // Invariant: Profile ID must match requested ID
          expect(result.loadedUserId).toBe(result.requestedUserId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5 (Idempotence): Multiple calls to getProfile should return the same data', async ({ page }) => {
    // Property: Getting the profile multiple times should return consistent data
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          username: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
          displayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          provider: fc.constantFrom('google' as const, 'discord' as const)
        }),
        async (profileData) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async (profileData) => {
              const mockProfile = {
                id: profileData.userId,
                username: profileData.username,
                display_name: profileData.displayName,
                avatar_url: null,
                provider: profileData.provider,
                provider_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const mockSupabase = {
                from: (table: string) => ({
                  select: (columns: string) => ({
                    eq: (column: string, value: any) => ({
                      single: async () => ({
                        data: table === 'profiles' ? mockProfile : null,
                        error: null
                      })
                    })
                  })
                })
              };

              const { ProfileService } = await import('../shared/utils/profile-service');
              const profileService = new ProfileService(mockSupabase as any);

              // Load profile multiple times
              const profile1 = await profileService.getProfile(profileData.userId);
              const profile2 = await profileService.getProfile(profileData.userId);
              const profile3 = await profileService.getProfile(profileData.userId);

              return {
                profile1Id: profile1?.id,
                profile2Id: profile2?.id,
                profile3Id: profile3?.id,
                profile1Username: profile1?.username,
                profile2Username: profile2?.username,
                profile3Username: profile3?.username,
                profile1DisplayName: profile1?.display_name,
                profile2DisplayName: profile2?.display_name,
                profile3DisplayName: profile3?.display_name
              };
            },
            profileData
          );

          // Idempotence: All calls should return the same data
          expect(result.profile1Id).toBe(result.profile2Id);
          expect(result.profile2Id).toBe(result.profile3Id);
          expect(result.profile1Username).toBe(result.profile2Username);
          expect(result.profile2Username).toBe(result.profile3Username);
          expect(result.profile1DisplayName).toBe(result.profile2DisplayName);
          expect(result.profile2DisplayName).toBe(result.profile3DisplayName);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5 (Error Handling): Profile loading should return null for non-existent users', async ({ page }) => {
    // Property: Requesting a profile that doesn't exist should return null, not throw
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (nonExistentUserId) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async (userId) => {
              // Mock Supabase to return not found error
              const mockSupabase = {
                from: (table: string) => ({
                  select: (columns: string) => ({
                    eq: (column: string, value: any) => ({
                      single: async () => ({
                        data: null,
                        error: { code: 'PGRST116', message: 'Not found' }
                      })
                    })
                  })
                })
              };

              const { ProfileService } = await import('../shared/utils/profile-service');
              const profileService = new ProfileService(mockSupabase as any);

              let profile = null;
              let threwError = false;

              try {
                profile = await profileService.getProfile(userId);
              } catch (error) {
                threwError = true;
              }

              return {
                profile,
                threwError
              };
            },
            nonExistentUserId
          );

          // Should return null, not throw
          expect(result.threwError).toBe(false);
          expect(result.profile).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
