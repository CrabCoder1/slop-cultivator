import { useState, useEffect } from 'react';
import type { PersonType } from '../../shared/types/person-types';
import type { Species, Dao, Title } from '../../shared/types/composition-types';
import PersonTypeList from './PersonTypeList';
import PersonTypeEditor from './PersonTypeEditor';
import {
  getAllPersonTypes,
  createPersonType,
  updatePersonType,
  deletePersonType,
} from '../../shared/utils/person-type-admin-service';
import { speciesAdminService } from '../services/species-admin-service';
import { daosAdminService } from '../services/daos-admin-service';
import { titlesAdminService } from '../services/titles-admin-service';

export default function PeopleEditor() {
  const [personTypes, setPersonTypes] = useState<PersonType[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [species, setSpecies] = useState<Species[]>([]);
  const [daos, setDaos] = useState<Dao[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load all data in parallel
      const [typesData, speciesData, daosData, titlesData] = await Promise.all([
        getAllPersonTypes(),
        speciesAdminService.loadSpecies(),
        daosAdminService.loadDaos(),
        titlesAdminService.loadTitles(),
      ]);
      
      setPersonTypes(typesData);
      setSpecies(speciesData);
      setDaos(daosData);
      setTitles(titlesData);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setIsLoading(false);
    }
  };

  const handleSelectPersonType = (index: number) => {
    setSelectedIndex(index);
    setHasChanges(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleFieldChange = () => {
    setHasChanges(true);
  };

  const handleSave = async (personType: PersonType) => {
    try {
      setError(null);
      setSuccessMessage(null);

      const updated = await updatePersonType(personType.id, personType);

      // Update local state
      setPersonTypes(prev => {
        const newTypes = [...prev];
        newTypes[selectedIndex] = updated;
        return newTypes;
      });

      setHasChanges(false);
      setSuccessMessage('Changes saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const handleCreateNew = async () => {
    try {
      setError(null);
      setSuccessMessage(null);

      // Create new person type with default values
      const newPersonType: Omit<PersonType, 'id' | 'createdAt' | 'updatedAt'> = {
        key: 'new_person_type',
        name: 'New Person Type',
        emoji: '❓',
        description: 'A new person type',
        lore: undefined,
        baseStats: {
          health: 100,
          damage: 10,
          attackSpeed: 1000,
          range: 100,
          movementSpeed: 1,
        },
        defenderConfig: {
          deploymentCost: 100,
          compatibleSkills: [],
          compatibleItems: [],
        },
        attackerConfig: undefined,
        version: 1,
      };

      const created = await createPersonType(newPersonType);

      // Add to list and select it
      setPersonTypes(prev => [...prev, created]);
      setSelectedIndex(personTypes.length);
      setHasChanges(false);

      setSuccessMessage('New person type created successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create new person type');
    }
  };

  const handleDelete = async (personType: PersonType) => {
    try {
      setError(null);
      setSuccessMessage(null);

      await deletePersonType(personType.id);

      // Remove from list
      const newTypes = personTypes.filter(pt => pt.id !== personType.id);
      setPersonTypes(newTypes);

      // Adjust selected index if needed
      if (selectedIndex >= newTypes.length) {
        setSelectedIndex(Math.max(0, newTypes.length - 1));
      }

      setHasChanges(false);
      setSuccessMessage('Person type deleted successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete person type');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-cyan-400 text-lg">Loading person types...</p>
      </div>
    );
  }

  // Show error if no person types loaded
  if (personTypes.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-400 text-lg">No person types found</p>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-amber-100 rounded-lg font-semibold"
        >
          ➕ Create First Person Type
        </button>
      </div>
    );
  }

  const currentPersonType = personTypes[selectedIndex] || null;

  return (
    <div className="flex gap-6 p-6" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Master List */}
      <PersonTypeList
        personTypes={personTypes}
        selectedIndex={selectedIndex}
        onSelect={handleSelectPersonType}
        onCreateNew={handleCreateNew}
        onDelete={handleDelete}
        species={species}
        daos={daos}
        titles={titles}
      />

      {/* Detail Panel */}
      <div className="flex-1 overflow-y-auto">
        {/* Error/Success Display */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded bg-red-900/20 border border-red-500 text-red-400">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 px-4 py-3 rounded bg-green-900/20 border border-green-500 text-green-400">
            {successMessage}
          </div>
        )}

        {/* Editor */}
        <PersonTypeEditor
          personType={currentPersonType}
          onSave={handleSave}
          hasChanges={hasChanges}
          onFieldChange={handleFieldChange}
          species={species}
          daos={daos}
          titles={titles}
        />
      </div>
    </div>
  );
}
