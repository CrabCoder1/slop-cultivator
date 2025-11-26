import { test, expect } from '@playwright/test';
import type { PlayerProfile, PlayerAchievement } from '../shared/types/composition-types';

/**
 * Unit tests for Player Profile Service
 * Tests profile creation, loading, stat updates, content unlocking, and achievement tracking
 */

test.describe('Player Profile Service', () => {
  
  test('should generate unique anonymous IDs', async () => {
    const { generateAnonymousId } = await import('../shared/utils/player-profile-service');
    
    const id1 = generateAnonymousId();
    const id2 = generateAnonymousId();
    
    // IDs should be unique
    expect(id1).not.toBe(id2);
    
    // IDs should follow format: anon_{timestamp}_{random}
    expect(id1).toMatch(/^anon_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^anon_\d+_[a-z0-9]+$/);
  });

  test('should create new player profile with default stats', async ({ page }) => {
    // Navigate to a page to have localStorage available
    await page.goto('http://localhost:5173');
    
    const profile = await page.evaluate(async () => {
      // Clear localStorage to ensure fresh profile
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile } = await import('../shared/utils/player-profile-service');
      return await loadOrCreatePlayerProfile();
    });
    
    // Verify profile structure
    expect(profile).toBeDefined();
    expect(profile.id).toBeDefined();
    expect(profile.anonymousId).toMatch(/^anon_\d+_[a-z0-9]+$/);
    
    // Verify default stats
    expect(profile.stats.totalGamesPlayed).toBe(0);
    expect(profile.stats.highestWave).toBe(0);
    expect(profile.stats.highestScore).toBe(0);
    expect(profile.stats.totalEnemiesDefeated).toBe(0);
    expect(profile.stats.totalCultivatorsDeployed).toBe(0);
    
    // Verify empty unlocked content
    expect(profile.unlockedSpecies).toEqual([]);
    expect(profile.unlockedDaos).toEqual([]);
    expect(profile.unlockedTitles).toEqual([]);
    
    // Verify timestamps
    expect(profile.createdAt).toBeDefined();
    expect(profile.updatedAt).toBeDefined();
  });

  test('should persist anonymous ID in localStorage', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const { anonymousId, storedId } = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile } = await import('../shared/utils/player-profile-service');
      const profile = await loadOrCreatePlayerProfile();
      
      const storedId = localStorage.getItem('castle-defense-player-id');
      
      return {
        anonymousId: profile.anonymousId,
        storedId
      };
    });
    
    // Anonymous ID should be stored in localStorage
    expect(storedId).toBe(anonymousId);
  });

  test('should load existing profile on subsequent calls', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const { profile1, profile2 } = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile } = await import('../shared/utils/player-profile-service');
      
      const profile1 = await loadOrCreatePlayerProfile();
      const profile2 = await loadOrCreatePlayerProfile();
      
      return { profile1, profile2 };
    });
    
    // Both calls should return the same profile
    expect(profile1.anonymousId).toBe(profile2.anonymousId);
    expect(profile1.id).toBe(profile2.id);
  });

  test('should update player stats', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const result = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile, updatePlayerStats } = await import('../shared/utils/player-profile-service');
      
      const profile = await loadOrCreatePlayerProfile();
      
      const updatedProfile = await updatePlayerStats(profile.id, {
        totalGamesPlayed: 5,
        highestWave: 10,
        highestScore: 5000
      });
      
      return updatedProfile;
    });
    
    // Verify stats were updated
    expect(result.stats.totalGamesPlayed).toBe(5);
    expect(result.stats.highestWave).toBe(10);
    expect(result.stats.highestScore).toBe(5000);
    
    // Other stats should remain at default
    expect(result.stats.totalEnemiesDefeated).toBe(0);
    expect(result.stats.totalCultivatorsDeployed).toBe(0);
  });

  test('should unlock species content', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const result = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile, unlockContent } = await import('../shared/utils/player-profile-service');
      
      const profile = await loadOrCreatePlayerProfile();
      
      const updated1 = await unlockContent(profile.id, 'species', 'species-1');
      const updated2 = await unlockContent(profile.id, 'species', 'species-2');
      
      return updated2;
    });
    
    // Verify species were unlocked
    expect(result.unlockedSpecies).toHaveLength(2);
    expect(result.unlockedSpecies).toContain('species-1');
    expect(result.unlockedSpecies).toContain('species-2');
    
    // Other content should remain empty
    expect(result.unlockedDaos).toEqual([]);
    expect(result.unlockedTitles).toEqual([]);
  });

  test('should unlock dao content', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const result = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile, unlockContent } = await import('../shared/utils/player-profile-service');
      
      const profile = await loadOrCreatePlayerProfile();
      
      return await unlockContent(profile.id, 'dao', 'dao-1');
    });
    
    // Verify dao was unlocked
    expect(result.unlockedDaos).toHaveLength(1);
    expect(result.unlockedDaos).toContain('dao-1');
  });

  test('should unlock title content', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const result = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile, unlockContent } = await import('../shared/utils/player-profile-service');
      
      const profile = await loadOrCreatePlayerProfile();
      
      return await unlockContent(profile.id, 'title', 'title-1');
    });
    
    // Verify title was unlocked
    expect(result.unlockedTitles).toHaveLength(1);
    expect(result.unlockedTitles).toContain('title-1');
  });

  test('should not duplicate unlocked content', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const result = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile, unlockContent } = await import('../shared/utils/player-profile-service');
      
      const profile = await loadOrCreatePlayerProfile();
      
      await unlockContent(profile.id, 'species', 'species-1');
      await unlockContent(profile.id, 'species', 'species-1');
      const final = await unlockContent(profile.id, 'species', 'species-1');
      
      return final;
    });
    
    // Species should only appear once
    expect(result.unlockedSpecies).toHaveLength(1);
    expect(result.unlockedSpecies).toContain('species-1');
  });

  test('should load player achievements', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const achievements = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile, loadPlayerAchievements } = await import('../shared/utils/player-profile-service');
      
      const profile = await loadOrCreatePlayerProfile();
      return await loadPlayerAchievements(profile.id);
    });
    
    // Should return an array (empty for new profile)
    expect(Array.isArray(achievements)).toBe(true);
  });

  test('should update achievement progress', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const result = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile, updateAchievementProgress } = await import('../shared/utils/player-profile-service');
      
      const profile = await loadOrCreatePlayerProfile();
      
      const updates: Array<{ achievementId: string; progress: Record<string, number> }> = [
        {
          achievementId: 'achievement-1',
          progress: { '0': 5, '1': 10 }
        },
        {
          achievementId: 'achievement-2',
          progress: { '0': 3 }
        }
      ];
      
      return await updateAchievementProgress(profile.id, updates);
    });
    
    // Should return updated achievements
    expect(result).toHaveLength(2);
    
    const achievement1 = result.find(a => a.achievementId === 'achievement-1');
    expect(achievement1).toBeDefined();
    expect(achievement1?.progress).toEqual({ '0': 5, '1': 10 });
    expect(achievement1?.isUnlocked).toBe(false);
    
    const achievement2 = result.find(a => a.achievementId === 'achievement-2');
    expect(achievement2).toBeDefined();
    expect(achievement2?.progress).toEqual({ '0': 3 });
  });

  test('should unlock achievement', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const result = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile, unlockAchievement } = await import('../shared/utils/player-profile-service');
      
      const profile = await loadOrCreatePlayerProfile();
      
      return await unlockAchievement(profile.id, 'achievement-1');
    });
    
    // Verify achievement was unlocked
    expect(result.achievementId).toBe('achievement-1');
    expect(result.isUnlocked).toBe(true);
    expect(result.unlockedAt).toBeDefined();
  });

  test('should handle batch achievement progress updates', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const result = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile, updateAchievementProgress } = await import('../shared/utils/player-profile-service');
      
      const profile = await loadOrCreatePlayerProfile();
      
      // Batch update multiple achievements
      const updates = [
        { achievementId: 'ach-1', progress: { '0': 1 } },
        { achievementId: 'ach-2', progress: { '0': 2 } },
        { achievementId: 'ach-3', progress: { '0': 3 } },
        { achievementId: 'ach-4', progress: { '0': 4 } },
        { achievementId: 'ach-5', progress: { '0': 5 } }
      ];
      
      return await updateAchievementProgress(profile.id, updates);
    });
    
    // All achievements should be updated
    expect(result).toHaveLength(5);
    
    // Verify each achievement has correct progress
    for (let i = 0; i < 5; i++) {
      const achievement = result.find(a => a.achievementId === `ach-${i + 1}`);
      expect(achievement).toBeDefined();
      expect(achievement?.progress['0']).toBe(i + 1);
    }
  });

  test('should handle empty batch updates', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const result = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile, updateAchievementProgress } = await import('../shared/utils/player-profile-service');
      
      const profile = await loadOrCreatePlayerProfile();
      
      return await updateAchievementProgress(profile.id, []);
    });
    
    // Should return empty array
    expect(result).toEqual([]);
  });

  test('should fall back to in-memory profile on database error', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Intercept Supabase requests and make them fail
    await page.route('**/rest/v1/player_profiles*', route => {
      route.abort('failed');
    });
    
    const profile = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile } = await import('../shared/utils/player-profile-service');
      return await loadOrCreatePlayerProfile();
    });
    
    // Should still return a valid profile
    expect(profile).toBeDefined();
    expect(profile.anonymousId).toMatch(/^anon_\d+_[a-z0-9]+$/);
    expect(profile.stats.totalGamesPlayed).toBe(0);
    
    // ID should indicate it's a temporary profile
    expect(profile.id).toContain('temp_');
  });

  test('should fall back to in-memory updates on database error', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Intercept Supabase requests and make them fail
    await page.route('**/rest/v1/player_profiles*', route => {
      route.abort('failed');
    });
    
    const result = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { loadOrCreatePlayerProfile, updatePlayerStats } = await import('../shared/utils/player-profile-service');
      
      const profile = await loadOrCreatePlayerProfile();
      
      return await updatePlayerStats(profile.id, {
        totalGamesPlayed: 10,
        highestWave: 20
      });
    });
    
    // Updates should still work in memory
    expect(result.stats.totalGamesPlayed).toBe(10);
    expect(result.stats.highestWave).toBe(20);
  });

  test('should fall back to in-memory achievement tracking on database error', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Intercept Supabase requests and make them fail
    await page.route('**/rest/v1/**', route => {
      route.abort('failed');
    });
    
    const result = await page.evaluate(async () => {
      localStorage.removeItem('castle-defense-player-id');
      
      const { 
        loadOrCreatePlayerProfile, 
        updateAchievementProgress,
        unlockAchievement 
      } = await import('../shared/utils/player-profile-service');
      
      const profile = await loadOrCreatePlayerProfile();
      
      // Update progress
      await updateAchievementProgress(profile.id, [
        { achievementId: 'ach-1', progress: { '0': 5 } }
      ]);
      
      // Unlock achievement
      const unlocked = await unlockAchievement(profile.id, 'ach-1');
      
      return unlocked;
    });
    
    // Achievement operations should still work in memory
    expect(result.achievementId).toBe('ach-1');
    expect(result.isUnlocked).toBe(true);
  });
});
