/**
 * Authenticated Achievement Service
 * Integrates achievement system with authentication
 * Supports both authenticated users and guest mode
 * 
 * Requirements: 6.2, 7.3
 */

import { supabase } from '../../game/utils/supabase/client';
import type { PlayerAchievement } from '../types/composition-types';

/**
 * Achievement data for local storage (guest mode)
 */
interface LocalAchievement {
  achievementId: string;
  progress: Record<string, number>;
  isUnlocked: boolean;
  unlockedAt?: string;
}

const LOCAL_ACHIEVEMENTS_KEY = 'wuxia_achievements';

/**
 * Load achievements for the current user
 * Automatically detects if user is authenticated and loads from appropriate source
 * 
 * @returns Array of player achievements
 */
export async function loadAchievements(): Promise<PlayerAchievement[]> {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Load from database for authenticated users
      return await loadAuthenticatedAchievements(session.user.id);
    } else {
      // Load from localStorage for guests
      return loadGuestAchievements();
    }
  } catch (error) {
    console.error('Error loading achievements:', error);
    // Fall back to guest achievements on error
    return loadGuestAchievements();
  }
}

/**
 * Save achievement progress
 * Automatically detects if user is authenticated and saves to appropriate location
 * 
 * @param achievements Array of achievements to save
 */
export async function saveAchievements(achievements: PlayerAchievement[]): Promise<void> {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Save to database for authenticated users
      await saveAuthenticatedAchievements(session.user.id, achievements);
    } else {
      // Save to localStorage for guests
      saveGuestAchievements(achievements);
    }
  } catch (error) {
    console.error('Error saving achievements:', error);
    // Fall back to guest storage on error
    saveGuestAchievements(achievements);
  }
}

/**
 * Unlock an achievement
 * Automatically handles authenticated vs guest storage
 * 
 * @param achievementId Achievement ID to unlock
 */
export async function unlockAchievement(achievementId: string): Promise<void> {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Unlock in database for authenticated users
      const unlockedAt = new Date().toISOString();
      
      const { error } = await supabase
        .from('player_achievements')
        .upsert({
          player_id: session.user.id,
          achievement_id: achievementId,
          is_unlocked: true,
          unlocked_at: unlockedAt,
          progress: {},
        });
      
      if (error) {
        throw error;
      }
    } else {
      // Unlock in localStorage for guests
      const achievements = loadGuestAchievements();
      const achievement = achievements.find(a => a.achievementId === achievementId);
      
      if (achievement) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date().toISOString();
      } else {
        achievements.push({
          id: `guest_${achievementId}`,
          playerId: 'guest',
          achievementId,
          progress: {},
          isUnlocked: true,
          unlockedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      
      saveGuestAchievements(achievements);
    }
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    throw error;
  }
}

/**
 * Update achievement progress
 * Automatically handles authenticated vs guest storage
 * 
 * @param achievementId Achievement ID
 * @param progress Progress data
 */
