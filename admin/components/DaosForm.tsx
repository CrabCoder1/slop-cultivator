import { useEffect, useState } from 'react';
import type { Dao } from '../../shared/types/composition-types';
import { FormInput, FormTextarea, FormSelect, Button } from './ui';
import { daosAdminService } from '../services/daos-admin-service';
import { SKILLS } from '@/utils/skills';

interface DaosFormProps {
  dao: Dao | null;
  isCreatingNew: boolean;
  onSave: () => void;
  onDelete: () => void;
  onFieldChange: <K extends keyof Dao>(field: K, value: Dao[K]) => void;
}

export default function DaosForm({
  dao,
  isCreatingNew,
  onSave,
  onDelete,
  onFieldChange,
}: DaosFormProps) {
  const [cultivatorsUsing, setCultivatorsUsing] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCultivators, setLoadingCultivators] = useState(false);
  const [availableSkills] = useState(() => Object.values(SKILLS));

  // Load cultivators using this dao
  useEffect(() => {
    if (dao && !isCreatingNew) {
      setLoadingCultivators(true);
      daosAdminService
        .getCultivatorsUsingDao(dao.id)
        .then(setCultivatorsUsing)
        .catch((error) => {
          console.error('Error loading cultivators:', error);
          setCultivatorsUsing([]);
        })
        .finally(() => setLoadingCultivators(false));
    } else {
      setCultivatorsUsing([]);
    }
  }, [dao?.id, isCreatingNew]);

  if (!dao) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500 text-lg">
          Select a dao or create a new one to get started
        </p>
      </div>
    );
  }

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!dao.name || dao.name.trim().length < 1) {
      errors.push('Name is required');
    }

    if (!dao.key || dao.key.trim().length < 1) {
      errors.push('Key is required');
    }

    if (dao.key && !/^[a-z0-9_]+$/.test(dao.key)) {
      errors.push('Key must contain only lowercase letters, numbers, and underscores');
    }

    if (!dao.emoji || dao.emoji.trim().length < 1) {
      errors.push('Emoji is required');
    }

    if (!dao.description || dao.description.trim().length < 1) {
      errors.push('Description is required');
    }

    if (!dao.combatStats || typeof dao.combatStats.damage !== 'number' || dao.combatStats.damage <= 0) {
      errors.push('Damage must be a positive number');
    }

    if (!dao.combatStats || typeof dao.combatStats.attackSpeed !== 'number' || dao.combatStats.attackSpeed <= 0) {
      errors.push('Attack speed must be a positive number');
    }

    if (!dao.combatStats || typeof dao.combatStats.range !== 'number' || dao.combatStats.range <= 0) {
      errors.push('Range must be a positive number');
    }

    if (!dao.combatStats || !dao.combatStats.attackPattern) {
      errors.push('Attack pattern is required');
    }

    return errors;
  };

  const errors = validateForm();
  const canSave = errors.length === 0;

  const toggleSkill = (skillId: string) => {
    const currentSkills = dao.compatibleSkills || [];
    const newSkills = currentSkills.includes(skillId)
      ? currentSkills.filter(id => id !== skillId)
      : [...currentSkills, skillId];
    onFieldChange('compatibleSkills', newSkills);
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
          {dao.emoji} {dao.name || 'New Dao'}
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
            value={dao.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            placeholder="e.g., Sword Dao, Palm Dao"
            required
          />

          <FormInput
            label="Key (unique identifier)"
            type="text"
            value={dao.key}
            onChange={(e) => onFieldChange('key', e.target.value.toLowerCase())}
            placeholder="e.g., sword_dao, palm_dao"
            required
            disabled={!isCreatingNew}
          />
        </div>

        <FormInput
          label="Emoji"
          type="text"
          value={dao.emoji}
          onChange={(e) => onFieldChange('emoji', e.target.value)}
          placeholder="⚔️"
          maxLength={4}
          className="text-2xl"
          required
        />

        <FormTextarea
          label="Description"
          value={dao.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="A short description of this dao"
          rows={2}
          required
        />

        <FormTextarea
          label="Lore (optional)"
          value={dao.lore || ''}
          onChange={(e) => onFieldChange('lore', e.target.value || undefined)}
          placeholder="Optional backstory or lore about this dao"
          rows={3}
        />
      </div>

      {/* Combat Stats */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-cyan-400">Combat Stats</h3>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Damage"
            type="number"
            min={1}
            step={1}
            value={dao.combatStats?.damage || 10}
            onChange={(e) =>
              onFieldChange('combatStats', {
                ...dao.combatStats,
                damage: parseInt(e.target.value) || 0,
              })
            }
            required
          />

          <FormInput
            label="Attack Speed (ms)"
            type="number"
            min={100}
            step={100}
            value={dao.combatStats?.attackSpeed || 1000}
            onChange={(e) =>
              onFieldChange('combatStats', {
                ...dao.combatStats,
                attackSpeed: parseInt(e.target.value) || 0,
              })
            }
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Range (pixels)"
            type="number"
            min={1}
            step={10}
            value={dao.combatStats?.range || 50}
            onChange={(e) =>
              onFieldChange('combatStats', {
                ...dao.combatStats,
                range: parseInt(e.target.value) || 0,
              })
            }
            required
          />

          <FormSelect
            label="Attack Pattern"
            value={dao.combatStats?.attackPattern || 'melee'}
            onChange={(e) =>
              onFieldChange('combatStats', {
                ...dao.combatStats,
                attackPattern: e.target.value as 'melee' | 'ranged' | 'aoe',
              })
            }
            required
          >
            <option value="melee">Melee</option>
            <option value="ranged">Ranged</option>
            <option value="aoe">AOE</option>
          </FormSelect>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">
            <strong className="text-cyan-400">Damage:</strong> Base damage per attack
            <br />
            <strong className="text-cyan-400">Attack Speed:</strong> Milliseconds between attacks (lower = faster)
            <br />
            <strong className="text-cyan-400">Range:</strong> Attack range in pixels
            <br />
            <strong className="text-cyan-400">Attack Pattern:</strong> Type of attack (melee, ranged, or area-of-effect)
          </p>
        </div>
      </div>

      {/* Compatible Skills */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-cyan-400">Compatible Skills</h3>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-4">
            Select which skills can be used with this dao. Cultivators following this dao will only be able to equip these skills.
          </p>
          
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {availableSkills.map((skill) => {
              const isSelected = dao.compatibleSkills?.includes(skill.id) || false;
              return (
                <label
                  key={skill.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-900/50 border border-cyan-600'
                      : 'bg-slate-700/30 border border-slate-600 hover:bg-slate-700/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSkill(skill.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-lg">{skill.icon}</span>
                  <span className="text-sm flex-1">{skill.name}</span>
                </label>
              );
            })}
          </div>
          
          <p className="text-xs text-slate-500 mt-2">
            {dao.compatibleSkills?.length || 0} skill(s) selected
          </p>
        </div>
      </div>

      {/* Cultivators Using This Dao */}
      {!isCreatingNew && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-cyan-400">Cultivators Using This Dao</h3>

          {loadingCultivators ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : cultivatorsUsing.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">
                No cultivators are currently using this dao.
              </p>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-amber-400 text-sm font-semibold mb-2">
                ⚠️ This dao is used by {cultivatorsUsing.length} cultivator(s):
              </p>
              <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                {cultivatorsUsing.map((cultivator) => (
                  <li key={cultivator.id}>{cultivator.name}</li>
                ))}
              </ul>
              <p className="text-slate-400 text-xs mt-2">
                You cannot delete this dao until these cultivators are updated or deleted.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
