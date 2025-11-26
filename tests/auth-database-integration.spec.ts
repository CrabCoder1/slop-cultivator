import { test, expect } from '@playwright/test';

/**
 * Integration Tests for Database Operations
 * Tests profile creation, achievement persistence, leaderboard scores, RLS policies, and data migration
 * Requirements: 6.1, 6.2, 6.3, 8.1, 8.2
 */

test.describe('Database Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Profile creation and retrieval', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const mockUserId = crypto.randomUUID();
      const mockProfile = {
        id: mockUserId,
        username: 'testuser123',
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        provider: 'google',
        provider_id: 'google_12345',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let createdProfile: any = null;

      const mockSupabase = {
        from: (table: string) => ({
          insert: (data: any) => ({
            select: () => ({
              single: async () => {
                if (table === 'profiles') {
                  createdProfile = { ...mockProfile, ...data };
                  return { data: createdProfile, error: null };
                }
                return { data: null, error: null };
              }
            })
          }),
          select: (columns: string) => ({
            eq: (column: string, value: any) => ({
              single: async () => {
                if (table === 'profiles' && column === 'id' && value === mockUserId) {
                  return { data: createdProfile, error: null };
                }
                return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
              }
            })
          }),
          update: (data: any) => ({
            eq: (column: string, value: any) => ({
              select: () => ({
                single: async () => {
                  if (table === 'profiles' && column === 'id' && value === mockUserId) {
                    createdProfile = { ...createdProfile, ...data, updated_at: new Date().toISOString() };
                    return { data: createdProfile, error: null };
                  }
                  return { data: null, error: null };
                }
              })
            })
          })
        })
      };

      const { ProfileService } = await import('../shared/utils/profile-service');
      const profileService = new ProfileService(mockSupabase as any);

      // Step 1: Create profile
      const createData = {
        username: mockProfile.username,
        display_name: mockProfile.display_name,
        avatar_url: mockProfile.avatar_url,
        provider: mockProfile.provider as 'google',
        provider_id: mockProfile.provider_id
      };
      
      let created = null;
      let createError = null;
      try {
        created = await profileService.createProfile(mockUserId, createData);
      } catch (error: any) {
        createError = error.message;
      }

      // Step 2: Retrieve profile
      let retrieved = null;
      let retrieveError = null;
      try {
        retrieved = await profileService.getProfile(mockUserId);
      } catch (error: any) {
        retrieveError = error.message;
      }

      // Step 3: Update profile
      let updated = null;
      let updateError = null;
      try {
        updated = await profileService.updateProfile(mockUserId, {
          display_name: 'Updated Name'
        });
      } catch (error: any) {
        updateError = error.message;
      }

      return {
        created,
        retrieved,
        updated,
        createError,
        retrieveError,
        updateError,
        createdId: created?.id,
        retrievedId: retrieved?.id,
        updatedDisplayName: updated?.display_name
      };
    });

    // Verify profile operations
    expect(result.createError).toBeNull();
    expect(result.retrieveError).toBeNull();
    expect(result.updateError).toBeNull();
    expect(result.created).not.toBeNull();
    expect(result.retrieved).not.toBeNull();
    expect(result.updated).not.toBeNull();
    expect(result.createdId).toBeDefined();
    expect(result.retrievedId).toBe(result.createdId);
    expect(result.updatedDisplayName).toBe('Updated Name');
  });

  test('Achievement persistence for authenticated users', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const mockUserId = crypto.randomUUID();
      const mockAchievements: any[] = [];

      // Mock Supabase auth to return authenticated session
      const mockSupabase = {
        auth: {
          getSession: async () => ({
            data: {
              session: {
                access_token: 'mock_token',
                user: { id: mockUserId }
              }
            },
            error: null
          })
        },
        from: (table: string) => ({
          upsert: async (data: any) => {
            if (table === 'player_achievements') {
              const achievements = Array.isArray(data) ? data : [data];
              achievements.forEach((a: any) => {
                mockAchievements.push({
                  id: crypto.randomUUID(),
                  player_id: mockUserId,
                  ...a,
                  created_at: new Date().toISOString()
                });
              });
              return { data: mockAchievements, error: null };
            }
            return { data: null, error: null };
          },
          select: (columns: string) => ({
            eq: (column: string, value: any) => {
              if (table === 'player_achievements' && column === 'player_id' && value === mockUserId) {
                return Promise.resolve({ data: mockAchievements, error: null });
              }
              return Promise.resolve({ data: [], error: null });
            }
          })
        })
      };

      // Mock the supabase module
      const originalSupabase = (window as any).__supabase;
      (window as any).__supabase = mockSupabase;

      // Import functions (they use the global supabase client)
      const { unlockAchievement } = await import('../shared/utils/authenticated-achievement-service');

      // Temporarily replace the supabase import
      const supabaseModule = await import('../../game/utils/supabase/client');
      const originalClient = supabaseModule.supabase;
      (supabaseModule as any).supabase = mockSupabase;

      // Step 1: Unlock achievements
      await unlockAchievement('first_kill');
      await unlockAchievement('wave_10');
      await unlockAchievement('perfect_defense');

      // Restore original supabase
      (supabaseModule as any).supabase = originalClient;
      (window as any).__supabase = originalSupabase;

      return {
        achievementCount: mockAchievements.length,
        hasFirstKill: mockAchievements.some((a: any) => a.achievement_id === 'first_kill'),
        hasWave10: mockAchievements.some((a: any) => a.achievement_id === 'wave_10'),
        hasPerfectDefense: mockAchievements.some((a: any) => a.achievement_id === 'perfect_defense'),
        allHaveUserId: mockAchievements.every((a: any) => a.player_id === mockUserId)
      };
    });

    // Verify achievement persistence
    expect(result.achievementCount).toBe(3);
    expect(result.hasFirstKill).toBe(true);
    expect(result.hasWave10).toBe(true);
    expect(result.hasPerfectDefense).toBe(true);
    expect(result.allHaveUserId).toBe(true);
  });

  test('Leaderboard score submission for authenticated users', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const mockUserId = crypto.randomUUID();
      const mockScores: any[] = [];

      const mockSupabase = {
        auth: {
          getSession: async () => ({
            data: {
              session: {
                access_token: 'mock_token',
                user: { id: mockUserId, email: 'test@example.com' }
              }
            },
            error: null
          })
        },
        from: (table: string) => ({
          insert: (data: any) => ({
            select: () => ({
              single: async () => {
                if (table === 'leaderboard_scores') {
                  const score = {
                    id: crypto.randomUUID(),
                    user_id: mockUserId,
                    ...data,
                    created_at: new Date().toISOString()
                  };
                  mockScores.push(score);
                  return { data: score, error: null };
                }
                return { data: null, error: null };
              }
            })
          }),
          select: (columns: string) => {
            const query = {
              eq: (column: string, value: any) => query,
              order: (column: string, options: any) => query,
              limit: (count: number) => Promise.resolve({ data: mockScores, error: null })
            };
            return query;
          }
        })
      };

      // Replace supabase client
      const supabaseModule = await import('../../game/utils/supabase/client');
      const originalClient = supabaseModule.supabase;
      (supabaseModule as any).supabase = mockSupabase;

      const { submitScore, getTopScores } = await import('../shared/utils/leaderboard-service');

      // Step 1: Submit scores
      await submitScore({
        playerName: 'Test Player',
        score: 5000,
        waveReached: 20,
        mapKey: 'classic_arena'
      });

      await submitScore({
        playerName: 'Test Player',
        score: 7500,
        waveReached: 25,
        mapKey: 'classic_arena'
      });

      // Step 2: Retrieve scores
      const scores = await getTopScores(10, 'classic_arena');

      // Restore original supabase
      (supabaseModule as any).supabase = originalClient;

      return {
        scoreCount: scores.length,
        allHaveUserId: scores.every((s: any) => s.userId === mockUserId),
        firstScore: scores[0]?.score,
        secondScore: scores[1]?.score
      };
    });

    // Verify leaderboard score submission
    expect(result.scoreCount).toBe(2);
    expect(result.allHaveUserId).toBe(true);
    expect(result.firstScore).toBe(5000);
    expect(result.secondScore).toBe(7500);
  });

  test('RLS policy enforcement - users can only access own data', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const user1Id = crypto.randomUUID();
      const user2Id = crypto.randomUUID();
      let currentUserId = user1Id;

      const mockProfiles = new Map([
        [user1Id, {
          id: user1Id,
          username: 'user1',
          display_name: 'User One',
          provider: 'google',
          provider_id: 'google_1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }],
        [user2Id, {
          id: user2Id,
          username: 'user2',
          display_name: 'User Two',
          provider: 'google',
          provider_id: 'google_2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      ]);

      const mockSupabase = {
        from: (table: string) => ({
          select: (columns: string) => ({
            eq: (column: string, value: any) => ({
              single: async () => {
                if (table === 'profiles') {
                  // Simulate RLS: only return profile if requesting own data
                  if (value === currentUserId) {
                    return { data: mockProfiles.get(value), error: null };
                  } else {
                    // RLS blocks access to other users' profiles
                    return {
                      data: null,
                      error: {
                        code: 'PGRST301',
                        message: 'Row level security policy violation',
                        details: 'Policy violation',
                        hint: null
                      }
                    };
                  }
                }
                return { data: null, error: null };
              }
            })
          }),
          update: (data: any) => ({
            eq: (column: string, value: any) => ({
              select: () => ({
                single: async () => {
                  if (table === 'profiles') {
                    // Simulate RLS: only allow update of own profile
                    if (value === currentUserId) {
                      const profile = mockProfiles.get(value);
                      if (profile) {
                        const updated = { ...profile, ...data, updated_at: new Date().toISOString() };
                        mockProfiles.set(value, updated);
                        return { data: updated, error: null };
                      }
                    }
                    return {
                      data: null,
                      error: {
                        code: 'PGRST301',
                        message: 'Row level security policy violation',
                        details: 'Policy violation',
                        hint: null
                      }
                    };
                  }
                  return { data: null, error: null };
                }
              })
            })
          })
        })
      };

      const { ProfileService } = await import('../shared/utils/profile-service');
      const profileService = new ProfileService(mockSupabase as any);

      // Test 1: User 1 can access own profile
      currentUserId = user1Id;
      let ownProfile = null;
      let ownProfileError = null;
      try {
        ownProfile = await profileService.getProfile(user1Id);
      } catch (error: any) {
        ownProfileError = error.message;
      }

      // Test 2: User 1 cannot access User 2's profile
      let otherProfile = null;
      let otherProfileError = null;
      try {
        otherProfile = await profileService.getProfile(user2Id);
      } catch (error: any) {
        otherProfileError = error.message;
      }

      // Test 3: User 1 can update own profile
      let updatedOwnProfile = null;
      let updateOwnError = null;
      try {
        updatedOwnProfile = await profileService.updateProfile(user1Id, {
          display_name: 'Updated User One'
        });
      } catch (error: any) {
        updateOwnError = error.message;
      }

      // Test 4: User 1 cannot update User 2's profile
      let updatedOtherProfile = null;
      let updateOtherError = null;
      try {
        updatedOtherProfile = await profileService.updateProfile(user2Id, {
          display_name: 'Hacked User Two'
        });
      } catch (error: any) {
        updateOtherError = error.message;
      }

      return {
        canAccessOwnProfile: ownProfile !== null,
        ownProfileUsername: ownProfile?.username,
        ownProfileError,
        cannotAccessOtherProfile: otherProfile === null && otherProfileError !== null,
        otherProfileError,
        canUpdateOwnProfile: updatedOwnProfile !== null,
        updatedDisplayName: updatedOwnProfile?.display_name,
        updateOwnError,
        cannotUpdateOtherProfile: updatedOtherProfile === null && updateOtherError !== null,
        updateOtherError
      };
    });

    // Verify RLS policy enforcement
    expect(result.canAccessOwnProfile).toBe(true);
    expect(result.ownProfileUsername).toBe('user1');
    expect(result.ownProfileError).toBeNull();
    expect(result.cannotAccessOtherProfile).toBe(true);
    expect(result.otherProfileError).toContain('database');
    expect(result.canUpdateOwnProfile).toBe(true);
    expect(result.updatedDisplayName).toBe('Updated User One');
    expect(result.updateOwnError).toBeNull();
    expect(result.cannotUpdateOtherProfile).toBe(true);
    expect(result.updateOtherError).toContain('database');
  });

  test('Data migration transactions - guest to authenticated', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const mockUserId = crypto.randomUUID();
      const guestData = {
        achievements: ['first_kill', 'wave_5'],
        highScores: [
          { score: 1000, wave: 10, map_id: 'classic_arena' },
          { score: 1500, wave: 15, map_id: 'classic_arena' }
        ],
        preferences: { soundEnabled: true, musicVolume: 0.7 }
      };

      // Set up guest data
      localStorage.setItem('wuxia_guest_mode', 'true');
      localStorage.setItem('wuxia_guest_achievements', JSON.stringify(guestData.achievements));
      localStorage.setItem('wuxia_guest_preferences', JSON.stringify(guestData.preferences));
      
      // Set up player data for migration
      const playerData = {
        playerName: 'Guest Player',
        personalBest: 1500,
        totalGamesPlayed: 5,
        localScores: guestData.highScores.map((s, i) => ({
          ...s,
          enemiesDefeated: 50 + i * 10,
          cultivatorsDeployed: 5 + i,
          timePlayed: 300 + i * 60,
          timestamp: Date.now() - i * 1000000
        }))
      };
      localStorage.setItem('wuxia_player_data', JSON.stringify(playerData));

      const migratedData: any = {
        achievements: [],
        scores: []
      };

      const mockSupabase = {
        from: (table: string) => ({
          insert: async (data: any) => {
            if (table === 'achievements') {
              const achievements = Array.isArray(data) ? data : [data];
              achievements.forEach((a: any) => {
                migratedData.achievements.push({
                  id: crypto.randomUUID(),
                  user_id: mockUserId,
                  ...a,
                  created_at: new Date().toISOString()
                });
              });
              return { data: migratedData.achievements, error: null };
            }
            if (table === 'leaderboard_scores') {
              const scores = Array.isArray(data) ? data : [data];
              scores.forEach((s: any) => {
                migratedData.scores.push({
                  id: crypto.randomUUID(),
                  user_id: mockUserId,
                  ...s,
                  created_at: new Date().toISOString()
                });
              });
              return { data: migratedData.scores, error: null };
            }
            if (table === 'profiles') {
              return { data: { id: mockUserId }, error: null };
            }
            return { data: null, error: null };
          },
          update: (data: any) => ({
            eq: (column: string, value: any) => ({
              select: () => ({
                single: async () => ({ data: { id: mockUserId, ...data }, error: null })
              })
            })
          })
        })
      };

      // Replace supabase client
      const supabaseModule = await import('../../game/utils/supabase/client');
      const originalClient = supabaseModule.supabase;
      (supabaseModule as any).supabase = mockSupabase;

      const { GuestMigrationService } = await import('../shared/utils/guest-migration-service');
      const migrationService = new GuestMigrationService();

      // Perform migration
      const migrationResult = await migrationService.migrateGuestData(mockUserId);

      // Check that guest data was cleared
      const guestDataAfter = localStorage.getItem('wuxia_guest_data');
      const guestModeAfter = localStorage.getItem('wuxia_guest_mode');

      // Restore original supabase
      (supabaseModule as any).supabase = originalClient;

      return {
        migrationSuccess: migrationResult.success,
        migrationError: migrationResult.error?.message,
        achievementsMigrated: migratedData.achievements.length,
        scoresMigrated: migratedData.scores.length,
        guestDataCleared: guestDataAfter === null,
        guestModeDisabled: guestModeAfter === null,
        allAchievementsHaveUserId: migratedData.achievements.every((a: any) => a.user_id === mockUserId),
        allScoresHaveUserId: migratedData.scores.every((s: any) => s.user_id === mockUserId)
      };
    });

    // Verify data migration - note: error is undefined when success is true (discriminated union)
    expect(result.migrationSuccess).toBe(true);
    expect(result.migrationError).toBeUndefined();
    expect(result.achievementsMigrated).toBe(2);
    expect(result.scoresMigrated).toBe(2);
    expect(result.allAchievementsHaveUserId).toBe(true);
    expect(result.allScoresHaveUserId).toBe(true);
  });

  test('Transaction rollback on migration failure', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const mockUserId = crypto.randomUUID();
      const guestData = {
        achievements: ['first_kill', 'wave_5'],
        highScores: [{ score: 1000, wave: 10, map_id: 'classic_arena' }],
        preferences: { soundEnabled: true }
      };

      localStorage.setItem('wuxia_guest_mode', 'true');
      localStorage.setItem('wuxia_guest_achievements', JSON.stringify(guestData.achievements));
      localStorage.setItem('wuxia_guest_preferences', JSON.stringify(guestData.preferences));
      
      const playerData = {
        playerName: 'Guest Player',
        personalBest: 1000,
        totalGamesPlayed: 1,
        localScores: guestData.highScores.map(s => ({
          ...s,
          enemiesDefeated: 50,
          cultivatorsDeployed: 5,
          timePlayed: 300,
          timestamp: Date.now()
        }))
      };
      localStorage.setItem('wuxia_player_data', JSON.stringify(playerData));

      let insertCount = 0;

      const mockSupabase = {
        from: (table: string) => ({
          insert: async (data: any) => {
            insertCount++;
            // Simulate failure on leaderboard_scores insert
            if (table === 'leaderboard_scores') {
              return {
                data: null,
                error: {
                  code: '23505',
                  message: 'Duplicate key violation',
                  details: 'Key already exists',
                  hint: null
                }
              };
            }
            return { data: [{ id: crypto.randomUUID() }], error: null };
          },
          update: (data: any) => ({
            eq: (column: string, value: any) => ({
              select: () => ({
                single: async () => ({ data: null, error: null })
              })
            })
          }),
          delete: () => ({
            eq: (column: string, value: any) => ({
              gte: (column2: string, value2: any) => Promise.resolve({ data: null, error: null })
            })
          })
        })
      };

      // Replace supabase client
      const supabaseModule = await import('../../game/utils/supabase/client');
      const originalClient = supabaseModule.supabase;
      (supabaseModule as any).supabase = mockSupabase;

      const { GuestMigrationService } = await import('../shared/utils/guest-migration-service');
      const migrationService = new GuestMigrationService();

      // Attempt migration (should fail)
      const migrationResult = await migrationService.migrateGuestData(mockUserId);

      // Check that guest data was NOT cleared (rollback)
      const guestDataAfter = localStorage.getItem('wuxia_guest_achievements');
      const guestModeAfter = localStorage.getItem('wuxia_guest_mode');

      // Restore original supabase
      (supabaseModule as any).supabase = originalClient;

      return {
        migrationSuccess: migrationResult.success,
        migrationError: migrationResult.error?.message,
        guestDataPreserved: guestDataAfter !== null,
        guestModePreserved: guestModeAfter !== null,
        insertAttempts: insertCount
      };
    });

    // Verify rollback on failure
    expect(result.migrationSuccess).toBe(false);
    expect(result.migrationError).toBeDefined();
    expect(result.guestDataPreserved).toBe(true);
    expect(result.guestModePreserved).toBe(true);
  });
});
