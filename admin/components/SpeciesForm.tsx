import { useEffect, useState } from 'react';
import type { Species } from '../../shared/types/composition-types';
import { FormInput, FormTextarea, Button } from './ui';
import { speciesAdminService } from '../services/species-admin-service';
import { InfoIcon } from './Tooltip';

interface SpeciesFormProps {
  species: Species | null;
  isCreatingNew: boolean;
  onSave: () => void;
  onDelete: () => void;
  onFieldChange: <K extends keyof Species>(field: K, value: Species[K]) => void;
}

export default function SpeciesForm({
  species,
  isCreatingNew,
  onSave,
  onDelete,
  onFieldChange,
}: SpeciesFormProps) {
  const [cultivatorsUsing, setCultivatorsUsing] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCultivators, setLoadingCultivators] = useState(false);

  // Load cultivators using this species
  useEffect(() => {
    if (species && !isCreatingNew) {
      setLoadingCultivators(true);
      speciesAdminService
        .getCultivatorsUsingSpecies(species.id)
        .then(setCultivatorsUsing)
        .catch((error) => {
          console.error('Error loading cultivators:', error);
          setCultivatorsUsing([]);
        })
        .finally(() => setLoadingCultivators(false));
    } else {
      setCultivatorsUsing([]);
    }
  }, [species?.id, isCreatingNew]);

  if (!species) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500 text-lg">
          Select a species or create a new one to get started
        </p>
      </div>
    );
  }

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!species.name || species.name.trim().length < 1) {
      errors.push('Name is required');
    }

    if (!species.key || species.key.trim().length < 1) {
      errors.push('Key is required');
    }

    if (species.key && !/^[a-z0-9_]+$/.test(species.key)) {
      errors.push('Key must contain only lowercase letters, numbers, and underscores');
    }

    if (!species.emoji || species.emoji.trim().length < 1) {
      errors.push('Emoji is required');
    }

    if (!species.description || species.description.trim().length < 1) {
      errors.push('Description is required');
    }

    if (!species.baseStats || typeof species.baseStats.health !== 'number' || species.baseStats.health <= 0) {
      errors.push('Health must be a positive number');
    }

    if (!species.baseStats || typeof species.baseStats.movementSpeed !== 'number' || species.baseStats.movementSpeed <= 0) {
      errors.push('Movement speed must be a positive number');
    }

    return errors;
  };

  const errors = validateForm();
  const canSave = errors.length === 0;

  return (
    <div className="flex-1 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
          {species.emoji} {species.name || 'New Species'}
        </h2>
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={!canSave} variant="success">
            💾 Save
          </Button>
          {!isCreatingNew && (
            <Button onClick={onDelete} variant="danger">
              🗑️ Delete
            </Button>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
          <h4 className="text-red-400 font-semibold mb-2">Please fix the following errors:</h4>
          <ul className="list-disc list-inside text-red-300 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-cyan-400">Basic Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-semibold text-slate-300">Name</label>
              <InfoIcon tooltip="Display name for this species (e.g., Human, Demon)" />
            </div>
            <FormInput
              type="text"
              value={species.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder="e.g., Human, Demon, Beast"
              required
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-semibold text-slate-300">Key</label>
              <InfoIcon tooltip="Unique identifier (lowercase, no spaces). Cannot be changed after creation." />
            </div>
            <FormInput
              type="text"
              value={species.key}
              onChange={(e) => onFieldChange('key', e.target.value.toLowerCase())}
              placeholder="e.g., human, demon, beast"
              required
              disabled={!isCreatingNew}
            />
          </div>
        </div>

        <FormInput
          label="Emoji"
          type="text"
          value={species.emoji}
          onChange={(e) => onFieldChange('emoji', e.target.value)}
          placeholder="🧑"
          maxLength={4}
          className="text-2xl"
          required
        />

        <FormTextarea
          label="Description"
          value={species.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="A short description of this species"
          rows={2}
          required
        />

        <FormTextarea
          label="Lore (optional)"
          value={species.lore || ''}
          onChange={(e) => onFieldChange('lore', e.target.value || undefined)}
          placeholder="Optional backstory or lore about this species"
          rows={3}
        />
      </div>

      {/* Base Stats */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-cyan-400">Base Stats</h3>
        <p className="text-sm text-slate-400">These stats define the physical characteristics of the species. They will be modified by Dao and Title bonuses.</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-semibold text-slate-300">Health (HP)</label>
              <InfoIcon tooltip="Base health points. Will be multiplied by title bonuses." />
            </div>
            <FormInput
              type="number"
              min={1}
              step={1}
              value={species.baseStats?.health || 100}
              onChange={(e) =>
                onFieldChange('baseStats', {
                  ...species.baseStats,
                  health: parseInt(e.target.value) || 0,
                })
              }
              required
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-semibold text-slate-300">Movement Speed</label>
              <InfoIcon tooltip="Movement speed in pixels per frame. Typical range: 0.5 - 2.0" />
            </div>
            <FormInput
              type="number"
              min={0.1}
              step={0.1}
              value={species.baseStats?.movementSpeed || 1}
              onChange={(e) =>
                onFieldChange('baseStats', {
                ...species.baseStats,
                movementSpeed: parseFloat(e.target.value) || 0,
              })
            }
            required
          />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">
            <strong className="text-cyan-400">Health:</strong> Base HP for cultivators of this species
            <br />
            <strong className="text-cyan-400">Movement Speed:</strong> How fast cultivators move (typical range: 0.5 - 2.0)
          </p>
        </div>
      </div>

      {/* Cultivators Using This Species */}
      {!isCreatingNew && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-cyan-400">Cultivators Using This Species</h3>

          {loadingCultivators ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : cultivatorsUsing.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">
                No cultivators are currently using this species.
              </p>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-amber-400 text-sm font-semibold mb-2">
                ⚠️ This species is used by {cultivatorsUsing.length} cultivator(s):
              </p>
              <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                {cultivatorsUsing.map((cultivator) => (
                  <li key={cultivator.id}>{cultivator.name}</li>
                ))}
              </ul>
              <p className="text-slate-400 text-xs mt-2">
                You cannot delete this species until these cultivators are updated or deleted.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
