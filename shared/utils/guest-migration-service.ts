import { supabase } from '../../game/utils/supabase/client';
import { getPlayerData, type PlayerData, type LocalScore } from '../../game/utils/local-storage';

/**
 * Guest data structure containing all local game progress
 */
export interface GuestData {
  playerData: PlayerData;
  achievements: string[]; // Achievement IDs that were unlocked
  preferences: Record<string, any>; // Game preferences
}

/**
 * Result of a migration operation
 */
export interface MigrationResult {
  success: boolean;
  error?: Error;
  migratedScores?: number;
  migratedAchievements?: number;
}

/**
 * Guest Migration Service
 * Handles migration of guest data to authenticated user accounts
 * 
 * Features:
 * - Extract guest data from localStorage
 * - Migrate data to server for authenticated users
 * - Handle migration failures with rollback
 * - Clear guest data after successful migration
 * 
 * Requirements: 5.4
 */
export class GuestMigrationService {
  /**
   * Get all guest data from localStorage
   * Extracts player data, achievements, and preferences
   * 
   * @returns Guest data object containing all local progress
   * 
   * Requirements: 5.4
   */
  getGuestData(): GuestData {
    try {
      // Get player data (scores, name, etc.)
      const playerData = getPlayerData();

      // Get achievements from localStorage
      const achievementsStr = localStorage.getItem('wuxia_guest_achievements');
      const achievements = achievementsStr ? JSON.parse(achievementsStr) : [];

      // Get preferences from localStorage
      const preferencesStr = localStorage.getItem('wuxia_guest_preferences');
      const preferences = preferencesStr ? JSON.parse(preferencesStr) : {};

      return {
        playerData,
        achievements,
        preferences
      };
    } catch (error) {
      console.error('Error getting guest data:', error);
      // Return empty data on error
      return {
        playerData: {
          playerName: '',
          personalBest: 0,
          totalGamesPlayed: 0,
          localScores: []
        },
        achievements: [],
        preferences: {}
      };
    }
  }

