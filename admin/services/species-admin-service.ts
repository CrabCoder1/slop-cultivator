// App: Admin

import { supabase } from '../../game/utils/supabase/client';
import type { Species } from '../../shared/types/composition-types';
import { clearCompositionCache } from '../../shared/utils/composition-data-service';

/**
 * Species Admin Service
 * Handles CRUD operations for Species in the admin tool
 */

export const speciesAdminService = {
  /**
   * Load all species from the database
   */
  async loadSpecies(): Promise<Species[]> {
    try {
      const { data, error } = await supabase
        .from('species')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading species:', error);
        throw new Error(`Failed to load species: ${error.message}`);
      }

      // Transform database format to Species interface
      return (data || []).map(row => ({
        id: row.id,
        key: row.key,
        name: row.name,
        emoji: row.emoji,
        description: row.description,
        lore: row.lore,
        baseStats: row.base_stats,
        version: row.version,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('Error in loadSpecies:', error);
      throw error;
    }
  },

  /**
   * Get a single species by key
   */
  async getSpeciesByKey(key: string): Promise<Species | null> {
    try {
      const { data, error } = await supabase
        .from('species')
        .select('*')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('Error getting species by key:', error);
        throw new Error(`Failed to get species: ${error.message}`);
      }

      if (!data) return null;

      return {
        id: data.id,
        key: data.key,
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        lore: data.lore,
        baseStats: data.base_stats,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in getSpeciesByKey:', error);
      throw error;
    }
  },

  /**
   * Create a new species
   */
  async createSpecies(species: Omit<Species, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Species> {
    try {
      // Validate required fields
      if (!species.key || !species.name || !species.emoji || !species.description) {
        throw new Error('Missing required fields: key, name, emoji, and description are required');
      }

      if (!species.baseStats || typeof species.baseStats.health !== 'number' || typeof species.baseStats.movementSpeed !== 'number') {
        throw new Error('Invalid baseStats: health and movementSpeed are required');
      }

      const { data, error } = await supabase
        .from('species')
        .insert({
          key: species.key,
          name: species.name,
          emoji: species.emoji,
          description: species.description,
          lore: species.lore || null,
          base_stats: species.baseStats,
          version: 1,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating species:', error);
        if (error.code === '23505') {
          throw new Error(`A species with key "${species.key}" already exists`);
        }
        throw new Error(`Failed to create species: ${error.message}`);
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
        baseStats: data.base_stats,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in createSpecies:', error);
      throw error;
    }
  },

  /**
   * Update an existing species
   */
  async updateSpecies(id: string, updates: Partial<Omit<Species, 'id' | 'createdAt'>>): Promise<Species> {
    try {
      // Build update object with database column names
      const updateData: any = {};
      
      if (updates.key !== undefined) updateData.key = updates.key;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.emoji !== undefined) updateData.emoji = updates.emoji;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.lore !== undefined) updateData.lore = updates.lore;
      if (updates.baseStats !== undefined) updateData.base_stats = updates.baseStats;
      if (updates.version !== undefined) updateData.version = updates.version;

      // Always update the updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('species')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating species:', error);
        if (error.code === '23505') {
          throw new Error(`A species with key "${updates.key}" already exists`);
        }
        throw new Error(`Failed to update species: ${error.message}`);
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
        baseStats: data.base_stats,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in updateSpecies:', error);
      throw error;
    }
  },

  /**
   * Delete a species with usage validation
   */
  async deleteSpecies(id: string): Promise<void> {
    try {
      // First check if any person_types are using this species
      const { data: usageData, error: usageError } = await supabase
        .from('person_types')
        .select('id, name')
        .eq('species_id', id)
        .limit(5);

      if (usageError) {
        console.error('Error checking species usage:', usageError);
        throw new Error(`Failed to check species usage: ${usageError.message}`);
      }

      if (usageData && usageData.length > 0) {
        const cultivatorNames = usageData.map(pt => pt.name).join(', ');
        const moreText = usageData.length === 5 ? ' and possibly more' : '';
        throw new Error(
          `Cannot delete species: it is used by ${usageData.length} cultivator(s): ${cultivatorNames}${moreText}. ` +
          `Please update or delete those cultivators first.`
        );
      }

      // If not in use, proceed with deletion
      const { error } = await supabase
        .from('species')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting species:', error);
        throw new Error(`Failed to delete species: ${error.message}`);
      }

      // Clear cache after successful deletion
      clearCompositionCache();
    } catch (error) {
      console.error('Error in deleteSpecies:', error);
      throw error;
    }
  },

  /**
   * Get cultivators using a specific species
   */
  async getCultivatorsUsingSpecies(speciesId: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const { data, error } = await supabase
        .from('person_types')
        .select('id, name')
        .eq('species_id', speciesId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error getting cultivators using species:', error);
        throw new Error(`Failed to get cultivators: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCultivatorsUsingSpecies:', error);
      throw error;
    }
  },
};
