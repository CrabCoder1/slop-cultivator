import { supabase } from '../../game/utils/supabase/client';
import type { PersonType, PersonTypeRow, personTypeFromRow } from '../types/person-types';
import { personTypeFromRow as transformFromRow } from '../types/person-types';
import { getDefaultPersonTypes as getDefaults } from './person-type-adapters';
import { getSpeciesById, getDaoById, getTitleById } from './composition-data-service';
import { composeCultivatorStats } from './cultivator-composition-service';
import type { Species, Dao, Title } from '../types/composition-types';

/**
 * Person Type Service for Supabase operations
 * Handles loading and caching of Person Type definitions
 */

class PersonTypeService {
  private cache: Map<string, PersonType> = new Map();
  private cacheByKey: Map<string, PersonType> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Composition system cache
  private composedStatsCache: Map<string, any> = new Map();
  private compositionDataCache: {
    species: Map<string, Species>;
    daos: Map<string, Dao>;
    titles: Map<string, Title>;
  } = {
    species: new Map(),
    daos: new Map(),
    titles: new Map(),
  };

  /**
   * Load all Person Types from Supabase
   * Uses caching to avoid repeated database calls
   */
  async loadPersonTypes(): Promise<PersonType[]> {
    // Check if cache is still valid
    if (this.isCacheValid()) {
      return Array.from(this.cache.values());
    }

    try {
      const { data, error } = await supabase
        .from('person_types')
        .select('*')
        .order('key');

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('No Person Types found in database, using fallback defaults');
        return this.getDefaultPersonTypes();
      }

      // Transform and cache the data
      const personTypes = data.map((row: PersonTypeRow) => transformFromRow(row));
      this.updateCache(personTypes);

      return personTypes;
    } catch (error) {
      console.error('Error loading Person Types from Supabase:', error);
      console.warn('Falling back to default Person Types');
      return this.getDefaultPersonTypes();
    }
  }

  /**
   * Get a single Person Type by key
   * Uses cache if available
   */
  async getPersonTypeByKey(key: string): Promise<PersonType | null> {
    // Check cache first
    if (this.isCacheValid() && this.cacheByKey.has(key)) {
      return this.cacheByKey.get(key)!;
    }

    try {
      const { data, error } = await supabase
        .from('person_types')
        .select('*')
        .eq('key', key)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        console.warn(`Person Type with key "${key}" not found`);
        return null;
      }

      const personType = transformFromRow(data as PersonTypeRow);
      
      // Update cache with this single entry
      this.cache.set(personType.id, personType);
      this.cacheByKey.set(personType.key, personType);

      return personType;
    } catch (error) {
      console.error(`Error loading Person Type "${key}":`, error);
      
      // Try to find in default types as fallback
      const defaults = this.getDefaultPersonTypes();
      return defaults.find(pt => pt.key === key) || null;
    }
  }

  /**
   * Get a single Person Type by ID
   * Uses cache if available
   */
  async getPersonTypeById(id: string): Promise<PersonType | null> {
    // Check cache first
    if (this.isCacheValid() && this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    try {
      const { data, error } = await supabase
        .from('person_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        console.warn(`Person Type with id "${id}" not found`);
        return null;
      }

      const personType = transformFromRow(data as PersonTypeRow);
      
      // Update cache with this single entry
      this.cache.set(personType.id, personType);
      this.cacheByKey.set(personType.key, personType);

      return personType;
    } catch (error) {
      console.error(`Error loading Person Type with id "${id}":`, error);
      return null;
    }
  }

  /**
   * Clear the cache (useful for testing or forcing refresh)
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheByKey.clear();
    this.cacheTimestamp = 0;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    if (this.cache.size === 0) {
      return false;
    }
    
    const now = Date.now();
    return (now - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  /**
   * Update cache with new data
   */
  private updateCache(personTypes: PersonType[]): void {
    this.cache.clear();
    this.cacheByKey.clear();
    
    personTypes.forEach(pt => {
      this.cache.set(pt.id, pt);
      this.cacheByKey.set(pt.key, pt);
    });
    
    this.cacheTimestamp = Date.now();
  }

  /**
   * Get default Person Types as fallback when database is unavailable
   * Uses adapter functions to convert old cultivator and enemy formats
   */
  private getDefaultPersonTypes(): PersonType[] {
    return getDefaults();
  }

  /**
   * Load person types with composition support
   * If a person type has species_id, dao_id, and title_id, compose the stats
   * 
   * @returns Person types with composed stats where applicable
   */
  async loadPersonTypesWithComposition(): Promise<PersonType[]> {
    try {
      // Load base person types
      const personTypes = await this.loadPersonTypes();
      
      // Process each person type to check for composition
      const processedTypes = await Promise.all(
        personTypes.map(async (pt) => {
          // Check if this person type uses composition
          if (pt.speciesId && pt.daoId && pt.titleId) {
            return await this.composePersonTypeStats(pt);
          }
          return pt;
        })
      );
      
      return processedTypes;
    } catch (error) {
      console.error('Error loading person types with composition:', error);
      return this.getDefaultPersonTypes();
    }
  }

  /**
   * Compose stats for a person type using Species + Dao + Title
   * Caches composed stats for performance
   */
  async composePersonTypeStats(personType: PersonType): Promise<PersonType> {
    if (!personType.speciesId || !personType.daoId || !personType.titleId) {
      return personType;
    }

    // Check cache first
    const cacheKey = `${personType.speciesId}_${personType.daoId}_${personType.titleId}`;
    if (this.composedStatsCache.has(cacheKey)) {
      const cachedStats = this.composedStatsCache.get(cacheKey);
      return {
        ...personType,
        baseStats: cachedStats,
      };
    }

    try {
      // Load composition components
      const [species, dao, title] = await Promise.all([
        this.getOrLoadSpecies(personType.speciesId),
        this.getOrLoadDao(personType.daoId),
        this.getOrLoadTitle(personType.titleId),
      ]);

      if (!species || !dao || !title) {
        console.warn(`Missing composition components for person type ${personType.key}`);
        return personType;
      }

      // Compose stats
      const composedStats = composeCultivatorStats(species, dao, title);

      // Cache the composed stats
      const finalStats = {
        health: composedStats.health,
        damage: composedStats.damage,
        attackSpeed: composedStats.attackSpeed,
        range: composedStats.range,
        movementSpeed: composedStats.movementSpeed,
      };
      
      this.composedStatsCache.set(cacheKey, finalStats);

      return {
        ...personType,
        baseStats: finalStats,
        // Update name and emoji from composition if not set
        name: personType.name || composedStats.displayName,
        emoji: personType.emoji || composedStats.emoji,
      };
    } catch (error) {
      console.error(`Error composing stats for person type ${personType.key}:`, error);
      return personType;
    }
  }

  /**
   * Get or load a species from cache
   */
  private async getOrLoadSpecies(id: string): Promise<Species | null> {
    if (this.compositionDataCache.species.has(id)) {
      return this.compositionDataCache.species.get(id)!;
    }

    const species = await getSpeciesById(id);
    if (species) {
      this.compositionDataCache.species.set(id, species);
    }
    return species;
  }

  /**
   * Get or load a dao from cache
   */
  private async getOrLoadDao(id: string): Promise<Dao | null> {
    if (this.compositionDataCache.daos.has(id)) {
      return this.compositionDataCache.daos.get(id)!;
    }

    const dao = await getDaoById(id);
    if (dao) {
      this.compositionDataCache.daos.set(id, dao);
    }
    return dao;
  }

  /**
   * Get or load a title from cache
   */
  private async getOrLoadTitle(id: string): Promise<Title | null> {
    if (this.compositionDataCache.titles.has(id)) {
      return this.compositionDataCache.titles.get(id)!;
    }

    const title = await getTitleById(id);
    if (title) {
      this.compositionDataCache.titles.set(id, title);
    }
    return title;
  }

  /**
   * Clear all caches including composition caches
   */
  clearAllCaches(): void {
    this.clearCache();
    this.composedStatsCache.clear();
    this.compositionDataCache.species.clear();
    this.compositionDataCache.daos.clear();
    this.compositionDataCache.titles.clear();
  }
}

// Export singleton instance
export const personTypeService = new PersonTypeService();