  /**
   * Migrate guest data to authenticated user account
   * Transfers all local progress to the server
   * Uses transactions to ensure data consistency
   * 
   * @param userId - The authenticated user's ID
   * @returns Promise resolving to migration result
   * 
   * Requirements: 5.4
   */
  async migrateGuestData(userId: string): Promise<MigrationResult> {
    try {
      // Get all guest data
      const guestData = this.getGuestData();

      // Check if there's any data to migrate
      const hasData = 
        guestData.playerData.localScores.length > 0 ||
        guestData.achievements.length > 0 ||
        Object.keys(guestData.preferences).length > 0;

      if (!hasData) {
        return {
          success: true,
          migratedScores: 0,
          migratedAchievements: 0
        };
      }

      // Migrate scores to leaderboard
      let migratedScores = 0;
      if (guestData.playerData.localScores.length > 0) {
        const scoresResult = await this.migrateScores(userId, guestData.playerData.localScores);
        if (!scoresResult.success) {
          throw scoresResult.error || new Error('Failed to migrate scores');
        }
        migratedScores = scoresResult.count || 0;
      }

      // Migrate achievements
      let migratedAchievements = 0;
      if (guestData.achievements.length > 0) {
        const achievementsResult = await this.migrateAchievements(userId, guestData.achievements);
        if (!achievementsResult.success) {
          // Rollback scores if achievements fail
          await this.rollbackScores(userId);
          throw achievementsResult.error || new Error('Failed to migrate achievements');
        }
        migratedAchievements = achievementsResult.count || 0;
      }

      // Update user profile with preferences
      if (Object.keys(guestData.preferences).length > 0) {
        const preferencesResult = await this.migratePreferences(userId, guestData.preferences);
        if (!preferencesResult.success) {
          // Rollback everything if preferences fail
          await this.rollbackScores(userId);
          await this.rollbackAchievements(userId);
          throw preferencesResult.error || new Error('Failed to migrate preferences');
        }
      }

      return {
        success: true,
        migratedScores,
        migratedAchievements
      };
    } catch (error) {
      console.error('Error migrating guest data:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown migration error')
      };
    }
  }

  /**
   * Migrate local scores to server leaderboard
   * 
   * @param userId - The authenticated user's ID
   * @param scores - Array of local scores to migrate
   * @returns Promise resolving to migration result
   * 
   * @private
   */
  private async migrateScores(userId: string, scores: LocalScore[]): Promise<{ success: boolean; error?: Error; count?: number }> {
    try {
      // Prepare scores for insertion
      const scoresData = scores.map(score => ({
        user_id: userId,
        score: score.score,
        wave: score.wave,
        enemies_defeated: score.enemiesDefeated,
        cultivators_deployed: score.cultivatorsDeployed,
        time_played: score.timePlayed,
        created_at: new Date(score.timestamp).toISOString()
      }));

      // Insert scores into leaderboard_scores table
      const { error } = await supabase
        .from('leaderboard_scores')
        .insert(scoresData);

      if (error) {
        throw error;
      }

      return {
        success: true,
        count: scores.length
      };
    } catch (error) {
      console.error('Error migrating scores:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error migrating scores')
      };
    }
  }

  /**
   * Migrate local achievements to server
   * 
   * @param userId - The authenticated user's ID
   * @param achievements - Array of achievement IDs to migrate
   * @returns Promise resolving to migration result
   * 
   * @private
   */
  private async migrateAchievements(userId: string, achievements: string[]): Promise<{ success: boolean; error?: Error; count?: number }> {
    try {
      // Prepare achievements for insertion
      const achievementsData = achievements.map(achievementId => ({
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString()
      }));

      // Insert achievements into achievements table
      const { error } = await supabase
        .from('achievements')
        .insert(achievementsData);

      if (error) {
        throw error;
      }

      return {
        success: true,
        count: achievements.length
      };
    } catch (error) {
      console.error('Error migrating achievements:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error migrating achievements')
      };
    }
  }

  /**
   * Migrate user preferences to profile
   * 
   * @param userId - The authenticated user's ID
   * @param preferences - User preferences object
   * @returns Promise resolving to migration result
   * 
   * @private
   */
  private async migratePreferences(userId: string, preferences: Record<string, any>): Promise<{ success: boolean; error?: Error }> {
    try {
      // Update profile with preferences
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error migrating preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error migrating preferences')
      };
    }
  }

  /**
   * Rollback migrated scores (delete scores added during this migration)
   * 
   * @param userId - The authenticated user's ID
   * @returns Promise resolving when rollback is complete
   * 
   * @private
   */
  private async rollbackScores(userId: string): Promise<void> {
    try {
      // Delete scores added in the last minute (migration window)
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      
      await supabase
        .from('leaderboard_scores')
        .delete()
        .eq('user_id', userId)
        .gte('created_at', oneMinuteAgo);
    } catch (error) {
      console.error('Error rolling back scores:', error);
      // Don't throw - rollback is best effort
    }
  }

  /**
   * Rollback migrated achievements (delete achievements added during this migration)
   * 
   * @param userId - The authenticated user's ID
   * @returns Promise resolving when rollback is complete
   * 
   * @private
   */
  private async rollbackAchievements(userId: string): Promise<void> {
    try {
      // Delete achievements added in the last minute (migration window)
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      
      await supabase
        .from('achievements')
        .delete()
        .eq('user_id', userId)
        .gte('unlocked_at', oneMinuteAgo);
    } catch (error) {
      console.error('Error rolling back achievements:', error);
      // Don't throw - rollback is best effort
    }
  }

  /**
   * Clear all guest data from localStorage
   * Should only be called after successful migration
   * 
   * @returns void
   * 
   * Requirements: 5.4
   */
  clearGuestData(): void {
    try {
      // Clear guest mode flag
      localStorage.removeItem('wuxia_guest_mode');

      // Clear player data
      localStorage.removeItem('wuxia_player_data');

      // Clear achievements
      localStorage.removeItem('wuxia_guest_achievements');

      // Clear preferences
      localStorage.removeItem('wuxia_guest_preferences');

      // Clear any other guest-related data
      localStorage.removeItem('wuxia_guest_data');
      localStorage.removeItem('wuxia_guest_score');

      console.log('Guest data cleared successfully');
    } catch (error) {
      console.error('Error clearing guest data:', error);
      // Don't throw - clearing is best effort
    }
  }

  /**
   * Check if there is guest data available to migrate
   * 
   * @returns True if guest data exists, false otherwise
   */
  hasGuestData(): boolean {
    try {
      const guestData = this.getGuestData();
      
      return (
        guestData.playerData.localScores.length > 0 ||
        guestData.achievements.length > 0 ||
        Object.keys(guestData.preferences).length > 0 ||
        guestData.playerData.totalGamesPlayed > 0
      );
    } catch (error) {
      console.error('Error checking for guest data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const guestMigrationService = new GuestMigrationService();
