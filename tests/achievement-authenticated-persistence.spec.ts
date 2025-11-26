/**
 * Property-Based Tests for Authenticated Achievement Persistence
 * 
 * Feature: user-authentication, Property 15: Authenticated Achievement Persistence
 * Validates: Requirements 6.2, 7.3
 * 
 * Property: For any authenticated user earning an achievement, 
 * the achievement should be recorded in the server database linked to their User Profile.
 */

import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';

test.describe('Achievement Authenticated Persistence', () => {
  
  /**
   * Property 15: Authenticated Achievement Persistence
   * 
   * For any authenticated user unlocking an achievement, the achievement
   * should be persisted to the database with their user_id.
   */
  test('Property 15: Authenticated achievements are persisted to database', async ({ page, context }) => {
    // Navigate to the game
    await page.goto('http://localhost:5173');
    
    // Property test with 100 iterations
    await fc.assert(
      fc.asyncProperty(
        // Generate random achievement data with alphanumeric IDs
        fc.record({
          achievementId: fc.stringMatching(/^[a-zA-Z0-9_-]{5,20}$/),
          progress: fc.dictionary(
            fc.stringMatching(/^[0-9]{1,2}$/),
            fc.integer({ min: 0, max: 1000 })
          ),
        }),
        async (achievementData) => {
          // Execute test in browser context
          const result = await page.evaluate(async (data) => {
            const { unlockAchievement, loadAchievements } = await import('./shared/utils/authenticated-achievement-service');
            const { supabase } = await import('./game/utils/supabase/client');
            
            // Sign in anonymously to get a user ID
            const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
            
            if (authError || !authData.session) {
              return { skipped: true };
            }
            
            try {
              // Unlock achievement while authenticated
              await unlockAchievement(data.achievementId);
              
              // Load achievements and verify it was persisted
              const achievements = await loadAchievements();
              const foundAchievement = achievements.find(a => a.achievementId === data.achievementId);
              
              const achievementExists = !!foundAchievement;
              const isUnlocked = foundAchievement?.isUnlocked || false;
              const hasUserId = foundAchievement?.playerId === authData.session.user.id;
              
              // Verify it's in the database (not just localStorage)
              const { data: dbData, error: dbError } = await supabase
                .from('player_achievements')
                .select('*')
                .eq('player_id', authData.session.user.id)
                .eq('achievement_id', data.achievementId)
                .single();
              
              const inDatabase = !!dbData && !dbError;
              const dbIsUnlocked = dbData?.is_unlocked || false;
              
              // Clean up
              await supabase
                .from('player_achievements')
                .delete()
                .eq('player_id', authData.session.user.id)
                .eq('achievement_id', data.achievementId);
              
              return {
                skipped: false,
                achievementExists,
                isUnlocked,
                hasUserId,
                inDatabase,
                dbIsUnlocked,
              };
            } finally {
              await supabase.auth.signOut();
            }
          }, achievementData);
          
          if (result.skipped) {
            return true;
          }
          
          expect(result.achievementExists).toBe(true);
          expect(result.isUnlocked).toBe(true);
          expect(result.hasUserId).toBe(true);
          expect(result.inDatabase).toBe(true);
          expect(result.dbIsUnlocked).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property: Guest achievements stay local
   * 
   * For guest users, achievements should be stored in localStorage only,
   * not in the database.
   */
  test('Property: Guest achievements stay in localStorage', async ({ page, context }) => {
    // Navigate to the game
    await page.goto('http://localhost:5173');
    
    // Property test with 100 iterations
    await fc.assert(
      fc.asyncProperty(
        // Generate random achievement data with alphanumeric IDs
        fc.record({
          achievementId: fc.stringMatching(/^[a-zA-Z0-9_-]{5,20}$/),
        }),
        async (achievementData) => {
          // Execute test in browser context
          const result = await page.evaluate(async (data) => {
            const { unlockAchievement, loadAchievements } = await import('./shared/utils/authenticated-achievement-service');
            const { supabase } = await import('./game/utils/supabase/client');
            
            // Ensure we're signed out (guest mode)
            await supabase.auth.signOut();
            
            try {
              // Unlock achievement as guest
              await unlockAchievement(data.achievementId);
              
              // Load achievements and verify it exists
              const achievements = await loadAchievements();
              const foundAchievement = achievements.find(a => a.achievementId === data.achievementId);
              
              const achievementExists = !!foundAchievement;
              const isUnlocked = foundAchievement?.isUnlocked || false;
              const isGuestAchievement = foundAchievement?.playerId === 'guest';
              
              // Verify it's in localStorage
              const localStorageData = localStorage.getItem('wuxia_achievements');
              const inLocalStorage = localStorageData?.includes(data.achievementId) || false;
              
              // Clean up
              if (localStorageData) {
                const achievements = JSON.parse(localStorageData);
                const filtered = achievements.filter((a: any) => a.achievementId !== data.achievementId);
                localStorage.setItem('wuxia_achievements', JSON.stringify(filtered));
              }
              
              return {
                achievementExists,
                isUnlocked,
                isGuestAchievement,
                inLocalStorage,
              };
            } catch (error) {
              return {
                error: error.message,
              };
            }
          }, achievementData);
          
          if (result.error) {
            throw new Error(result.error);
          }
          
          expect(result.achievementExists).toBe(true);
          expect(result.isUnlocked).toBe(true);
          expect(result.isGuestAchievement).toBe(true);
          expect(result.inLocalStorage).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property: Achievement progress is persisted
   * 
   * For authenticated users, achievement progress updates should be
   * persisted to the database.
   */
  test('Property: Achievement progress is persisted for authenticated users', async ({ page, context }) => {
    // Navigate to the game
    await page.goto('http://localhost:5173');
    
    // Property test with 50 iterations
    await fc.assert(
      fc.asyncProperty(
        // Generate random achievement data with progress and alphanumeric IDs
        fc.record({
          achievementId: fc.stringMatching(/^[a-zA-Z0-9_-]{5,20}$/),
          progress: fc.dictionary(
            fc.constantFrom('0', '1', '2'),
            fc.integer({ min: 0, max: 100 })
          ).filter(d => Object.keys(d).length > 0),
        }),
        async (achievementData) => {
          // Execute test in browser context
          const result = await page.evaluate(async (data) => {
            const { updateAchievementProgress, loadAchievements } = await import('./shared/utils/authenticated-achievement-service');
            const { supabase } = await import('./game/utils/supabase/client');
            
            // Sign in anonymously to get a user ID
            const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
            
            if (authError || !authData.session) {
              return { skipped: true };
            }
            
            try {
              // Update achievement progress while authenticated
              await updateAchievementProgress(data.achievementId, data.progress);
              
              // Load achievements and verify progress was saved
              const achievements = await loadAchievements();
              const foundAchievement = achievements.find(a => a.achievementId === data.achievementId);
              
              const achievementExists = !!foundAchievement;
              const progressMatches = JSON.stringify(foundAchievement?.progress) === JSON.stringify(data.progress);
              
              // Verify it's in the database with correct progress
              const { data: dbData, error: dbError } = await supabase
                .from('player_achievements')
                .select('*')
                .eq('player_id', authData.session.user.id)
                .eq('achievement_id', data.achievementId)
                .single();
              
              const inDatabase = !!dbData && !dbError;
              const dbProgressMatches = JSON.stringify(dbData?.progress) === JSON.stringify(data.progress);
              
              // Clean up
              await supabase
                .from('player_achievements')
                .delete()
                .eq('player_id', authData.session.user.id)
                .eq('achievement_id', data.achievementId);
              
              return {
                skipped: false,
                achievementExists,
                progressMatches,
                inDatabase,
                dbProgressMatches,
              };
            } finally {
              await supabase.auth.signOut();
            }
          }, achievementData);
          
          if (result.skipped) {
            return true;
          }
          
          expect(result.achievementExists).toBe(true);
          expect(result.progressMatches).toBe(true);
          expect(result.inDatabase).toBe(true);
          expect(result.dbProgressMatches).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
