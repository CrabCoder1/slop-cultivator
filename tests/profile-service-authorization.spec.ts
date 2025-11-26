import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Profile Authorization
 * Feature: user-authentication, Property 18: Profile Access Authorization
 * Feature: user-authentication, Property 19: Profile Modification Authorization
 * Validates: Requirements 8.1, 8.2
 * 
 * Property 18: For any attempt to access User Profile data, the system should verify 
 * the session matches the requested profile and deny access otherwise.
 * 
 * Property 19: For any attempt to modify User Profile data, the system should enforce 
 * RLS policies and only allow users to modify their own profiles.
 */

test.describe('Profile Service - Authorization (Property-Based)', () => {
  test('Property 18: Profile Access Authorization - users can only access their own profiles', async ({ page }) => {
    // Property-based test with 100 iterations as specified in design
    await fc.assert(
      fc.asyncProperty(
        // Generate two different user IDs (owner and other user)
        fc.tuple(fc.uuid(), fc.uuid()).filter(([id1, id2]) => id1 !== id2),
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
          displayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          provider: fc.constantFrom('google' as const, 'discord' as const)
        }),
        async ([ownerId, otherUserId], profileData) => {
          // Navigate to the game
          await page.goto('http://localhost:5173');

          // Test that RLS policies enforce profile access authorization
          const result = await page.evaluate(
            async ({ ownerId, otherUserId, profileData }) => {
              // Create mock profile for the owner
              const ownerProfile = {
                id: ownerId,
                username: profileData.username,
                display_name: profileData.displayName,
                avatar_url: null,
                provider: profileData.provider,
                provider_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              // Mock Supabase client that simulates RLS policies
              const mockSupabase = {
                from: (table: string) => ({
                  select: (columns: string) => ({
                    eq: (column: string, value: any) => ({
                      single: async () => {
                        // Simulate RLS: Only return profile if requesting own profile
                        // In real Supabase, this would be enforced by RLS policies
                        // For testing, we simulate the behavior
                        if (table === 'profiles' && value === ownerId) {
                          return {
                            data: ownerProfile,
                            error: null
                          };
                        } else {
                          // Simulate RLS denial - return error
                          return {
                            data: null,
                            error: {
                              code: 'PGRST301',
                              message: 'Row level security policy violation'
                            }
                          };
                        }
                      }
                    })
                  })
                })
              };

              const { ProfileService } = await import('../shared/utils/profile-service');
              const profileService = new ProfileService(mockSupabase as any);

              // Try to access own profile (should succeed)
              let ownProfileResult = null;
              let ownProfileError = null;
              try {
                ownProfileResult = await profileService.getProfile(ownerId);
              } catch (error) {
                ownProfileError = error;
              }

              // Try to access other user's profile (should fail)
              let otherProfileResult = null;
              let otherProfileError = null;
              try {
                otherProfileResult = await profileService.getProfile(otherUserId);
              } catch (error) {
                otherProfileError = error;
              }

              return {
                ownProfileSuccess: ownProfileResult !== null,
                ownProfileError: ownProfileError ? ownProfileError.message : null,
                otherProfileSuccess: otherProfileResult !== null,
                otherProfileError: otherProfileError ? otherProfileError.message : null
              };
            },
            { ownerId, otherUserId, profileData }
          );

          // Property assertions:
          // 1. User should be able to access their own profile
          expect(result.ownProfileSuccess).toBe(true);
          expect(result.ownProfileError).toBeNull();

          // 2. User should NOT be able to access other user's profile
          expect(result.otherProfileSuccess).toBe(false);
          expect(result.otherProfileError).not.toBeNull();
        }
      ),
      { 
        numRuns: 100, // Minimum 100 iterations as specified in design
        verbose: true 
      }
    );
  });

  test('Property 19: Profile Modification Authorization - users can only modify their own profiles', async ({ page }) => {
    // Property-based test with 100 iterations as specified in design
    await fc.assert(
      fc.asyncProperty(
        // Generate two different user IDs (owner and other user)
        fc.tuple(fc.uuid(), fc.uuid()).filter(([id1, id2]) => id1 !== id2),
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
          displayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          newDisplayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          provider: fc.constantFrom('google' as const, 'discord' as const)
        }),
        async ([ownerId, otherUserId], profileData) => {
          await page.goto('http://localhost:5173');

          // Test that RLS policies enforce profile modification authorization
          const result = await page.evaluate(
            async ({ ownerId, otherUserId, profileData }) => {
              // Create mock profile for the owner
              const ownerProfile = {
                id: ownerId,
                username: profileData.username,
                display_name: profileData.displayName,
                avatar_url: null,
                provider: profileData.provider,
                provider_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              // Mock Supabase client that simulates RLS policies for updates
              const mockSupabase = {
                from: (table: string) => ({
                  update: (data: any) => ({
                    eq: (column: string, value: any) => ({
                      select: () => ({
                        single: async () => {
                          // Simulate RLS: Only allow update if modifying own profile
                          if (table === 'profiles' && value === ownerId) {
                            return {
                              data: {
                                ...ownerProfile,
                                display_name: data.display_name,
                                updated_at: new Date().toISOString()
                              },
                              error: null
                            };
                          } else {
                            // Simulate RLS denial
                            return {
                              data: null,
                              error: {
                                code: 'PGRST301',
                                message: 'Row level security policy violation'
                              }
                            };
                          }
                        }
                      })
                    })
                  })
                })
              };

              const { ProfileService } = await import('../shared/utils/profile-service');
              const profileService = new ProfileService(mockSupabase as any);

              // Try to update own profile (should succeed)
              let ownUpdateResult = null;
              let ownUpdateError = null;
              try {
                ownUpdateResult = await profileService.updateProfile(ownerId, {
                  display_name: profileData.newDisplayName
                });
              } catch (error) {
                ownUpdateError = error;
              }

              // Try to update other user's profile (should fail)
              let otherUpdateResult = null;
              let otherUpdateError = null;
              try {
                otherUpdateResult = await profileService.updateProfile(otherUserId, {
                  display_name: profileData.newDisplayName
                });
              } catch (error) {
                otherUpdateError = error;
              }

              return {
                ownUpdateSuccess: ownUpdateResult !== null,
                ownUpdateError: ownUpdateError ? ownUpdateError.message : null,
                ownUpdateDisplayName: ownUpdateResult?.display_name,
                otherUpdateSuccess: otherUpdateResult !== null,
                otherUpdateError: otherUpdateError ? otherUpdateError.message : null
              };
            },
            { ownerId, otherUserId, profileData }
          );

          // Property assertions:
          // 1. User should be able to update their own profile
          expect(result.ownUpdateSuccess).toBe(true);
          expect(result.ownUpdateError).toBeNull();
          expect(result.ownUpdateDisplayName).toBe(profileData.newDisplayName);

          // 2. User should NOT be able to update other user's profile
          expect(result.otherUpdateSuccess).toBe(false);
          expect(result.otherUpdateError).not.toBeNull();
        }
      ),
      { 
        numRuns: 100,
        verbose: true 
      }
    );
  });

  test('Property 18 (Edge Cases): Authorization should handle various access patterns', async ({ page }) => {
    // Test authorization with different user ID formats and edge cases
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.oneof(
          fc.uuid(), // Valid different UUID
          fc.constant(''), // Empty string
          fc.constant('invalid-uuid'), // Invalid UUID format
          fc.constant(null) // Null value
        ),
        async (ownerId, invalidUserId) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ ownerId, invalidUserId }) => {
              const ownerProfile = {
                id: ownerId,
                username: 'testuser',
                display_name: 'Test User',
                avatar_url: null,
                provider: 'google',
                provider_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const mockSupabase = {
                from: (table: string) => ({
                  select: (columns: string) => ({
                    eq: (column: string, value: any) => ({
                      single: async () => {
                        if (table === 'profiles' && value === ownerId) {
                          return { data: ownerProfile, error: null };
                        }
                        return {
                          data: null,
                          error: { code: 'PGRST301', message: 'Access denied' }
                        };
                      }
                    })
                  })
                })
              };

              const { ProfileService } = await import('../shared/utils/profile-service');
              const profileService = new ProfileService(mockSupabase as any);

              // Try to access with invalid user ID
              let invalidAccessResult = null;
              let invalidAccessError = null;
              try {
                invalidAccessResult = await profileService.getProfile(invalidUserId as string);
              } catch (error) {
                invalidAccessError = error;
              }

              return {
                invalidAccessSuccess: invalidAccessResult !== null,
                hasError: invalidAccessError !== null
              };
            },
            { ownerId, invalidUserId }
          );

          // Should deny access for invalid user IDs
          if (invalidUserId !== ownerId) {
            expect(result.invalidAccessSuccess).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 19 (Invariant): Profile updates must preserve user ID', async ({ page }) => {
    // Property: Updating a profile should never change the user ID
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
          displayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          avatarUrl: fc.webUrl()
        }),
        async (userId, updates) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ userId, updates }) => {
              const originalProfile = {
                id: userId,
                username: 'original',
                display_name: 'Original Name',
                avatar_url: null,
                provider: 'google',
                provider_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const mockSupabase = {
                from: (table: string) => ({
                  update: (data: any) => ({
                    eq: (column: string, value: any) => ({
                      select: () => ({
                        single: async () => {
                          if (table === 'profiles' && value === userId) {
                            return {
                              data: {
                                ...originalProfile,
                                ...data,
                                id: userId, // ID should never change
                                updated_at: new Date().toISOString()
                              },
                              error: null
                            };
                          }
                          return {
                            data: null,
                            error: { code: 'PGRST301', message: 'Access denied' }
                          };
                        }
                      })
                    })
                  })
                })
              };

              const { ProfileService } = await import('../shared/utils/profile-service');
              const profileService = new ProfileService(mockSupabase as any);

              const updatedProfile = await profileService.updateProfile(userId, {
                username: updates.username,
                display_name: updates.displayName,
                avatar_url: updates.avatarUrl
              });

              return {
                originalId: userId,
                updatedId: updatedProfile?.id
              };
            },
            { userId, updates }
          );

          // Invariant: User ID must remain unchanged after update
          expect(result.updatedId).toBe(result.originalId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 18 & 19 (Metamorphic): Access and modification authorization should be consistent', async ({ page }) => {
    // Property: If a user can access a profile, they should be able to modify it (and vice versa)
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
          displayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
        }),
        async (userId, profileData) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async ({ userId, profileData }) => {
              const profile = {
                id: userId,
                username: profileData.username,
                display_name: profileData.displayName,
                avatar_url: null,
                provider: 'google',
                provider_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const mockSupabase = {
                from: (table: string) => {
                  if (table === 'profiles') {
                    return {
                      select: (columns: string) => ({
                        eq: (column: string, value: any) => ({
                          single: async () => {
                            if (value === userId) {
                              return { data: profile, error: null };
                            }
                            return {
                              data: null,
                              error: { code: 'PGRST301', message: 'Access denied' }
                            };
                          }
                        })
                      }),
                      update: (data: any) => ({
                        eq: (column: string, value: any) => ({
                          select: () => ({
                            single: async () => {
                              if (value === userId) {
                                return {
                                  data: { ...profile, ...data },
                                  error: null
                                };
                              }
                              return {
                                data: null,
                                error: { code: 'PGRST301', message: 'Access denied' }
                              };
                            }
                          })
                        })
                      })
                    };
                  }
                  return {};
                }
              };

              const { ProfileService } = await import('../shared/utils/profile-service');
              const profileService = new ProfileService(mockSupabase as any);

              // Try to access profile
              let canAccess = false;
              try {
                const accessResult = await profileService.getProfile(userId);
                canAccess = accessResult !== null;
              } catch (error) {
                canAccess = false;
              }

              // Try to modify profile
              let canModify = false;
              try {
                const modifyResult = await profileService.updateProfile(userId, {
                  display_name: 'New Name'
                });
                canModify = modifyResult !== null;
              } catch (error) {
                canModify = false;
              }

              return {
                canAccess,
                canModify
              };
            },
            { userId, profileData }
          );

          // Metamorphic property: Access and modification permissions should be consistent
          // If you can access, you should be able to modify (for your own profile)
          expect(result.canAccess).toBe(result.canModify);
        }
      ),
      { numRuns: 100 }
    );
  });
});
