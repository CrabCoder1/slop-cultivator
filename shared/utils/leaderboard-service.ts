/**
 * Leaderboard Service
 * Manages leaderboard score submission and retrieval
 * Supports both authenticated users and guest players
 * 
 * Requirements: 6.3, 7.2
 */

import { supabase } from '../../game/utils/supabase/client';

/**
 * Score entry interface for leaderboard
 */
export interface LeaderboardScore {
  id: string;
  userId: string | null;
  anonymousId: string | null;
  playerName: string;
  score: number;
  waveReached: number;
  mapKey: string | null;
  createdAt: string;
  // Joined profile data (for authenticated users)
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

/**
 * Score submission data
 */
export interface ScoreSubmission {
  playerName: string;
  score: number;
  waveReached: number;
  mapKey?: string;
}

/**
 * Get anonymous ID from localStorage
 * Used for guest players
 */
function getAnonymousId(): string {
  const ANONYMOUS_ID_KEY = 'castle-defense-player-id';
  let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY);
  
  if (!anonymousId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    anonymousId = `anon_${timestamp}_${random}`;
    try {
      localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
    } catch (error) {
      console.warn('Failed to save anonymous ID to localStorage:', error);
    }
  }
  
  return anonymousId;
}

/**
 * Submit a score to the leaderboard
 * Automatically detects if user is authenticated and associates score accordingly
 * 
 * @param submission Score submission data
 * @returns The created score entry
 */
export async function submitScore(submission: ScoreSubmission): Promise<LeaderboardScore> {
  try {
    // Get current session to check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    const scoreData: any = {
      player_name: submission.playerName,
      score: submission.score,
      wave_reached: submission.waveReached,
      map_key: submission.mapKey || null,
    };
    
    // Add user_id for authenticated users, anonymous_id for guests
    if (session?.user) {
      scoreData.user_id = session.user.id;
      scoreData.anonymous_id = null;
    } else {
      scoreData.user_id = null;
      scoreData.anonymous_id = getAnonymousId();
    }
    
    const { data, error } = await supabase
      .from('leaderboard_scores')
      .insert(scoreData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return transformScoreFromDb(data);
  } catch (error) {
    console.error('Error submitting score:', error);
    throw error;
  }
}

/**
 * Get top scores from the leaderboard
 * Joins with profiles table to display usernames for authenticated users
 * 
 * @param limit Maximum number of scores to return (default: 100)
 * @param mapKey Optional map key to filter scores by specific map
 * @returns Array of leaderboard scores
 */
export async function getTopScores(limit: number = 100, mapKey?: string): Promise<LeaderboardScore[]> {
  try {
    let query = supabase
      .from('leaderboard_scores')
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .order('score', { ascending: false })
      .order('wave_reached', { ascending: false })
      .limit(limit);
    
    // Filter by map if specified
    if (mapKey) {
      query = query.eq('map_key', mapKey);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return (data || []).map(transformScoreFromDb);
  } catch (error) {
    console.error('Error fetching top scores:', error);
    throw error;
  }
}

/**
 * Get scores for a specific authenticated user
 * 
 * @param userId User ID
 * @param limit Maximum number of scores to return (default: 10)
 * @returns Array of user's scores
 */
export async function getUserScores(userId: string, limit: number = 10): Promise<LeaderboardScore[]> {
  try {
    const { data, error } = await supabase
      .from('leaderboard_scores')
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    return (data || []).map(transformScoreFromDb);
  } catch (error) {
    console.error('Error fetching user scores:', error);
    throw error;
  }
}

/**
 * Get scores for the current guest player (by anonymous ID)
 * 
 * @param limit Maximum number of scores to return (default: 10)
 * @returns Array of guest's scores
 */
export async function getGuestScores(limit: number = 10): Promise<LeaderboardScore[]> {
  try {
    const anonymousId = getAnonymousId();
    
    const { data, error } = await supabase
      .from('leaderboard_scores')
      .select('*')
      .eq('anonymous_id', anonymousId)
      .order('score', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    return (data || []).map(transformScoreFromDb);
  } catch (error) {
    console.error('Error fetching guest scores:', error);
    throw error;
  }
}

/**
 * Get user's personal best score
 * 
 * @param userId User ID (optional, uses current session if not provided)
 * @returns Personal best score or null if no scores found
 */
export async function getPersonalBest(userId?: string): Promise<LeaderboardScore | null> {
  try {
    let targetUserId = userId;
    
    // If no userId provided, get from current session
    if (!targetUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // For guests, use anonymous ID
        const anonymousId = getAnonymousId();
        const { data, error } = await supabase
          .from('leaderboard_scores')
          .select('*')
          .eq('anonymous_id', anonymousId)
          .order('score', { ascending: false })
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }
        
        return data ? transformScoreFromDb(data) : null;
      }
      targetUserId = session.user.id;
    }
    
    const { data, error } = await supabase
      .from('leaderboard_scores')
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('user_id', targetUserId)
      .order('score', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }
    
    return data ? transformScoreFromDb(data) : null;
  } catch (error) {
    console.error('Error fetching personal best:', error);
    return null;
  }
}

/**
 * Transform database row to LeaderboardScore interface
 */
function transformScoreFromDb(row: any): LeaderboardScore {
  const score: LeaderboardScore = {
    id: row.id,
    userId: row.user_id,
    anonymousId: row.anonymous_id,
    playerName: row.player_name,
    score: row.score,
    waveReached: row.wave_reached,
    mapKey: row.map_key,
    createdAt: row.created_at,
  };
  
  // Add profile data if available (for authenticated users)
  if (row.profiles) {
    score.username = row.profiles.username;
    score.displayName = row.profiles.display_name;
    score.avatarUrl = row.profiles.avatar_url;
  }
  
  return score;
}
