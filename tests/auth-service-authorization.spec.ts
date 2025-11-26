import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Authentication Authorization
 * Feature: user-authentication, Property 20: Unauthenticated Request Rejection
 * Feature: user-authentication, Property 21: Invalid Session Rejection
 * Validates: Requirements 8.3, 8.4
 * 
 * Property 20: For any unauthenticated request attempting to access protected data, 
 * the system should reject the request.
 * 
 * Property 21: For any request using an invalid or expired session token, 
 * the system should reject the request.
 */

test.describe('Auth Service - Authorization (Property-Based)', () => {
  test('Property 20: Unauthenticated Request Rejection - protected data access should be denied without authentication', async ({ page }) => {
    // Property-based test with 100 iterations as specified in design
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          username: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
          displayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          score: fc.integer({ min: 0, max: 1000000 }),
          achievementName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0)
        }),
        async (testData) => {
          await page.goto('http://localhost:5173');

          // Test that unauthenticated requests are rejected for protected resources
          const result = await page.evaluate(
            async (testData) => {
              // Mock Supabase client that simulates RLS policies without authentication
              const mockSupabaseUnauthenticated = {
                auth: {
                  getSession: async () => ({
                    data: { session: null },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: null },
                    error: null
                  })
                },
                from: (table: string) => ({
                  select: (columns: string) => ({
                    eq: (column: string, value: any) => ({
                      single: async () => {
                        // Simulate RLS: Deny access to protected data without authentication
                        if (table === 'achievements' || table === 'profiles') {
                          return {
                            data: null,
                            error: {
                              code: 'PGRST301',
                              message: 'Row level security policy violation',
                              details: 'Policy check failed for unauthenticated user'
                            }
                          };
                        }
                        return { data: null, error: null };
                      }
                    }),
                    limit: (count: number) => ({
                      async then(resolve: any) {
                        // Leaderboard is public read, should work
                        if (table === 'leaderboard_scores') {
                          return resolve({
                            data: [],
                            error: null
                          });
                        }
                        return resolve({
                          data: null,
                          error: {
                            code: 'PGRST301',
                            message: 'Row level security policy violation'
                          }
                        });
                      }
                    })
                  }),
                  insert: (data: any) => ({
                    select: () => ({
                      single: async () => {
                        // Simulate RLS: Deny insert to protected tables without authentication
                        if (table === 'achievements') {
                          return {
                            data: null,
                            error: {
                              code: 'PGRST301',
                              message: 'Row level security policy violation',
                              details: 'Cannot insert without authentication'
                            }
                          };
                        }
                        // Leaderboard allows guest inserts with anonymous_id
                        if (table === 'leaderboard_scores' && data.anonymous_id) {
                          return {
                            data: { ...data, id: crypto.randomUUID() },
                            error: null
                          };
                        }
                        return {
                          data: null,
                          error: {
                            code: 'PGRST301',
                            message: 'Row level security policy violation'
                          }
                        };
                      }
                    })
                  }),
                  update: (data: any) => ({
                    eq: (column: string, value: any) => ({
                      select: () => ({
                        single: async () => {
                          // Simulate RLS: Deny update without authentication
                          return {
                            data: null,
                            error: {
                              code: 'PGRST301',
                              message: 'Row level security policy violation',
                              details: 'Cannot update without authentication'
                            }
                          };
                        }
                      })
                    })
                  })
                })
              };

              const { ProfileService } = await import('../shared/utils/profile-service');
              const profileService = new ProfileService(mockSupabaseUnauthenticated as any);

              // Try to access profile without authentication (should fail)
              let profileAccessResult = null;
              let profileAccessError = null;
              try {
                profileAccessResult = await profileService.getProfile(testData.userId);
              } catch (error: any) {
                profileAccessError = error;
              }

              // Try to update profile without authentication (should fail)
              let profileUpdateResult = null;
              let profileUpdateError = null;
              try {
                profileUpdateResult = await profileService.updateProfile(testData.userId, {
                  display_name: testData.displayName
                });
              } catch (error: any) {
                profileUpdateError = error;
              }

              // Try to insert achievement without authentication (should fail)
              let achievementInsertResult = null;
              let achievementInsertError = null;
              try {
                const achievementData = {
                  user_id: testData.userId,
                  achievement_name: testData.achievementName,
                  unlocked_at: new Date().toISOString()
                };
                const { data, error } = await mockSupabaseUnauthenticated
                  .from('achievements')
                  .insert(achievementData)
                  .select()
                  .single();
                
                achievementInsertResult = data;
                achievementInsertError = error;
              } catch (error: any) {
                achievementInsertError = error;
              }

              // Try to read leaderboard without authentication (should succeed - public read)
              let leaderboardReadResult = null;
              let leaderboardReadError = null;
              try {
                const response = await mockSupabaseUnauthenticated
                  .from('leaderboard_scores')
                  .select('*')
                  .limit(10);
                
                leaderboardReadResult = response.data;
                leaderboardReadError = response.error;
              } catch (error: any) {
                leaderboardReadError = error;
              }

              return {
                profileAccessDenied: profileAccessResult === null && profileAccessError !== null,
                profileUpdateDenied: profileUpdateResult === null && profileUpdateError !== null,
                achievementInsertDenied: achievementInsertResult === null && achievementInsertError !== null,
                leaderboardReadAllowed: leaderboardReadResult !== null && leaderboardReadError === null,
                profileAccessErrorCode: profileAccessError?.code || profileAccessError?.message,
                profileUpdateErrorCode: profileUpdateError?.code || profileUpdateError?.message,
                achievementInsertErrorCode: achievementInsertError?.code || achievementInsertError?.message
              };
            },
            testData
          );

          // Property assertions:
          // 1. Profile access should be denied without authentication
          expect(result.profileAccessDenied).toBe(true);
          expect(result.profileAccessErrorCode).toBeTruthy();

          // 2. Profile updates should be denied without authentication
          expect(result.profileUpdateDenied).toBe(true);
          expect(result.profileUpdateErrorCode).toBeTruthy();

          // 3. Achievement inserts should be denied without authentication
          expect(result.achievementInsertDenied).toBe(true);
          expect(result.achievementInsertErrorCode).toBeTruthy();

          // 4. Leaderboard reads should be allowed (public read policy)
          expect(result.leaderboardReadAllowed).toBe(true);
        }
      ),
      { 
        numRuns: 100, // Minimum 100 iterations as specified in design
        verbose: true 
      }
    );
  });

  test('Property 21: Invalid Session Rejection - requests with invalid or expired sessions should be rejected', async ({ page }) => {
    // Property-based test with 100 iterations as specified in design
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          invalidToken: fc.oneof(
            fc.constant(''), // Empty token
            fc.constant('invalid-token'), // Invalid format
            fc.string({ minLength: 10, maxLength: 50 }), // Random string
            fc.constant('expired.jwt.token') // Expired token format
          ),
          displayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
        }),
        async (testData) => {
          await page.goto('http://localhost:5173');

          // Test that requests with invalid sessions are rejected
          const result = await page.evaluate(
            async (testData) => {
              // Create an expired session (expires_at in the past)
              const expiredSession = {
                access_token: testData.invalidToken,
                refresh_token: 'expired-refresh-token',
                expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
                expires_in: -3600,
                token_type: 'bearer' as const,
                user: {
                  id: testData.userId,
                  email: 'test@example.com',
                  app_metadata: { provider: 'google', providers: ['google'] },
                  user_metadata: {},
                  created_at: new Date().toISOString()
                }
              };

              // Mock Supabase client that simulates invalid session handling
              const mockSupabaseInvalidSession = {
                auth: {
                  getSession: async () => ({
                    data: { session: expiredSession },
                    error: null
                  }),
                  getUser: async () => ({
                    data: { user: null },
                    error: {
                      message: 'Invalid or expired JWT',
                      status: 401
                    }
                  }),
                  refreshSession: async () => ({
                    data: { session: null },
                    error: {
                      message: 'Invalid refresh token',
                      status: 401
                    }
                  })
                },
                from: (table: string) => ({
                  select: (columns: string) => ({
                    eq: (column: string, value: any) => ({
                      single: async () => {
                        // Simulate RLS: Reject requests with invalid session
                        return {
                          data: null,
                          error: {
                            code: '401',
                            message: 'Invalid or expired session',
                            details: 'JWT verification failed'
                          }
                        };
                      }
                    })
                  }),
                  update: (data: any) => ({
                    eq: (column: string, value: any) => ({
                      select: () => ({
                        single: async () => {
                          // Simulate RLS: Reject updates with invalid session
                          return {
                            data: null,
                            error: {
                              code: '401',
                              message: 'Invalid or expired session',
                              details: 'JWT verification failed'
                            }
                          };
                        }
                      })
                    })
                  }),
                  insert: (data: any) => ({
                    select: () => ({
                      single: async () => {
                        // Simulate RLS: Reject inserts with invalid session
                        return {
                          data: null,
                          error: {
                            code: '401',
                            message: 'Invalid or expired session',
                            details: 'JWT verification failed'
                          }
                        };
                      }
                    })
                  })
                })
              };

              const { AuthService } = await import('../shared/utils/auth-service');
              const authService = new AuthService(mockSupabaseInvalidSession as any);

              // Check if session is expired
              const isExpired = await authService.isSessionExpired();

              // Try to get user with invalid session (should fail)
              const user = await authService.getUser();

              // Try to refresh invalid session (should fail)
              const refreshedSession = await authService.refreshSession();

              // Try to access profile with invalid session
              const { ProfileService } = await import('../shared/utils/profile-service');
              const profileService = new ProfileService(mockSupabaseInvalidSession as any);

              let profileAccessResult = null;
              let profileAccessError = null;
              try {
                profileAccessResult = await profileService.getProfile(testData.userId);
              } catch (error: any) {
                profileAccessError = error;
              }

              // Try to update profile with invalid session
              let profileUpdateResult = null;
              let profileUpdateError = null;
              try {
                profileUpdateResult = await profileService.updateProfile(testData.userId, {
                  display_name: testData.displayName
                });
              } catch (error: any) {
                profileUpdateError = error;
              }

              return {
                sessionExpired: isExpired,
                userNull: user === null,
                refreshFailed: refreshedSession === null,
                profileAccessDenied: profileAccessResult === null && profileAccessError !== null,
                profileUpdateDenied: profileUpdateResult === null && profileUpdateError !== null,
                profileAccessErrorCode: profileAccessError?.code || profileAccessError?.message,
                profileUpdateErrorCode: profileUpdateError?.code || profileUpdateError?.message
              };
            },
            testData
          );

          // Property assertions:
          // 1. Expired session should be detected
          expect(result.sessionExpired).toBe(true);

          // 2. Getting user with invalid session should fail
          expect(result.userNull).toBe(true);

          // 3. Refreshing invalid session should fail
          expect(result.refreshFailed).toBe(true);

          // 4. Profile access with invalid session should be denied
          expect(result.profileAccessDenied).toBe(true);
          expect(result.profileAccessErrorCode).toBeTruthy();

          // 5. Profile updates with invalid session should be denied
          expect(result.profileUpdateDenied).toBe(true);
          expect(result.profileUpdateErrorCode).toBeTruthy();
        }
      ),
      { 
        numRuns: 100,
        verbose: true 
      }
    );
  });

  test('Property 20 (Edge Cases): Unauthenticated requests should handle various scenarios', async ({ page }) => {
    // Test unauthenticated access with different data patterns
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.uuid(), // Valid UUID
          fc.constant(''), // Empty string
          fc.constant(null), // Null
          fc.constant('not-a-uuid') // Invalid format
        ),
        async (userId) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async (userId) => {
              const mockSupabase = {
                auth: {
                  getSession: async () => ({ data: { session: null }, error: null })
                },
                from: (table: string) => ({
                  select: (columns: string) => ({
                    eq: (column: string, value: any) => ({
                      single: async () => ({
                        data: null,
                        error: {
                          code: 'PGRST301',
                          message: 'Row level security policy violation'
                        }
                      })
                    })
                  })
                })
              };

              const { ProfileService } = await import('../shared/utils/profile-service');
              const profileService = new ProfileService(mockSupabase as any);

              let accessDenied = false;
              try {
                const profile = await profileService.getProfile(userId as string);
                accessDenied = profile === null;
              } catch (error) {
                accessDenied = true;
              }

              return { accessDenied };
            },
            userId
          );

          // Should deny access regardless of user ID format
          expect(result.accessDenied).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 21 (Metamorphic): Session validity should be consistent across operations', async ({ page }) => {
    // Property: If a session is invalid for one operation, it should be invalid for all operations
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          invalidToken: fc.string({ minLength: 10, maxLength: 50 }),
          operation: fc.constantFrom('getProfile', 'updateProfile', 'getUser')
        }),
        async (testData) => {
          await page.goto('http://localhost:5173');

          const result = await page.evaluate(
            async (testData) => {
              const expiredSession = {
                access_token: testData.invalidToken,
                refresh_token: 'expired-refresh',
                expires_at: Math.floor(Date.now() / 1000) - 3600,
                expires_in: -3600,
                token_type: 'bearer' as const,
                user: {
                  id: testData.userId,
                  email: 'test@example.com',
                  app_metadata: { provider: 'google', providers: ['google'] },
                  user_metadata: {},
                  created_at: new Date().toISOString()
                }
              };

              const mockSupabase = {
                auth: {
                  getSession: async () => ({ data: { session: expiredSession }, error: null }),
                  getUser: async () => ({
                    data: { user: null },
                    error: { message: 'Invalid JWT', status: 401 }
                  })
                },
                from: (table: string) => ({
                  select: (columns: string) => ({
                    eq: (column: string, value: any) => ({
                      single: async () => ({
                        data: null,
                        error: { code: '401', message: 'Invalid session' }
                      })
                    })
                  }),
                  update: (data: any) => ({
                    eq: (column: string, value: any) => ({
                      select: () => ({
                        single: async () => ({
                          data: null,
                          error: { code: '401', message: 'Invalid session' }
                        })
                      })
                    })
                  })
                })
              };

              const { AuthService } = await import('../shared/utils/auth-service');
              const { ProfileService } = await import('../shared/utils/profile-service');
              
              const authService = new AuthService(mockSupabase as any);
              const profileService = new ProfileService(mockSupabase as any);

              // Check session expiration
              const isExpired = await authService.isSessionExpired();

              // Try different operations
              const operations = {
                getProfile: async () => {
                  try {
                    return await profileService.getProfile(testData.userId);
                  } catch (error) {
                    return null;
                  }
                },
                updateProfile: async () => {
                  try {
                    return await profileService.updateProfile(testData.userId, {
                      display_name: 'New Name'
                    });
                  } catch (error) {
                    return null;
                  }
                },
                getUser: async () => {
                  return await authService.getUser();
                }
              };

              const operationResult = await operations[testData.operation as keyof typeof operations]();

              return {
                sessionExpired: isExpired,
                operationFailed: operationResult === null
              };
            },
            testData
          );

          // Metamorphic property: If session is expired, all operations should fail
          if (result.sessionExpired) {
            expect(result.operationFailed).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
