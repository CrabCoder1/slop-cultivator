/**
 * Authenticated Player Profile Service
 * Integrates player profile system with authentication
 * Supports both authenticated users and guest mode
 * Syncs profile data across devices for authenticated users
 * 
 * Requirements: 6.1, 6.4
 */

import { supabase } from '../../game/utils/supabase/client';
import type { PlayerProfile } from '../types/composition-types';

const LOCAL_PROFILE_KEY = 'wuxia_player_profile';

/**
 * Load player profile
 * Automatically detects if user is authenticated and loads from appropriate source
 * For authenticated users, syncs data across devices
 * 
 * @returns Player profile
 */
export async function loadPlayerProfile(): Promise<PlayerProfile> {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log('[loadPlayerProfile] Session check:', session ? 'authenticated' : 'guest');
    
    if (session?.user) {
      console.log('[loadPlayerProfile] Loading authenticated profile for user:', session.user.id);
      // Load from database for authenticated users (syncs across devices)
      const profile = await loadAuthenticatedProfile(session.user.id);
      console.log('[loadPlayerProfile] Successfully loaded authenticated profile:', profile.id);
      return profile;
    } else {
      console.log('[loadPlayerProfile] Loading guest profile from localStorage');
      // Load from localStorage for guests
      return loadGuestProfile();
    }
  } catch (error) {
    console.error('[loadPlayerProfile] Error loading player profile:', error);
    console.error('[loadPlayerProfile] Error details:', error instanceof Error ? error.message : String(error));
    // Fall back to guest profile on error
    console.log('[loadPlayerProfile] Falling back to guest profile');
    return loadGuestProfile();
  }
}

/**
 * Save player profile
 * Automatically detects if user is authenticated and saves to appropriate location
 * For authenticated users, syncs data to server for cross-device access
 * 
 * @param profile Player profile to save
 */
export async function savePlayerProfile(profile: PlayerProfile): Promise<void> {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Save to database for authenticated users (syncs across devices)
      await saveAuthenticatedProfile(session.user.id, profile);
    } else {
      // Save to localStorage for guests
      saveGuestProfile(profile);
    }
  } catch (error) {
    console.error('Error saving player profile:', error);
    // Fall back to guest storage on error
    saveGuestProfile(profile);
  }
}

/**
 * Update player statistics
 * Automatically handles authenticated vs guest storage
 * 
 * @param stats Partial stats to update
 */
export async function updatePlayerStats(stats: Partial<PlayerProfile['stats']>): Promise<void> {
  try {
    const profile = await loadPlayerProfile();
    
    // Merge stats
    profile.stats = {
      ...profile.stats,
      ...stats,
    };
    profile.updatedAt = new Date().toISOString();
    
    await savePlayerProfile(profile);
  } catch (error) {
    console.error('Error updating player stats:', error);
    throw error;
  }
}

/**
 * Unlock content (species, dao, or title)
 * Automatically handles authenticated vs guest storage
 * 
 * @param contentType Type of content to unlock
 * @param contentId Content ID to unlock
 */
export async function unlockContent(
  contentType: 'species' | 'dao' | 'title',
  contentId: string
): Promise<void> {
  try {
    const profile = await loadPlayerProfile();
    
    // Add content ID if not already unlocked
    switch (contentType) {
      case 'species':
        if (!profile.unlockedSpecies.includes(contentId)) {
          profile.unlockedSpecies = [...profile.unlockedSpecies, contentId];
        }
        break;
      case 'dao':
        if (!profile.unlockedDaos.includes(contentId)) {
          profile.unlockedDaos = [...profile.unlockedDaos, contentId];
        }
        break;
      case 'title':
        if (!profile.unlockedTitles.includes(contentId)) {
          profile.unlockedTitles = [...profile.unlockedTitles, contentId];
        }
        break;
    }
    
    profile.updatedAt = new Date().toISOString();
    await savePlayerProfile(profile);
  } catch (error) {
    console.error('Error unlocking content:', error);
    throw error;
  }
}

/**
 * Sync guest profile to authenticated account
 * Called when a guest user creates an account
 * Migrates all local profile data to the server
 * 
 * @param userId User ID to sync profile to
 */
