import { supabaseAdmin as supabase } from '../utils/supabase-admin-client';
import type { Title } from '../../shared/types/composition-types';
import { clearCompositionCache } from '../../shared/utils/composition-data-service';

/**
 * Titles Admin Service
 * Handles CRUD operations for Titles in the admin tool
 */

export const titlesAdminService = {
  /**
   * Load all titles from the database
   */
  async loadTitles(): Promise<Title[]> {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .order('prestige_level', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading titles:', error);
        throw new Error(`Failed to load titles: ${error.message}`);
      }

      // Transform database format to Title interface
      return (data || []).map(row => ({
        id: row.id,
        key: row.key,
        name: row.name,
        emoji: row.emoji,
        description: row.description,
        statBonuses: row.stat_bonuses,
        prestigeLevel: row.prestige_level,
        version: row.version,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('Error in loadTitles:', error);
      throw error;
    }
  },

  /**
   * Get a single title by key
   */
  async getTitleByKey(key: string): Promise<Title | null> {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('Error getting title by key:', error);
        throw new Error(`Failed to get title: ${error.message}`);
      }

      if (!data) return null;

      return {
        id: data.id,
        key: data.key,
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        statBonuses: data.stat_bonuses,
        prestigeLevel: data.prestige_level,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in getTitleByKey:', error);
      throw error;
    }
  },

  /**
   * Create a new title
   */
  async createTitle(title: Omit<Title, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Title> {
    try {
      // Validate required fields
      if (!title.key || !title.name || !title.emoji || !title.description) {
        throw new Error('Missing required fields: key, name, emoji, and description are required');
      }

      if (typeof title.prestigeLevel !== 'number' || title.prestigeLevel < 1 || title.prestigeLevel > 10) {
        throw new Error('Invalid prestigeLevel: must be a number between 1 and 10');
      }

      if (!title.statBonuses || typeof title.statBonuses !== 'object') {
        throw new Error('Invalid statBonuses: must be an object');
      }

      const { data, error } = await supabase
        .from('titles')
        .insert({
          key: title.key,
          name: title.name,
          emoji: title.emoji,
          description: title.description,
          stat_bonuses: title.statBonuses,
          prestige_level: title.prestigeLevel,
          version: 1,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating title:', error);
        if (error.code === '23505') {
          throw new Error(`A title with key "${title.key}" already exists`);
        }
        throw new Error(`Failed to create title: ${error.message}`);
      }

      // Clear cache after successful creation
      clearCompositionCache();

      return {
        id: data.id,
        key: data.key,
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        statBonuses: data.stat_bonuses,
        prestigeLevel: data.prestige_level,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in createTitle:', error);
      throw error;
    }
  },

  /**
   * Update an existing title
   */
  async updateTitle(id: string, updates: Partial<Omit<Title, 'id' | 'createdAt'>>): Promise<Title> {
    try {
      // Build update object with database column names
      const updateData: any = {};
      
      if (updates.key !== undefined) updateData.key = updates.key;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.emoji !== undefined) updateData.emoji = updates.emoji;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.statBonuses !== undefined) updateData.stat_bonuses = updates.statBonuses;
      if (updates.prestigeLevel !== undefined) updateData.prestige_level = updates.prestigeLevel;
      if (updates.version !== undefined) updateData.version = updates.version;

      // Always update the updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('titles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating title:', error);
        if (error.code === '23505') {
          throw new Error(`A title with key "${updates.key}" already exists`);
        }
        throw new Error(`Failed to update title: ${error.message}`);
      }

      // Clear cache after successful update
      clearCompositionCache();

      return {
        id: data.id,
        key: data.key,
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        statBonuses: data.stat_bonuses,
        prestigeLevel: data.prestige_level,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in updateTitle:', error);
      throw error;
    }
  },

  /**
   * Delete a title with usage validation
   */
  async deleteTitle(id: string): Promise<void> {
    try {
      // First check if any person_types are using this title
      const { data: usageData, error: usageError } = await supabase
        .from('person_types')
        .select('id, name')
        .eq('title_id', id)
        .limit(5);

      if (usageError) {
        console.error('Error checking title usage:', usageError);
        throw new Error(`Failed to check title usage: ${usageError.message}`);
      }

      if (usageData && usageData.length > 0) {
        const cultivatorNames = usageData.map(pt => pt.name).join(', ');
        const moreText = usageData.length === 5 ? ' and possibly more' : '';
        throw new Error(
          `Cannot delete title: it is used by ${usageData.length} cultivator(s): ${cultivatorNames}${moreText}. ` +
          `Please update or delete those cultivators first.`
        );
      }

      // If not in use, proceed with deletion
      const { error } = await supabase
        .from('titles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting title:', error);
        throw new Error(`Failed to delete title: ${error.message}`);
      }

      // Clear cache after successful deletion
      clearCompositionCache();
    } catch (error) {
      console.error('Error in deleteTitle:', error);
      throw error;
    }
  },

  /**
   * Get cultivators using a specific title
   */
  async getCultivatorsUsingTitle(titleId: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const { data, error } = await supabase
        .from('person_types')
        .select('id, name')
        .eq('title_id', titleId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error getting cultivators using title:', error);
        throw new Error(`Failed to get cultivators: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCultivatorsUsingTitle:', error);
      throw error;
    }
  },
};
