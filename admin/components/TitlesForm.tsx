import { useEffect, useState } from 'react';
import type { Title } from '../../shared/types/composition-types';
import { FormInput, FormTextarea, Button } from './ui';
import { titlesAdminService } from '../services/titles-admin-service';

interface TitlesFormProps {
  title: Title | null;
  isCreatingNew: boolean;
  onSave: () => void;
  onDelete: () => void;
  onFieldChange: <K extends keyof Title>(field: K, value: Title[K]) => void;
}

export default function TitlesForm({
  title,
  isCreatingNew,
  onSave,
  onDelete,
  onFieldChange,
}: TitlesFormProps) {
  const [cultivatorsUsing, setCultivatorsUsing] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCultivators, setLoadingCultivators] = useState(false);

  // Load cultivators using this title
  useEffect(() => {
    if (title && !isCreatingNew) {
      setLoadingCultivators(true);
      titlesAdminService
        .getCultivatorsUsingTitle(title.id)
        .then(setCultivatorsUsing)
        .catch((error) => {
          console.error('Error loading cultivators:', error);
          setCultivatorsUsing([]);
        })
        .finally(() => setLoadingCultivators(false));
    } else {
      setCultivatorsUsing([]);
    }
  }, [title?.id, isCreatingNew]);

  if (!title) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500 text-lg">
          Select a title or create a new one to get started
        </p>
      </div>
    );
  }

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!title.name || title.name.trim().length < 1) {
      errors.push('Name is required');
    }

    if (!title.key || title.key.trim().length < 1) {
      errors.push('Key is required');
    }

    if (title.key && !/^[a-z0-9_]+$/.test(title.key)) {
      errors.push('Key must contain only lowercase letters, numbers, and underscores');
    }

    if (!title.emoji || title.emoji.trim().length < 1) {
      errors.push('Emoji is required');
    }

    if (!title.description || title.description.trim().length < 1) {
      errors.push('Description is required');
    }

    if (typeof title.prestigeLevel !== 'number' || title.prestigeLevel < 1 || title.prestigeLevel > 10) {
      errors.push('Prestige level must be between 1 and 10');
    }

    return errors;
  };

  const errors = validateForm();
  const canSave = errors.length === 0;

  return (
    <div className="flex-1 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
          {title.emoji} {title.name || 'New Title'}
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
          <FormInput
            label="Name"
            type="text"
            value={title.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            placeholder="e.g., Palm Sage, Sword Cultivator"
            required
          />

          <FormInput
            label="Key (unique identifier)"
            type="text"
            value={title.key}
            onChange={(e) => onFieldChange('key', e.target.value.toLowerCase())}
            placeholder="e.g., palm_sage, sword_cultivator"
            required
            disabled={!isCreatingNew}
          />
        </div>

        <FormInput
          label="Emoji"
          type="text"
          value={title.emoji}
          onChange={(e) => onFieldChange('emoji', e.target.value)}
          placeholder="👑"
          maxLength={4}
          className="text-2xl"
          required
        />

        <FormTextarea
          label="Description"
          value={title.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="A short description of this title"
          rows={2}
          required
        />

        <FormInput
          label="Prestige Level (1-10)"
          type="number"
          min={1}
          max={10}
          step={1}
          value={title.prestigeLevel || 1}
          onChange={(e) => onFieldChange('prestigeLevel', parseInt(e.target.value) || 1)}
          required
        />
      </div>

      {/* Stat Bonuses */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-cyan-400">Stat Bonuses</h3>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Health Multiplier"
            type="number"
            min={0.1}
            step={0.1}
            value={title.statBonuses?.healthMultiplier || ''}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              onFieldChange('statBonuses', {
                ...title.statBonuses,
                healthMultiplier: value,
              });
            }}
            placeholder="e.g., 1.2 = +20% health"
          />

          <FormInput
            label="Damage Multiplier"
            type="number"
            min={0.1}
            step={0.1}
            value={title.statBonuses?.damageMultiplier || ''}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              onFieldChange('statBonuses', {
                ...title.statBonuses,
                damageMultiplier: value,
              });
            }}
            placeholder="e.g., 1.5 = +50% damage"
          />

          <FormInput
            label="Attack Speed Multiplier"
            type="number"
            min={0.1}
            step={0.1}
            value={title.statBonuses?.attackSpeedMultiplier || ''}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              onFieldChange('statBonuses', {
                ...title.statBonuses,
                attackSpeedMultiplier: value,
              });
            }}
            placeholder="e.g., 0.8 = 20% faster"
          />

          <FormInput
            label="Range Bonus (pixels)"
            type="number"
            min={0}
            step={10}
            value={title.statBonuses?.rangeBonus || ''}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              onFieldChange('statBonuses', {
                ...title.statBonuses,
                rangeBonus: value,
              });
            }}
            placeholder="e.g., 50 = +50 pixels"
          />

          <FormInput
            label="Movement Speed Multiplier"
            type="number"
            min={0.1}
            step={0.1}
            value={title.statBonuses?.movementSpeedMultiplier || ''}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              onFieldChange('statBonuses', {
                ...title.statBonuses,
                movementSpeedMultiplier: value,
              });
            }}
            placeholder="e.g., 1.1 = +10% speed"
          />
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">
            <strong className="text-cyan-400">Multipliers:</strong> Values greater than 1.0 increase the stat, less than 1.0 decrease it
            <br />
            <strong className="text-cyan-400">Range Bonus:</strong> Flat bonus added to attack range in pixels
            <br />
            <strong className="text-cyan-400">Leave empty:</strong> Any bonus field left empty will not affect that stat
          </p>
        </div>
      </div>

      {/* Cultivators Using This Title */}
      {!isCreatingNew && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-cyan-400">Cultivators Using This Title</h3>

          {loadingCultivators ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : cultivatorsUsing.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">
                No cultivators are currently using this title.
              </p>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-amber-400 text-sm font-semibold mb-2">
                ⚠️ This title is used by {cultivatorsUsing.length} cultivator(s):
              </p>
              <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                {cultivatorsUsing.map((cultivator) => (
                  <li key={cultivator.id}>{cultivator.name}</li>
                ))}
              </ul>
              <p className="text-slate-400 text-xs mt-2">
                You cannot delete this title until these cultivators are updated or deleted.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