export async function syncGuestProfile(userId: string): Promise<void> {
  try {
    const guestProfile = loadGuestProfile();
    
    // Check if there's any meaningful data to sync
    const hasData = 
      guestProfile.stats.totalGamesPlayed > 0 ||
      guestProfile.unlockedSpecies.length > 0 ||
      guestProfile.unlockedDaos.length > 0 ||
      guestProfile.unlockedTitles.length > 0;
    
    if (!hasData) {
      return; // Nothing to sync
    }
    
    // Load existing authenticated profile (if any)
    let authenticatedProfile: PlayerProfile;
    try {
      authenticatedProfile = await loadAuthenticatedProfile(userId);
    } catch (error) {
      // Profile doesn't exist yet, create new one
      authenticatedProfile = createEmptyProfile(userId);
    }
    
    // Merge guest data with authenticated profile
    // Take the maximum values for stats
    authenticatedProfile.stats = {
      totalGamesPlayed: Math.max(
        authenticatedProfile.stats.totalGamesPlayed,
        guestProfile.stats.totalGamesPlayed
      ),
      highestWave: Math.max(
        authenticatedProfile.stats.highestWave,
        guestProfile.stats.highestWave
      ),
      highestScore: Math.max(
        authenticatedProfile.stats.highestScore,
        guestProfile.stats.highestScore
      ),
      totalEnemiesDefeated: Math.max(
        authenticatedProfile.stats.totalEnemiesDefeated,
        guestProfile.stats.totalEnemiesDefeated
      ),
      totalCultivatorsDeployed: Math.max(
        authenticatedProfile.stats.totalCultivatorsDeployed,
        guestProfile.stats.totalCultivatorsDeployed
      ),
    };
    
    // Merge unlocked content (union of both sets)
    authenticatedProfile.unlockedSpecies = [
      ...new Set([...authenticatedProfile.unlockedSpecies, ...guestProfile.unlockedSpecies])
    ];
    authenticatedProfile.unlockedDaos = [
      ...new Set([...authenticatedProfile.unlockedDaos, ...guestProfile.unlockedDaos])
    ];
    authenticatedProfile.unlockedTitles = [
      ...new Set([...authenticatedProfile.unlockedTitles, ...guestProfile.unlockedTitles])
    ];
    
    // Save merged profile
    await saveAuthenticatedProfile(userId, authenticatedProfile);
    
    console.log('Successfully synced guest profile to authenticated account');
  } catch (error) {
    console.error('Error syncing guest profile:', error);
    throw error;
  }
}

/**
 * Clear guest profile from localStorage
 * Called after successful sync to authenticated account
 */
export function clearGuestProfile(): void {
  try {
    localStorage.removeItem(LOCAL_PROFILE_KEY);
  } catch (error) {
    console.warn('Failed to clear guest profile:', error);
  }
}

/**
 * Check if user has guest profile data
 * Used to determine if migration prompt should be shown
 */
export function hasGuestProfileData(): boolean {
  try {
    const stored = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!stored) {
      return false;
    }
    
    const profile: PlayerProfile = JSON.parse(stored);
    
    // Check if there's any meaningful data
    return (
      profile.stats.totalGamesPlayed > 0 ||
      profile.unlockedSpecies.length > 0 ||
      profile.unlockedDaos.length > 0 ||
      profile.unlockedTitles.length > 0
    );
  } catch (error) {
    return false;
  }
}

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * Load profile from database for authenticated user
 * Provides cross-device sync
 */
async function loadAuthenticatedProfile(userId: string): Promise<PlayerProfile> {
  console.log('[loadAuthenticatedProfile] Querying player_profiles for user_id:', userId);
  
  // First, try to load from player_profiles table (linked to auth.users)
  const { data, error } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('[loadAuthenticatedProfile] Query error:', error);
    // If profile doesn't exist, create a new one
    if (error.code === 'PGRST116') { // No rows returned
      console.log('[loadAuthenticatedProfile] No profile found, creating new one');
      const newProfile = createEmptyProfile(userId);
      await saveAuthenticatedProfile(userId, newProfile);
      console.log('[loadAuthenticatedProfile] Created new profile:', newProfile.id);
      return newProfile;
    }
    throw error;
  }
  
  console.log('[loadAuthenticatedProfile] Found profile:', data);
  return transformProfileFromDb(data);
}

/**
 * Save profile to database for authenticated user
 * Enables cross-device sync
 */
async function saveAuthenticatedProfile(userId: string, profile: PlayerProfile): Promise<void> {
  const profileData = {
    user_id: userId,
    stats: profile.stats,
    unlocked_species: profile.unlockedSpecies,
    unlocked_daos: profile.unlockedDaos,
    unlocked_titles: profile.unlockedTitles,
    updated_at: new Date().toISOString(),
  };
  
  const { error } = await supabase
    .from('player_profiles')
    .upsert(profileData);
  
  if (error) {
    throw error;
  }
}

/**
 * Load profile from localStorage for guest users
 */
function loadGuestProfile(): PlayerProfile {
  try {
    const stored = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!stored) {
      return createEmptyProfile('guest');
    }
    
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to load guest profile:', error);
    return createEmptyProfile('guest');
  }
}

/**
 * Save profile to localStorage for guest users
 */
function saveGuestProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.warn('Failed to save guest profile:', error);
  }
}

/**
 * Create an empty player profile
 */
function createEmptyProfile(id: string): PlayerProfile {
  // Generate proper UUID for guest profiles (database expects UUID)
  const profileId = id === 'guest' ? crypto.randomUUID() : id;
  
  return {
    id: profileId,
    anonymousId: id === 'guest' ? 'guest' : undefined,
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
}

/**
 * Transform database row to PlayerProfile interface
 */
function transformProfileFromDb(row: any): PlayerProfile {
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
