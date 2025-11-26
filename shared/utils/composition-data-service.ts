// Composition Data Service
// Shared service for loading Species, Daos, Titles, and Achievements
// Used by both the game and admin tool
// Includes caching for performance optimization

import { supabase } from '../../game/utils/supabase/client';
import type { Species, Dao, Title, Achievement } from '../types/composition-types';

// Cache configuration
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Cache storage
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = {
  species: null as CacheEntry<Species[]> | null,
  daos: null as CacheEntry<Dao[]> | null,
  titles: null as CacheEntry<Title[]> | null,
  achievements: null as CacheEntry<Achievement[]> | null,
};

/**
 * Check if cache entry is still valid
 */
function isCacheValid<T>(entry: CacheEntry<T> | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATION_MS;
}

/**
 * Clear all caches (useful for admin tool after updates)
 */
export function clearCompositionCache(): void {
  cache.species = null;
  cache.daos = null;
  cache.titles = null;
  cache.achievements = null;
}

/**
 * Load all species from the database
 * Falls back to empty array if database is unavailable
 * Uses caching for performance
 */
export async function loadSpecies(useCache: boolean = true): Promise<Species[]> {
  // Check cache first
  if (useCache && isCacheValid(cache.species)) {
    return cache.species!.data;
  }

  try {
    const { data, error } = await supabase
      .from('species')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading species:', error);
      // Return cached data if available, even if expired
      if (cache.species) {
        console.warn('Using expired cache for species due to error');
        return cache.species.data;
      }
      return [];
    }

    // Transform database format to Species interface
    const species = (data || []).map(row => ({
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

    // Update cache
    cache.species = {
      data: species,
      timestamp: Date.now(),
    };

    return species;
  } catch (error) {
    console.error('Error in loadSpecies:', error);
    // Return cached data if available, even if expired
    if (cache.species) {
      console.warn('Using expired cache for species due to error');
      return cache.species.data;
    }
    return [];
  }
}

/**
 * Load all daos from the database
 * Falls back to empty array if database is unavailable
 * Uses caching for performance
 */
export async function loadDaos(useCache: boolean = true): Promise<Dao[]> {
  // Check cache first
  if (useCache && isCacheValid(cache.daos)) {
    return cache.daos!.data;
  }

  try {
    const { data, error } = await supabase
      .from('daos')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading daos:', error);
      // Return cached data if available, even if expired
      if (cache.daos) {
        console.warn('Using expired cache for daos due to error');
        return cache.daos.data;
      }
      return [];
    }

    // Transform database format to Dao interface
    const daos = (data || []).map(row => ({
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

    // Update cache
    cache.daos = {
      data: daos,
      timestamp: Date.now(),
    };

    return daos;
  } catch (error) {
    console.error('Error in loadDaos:', error);
    // Return cached data if available, even if expired
    if (cache.daos) {
      console.warn('Using expired cache for daos due to error');
      return cache.daos.data;
    }
    return [];
  }
}

/**
 * Load all titles from the database
 * Falls back to empty array if database is unavailable
 * Uses caching for performance
 */
export async function loadTitles(useCache: boolean = true): Promise<Title[]> {
  // Check cache first
  if (useCache && isCacheValid(cache.titles)) {
    return cache.titles!.data;
  }

  try {
    const { data, error } = await supabase
      .from('titles')
      .select('*')
      .order('prestige_level', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading titles:', error);
      // Return cached data if available, even if expired
      if (cache.titles) {
        console.warn('Using expired cache for titles due to error');
        return cache.titles.data;
      }
      return [];
    }

    // Transform database format to Title interface
    const titles = (data || []).map(row => ({
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

    // Update cache
    cache.titles = {
      data: titles,
      timestamp: Date.now(),
    };

    return titles;
  } catch (error) {
    console.error('Error in loadTitles:', error);
    // Return cached data if available, even if expired
    if (cache.titles) {
      console.warn('Using expired cache for titles due to error');
      return cache.titles.data;
    }
    return [];
  }
}

/**
 * Load all achievements from the database
 * Falls back to empty array if database is unavailable
 * Uses caching for performance
 */
export async function loadAchievements(useCache: boolean = true): Promise<Achievement[]> {
  // Check cache first
  if (useCache && isCacheValid(cache.achievements)) {
    return cache.achievements!.data;
  }

  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading achievements:', error);
      // Return cached data if available, even if expired
      if (cache.achievements) {
        console.warn('Using expired cache for achievements due to error');
        return cache.achievements.data;
      }
      return [];
    }

    // Transform database format to Achievement interface
    const achievements = (data || []).map(row => ({
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

    // Update cache
    cache.achievements = {
      data: achievements,
      timestamp: Date.now(),
    };

    return achievements;
  } catch (error) {
    console.error('Error in loadAchievements:', error);
    // Return cached data if available, even if expired
    if (cache.achievements) {
      console.warn('Using expired cache for achievements due to error');
      return cache.achievements.data;
    }
    return [];
  }
}

/**
 * Get a species by ID
 */
export async function getSpeciesById(id: string): Promise<Species | null> {
  try {
    const { data, error } = await supabase
      .from('species')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

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
    console.error('Error getting species by ID:', error);
    return null;
  }
}

/**
 * Get a dao by ID
 */
export async function getDaoById(id: string): Promise<Dao | null> {
  try {
    const { data, error } = await supabase
      .from('daos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

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
    console.error('Error getting dao by ID:', error);
    return null;
  }
}

/**
 * Get a title by ID
 */
export async function getTitleById(id: string): Promise<Title | null> {
  try {
    const { data, error } = await supabase
      .from('titles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

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
    console.error('Error getting title by ID:', error);
    return null;
  }
}
