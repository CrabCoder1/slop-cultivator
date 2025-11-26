import { supabase } from '../../game/utils/supabase/client';
import type { Map, TileType } from '../types/map';

/**
 * Map service for Supabase operations
 */

class MapService {
  /**
   * Fetch all maps (admin use)
   */
  async getAllMaps(): Promise<Map[]> {
    const { data, error } = await supabase
      .from('maps')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      this.handleError(error, 'fetch all maps');
    }

    return (data || []).map(this.transformFromDb);
  }

  /**
   * Fetch available maps (game use)
   */
  async getAvailableMaps(): Promise<Map[]> {
    const { data, error } = await supabase
      .from('maps')
      .select('*')
      .eq('is_available', true)
      .order('name');

    if (error) {
      this.handleError(error, 'fetch available maps');
    }

    return (data || []).map(this.transformFromDb);
  }

  /**
   * Create a new map
   */
  async createMap(map: Omit<Map, 'id' | 'createdAt' | 'updatedAt'>): Promise<Map> {
    // Validate map before creating
    const errors = this.validateMap(map as Map);
    if (errors.length > 0) {
      throw new Error(`Map validation failed: ${errors.join(', ')}`);
    }

    const dbMap = this.transformToDb(map);
    const { data, error } = await supabase
      .from('maps')
      .insert(dbMap)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create map');
    }

    return this.transformFromDb(data);
  }

  /**
   * Update an existing map
   */
  async updateMap(id: string, updates: Partial<Map>): Promise<Map> {
    const dbUpdates = this.transformToDb(updates);
    const { data, error } = await supabase
      .from('maps')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'update map');
    }

    return this.transformFromDb(data);
  }

  /**
   * Delete a map
   */
  async deleteMap(id: string): Promise<void> {
    const { error } = await supabase
      .from('maps')
      .delete()
      .eq('id', id);

    if (error) {
      this.handleError(error, 'delete map');
    }
  }

  /**
   * Toggle map availability
   */
  async toggleAvailability(id: string, isAvailable: boolean): Promise<Map> {
    return this.updateMap(id, { isAvailable });
  }

  /**
   * Fetch all tile types
   */
  async getTileTypes(): Promise<TileType[]> {
    const { data, error } = await supabase
      .from('tile_types')
      .select('*')
      .order('key');

    if (error) {
      this.handleError(error, 'fetch tile types');
    }

    return (data || []).map(this.transformTileTypeFromDb);
  }

  /**
   * Create a new tile type
   */
  async createTileType(tileType: Omit<TileType, 'id' | 'createdAt' | 'updatedAt'>): Promise<TileType> {
    const dbTileType = this.transformTileTypeToDb(tileType);
    const { data, error } = await supabase
      .from('tile_types')
      .insert(dbTileType)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create tile type');
    }

    return this.transformTileTypeFromDb(data);
  }

  /**
   * Update an existing tile type
   */
  async updateTileType(id: string, updates: Partial<TileType>): Promise<TileType> {
    const dbUpdates = this.transformTileTypeToDb(updates);
    const { data, error } = await supabase
      .from('tile_types')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'update tile type');
    }

    return this.transformTileTypeFromDb(data);
  }

  /**
   * Transform database row to Map type
   */
  private transformFromDb(row: any): Map {
    return {
      id: row.id,
      name: row.name,
      width: row.width,
      height: row.height,
      tiles: row.tiles,
      isAvailable: row.is_available,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata,
    };
  }

  /**
   * Transform Map type to database row
   */
  private transformToDb(map: Partial<Map>): any {
    const dbMap: any = {};
    
    if (map.name !== undefined) dbMap.name = map.name;
    if (map.width !== undefined) dbMap.width = map.width;
    if (map.height !== undefined) dbMap.height = map.height;
    if (map.tiles !== undefined) dbMap.tiles = map.tiles;
    if (map.isAvailable !== undefined) dbMap.is_available = map.isAvailable;
    if (map.metadata !== undefined) dbMap.metadata = map.metadata;

    return dbMap;
  }

  /**
   * Transform database row to TileType
   */
  private transformTileTypeFromDb(row: any): TileType {
    return {
      id: row.id,
      key: row.key,
      displayName: row.display_name,
      visual: row.visual,
      pathfinding: row.pathfinding,
      gameplay: row.gameplay,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Transform TileType to database row
   */
  private transformTileTypeToDb(tileType: Partial<TileType>): any {
    const dbTileType: any = {};
    
    if (tileType.key !== undefined) dbTileType.key = tileType.key;
    if (tileType.displayName !== undefined) dbTileType.display_name = tileType.displayName;
    if (tileType.visual !== undefined) dbTileType.visual = tileType.visual;
    if (tileType.pathfinding !== undefined) dbTileType.pathfinding = tileType.pathfinding;
    if (tileType.gameplay !== undefined) dbTileType.gameplay = tileType.gameplay;

    return dbTileType;
  }

  /**
   * Validate map data
   */
  private validateMap(map: Map): string[] {
    const errors: string[] = [];

    if (!map.name || map.name.length < 1 || map.name.length > 100) {
      errors.push('Map name must be 1-100 characters');
    }

    if (map.width < 5 || map.width > 100) {
      errors.push('Width must be 5-100 tiles');
    }

    if (map.height < 5 || map.height > 100) {
      errors.push('Height must be 5-100 tiles');
    }

    if (!map.tiles || map.tiles.length !== map.height) {
      errors.push('Tile grid height mismatch');
    }

    if (map.tiles && map.tiles.some(row => row.length !== map.width)) {
      errors.push('Tile grid width mismatch');
    }

    return errors;
  }

  /**
   * Handle Supabase errors with user-friendly messages
   */
  private handleError(error: any, context: string): void {
    console.error(`Map service error in ${context}:`, error);

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
      return 'A map with this name already exists. Please choose a different name.';
    }
    
    if (code === '23503') {
      return 'Invalid reference. The map contains invalid tile types.';
    }
    
    // Timeout errors
    if (message.includes('timeout') || code === 'ETIMEDOUT') {
      return 'Request timed out. Please try again.';
    }
    
    // Not found errors
    if (code === 'PGRST116' || message.includes('not found')) {
      return `The map you're trying to ${context} was not found.`;
    }
    
    // Generic error with context
    return `Failed to ${context}. Please try again later.`;
  }
}

// Export singleton instance
export const mapService = new MapService();