export async function updateAchievementProgress(
  achievementId: string,
  progress: Record<string, number>
): Promise<void> {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Update in database for authenticated users
      const { error } = await supabase
        .from('player_achievements')
        .upsert({
          player_id: session.user.id,
          achievement_id: achievementId,
          progress,
          is_unlocked: false,
        });
      
      if (error) {
        throw error;
      }
    } else {
      // Update in localStorage for guests
      const achievements = loadGuestAchievements();
      const achievement = achievements.find(a => a.achievementId === achievementId);
      
      if (achievement) {
        achievement.progress = progress;
        achievement.updatedAt = new Date().toISOString();
      } else {
        achievements.push({
          id: `guest_${achievementId}`,
          playerId: 'guest',
          achievementId,
          progress,
          isUnlocked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      
      saveGuestAchievements(achievements);
    }
  } catch (error) {
    console.error('Error updating achievement progress:', error);
    throw error;
  }
}

/**
 * Sync guest achievements to authenticated account
 * Called when a guest user creates an account
 * 
 * @param userId User ID to sync achievements to
 */
export async function syncGuestAchievements(userId: string): Promise<void> {
  try {
    const guestAchievements = loadGuestAchievements();
    
    if (guestAchievements.length === 0) {
      return; // Nothing to sync
    }
    
    // Convert guest achievements to database format
    const achievementsToSync = guestAchievements.map(achievement => ({
      player_id: userId,
      achievement_id: achievement.achievementId,
      progress: achievement.progress,
      is_unlocked: achievement.isUnlocked,
      unlocked_at: achievement.unlockedAt,
    }));
    
    // Batch insert/update achievements
    const { error } = await supabase
      .from('player_achievements')
      .upsert(achievementsToSync);
    
    if (error) {
      throw error;
    }
    
    console.log(`Synced ${guestAchievements.length} achievements to authenticated account`);
  } catch (error) {
    console.error('Error syncing guest achievements:', error);
    throw error;
  }
}

/**
 * Clear guest achievements from localStorage
 * Called after successful sync to authenticated account
 */
export function clearGuestAchievements(): void {
  try {
    localStorage.removeItem(LOCAL_ACHIEVEMENTS_KEY);
  } catch (error) {
    console.warn('Failed to clear guest achievements:', error);
  }
}

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * Load achievements from database for authenticated user
 */
async function loadAuthenticatedAchievements(userId: string): Promise<PlayerAchievement[]> {
  const { data, error } = await supabase
    .from('player_achievements')
    .select('*')
    .eq('player_id', userId);
  
  if (error) {
    throw error;
  }
  
  return (data || []).map(transformAchievementFromDb);
}

/**
 * Save achievements to database for authenticated user
 */
async function saveAuthenticatedAchievements(
  userId: string,
  achievements: PlayerAchievement[]
): Promise<void> {
  // Convert to database format
  const achievementsToSave = achievements.map(achievement => ({
    player_id: userId,
    achievement_id: achievement.achievementId,
    progress: achievement.progress,
    is_unlocked: achievement.isUnlocked,
    unlocked_at: achievement.unlockedAt,
  }));
  
  // Batch upsert
  const { error } = await supabase
    .from('player_achievements')
    .upsert(achievementsToSave);
  
  if (error) {
    throw error;
  }
}

/**
 * Load achievements from localStorage for guest users
 */
function loadGuestAchievements(): PlayerAchievement[] {
  try {
    const stored = localStorage.getItem(LOCAL_ACHIEVEMENTS_KEY);
    if (!stored) {
      return [];
    }
    
    const localAchievements: LocalAchievement[] = JSON.parse(stored);
    
    // Convert to PlayerAchievement format
    return localAchievements.map((achievement, index) => ({
      id: `guest_${achievement.achievementId}`,
      playerId: 'guest',
      achievementId: achievement.achievementId,
      progress: achievement.progress,
      isUnlocked: achievement.isUnlocked,
      unlockedAt: achievement.unlockedAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.warn('Failed to load guest achievements:', error);
    return [];
  }
}

/**
 * Save achievements to localStorage for guest users
 */
function saveGuestAchievements(achievements: PlayerAchievement[]): void {
  try {
    // Convert to local storage format
    const localAchievements: LocalAchievement[] = achievements.map(achievement => ({
      achievementId: achievement.achievementId,
      progress: achievement.progress,
      isUnlocked: achievement.isUnlocked,
      unlockedAt: achievement.unlockedAt,
    }));
    
    localStorage.setItem(LOCAL_ACHIEVEMENTS_KEY, JSON.stringify(localAchievements));
  } catch (error) {
    console.warn('Failed to save guest achievements:', error);
  }
}

/**
 * Transform database row to PlayerAchievement interface
 */
function transformAchievementFromDb(row: any): PlayerAchievement {
  return {
    id: row.id,
    playerId: row.player_id,
    achievementId: row.achievement_id,
    progress: row.progress || {},
    isUnlocked: row.is_unlocked || false,
    unlockedAt: row.unlocked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
