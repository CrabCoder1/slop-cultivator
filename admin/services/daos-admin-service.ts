import { supabase } from '../../game/utils/supabase/client';
import type { Dao } from '../../shared/types/composition-types';
import { clearCompositionCache } from '../../shared/utils/composition-data-service';

/**
 * Daos Admin Service
 * Handles CRUD operations for Daos in the admin tool
 */

export const daosAdminService = {
  /**
   * Load all daos from the database
   */
  async loadDaos(): Promise<Dao[]> {
    try {
      const { data, error } = await supabase
        .from('daos')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading daos:', error);
        throw new Error(`Failed to load daos: ${error.message}`);
      }

      // Transform database format to Dao interface
      return (data || []).map(row => ({
        id: row.id,
        key: row.key,
        name: row.name,
        emoji: row.emoji,
        description: row.description,
        lore: row.lore,
        combatStats: row.combat_stats,
        compatibleSkills: row.compatible_skills,
        version: row.version,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('Error in loadDaos:', error);
      throw error;
    }
  },

  /**
   * Get a single dao by key
   */
  async getDaoByKey(key: string): Promise<Dao | null> {
    try {
      const { data, error } = await supabase
        .from('daos')
        .select('*')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('Error getting dao by key:', error);
        throw new Error(`Failed to get dao: ${error.message}`);
      }

      if (!data) return null;

      return {
        id: data.id,
        key: data.key,
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        lore: data.lore,
        combatStats: data.combat_stats,
        compatibleSkills: data.compatible_skills,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in getDaoByKey:', error);
      throw error;
    }
  },

  /**
   * Create a new dao
   */
  async createDao(dao: Omit<Dao, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Dao> {
    try {
      // Validate required fields
      if (!dao.key || !dao.name || !dao.emoji || !dao.description) {
        throw new Error('Missing required fields: key, name, emoji, and description are required');
      }

      if (!dao.combatStats || 
          typeof dao.combatStats.damage !== 'number' || 
          typeof dao.combatStats.attackSpeed !== 'number' ||
          typeof dao.combatStats.range !== 'number' ||
          !dao.combatStats.attackPattern) {
        throw new Error('Invalid combatStats: damage, attackSpeed, range, and attackPattern are required');
      }

      if (!Array.isArray(dao.compatibleSkills)) {
        throw new Error('compatibleSkills must be an array');
      }

      const { data, error } = await supabase
        .from('daos')
        .insert({
          key: dao.key,
          name: dao.name,
          emoji: dao.emoji,
          description: dao.description,
          lore: dao.lore || null,
          combat_stats: dao.combatStats,
          compatible_skills: dao.compatibleSkills,
          version: 1,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating dao:', error);
        if (error.code === '23505') {
          throw new Error(`A dao with key "${dao.key}" already exists`);
        }
        throw new Error(`Failed to create dao: ${error.message}`);
      }

      // Clear cache after successful creation
      clearCompositionCache();

      return {
        id: data.id,
        key: data.key,
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        lore: data.lore,
        combatStats: data.combat_stats,
        compatibleSkills: data.compatible_skills,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in createDao:', error);
      throw error;
    }
  },

  /**
   * Update an existing dao
   */
  async updateDao(id: string, updates: Partial<Omit<Dao, 'id' | 'createdAt'>>): Promise<Dao> {
    try {
      // Build update object with database column names
      const updateData: any = {};
      
      if (updates.key !== undefined) updateData.key = updates.key;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.emoji !== undefined) updateData.emoji = updates.emoji;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.lore !== undefined) updateData.lore = updates.lore;
      if (updates.combatStats !== undefined) updateData.combat_stats = updates.combatStats;
      if (updates.compatibleSkills !== undefined) updateData.compatible_skills = updates.compatibleSkills;
      if (updates.version !== undefined) updateData.version = updates.version;

      // Always update the updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('daos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating dao:', error);
        if (error.code === '23505') {
          throw new Error(`A dao with key "${updates.key}" already exists`);
        }
        throw new Error(`Failed to update dao: ${error.message}`);
      }

      // Clear cache after successful update
      clearCompositionCache();

      return {
        id: data.id,
        key: data.key,
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        lore: data.lore,
        combatStats: data.combat_stats,
        compatibleSkills: data.compatible_skills,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in updateDao:', error);
      throw error;
    }
  },

  /**
   * Delete a dao with usage validation
   */
  async deleteDao(id: string): Promise<void> {
    try {
      // First check if any person_types are using this dao
      const { data: usageData, error: usageError } = await supabase
        .from('person_types')
        .select('id, name')
        .eq('dao_id', id)
        .limit(5);

      if (usageError) {
        console.error('Error checking dao usage:', usageError);
        throw new Error(`Failed to check dao usage: ${usageError.message}`);
      }

      if (usageData && usageData.length > 0) {
        const cultivatorNames = usageData.map(pt => pt.name).join(', ');
        const moreText = usageData.length === 5 ? ' and possibly more' : '';
        throw new Error(
          `Cannot delete dao: it is used by ${usageData.length} cultivator(s): ${cultivatorNames}${moreText}. ` +
          `Please update or delete those cultivators first.`
        );
      }

      // If not in use, proceed with deletion
      const { error } = await supabase
        .from('daos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting dao:', error);
        throw new Error(`Failed to delete dao: ${error.message}`);
      }

      // Clear cache after successful deletion
      clearCompositionCache();
    } catch (error) {
      console.error('Error in deleteDao:', error);
      throw error;
    }
  },

  /**
   * Get cultivators using a specific dao
   */
  async getCultivatorsUsingDao(daoId: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const { data, error } = await supabase
        .from('person_types')
        .select('id, name')
        .eq('dao_id', daoId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error getting cultivators using dao:', error);
        throw new Error(`Failed to get cultivators: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCultivatorsUsingDao:', error);
      throw error;
    }
  },
};
