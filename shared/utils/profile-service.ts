import { supabase } from '../../game/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { retryDatabaseOperation, type RetryConfig, DEFAULT_RETRY_CONFIG } from './database-error-handler';

// Re-export database error types for convenience
export { DatabaseError, DatabaseErrorType } from './database-error-handler';

/**
 * User Profile Service
 * Manages authenticated user profiles linked to auth.users
 * Handles profile creation from OAuth data, retrieval, and updates
 * Implements retry logic with exponential backoff for database operations
 * 
 * Requirements: 1.3, 1.5, 2.2, 6.1, 6.2, 6.3
 */

/**
 * User profile data structure matching the profiles table
 */
export interface UserProfile {
  id: string; // UUID from auth.users
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  provider: 'google' | 'discord' | 'github' | 'steam';
  provider_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Data required to create a new profile
 */
export interface CreateProfileData {
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  provider: 'google' | 'discord' | 'github' | 'steam';
  provider_id?: string | null;
}



/**
 * Profile Service for managing authenticated user profiles
 * 
 * @param supabaseClient - Optional Supabase client for dependency injection (defaults to production client)
 */
export class ProfileService {
  private supabaseClient: SupabaseClient;
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

  constructor(supabaseClient: SupabaseClient = supabase) {
    this.supabaseClient = supabaseClient;
  }

  /**
   * Get a user profile by user ID
   * Implements retry logic with exponential backoff
   * 
   * @param userId - The UUID of the user (from auth.users)
   * @returns Promise resolving to the user profile or null if not found
   * 
   * Requirements: 2.2, 6.1
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    return retryDatabaseOperation(async () => {
      const { data, error } = await this.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Not found is expected for new users before profile creation
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return this.transformFromDb(data);
    }, 'getProfile', this.retryConfig);
  }

  /**
   * Create a new user profile
   * This is typically called automatically by the database trigger,
   * but can be called manually if needed
   * Implements retry logic with exponential backoff
   * 
   * @param userId - The UUID of the user (from auth.users)
   * @param data - Profile data to create
   * @returns Promise resolving to the created profile
   * 
   * Requirements: 1.3, 1.5, 6.1
   */
  async createProfile(userId: string, data: CreateProfileData): Promise<UserProfile> {
    return retryDatabaseOperation(async () => {
      const profileData = {
        id: userId,
        username: data.username || null,
        display_name: data.display_name || null,
        avatar_url: data.avatar_url || null,
        provider: data.provider,
        provider_id: data.provider_id || null,
      };

      const { data: createdProfile, error } = await this.supabaseClient
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.transformFromDb(createdProfile);
    }, 'createProfile', this.retryConfig);
  }

  /**
   * Update an existing user profile
   * Only the profile owner can update their profile (enforced by RLS)
   * Implements retry logic with exponential backoff
   * 
   * @param userId - The UUID of the user (from auth.users)
   * @param updates - Partial profile data to update
   * @returns Promise resolving to the updated profile
   * 
   * Requirements: 2.2, 6.1
   */
  async updateProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>): Promise<UserProfile> {
    return retryDatabaseOperation(async () => {
      const updateData: any = {};

      if (updates.username !== undefined) updateData.username = updates.username;
      if (updates.display_name !== undefined) updateData.display_name = updates.display_name;
      if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url;
      if (updates.provider !== undefined) updateData.provider = updates.provider;
      if (updates.provider_id !== undefined) updateData.provider_id = updates.provider_id;

      const { data, error } = await this.supabaseClient
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.transformFromDb(data);
    }, 'updateProfile', this.retryConfig);
  }

  /**
   * Create profile from OAuth user metadata
   * Extracts relevant data from OAuth provider response
   * 
   * @param userId - The UUID of the user (from auth.users)
   * @param userMetadata - User metadata from OAuth provider
   * @param provider - The OAuth provider used
   * @returns Promise resolving to the created profile
   * 
   * Requirements: 1.3, 1.5
   */
  async createProfileFromOAuth(
    userId: string,
    userMetadata: Record<string, any>,
    provider: 'google' | 'discord' | 'github' | 'steam'
  ): Promise<UserProfile> {
    const profileData: CreateProfileData = {
      username: userMetadata.username || userMetadata.email || null,
      display_name: userMetadata.full_name || userMetadata.name || null,
      avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
      provider,
      provider_id: userMetadata.provider_id || userMetadata.sub || null,
    };

    return this.createProfile(userId, profileData);
  }

  /**
   * Transform database row to UserProfile interface
   * 
   * @private
   */
  private transformFromDb(row: any): UserProfile {
    return {
      id: row.id,
      username: row.username,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      provider: row.provider,
      provider_id: row.provider_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

// Export a singleton instance using the production Supabase client
export const profileService = new ProfileService();
