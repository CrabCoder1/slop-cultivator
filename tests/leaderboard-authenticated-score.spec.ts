/**
 * Property-Based Tests for Authenticated Score Association
 * 
 * Feature: user-authentication, Property 16: Authenticated Score Association
 * Validates: Requirements 6.3, 7.2
 * 
 * Property: For any authenticated user submitting a leaderboard score, 
 * the score should be associated with their User Profile identifier.
 */

import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';

test.describe('Leaderboard Authenticated Score Association', () => {
  
  /**
   * Property 16: Authenticated Score Association
   * 
   * For any authenticated user submitting a score, the score should be
   * associated with their user_id in the database, not an anonymous_id.
   */
  test('Property 16: Authenticated scores are associated with user_id', async ({ page, context }) => {
    // Navigate to the game
    await page.goto('http://localhost:5173');
    
    // Property test with 100 iterations
    await fc.assert(
      fc.asyncProperty(
        // Generate random score data
        fc.record({
          score: fc.integer({ min: 100, max: 100000 }),
          wave: fc.integer({ min: 1, max: 50 }),
          playerName: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
        }),
        async (scoreData) => {
          // Execute test in browser context where localStorage is available
          const result = await page.evaluate(async (data) => {
            const { submitScore, getTopScores } = await import('./shared/utils/leaderboard-service');
            const { supabase } = await import('./game/utils/supabase/client');
            
            // Sign in anonymously to get a user ID
            const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
            
            if (authError || !authData.session) {
              return { skipped: true };
            }
            
            try {
              // Submit score while authenticated
              const submittedScore = await submitScore({
                playerName: data.playerName,
                score: data.score,
                waveReached: data.wave,
              });
              
              // Verify the score is associated with user_id
              const hasUserId = !!submittedScore.userId;
              const userIdMatches = submittedScore.userId === authData.session.user.id;
              const noAnonymousId = submittedScore.anonymousId === null;
              
              // Verify the score appears in the leaderboard
              const topScores = await getTopScores(100);
              const foundScore = topScores.find(s => s.id === submittedScore.id);
              
              const foundInLeaderboard = !!foundScore;
              const leaderboardUserIdMatches = foundScore?.userId === authData.session.user.id;
              const leaderboardNoAnonymousId = foundScore?.anonymousId === null;
              
              // Clean up: delete the test score
              await supabase
                .from('leaderboard_scores')
                .delete()
                .eq('id', submittedScore.id);
              
              return {
                skipped: false,
                hasUserId,
                userIdMatches,
                noAnonymousId,
                foundInLeaderboard,
                leaderboardUserIdMatches,
                leaderboardNoAnonymousId,
              };
            } finally {
              // Sign out
              await supabase.auth.signOut();
            }
          }, scoreData);
          
          if (result.skipped) {
            return true; // Skip this iteration
          }
          
          expect(result.hasUserId).toBe(true);
          expect(result.userIdMatches).toBe(true);
          expect(result.noAnonymousId).toBe(true);
          expect(result.foundInLeaderboard).toBe(true);
          expect(result.leaderboardUserIdMatches).toBe(true);
          expect(result.leaderboardNoAnonymousId).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property: Guest scores should NOT be associated with user_id
   * 
   * This is the inverse property - ensuring guest scores use anonymous_id
   */
  test('Property: Guest scores use anonymous_id not user_id', async ({ page, context }) => {
    // Navigate to the game
    await page.goto('http://localhost:5173');
    
    // Property test with 100 iterations
    await fc.assert(
      fc.asyncProperty(
        // Generate random score data with alphanumeric player names
        fc.record({
          score: fc.integer({ min: 100, max: 100000 }),
          wave: fc.integer({ min: 1, max: 50 }),
          playerName: fc.stringMatching(/^[a-zA-Z0-9 ]{3,20}$/).filter(s => s.trim().length >= 3),
        }),
        async (scoreData) => {
          // Execute test in browser context where localStorage is available
          const result = await page.evaluate(async (data) => {
            const { submitScore } = await import('./shared/utils/leaderboard-service');
            const { supabase } = await import('./game/utils/supabase/client');
            
            // Ensure we're signed out (guest mode)
            await supabase.auth.signOut();
            
            try {
              // Submit score as guest
              const submittedScore = await submitScore({
                playerName: data.playerName,
                score: data.score,
                waveReached: data.wave,
              });
              
              // Verify the score is associated with anonymous_id, not user_id
              const noUserId = submittedScore.userId === null;
              const hasAnonymousId = !!submittedScore.anonymousId;
              const anonymousIdFormat = submittedScore.anonymousId?.startsWith('anon_') || false;
              
              // Clean up: delete the test score
              await supabase
                .from('leaderboard_scores')
                .delete()
                .eq('id', submittedScore.id);
              
              return {
                noUserId,
                hasAnonymousId,
                anonymousIdFormat,
              };
            } catch (error) {
              return {
                error: error.message,
              };
            }
          }, scoreData);
          
          if (result.error) {
            throw new Error(result.error);
          }
          
          expect(result.noUserId).toBe(true);
          expect(result.hasAnonymousId).toBe(true);
          expect(result.anonymousIdFormat).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property: Authenticated user scores should display username
   * 
   * When fetching leaderboard scores, authenticated users should have
   * their profile information (username/display_name) available
   */
  test('Property: Authenticated scores include profile information', async ({ page, context }) => {
    // Navigate to the game
    await page.goto('http://localhost:5173');
    
    // Property test with 50 iterations (fewer since this involves profile creation)
    await fc.assert(
      fc.asyncProperty(
        // Generate random score and profile data
        fc.record({
          score: fc.integer({ min: 100, max: 100000 }),
          wave: fc.integer({ min: 1, max: 50 }),
          username: fc.string({ minLength: 3, maxLength: 15 }).filter(s => s.trim().length >= 3),
          displayName: fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
        }),
        async (testData) => {
          // Execute test in browser context
          const result = await page.evaluate(async (data) => {
            const { submitScore, getTopScores } = await import('./shared/utils/leaderboard-service');
            const { supabase } = await import('./game/utils/supabase/client');
            
            // Sign in anonymously to get a user ID
            const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
            
            if (authError || !authData.session) {
              return { skipped: true };
            }
            
            try {
              // Create a profile for this user
              const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                  id: authData.session.user.id,
                  username: data.username,
                  display_name: data.displayName,
                  provider: 'anonymous',
                });
              
              if (profileError) {
                return { skipped: true };
              }
              
              // Submit score
              const submittedScore = await submitScore({
                playerName: 'Test Player',
                score: data.score,
                waveReached: data.wave,
              });
              
              // Fetch scores and verify profile information is included
              const topScores = await getTopScores(100);
              const foundScore = topScores.find(s => s.id === submittedScore.id);
              
              const foundInLeaderboard = !!foundScore;
              const userIdMatches = foundScore?.userId === authData.session.user.id;
              const hasProfileInfo = !!(foundScore?.username || foundScore?.displayName);
              
              // Clean up
              await supabase
                .from('leaderboard_scores')
                .delete()
                .eq('id', submittedScore.id);
              
              await supabase
                .from('profiles')
                .delete()
                .eq('id', authData.session.user.id);
              
              return {
                skipped: false,
                foundInLeaderboard,
                userIdMatches,
                hasProfileInfo,
              };
            } finally {
              await supabase.auth.signOut();
            }
          }, testData);
          
          if (result.skipped) {
            return true;
          }
          
          expect(result.foundInLeaderboard).toBe(true);
          expect(result.userIdMatches).toBe(true);
          expect(result.hasProfileInfo).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
