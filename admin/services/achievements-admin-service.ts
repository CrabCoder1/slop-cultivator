import { supabaseAdmin as supabase } from '../utils/supabase-admin-client';
import type { Achievement } from '../../shared/types/composition-types';
import { clearCompositionCache } from '../../shared/utils/composition-data-service';

/**
 * Achievements Admin Service
 * Handles CRUD operations for Achievements in the admin tool
 */

export const achievementsAdminService = {
  /**
   * Load all achievements from the database
   */
  async loadAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading achievements:', error);
        throw new Error(`Failed to load achievements: ${error.message}`);
      }

      // Transform database format to Achievement interface
      return (data || []).map(row => ({
        id: row.id,
        key: row.key,
        name: row.name,
        emoji: row.emoji,
        description: row.description,
        conditions: row.conditions,
        rewards: row.rewards,
        sortOrder: row.sort_order,
        version: row.version,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('Error in loadAchievements:', error);
      throw error;
    }
  },

  /**
   * Get a single achievement by key
   */
  async getAchievementByKey(key: string): Promise<Achievement | null> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('Error getting achievement by key:', error);
        throw new Error(`Failed to get achievement: ${error.message}`);
      }

      if (!data) return null;

      return {
        id: data.id,
        key: data.key,
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        conditions: data.conditions,
        rewards: data.rewards,
        sortOrder: data.sort_order,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in getAchievementByKey:', error);
      throw error;
    }
  },

  /**
   * Create a new achievement
   */
  async createAchievement(achievement: Omit<Achievement, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Achievement> {
    try {
      // Validate required fields
      if (!achievement.key || !achievement.name || !achievement.emoji || !achievement.description) {
        throw new Error('Missing required fields: key, name, emoji, and description are required');
      }

      if (!Array.isArray(achievement.conditions) || achievement.conditions.length === 0) {
        throw new Error('Invalid conditions: must be a non-empty array');
      }

      if (!Array.isArray(achievement.rewards) || achievement.rewards.length === 0) {
        throw new Error('Invalid rewards: must be a non-empty array');
      }

      if (typeof achievement.sortOrder !== 'number') {
        throw new Error('Invalid sortOrder: must be a number');
      }

      // Validate each condition
      achievement.conditions.forEach((condition, index) => {
        if (!condition.type || typeof condition.targetValue !== 'number' || !condition.comparisonOperator) {
          throw new Error(`Invalid condition at index ${index}: type, targetValue, and comparisonOperator are required`);
        }
        if (typeof condition.isTrackable !== 'boolean') {
          throw new Error(`Invalid condition at index ${index}: isTrackable must be a boolean`);
        }
      });

      // Validate each reward
      achievement.rewards.forEach((reward, index) => {
        if (!reward.type || reward.value === undefined || !reward.displayName) {
          throw new Error(`Invalid reward at index ${index}: type, value, and displayName are required`);
        }
      });

      const { data, error } = await supabase
        .from('achievements')
        .insert({
          key: achievement.key,
          name: achievement.name,
          emoji: achievement.emoji,
          description: achievement.description,
          conditions: achievement.conditions,
          rewards: achievement.rewards,
          sort_order: achievement.sortOrder,
          version: 1,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating achievement:', error);
        if (error.code === '23505') {
          throw new Error(`An achievement with key "${achievement.key}" already exists`);
        }
        throw new Error(`Failed to create achievement: ${error.message}`);
      }

      // Clear cache after successful creation
      clearCompositionCache();

      return {
        id: data.id,
        key: data.key,
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        conditions: data.conditions,
        rewards: data.rewards,
        sortOrder: data.sort_order,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in createAchievement:', error);
      throw error;
    }
  },

  /**
   * Update an existing achievement
   */
  async updateAchievement(id: string, updates: Partial<Omit<Achievement, 'id' | 'createdAt'>>): Promise<Achievement> {
    try {
      // Build update object with database column names
      const updateData: any = {};
      
      if (updates.key !== undefined) updateData.key = updates.key;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.emoji !== undefined) updateData.emoji = updates.emoji;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
      if (updates.rewards !== undefined) updateData.rewards = updates.rewards;
      if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
      if (updates.version !== undefined) updateData.version = updates.version;

      // Always update the updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('achievements')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating achievement:', error);
        if (error.code === '23505') {
          throw new Error(`An achievement with key "${updates.key}" already exists`);
        }
        throw new Error(`Failed to update achievement: ${error.message}`);
      }

      // Clear cache after successful update
      clearCompositionCache();

      return {
        id: data.id,
        key: data.key,
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        conditions: data.conditions,
        rewards: data.rewards,
        sortOrder: data.sort_order,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in updateAchievement:', error);
      throw error;
    }
  },

  /**
   * Delete an achievement
   */
  async deleteAchievement(id: string): Promise<void> {
    try {
      // Note: Achievements don't have usage validation like Species/Daos/Titles
      // because they're not referenced by other entities in the same way.
      // Player achievements will be handled by cascade delete in the database.

      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting achievement:', error);
        throw new Error(`Failed to delete achievement: ${error.message}`);
      }

      // Clear cache after successful deletion
      clearCompositionCache();
    } catch (error) {
      console.error('Error in deleteAchievement:', error);
      throw error;
    }
  },
};
