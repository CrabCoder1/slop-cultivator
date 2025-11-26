import { useState, useEffect } from 'react';
import type { PersonType, BaseStats, DefenderConfig, AttackerConfig } from '../../shared/types/person-types';
import type { Species, Dao, Title } from '../../shared/types/composition-types';
import { Button, FormInput, FormTextarea, FormSelect } from './ui';
import { composeCultivatorStats } from '../../shared/utils/cultivator-composition-service';

interface PersonTypeEditorProps {
  personType: PersonType | null;
  onSave: (personType: PersonType) => Promise<void>;
  hasChanges: boolean;
  onFieldChange: () => void;
  species: Species[];
  daos: Dao[];
  titles: Title[];
}

export default function PersonTypeEditor({
  personType,
  onSave,
  hasChanges,
  onFieldChange,
  species,
  daos,
  titles,
}: PersonTypeEditorProps) {
  const [editedPersonType, setEditedPersonType] = useState<PersonType | null>(personType);
  const [roleMode, setRoleMode] = useState<'defender' | 'attacker' | 'both'>('both');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [composedStats, setComposedStats] = useState<any>(null);

  useEffect(() => {
    setEditedPersonType(personType);
    if (personType) {
      // Determine role mode based on configs
      if (personType.defenderConfig && personType.attackerConfig) {
        setRoleMode('both');
      } else if (personType.defenderConfig) {
        setRoleMode('defender');
      } else if (personType.attackerConfig) {
        setRoleMode('attacker');
      } else {
        setRoleMode('both');
      }
    }
    setValidationErrors({});
  }, [personType]);

  // Calculate composed stats when composition changes
  useEffect(() => {
    if (!editedPersonType || !editedPersonType.speciesId || !editedPersonType.daoId || !editedPersonType.titleId) {
      setComposedStats(null);
      return;
    }

    const selectedSpecies = species.find(s => s.id === editedPersonType.speciesId);
    const selectedDao = daos.find(d => d.id === editedPersonType.daoId);
    const selectedTitle = titles.find(t => t.id === editedPersonType.titleId);

    if (selectedSpecies && selectedDao && selectedTitle) {
      const stats = composeCultivatorStats(selectedSpecies, selectedDao, selectedTitle);
      setComposedStats(stats);
    } else {
      setComposedStats(null);
    }
  }, [editedPersonType?.speciesId, editedPersonType?.daoId, editedPersonType?.titleId, species, daos, titles]);

  if (!editedPersonType) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400 text-lg">Select a person type to edit</p>
      </div>
    );
  }

  const updateField = (field: keyof PersonType, value: any) => {
    setEditedPersonType(prev => prev ? { ...prev, [field]: value } : null);
    onFieldChange();
  };

  const updateBaseStats = (field: keyof BaseStats, value: number) => {
    setEditedPersonType(prev => prev ? {
      ...prev,
      baseStats: { ...prev.baseStats, [field]: value }
    } : null);
    onFieldChange();
  };

  const updateDefenderConfig = (field: keyof DefenderConfig, value: any) => {
    setEditedPersonType(prev => {
      if (!prev) return null;
      const defenderConfig = prev.defenderConfig || {
        deploymentCost: 100,
        compatibleSkills: [],
        compatibleItems: []
      };
      return {
        ...prev,
        defenderConfig: { ...defenderConfig, [field]: value }
      };
    });
    onFieldChange();
  };

  const updateAttackerConfig = (field: keyof AttackerConfig, value: any) => {
    setEditedPersonType(prev => {
      if (!prev) return null;
      const attackerConfig = prev.attackerConfig || {
        reward: 10,
        spawnWeight: 5,
        firstAppearance: 1,
        difficulty: 'common' as const
      };
      return {
        ...prev,
        attackerConfig: { ...attackerConfig, [field]: value }
      };
    });
    onFieldChange();
  };

  const handleRoleModeChange = (mode: 'defender' | 'attacker' | 'both') => {
    setRoleMode(mode);
    setEditedPersonType(prev => {
      if (!prev) return null;
      
      const updated = { ...prev };
      
      if (mode === 'defender') {
        // Keep defender config, remove attacker config
        if (!updated.defenderConfig) {
          updated.defenderConfig = {
            deploymentCost: 100,
            compatibleSkills: [],
            compatibleItems: []
          };
        }
        updated.attackerConfig = undefined;
      } else if (mode === 'attacker') {
        // Keep attacker config, remove defender config
        if (!updated.attackerConfig) {
          updated.attackerConfig = {
            reward: 10,
            spawnWeight: 5,
            firstAppearance: 1,
            difficulty: 'common'
          };
        }
        updated.defenderConfig = undefined;
      } else {
        // Both - ensure both configs exist
        if (!updated.defenderConfig) {
          updated.defenderConfig = {
            deploymentCost: 100,
            compatibleSkills: [],
            compatibleItems: []
          };
        }
        if (!updated.attackerConfig) {
          updated.attackerConfig = {
            reward: 10,
            spawnWeight: 5,
            firstAppearance: 1,
            difficulty: 'common'
          };
        }
      }
      
      return updated;
    });
    onFieldChange();
  };

  const validatePersonType = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!editedPersonType) return errors;

    // Validate key
    if (!editedPersonType.key || editedPersonType.key.trim() === '') {
      errors.key = 'Key is required';
    } else if (!/^[a-z0-9_]+$/.test(editedPersonType.key)) {
      errors.key = 'Key must contain only lowercase letters, numbers, and underscores';
    }

    // Validate name
    if (!editedPersonType.name || editedPersonType.name.trim() === '') {
      errors.name = 'Name is required';
    }

    // Validate emoji
    if (!editedPersonType.emoji || editedPersonType.emoji.trim() === '') {
      errors.emoji = 'Emoji is required';
    }

    // Validate description
    if (!editedPersonType.description || editedPersonType.description.trim() === '') {
      errors.description = 'Description is required';
    }

    // Validate base stats
    if (editedPersonType.baseStats.health <= 0) {
      errors.health = 'Health must be greater than 0';
    }
    if (editedPersonType.baseStats.damage < 0) {
      errors.damage = 'Damage cannot be negative';
    }
    if (editedPersonType.baseStats.attackSpeed <= 0) {
      errors.attackSpeed = 'Attack speed must be greater than 0';
    }
    if (editedPersonType.baseStats.range < 0) {
      errors.range = 'Range cannot be negative';
    }
    if (editedPersonType.baseStats.movementSpeed < 0) {
      errors.movementSpeed = 'Movement speed cannot be negative';
    }

    // Validate defender config if present
    if (editedPersonType.defenderConfig) {
      if (editedPersonType.defenderConfig.deploymentCost < 0) {
        errors.deploymentCost = 'Deployment cost cannot be negative';
      }
    }

    // Validate attacker config if present
    if (editedPersonType.attackerConfig) {
      if (editedPersonType.attackerConfig.reward < 0) {
        errors.reward = 'Reward cannot be negative';
      }
      if (editedPersonType.attackerConfig.spawnWeight < 1 || editedPersonType.attackerConfig.spawnWeight > 10) {
        errors.spawnWeight = 'Spawn weight must be between 1 and 10';
      }
      if (editedPersonType.attackerConfig.firstAppearance < 1) {
        errors.firstAppearance = 'First appearance must be at least wave 1';
      }
    }

    // Validate that at least one config exists
    if (!editedPersonType.defenderConfig && !editedPersonType.attackerConfig) {
      errors.roleMode = 'Person type must have at least one role (defender or attacker)';
    }

    return errors;
  };

  const handleSave = async () => {
    if (!editedPersonType) return;

    const errors = validatePersonType();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsSaving(true);

    try {
      await onSave(editedPersonType);
    } finally {
      setIsSaving(false);
    }
  };

  const parseArrayInput = (value: string): string[] => {
    return value
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const updateCompositionField = (field: 'speciesId' | 'daoId' | 'titleId', value: string) => {
    setEditedPersonType(prev => prev ? { ...prev, [field]: value || undefined } : null);
    onFieldChange();
  };

  const validateSkillCompatibility = (): string[] => {
    if (!editedPersonType?.daoId || !editedPersonType?.defenderConfig) {
      return [];
    }

    const selectedDao = daos.find(d => d.id === editedPersonType.daoId);
    if (!selectedDao) {
      return [];
    }

    const incompatibleSkills = editedPersonType.defenderConfig.compatibleSkills.filter(
      skillId => !selectedDao.compatibleSkills.includes(skillId)
    );

    return incompatibleSkills;
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
          {editedPersonType.emoji} {editedPersonType.name}
        </h2>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || isSaving} 
          variant="success"
        >
          💾 {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Validation Errors Display */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="px-4 py-3 rounded bg-red-900/20 border border-red-500 text-red-400">
          <p className="font-bold mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(validationErrors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Properties */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-cyan-400">Basic Properties</h3>
          
          <div>
            <FormInput
              label="Key"
              type="text"
              value={editedPersonType.key}
              onChange={(e) => updateField('key', e.target.value)}
              placeholder="e.g., sword_cultivator, crimson_demon"
            />
            {validationErrors.key && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.key}</p>
            )}
          </div>

          <div>
            <FormInput
              label="Name"
              type="text"
              value={editedPersonType.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Sword Cultivator"
            />
            {validationErrors.name && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <FormInput
              label="Emoji"
              type="text"
              value={editedPersonType.emoji}
              onChange={(e) => updateField('emoji', e.target.value)}
              placeholder="⚔️"
              maxLength={4}
            />
            {validationErrors.emoji && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.emoji}</p>
            )}
          </div>

          <div>
            <FormTextarea
              label="Description"
              value={editedPersonType.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="A brief description of this person type"
              rows={3}
            />
            {validationErrors.description && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.description}</p>
            )}
          </div>

          <FormTextarea
            label="Lore (Optional)"
            value={editedPersonType.lore || ''}
            onChange={(e) => updateField('lore', e.target.value || undefined)}
            placeholder="Background story and lore"
            rows={4}
          />
        </div>

        {/* Composition System */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-cyan-400">Composition</h3>
          <p className="text-sm text-slate-400">
            Compose this cultivator from Species, Dao, and Title components. Stats will be calculated automatically.
          </p>

          <div>
            <FormSelect
              label="Species"
              value={editedPersonType.speciesId || ''}
              onChange={(e) => updateCompositionField('speciesId', e.target.value)}
            >
              <option value="">-- Select Species --</option>
              {species.map(s => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.name}
                </option>
              ))}
            </FormSelect>
            {editedPersonType.speciesId && (() => {
              const selectedSpecies = species.find(s => s.id === editedPersonType.speciesId);
              return selectedSpecies ? (
                <p className="text-xs text-slate-400 mt-1">
                  Base Health: {selectedSpecies.baseStats.health}, Movement: {selectedSpecies.baseStats.movementSpeed}
                </p>
              ) : null;
            })()}
          </div>

          <div>
            <FormSelect
              label="Dao"
              value={editedPersonType.daoId || ''}
              onChange={(e) => updateCompositionField('daoId', e.target.value)}
            >
              <option value="">-- Select Dao --</option>
              {daos.map(d => (
                <option key={d.id} value={d.id}>
                  {d.emoji} {d.name}
                </option>
              ))}
            </FormSelect>
            {editedPersonType.daoId && (() => {
              const selectedDao = daos.find(d => d.id === editedPersonType.daoId);
              return selectedDao ? (
                <p className="text-xs text-slate-400 mt-1">
                  Damage: {selectedDao.combatStats.damage}, Attack Speed: {selectedDao.combatStats.attackSpeed}ms, 
                  Range: {selectedDao.combatStats.range}px, Pattern: {selectedDao.combatStats.attackPattern}
                </p>
              ) : null;
            })()}
          </div>

          <div>
            <FormSelect
              label="Title"
              value={editedPersonType.titleId || ''}
              onChange={(e) => updateCompositionField('titleId', e.target.value)}
            >
              <option value="">-- Select Title --</option>
              {titles.map(t => (
                <option key={t.id} value={t.id}>
                  {t.emoji} {t.name} (Prestige {t.prestigeLevel})
                </option>
              ))}
            </FormSelect>
            {editedPersonType.titleId && (() => {
              const selectedTitle = titles.find(t => t.id === editedPersonType.titleId);
              if (!selectedTitle) return null;
              const bonuses = [];
              if (selectedTitle.statBonuses.healthMultiplier) bonuses.push(`Health ×${selectedTitle.statBonuses.healthMultiplier}`);
              if (selectedTitle.statBonuses.damageMultiplier) bonuses.push(`Damage ×${selectedTitle.statBonuses.damageMultiplier}`);
              if (selectedTitle.statBonuses.attackSpeedMultiplier) bonuses.push(`Attack Speed ×${selectedTitle.statBonuses.attackSpeedMultiplier}`);
              if (selectedTitle.statBonuses.rangeBonus) bonuses.push(`Range +${selectedTitle.statBonuses.rangeBonus}px`);
              if (selectedTitle.statBonuses.movementSpeedMultiplier) bonuses.push(`Movement ×${selectedTitle.statBonuses.movementSpeedMultiplier}`);
              return bonuses.length > 0 ? (
                <p className="text-xs text-slate-400 mt-1">
                  Bonuses: {bonuses.join(', ')}
                </p>
              ) : null;
            })()}
          </div>

          {/* Composed Stats Preview */}
          {composedStats && (
            <div className="p-4 rounded bg-emerald-900/20 border border-emerald-700">
              <h4 className="text-sm font-bold text-emerald-400 mb-2">📊 Composed Stats Preview</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Health:</span>
                  <span className="text-white ml-2 font-mono">{Math.round(composedStats.health)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Damage:</span>
                  <span className="text-white ml-2 font-mono">{Math.round(composedStats.damage)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Attack Speed:</span>
                  <span className="text-white ml-2 font-mono">{Math.round(composedStats.attackSpeed)}ms</span>
                </div>
                <div>
                  <span className="text-slate-400">Range:</span>
                  <span className="text-white ml-2 font-mono">{Math.round(composedStats.range)}px</span>
                </div>
                <div>
                  <span className="text-slate-400">Movement:</span>
                  <span className="text-white ml-2 font-mono">{composedStats.movementSpeed.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Display Name:</span>
                  <span className="text-white ml-2">{composedStats.displayName}</span>
                </div>
              </div>
            </div>
          )}

          {/* Skill Compatibility Warning */}
          {(() => {
            const incompatibleSkills = validateSkillCompatibility();
            return incompatibleSkills.length > 0 ? (
              <div className="p-3 rounded bg-yellow-900/20 border border-yellow-700">
                <p className="text-sm text-yellow-400">
                  ⚠️ Warning: The following skills are not compatible with the selected Dao: {incompatibleSkills.join(', ')}
                </p>
              </div>
            ) : null;
          })()}
        </div>

        {/* Base Stats */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-cyan-400">Base Stats</h3>
          
          <div>
            <FormInput
              label="Health"
              type="number"
              value={editedPersonType.baseStats.health}
              onChange={(e) => updateBaseStats('health', parseFloat(e.target.value))}
              min="1"
              step="1"
            />
            {validationErrors.health && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.health}</p>
            )}
          </div>

          <div>
            <FormInput
              label="Damage"
              type="number"
              value={editedPersonType.baseStats.damage}
              onChange={(e) => updateBaseStats('damage', parseFloat(e.target.value))}
              min="0"
              step="1"
            />
            {validationErrors.damage && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.damage}</p>
            )}
          </div>

          <div>
            <FormInput
              label="Attack Speed (ms)"
              type="number"
              value={editedPersonType.baseStats.attackSpeed}
              onChange={(e) => updateBaseStats('attackSpeed', parseFloat(e.target.value))}
              min="1"
              step="100"
            />
            {validationErrors.attackSpeed && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.attackSpeed}</p>
            )}
          </div>

          <div>
            <FormInput
              label="Range (pixels)"
              type="number"
              value={editedPersonType.baseStats.range}
              onChange={(e) => updateBaseStats('range', parseFloat(e.target.value))}
              min="0"
              step="10"
            />
            {validationErrors.range && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.range}</p>
            )}
          </div>

          <div>
            <FormInput
              label="Movement Speed (pixels/frame)"
              type="number"
              value={editedPersonType.baseStats.movementSpeed}
              onChange={(e) => updateBaseStats('movementSpeed', parseFloat(e.target.value))}
              min="0"
              step="0.1"
            />
            {validationErrors.movementSpeed && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.movementSpeed}</p>
            )}
          </div>
        </div>

        {/* Role Mode Toggle */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-cyan-400">Role Configuration</h3>
          
          <div>
            <label className="block text-sm font-medium text-emerald-400 mb-2">
              Role Mode
            </label>
            <div className="flex gap-2">
              <Button
                onClick={() => handleRoleModeChange('defender')}
                variant={roleMode === 'defender' ? 'success' : 'primary'}
                className="flex-1"
              >
                🛡️ Defender Only
              </Button>
              <Button
                onClick={() => handleRoleModeChange('attacker')}
                variant={roleMode === 'attacker' ? 'success' : 'primary'}
                className="flex-1"
              >
                ⚔️ Attacker Only
              </Button>
              <Button
                onClick={() => handleRoleModeChange('both')}
                variant={roleMode === 'both' ? 'success' : 'primary'}
                className="flex-1"
              >
                ⚡ Both Roles
              </Button>
            </div>
            {validationErrors.roleMode && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.roleMode}</p>
            )}
          </div>
        </div>

        {/* Defender Config */}
        {(roleMode === 'defender' || roleMode === 'both') && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-cyan-400">Defender Configuration</h3>
            
            <div>
              <FormInput
                label="Deployment Cost (Qi)"
                type="number"
                value={editedPersonType.defenderConfig?.deploymentCost || 100}
                onChange={(e) => updateDefenderConfig('deploymentCost', parseFloat(e.target.value))}
                min="0"
                step="10"
              />
              {validationErrors.deploymentCost && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.deploymentCost}</p>
              )}
            </div>

            <div>
              <FormInput
                label="Compatible Skills (comma-separated IDs)"
                type="text"
                value={editedPersonType.defenderConfig?.compatibleSkills.join(', ') || ''}
                onChange={(e) => updateDefenderConfig('compatibleSkills', parseArrayInput(e.target.value))}
                placeholder="fireball, ice_blast, lightning_strike"
              />
              <p className="text-slate-400 text-xs mt-1">
                Enter skill IDs separated by commas
              </p>
            </div>

            <div>
              <FormInput
                label="Compatible Items (comma-separated IDs)"
                type="text"
                value={editedPersonType.defenderConfig?.compatibleItems.join(', ') || ''}
                onChange={(e) => updateDefenderConfig('compatibleItems', parseArrayInput(e.target.value))}
                placeholder="sword_of_flames, shield_of_light"
              />
              <p className="text-slate-400 text-xs mt-1">
                Enter item IDs separated by commas
              </p>
            </div>
          </div>
        )}

        {/* Attacker Config */}
        {(roleMode === 'attacker' || roleMode === 'both') && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-cyan-400">Attacker Configuration</h3>
            
            <div>
              <FormInput
                label="Reward (Qi)"
                type="number"
                value={editedPersonType.attackerConfig?.reward || 10}
                onChange={(e) => updateAttackerConfig('reward', parseFloat(e.target.value))}
                min="0"
                step="5"
              />
              {validationErrors.reward && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.reward}</p>
              )}
            </div>

            <div>
              <FormInput
                label="Spawn Weight (1-10)"
                type="number"
                value={editedPersonType.attackerConfig?.spawnWeight || 5}
                onChange={(e) => updateAttackerConfig('spawnWeight', parseFloat(e.target.value))}
                min="1"
                max="10"
                step="1"
              />
              {validationErrors.spawnWeight && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.spawnWeight}</p>
              )}
              <p className="text-slate-400 text-xs mt-1">
                Higher weight = more likely to spawn (1=rare, 10=very common)
              </p>
            </div>

            <div>
              <FormInput
                label="First Appearance (Wave Number)"
                type="number"
                value={editedPersonType.attackerConfig?.firstAppearance || 1}
                onChange={(e) => updateAttackerConfig('firstAppearance', parseInt(e.target.value))}
                min="1"
                step="1"
              />
              {validationErrors.firstAppearance && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.firstAppearance}</p>
              )}
            </div>

            <div>
              <FormSelect
                label="Difficulty"
                value={editedPersonType.attackerConfig?.difficulty || 'common'}
                onChange={(e) => updateAttackerConfig('difficulty', e.target.value)}
              >
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="elite">Elite</option>
                <option value="boss">Boss</option>
              </FormSelect>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
