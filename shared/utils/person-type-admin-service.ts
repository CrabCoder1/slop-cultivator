import { supabase } from '../../game/utils/supabase/client';
import type { PersonType, PersonTypeRow } from '../types/person-types';
import { personTypeFromRow, personTypeToRow } from '../types/person-types';

/**
 * Person Type Admin Service
 * Handles CRUD operations for Person Types in the Admin Tool
 */

/**
 * Create a new Person Type
 */
export async function createPersonType(
  personType: Omit<PersonType, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PersonType> {
  try {
    // Convert to database row format
    const row = personTypeToRow(personType);

    // Insert into database
    const { data, error } = await supabase
      .from('person_types')
      .insert(row)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create person type: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from create operation');
    }

    // Convert back to PersonType format
    return personTypeFromRow(data as PersonTypeRow);
  } catch (error) {
    console.error('Error creating person type:', error);
    throw error;
  }
}

/**
 * Update an existing Person Type
 */
export async function updatePersonType(
  id: string,
  personType: PersonType
): Promise<PersonType> {
  try {
    // Convert to database row format (excluding id, created_at, updated_at)
    const row = personTypeToRow(personType);

    // Update in database
    const { data, error } = await supabase
      .from('person_types')
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update person type: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from update operation');
    }

    // Convert back to PersonType format
    return personTypeFromRow(data as PersonTypeRow);
  } catch (error) {
    console.error('Error updating person type:', error);
    throw error;
  }
}

/**
 * Delete a Person Type
 */
export async function deletePersonType(id: string): Promise<void> {
  try {
    // Check if person type is referenced in wave configurations
    const { data: waveConfigs, error: checkError } = await supabase
      .from('wave_configurations')
      .select('id, wave_number, spawns');

    if (checkError) {
      throw new Error(`Failed to check wave configurations: ${checkError.message}`);
    }

    // Check if any wave config references this person type
    const referencingWaves = waveConfigs?.filter(config => 
      config.spawns.some((spawn: any) => spawn.personTypeId === id)
    );

    if (referencingWaves && referencingWaves.length > 0) {
      const waveNumbers = referencingWaves.map(w => w.wave_number).join(', ');
      throw new Error(
        `Cannot delete person type: it is referenced in wave configurations (waves: ${waveNumbers}). ` +
        `Please remove it from those waves first.`
      );
    }

    // Delete from database
    const { error } = await supabase
      .from('person_types')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete person type: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting person type:', error);
    throw error;
  }
}

/**
 * Get all Person Types (for admin use)
 */
export async function getAllPersonTypes(): Promise<PersonType[]> {
  try {
    const { data, error } = await supabase
      .from('person_types')
      .select('*')
      .order('key');

    if (error) {
      throw new Error(`Failed to load person types: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map((row: PersonTypeRow) => personTypeFromRow(row));
  } catch (error) {
    console.error('Error loading person types:', error);
    throw error;
  }
}
