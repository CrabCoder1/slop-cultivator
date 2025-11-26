import { supabase } from '../../game/utils/supabase/client';
import type { PlayerProfile, PlayerAchievement } from '../types/composition-types';

/**
 * Player Profile Service
 * Manages player profiles, statistics, and unlocked content
 * Supports anonymous players with localStorage-based identification
 */

const ANONYMOUS_ID_KEY = 'castle-defense-player-id';

// In-memory fallback profile for when database is unavailable
let inMemoryProfile: PlayerProfile | null = null;

/**
 * Generate a unique anonymous ID for a player
 * Format: anon_{timestamp}_{random}
 */
export function generateAnonymousId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `anon_${timestamp}_${random}`;
}

/**
 * Get anonymous ID from localStorage or generate a new one
 */
function getOrCreateAnonymousId(): string {
  let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY);
  
  if (!anonymousId) {
    anonymousId = generateAnonymousId();
    try {
      localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
    } catch (error) {
      console.warn('Failed to save anonymous ID to localStorage:', error);
    }
  }
  
  return anonymousId;
}

/**
 * Load existing player profile or create a new one
 * Falls back to in-memory profile if database is unavailable
 */
export async function loadOrCreatePlayerProfile(): Promise<PlayerProfile> {
  const anonymousId = getOrCreateAnonymousId();
  
  try {
    // Try to load existing profile from database
    const { data: existingProfile, error: loadError } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('anonymous_id', anonymousId)
      .single();
    
    if (existingProfile && !loadError) {
      // Transform database row to PlayerProfile
      const profile = transformFromDb(existingProfile);
      inMemoryProfile = profile; // Cache in memory
      return profile;
    }
    
    // Profile doesn't exist, create a new one
    const newProfile: Omit<PlayerProfile, 'id' | 'createdAt' | 'updatedAt'> = {
      anonymousId,
      stats: {
        totalGamesPlayed: 0,
        highestWave: 0,
        highestScore: 0,
        totalEnemiesDefeated: 0,
        totalCultivatorsDeployed: 0,
      },
      unlockedSpecies: [],
      unlockedDaos: [],
      unlockedTitles: [],
    };
    
    const { data: createdProfile, error: createError } = await supabase
      .from('player_profiles')
      .insert(transformToDb(newProfile))
      .select()
      .single();
    
    if (createError) {
      throw createError;
    }
    
    const profile = transformFromDb(createdProfile);
    inMemoryProfile = profile; // Cache in memory
    return profile;
    
  } catch (error) {
    console.error('Error loading/creating player profile from database:', error);
    console.warn('Falling back to in-memory player profile');
    
    // Return or create in-memory fallback profile
    if (inMemoryProfile) {
      return inMemoryProfile;
    }
    
    inMemoryProfile = {
      id: `temp_${anonymousId}`,
      anonymousId,
      stats: {
        totalGamesPlayed: 0,
        highestWave: 0,
        highestScore: 0,
        totalEnemiesDefeated: 0,
        totalCultivatorsDeployed: 0,
      },
      unlockedSpecies: [],
      unlockedDaos: [],
      unlockedTitles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return inMemoryProfile;
  }
}

/**
 * Update player statistics
 * Falls back to in-memory update if database is unavailable
 */
export async function updatePlayerStats(
  playerId: string,
  stats: Partial<PlayerProfile['stats']>
): Promise<PlayerProfile> {
  try {
    // First, load the current profile to merge stats
    const { data: currentProfile, error: loadError } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('id', playerId)
      .single();
    
    if (loadError) {
      throw loadError;
    }
    
    const profile = transformFromDb(currentProfile);
    
    // Merge stats
    const mergedStats = {
      ...profile.stats,
      ...stats,
    };
    
    const { data, error } = await supabase
      .from('player_profiles')
      .update({
        stats: mergedStats,
        updated_at: new Date().toISOString(),
      })
      .eq('id', playerId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    const updatedProfile = transformFromDb(data);
    inMemoryProfile = updatedProfile; // Update cache
    return updatedProfile;
    
  } catch (error) {
    console.error('Error updating player stats in database:', error);
    console.warn('Falling back to in-memory update');
    
    // Update in-memory profile
    if (inMemoryProfile && inMemoryProfile.id === playerId) {
      inMemoryProfile = {
        ...inMemoryProfile,
        stats: {
          ...inMemoryProfile.stats,
          ...stats,
        },
        updatedAt: new Date().toISOString(),
      };
      return inMemoryProfile;
    }
    
    throw new Error('Player profile not found in memory');
  }
}

/**
 * Unlock content (species, dao, or title) for a player
 * Falls back to in-memory update if database is unavailable
 */
export async function unlockContent(
  playerId: string,
  contentType: 'species' | 'dao' | 'title',
  contentId: string
): Promise<PlayerProfile> {
  try {
    // First, load the current profile to get existing unlocks
    const { data: currentProfile, error: loadError } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('id', playerId)
      .single();
    
    if (loadError) {
      throw loadError;
    }
    
    const profile = transformFromDb(currentProfile);
    
    // Determine which array to update
    let updatedUnlocks: string[];
    let fieldName: string;
    
    switch (contentType) {
      case 'species':
        updatedUnlocks = [...profile.unlockedSpecies];
        fieldName = 'unlocked_species';
        break;
      case 'dao':
        updatedUnlocks = [...profile.unlockedDaos];
        fieldName = 'unlocked_daos';
        break;
      case 'title':
        updatedUnlocks = [...profile.unlockedTitles];
        fieldName = 'unlocked_titles';
        break;
    }
    
    // Add content ID if not already unlocked
    if (!updatedUnlocks.includes(contentId)) {
      updatedUnlocks.push(contentId);
    }
    
    // Update in database
    const { data, error } = await supabase
      .from('player_profiles')
      .update({
        [fieldName]: updatedUnlocks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', playerId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    const updatedProfile = transformFromDb(data);
    inMemoryProfile = updatedProfile; // Update cache
    return updatedProfile;
    
  } catch (error) {
    console.error('Error unlocking content in database:', error);
    console.warn('Falling back to in-memory update');
    
    // Update in-memory profile
    if (inMemoryProfile && inMemoryProfile.id === playerId) {
      let updatedProfile = { ...inMemoryProfile };
      
      switch (contentType) {
        case 'species':
          if (!updatedProfile.unlockedSpecies.includes(contentId)) {
            updatedProfile.unlockedSpecies = [...updatedProfile.unlockedSpecies, contentId];
          }
          break;
        case 'dao':
          if (!updatedProfile.unlockedDaos.includes(contentId)) {
            updatedProfile.unlockedDaos = [...updatedProfile.unlockedDaos, contentId];
          }
          break;
        case 'title':
          if (!updatedProfile.unlockedTitles.includes(contentId)) {
            updatedProfile.unlockedTitles = [...updatedProfile.unlockedTitles, contentId];
          }
          break;
      }
      
      updatedProfile.updatedAt = new Date().toISOString();
      inMemoryProfile = updatedProfile;
      return updatedProfile;
    }
    
    throw new Error('Player profile not found in memory');
  }
}

/**
 * Transform database row to PlayerProfile interface
 */
function transformFromDb(row: any): PlayerProfile {
  return {
    id: row.id,
    anonymousId: row.anonymous_id,
    stats: row.stats || {
      totalGamesPlayed: 0,
      highestWave: 0,
      highestScore: 0,
      totalEnemiesDefeated: 0,
      totalCultivatorsDeployed: 0,
    },
    unlockedSpecies: row.unlocked_species || [],
    unlockedDaos: row.unlocked_daos || [],
    unlockedTitles: row.unlocked_titles || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transform PlayerProfile to database row format
 */
function transformToDb(profile: Partial<PlayerProfile>): any {
  const row: any = {};
  
  if (profile.anonymousId !== undefined) row.anonymous_id = profile.anonymousId;
  if (profile.stats !== undefined) row.stats = profile.stats;
  if (profile.unlockedSpecies !== undefined) row.unlocked_species = profile.unlockedSpecies;
  if (profile.unlockedDaos !== undefined) row.unlocked_daos = profile.unlockedDaos;
  if (profile.unlockedTitles !== undefined) row.unlocked_titles = profile.unlockedTitles;
  
  return row;
}

/**
 * Player Achievement Tracking Functions
 */

// In-memory fallback for player achievements
let inMemoryAchievements: PlayerAchievement[] = [];

/**
 * Load all player achievements for a player
 * Falls back to in-memory storage if database is unavailable
 */
export async function loadPlayerAchievements(playerId: string): Promise<PlayerAchievement[]> {
  try {
    const { data, error } = await supabase
      .from('player_achievements')
      .select('*')
      .eq('player_id', playerId);
    
    if (error) {
      throw error;
    }
    
    const achievements = (data || []).map(transformAchievementFromDb);
    inMemoryAchievements = achievements; // Cache in memory
    return achievements;
    
  } catch (error) {
    console.error('Error loading player achievements from database:', error);
    console.warn('Falling back to in-memory player achievements');
    
    // Return in-memory achievements for this player
    return inMemoryAchievements.filter(a => a.playerId === playerId);
  }
}

/**
 * Update achievement progress for a player
 * Supports batch updates for performance
 * Falls back to in-memory update if database is unavailable
 */
export async function updateAchievementProgress(
  playerId: string,
  updates: Array<{
    achievementId: string;
    progress: Record<string, number>;
  }>
): Promise<PlayerAchievement[]> {
  if (updates.length === 0) {
    return [];
  }
  
  try {
    // Batch update all achievements
    const updatePromises = updates.map(async ({ achievementId, progress }) => {
      // First check if player achievement record exists
      const { data: existing } = await supabase
        .from('player_achievements')
        .select('*')
        .eq('player_id', playerId)
        .eq('achievement_id', achievementId)
        .single();
      
      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('player_achievements')
          .update({
            progress,
            updated_at: new Date().toISOString(),
          })
          .eq('player_id', playerId)
          .eq('achievement_id', achievementId)
          .select()
          .single();
        
        if (error) throw error;
        return transformAchievementFromDb(data);
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('player_achievements')
          .insert({
            player_id: playerId,
            achievement_id: achievementId,
            progress,
            is_unlocked: false,
          })
          .select()
          .single();
        
        if (error) throw error;
        return transformAchievementFromDb(data);
      }
    });
    
    const updatedAchievements = await Promise.all(updatePromises);
    
    // Update in-memory cache
    updatedAchievements.forEach(updated => {
      const index = inMemoryAchievements.findIndex(
        a => a.playerId === playerId && a.achievementId === updated.achievementId
      );
      if (index >= 0) {
        inMemoryAchievements[index] = updated;
      } else {
        inMemoryAchievements.push(updated);
      }
    });
    
    return updatedAchievements;
    
  } catch (error) {
    console.error('Error updating achievement progress in database:', error);
    console.warn('Falling back to in-memory update');
    
    // Update in-memory achievements
    const updatedAchievements: PlayerAchievement[] = [];
    
    updates.forEach(({ achievementId, progress }) => {
      const index = inMemoryAchievements.findIndex(
        a => a.playerId === playerId && a.achievementId === achievementId
      );
      
      if (index >= 0) {
        inMemoryAchievements[index] = {
          ...inMemoryAchievements[index],
          progress,
          updatedAt: new Date().toISOString(),
        };
        updatedAchievements.push(inMemoryAchievements[index]);
      } else {
        const newAchievement: PlayerAchievement = {
          id: `temp_${playerId}_${achievementId}`,
          playerId,
          achievementId,
          progress,
          isUnlocked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        inMemoryAchievements.push(newAchievement);
        updatedAchievements.push(newAchievement);
      }
    });
    
    return updatedAchievements;
  }
}

/**
 * Unlock an achievement for a player
 * Falls back to in-memory update if database is unavailable
 */
export async function unlockAchievement(
  playerId: string,
  achievementId: string
): Promise<PlayerAchievement> {
  try {
    const unlockedAt = new Date().toISOString();
    
    // Check if player achievement record exists
    const { data: existing } = await supabase
      .from('player_achievements')
      .select('*')
      .eq('player_id', playerId)
      .eq('achievement_id', achievementId)
      .single();
    
    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('player_achievements')
        .update({
          is_unlocked: true,
          unlocked_at: unlockedAt,
          updated_at: unlockedAt,
        })
        .eq('player_id', playerId)
        .eq('achievement_id', achievementId)
        .select()
        .single();
      
      if (error) throw error;
      
      const achievement = transformAchievementFromDb(data);
      
      // Update in-memory cache
      const index = inMemoryAchievements.findIndex(
        a => a.playerId === playerId && a.achievementId === achievementId
      );
      if (index >= 0) {
        inMemoryAchievements[index] = achievement;
      }
      
      return achievement;
    } else {
      // Create new record (already unlocked)
      const { data, error } = await supabase
        .from('player_achievements')
        .insert({
          player_id: playerId,
          achievement_id: achievementId,
          progress: {},
          is_unlocked: true,
          unlocked_at: unlockedAt,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const achievement = transformAchievementFromDb(data);
      inMemoryAchievements.push(achievement);
      return achievement;
    }
    
  } catch (error) {
    console.error('Error unlocking achievement in database:', error);
    console.warn('Falling back to in-memory unlock');
    
    // Update in-memory achievement
    const index = inMemoryAchievements.findIndex(
      a => a.playerId === playerId && a.achievementId === achievementId
    );
    
    const unlockedAt = new Date().toISOString();
    
    if (index >= 0) {
      inMemoryAchievements[index] = {
        ...inMemoryAchievements[index],
        isUnlocked: true,
        unlockedAt,
        updatedAt: unlockedAt,
      };
      return inMemoryAchievements[index];
    } else {
      const newAchievement: PlayerAchievement = {
        id: `temp_${playerId}_${achievementId}`,
        playerId,
        achievementId,
        progress: {},
        isUnlocked: true,
        unlockedAt,
        createdAt: unlockedAt,
        updatedAt: unlockedAt,
      };
      inMemoryAchievements.push(newAchievement);
      return newAchievement;
    }
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
