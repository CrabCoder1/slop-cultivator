import { supabase } from '../../game/utils/supabase/client';
import type { Species } from '../types/composition-types';

/**
 * Species admin service for Supabase operations
 */

class SpeciesAdminService {
  /**
   * Fetch all species
   */
  async loadSpecies(): Promise<Species[]> {
    const { data, error } = await supabase
      .from('species')
      .select('*')
      .order('name');

    if (error) {
      this.handleError(error, 'fetch all species');
    }

    return (data || []).map(this.transformFromDb);
  }

  /**
   * Get a single species by key
   */
  async getSpeciesByKey(key: string): Promise<Species | null> {
    const { data, error } = await supabase
      .from('species')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      this.handleError(error, 'fetch species by key');
    }

    return data ? this.transformFromDb(data) : null;
  }

  /**
   * Create a new species
   */
  async createSpecies(species: Omit<Species, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Species> {
    // Validate species before creating
    const errors = this.validateSpecies(species as Species);
    if (errors.length > 0) {
      throw new Error(`Species validation failed: ${errors.join(', ')}`);
    }

    const dbSpecies = this.transformToDb(species);
    const { data, error } = await supabase
      .from('species')
      .insert(dbSpecies)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create species');
    }

    return this.transformFromDb(data);
  }

  /**
   * Update an existing species
   */
  async updateSpecies(id: string, updates: Partial<Species>): Promise<Species> {
    const dbUpdates = this.transformToDb(updates);
    const { data, error } = await supabase
      .from('species')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'update species');
    }

    return this.transformFromDb(data);
  }

  /**
   * Delete a species with usage validation
   */
  async deleteSpecies(id: string): Promise<void> {
    // Check if species is in use by any person_types
    const { data: personTypes, error: checkError } = await supabase
      .from('person_types')
      .select('id, name')
      .eq('species_id', id)
      .limit(5);

    if (checkError) {
      this.handleError(checkError, 'check species usage');
    }

    if (personTypes && personTypes.length > 0) {
      const names = personTypes.map(pt => pt.name).join(', ');
      const more = personTypes.length === 5 ? ' and possibly more' : '';
      throw new Error(
        `Cannot delete species: it is used by ${personTypes.length} cultivator(s): ${names}${more}`
      );
    }

    // Delete the species
    const { error } = await supabase
      .from('species')
      .delete()
      .eq('id', id);

    if (error) {
      this.handleError(error, 'delete species');
    }
  }

  /**
   * Get cultivators using a specific species
   */
  async getCultivatorsUsingSpecies(speciesId: string): Promise<Array<{ id: string; name: string }>> {
    const { data, error } = await supabase
      .from('person_types')
      .select('id, name')
      .eq('species_id', speciesId)
      .order('name');

    if (error) {
      this.handleError(error, 'fetch cultivators using species');
    }

    return data || [];
  }

  /**
   * Transform database row to Species type
   */
  private transformFromDb(row: any): Species {
    return {
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
    };
  }

  /**
   * Transform Species type to database row
   */
  private transformToDb(species: Partial<Species>): any {
    const dbSpecies: any = {};
    
    if (species.key !== undefined) dbSpecies.key = species.key;
    if (species.name !== undefined) dbSpecies.name = species.name;
    if (species.emoji !== undefined) dbSpecies.emoji = species.emoji;
    if (species.description !== undefined) dbSpecies.description = species.description;
    if (species.lore !== undefined) dbSpecies.lore = species.lore;
    if (species.baseStats !== undefined) dbSpecies.base_stats = species.baseStats;

    return dbSpecies;
  }

  /**
   * Validate species data
   */
  private validateSpecies(species: Species): string[] {
    const errors: string[] = [];

    if (!species.key || species.key.length < 1 || species.key.length > 50) {
      errors.push('Species key must be 1-50 characters');
    }

    if (!species.name || species.name.length < 1 || species.name.length > 100) {
      errors.push('Species name must be 1-100 characters');
    }

    if (!species.emoji || species.emoji.length < 1) {
      errors.push('Species emoji is required');
    }

    if (!species.description || species.description.length < 1) {
      errors.push('Species description is required');
    }

    if (!species.baseStats) {
      errors.push('Base stats are required');
    } else {
      if (typeof species.baseStats.health !== 'number' || species.baseStats.health <= 0) {
        errors.push('Base health must be a positive number');
      }
      if (typeof species.baseStats.movementSpeed !== 'number' || species.baseStats.movementSpeed <= 0) {
        errors.push('Movement speed must be a positive number');
      }
    }

    return errors;
  }

  /**
   * Handle Supabase errors with user-friendly messages
   */
  private handleError(error: any, context: string): void {
    console.error(`Species service error in ${context}:`, error);

    const errorMessage = this.getErrorMessage(error, context);
    console.error(errorMessage);
    
    // Throw error with user-friendly message so calling code can handle it
    throw new Error(errorMessage);
  }

  /**
   * Get user-friendly error message based on error type
   */
  private getErrorMessage(error: any, context: string): string {
    const message = error?.message || '';
    const code = error?.code || '';
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('Failed to fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    // Permission/Authentication errors
    if (message.includes('permission') || message.includes('auth') || code === 'PGRST301' || code === '42501') {
      return 'Permission denied. You may not have access to perform this action.';
    }
    
    // Database constraint errors
    if (code === '23505') {
      return 'A species with this key already exists. Please choose a different key.';
    }
    
    if (code === '23503') {
      return 'Invalid reference. The species contains invalid data.';
    }
    
    // Timeout errors
    if (message.includes('timeout') || code === 'ETIMEDOUT') {
      return 'Request timed out. Please try again.';
    }
    
    // Not found errors
    if (code === 'PGRST116' || message.includes('not found')) {
      return `The species you're trying to ${context} was not found.`;
    }
    
    // Generic error with context
    return `Failed to ${context}. Please try again later.`;
  }
}

// Export singleton instance
export const speciesAdminService = new SpeciesAdminService();
