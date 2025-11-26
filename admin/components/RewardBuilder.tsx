import { useState, useEffect } from 'react';
import type { AchievementReward } from '../../shared/types/composition-types';
import { FormSelect, FormInput, Button } from './ui';
import { speciesAdminService } from '../services/species-admin-service';
import { daosAdminService } from '../services/daos-admin-service';
import { titlesAdminService } from '../services/titles-admin-service';

interface RewardBuilderProps {
  rewards: AchievementReward[];
  onChange: (rewards: AchievementReward[]) => void;
}

const REWARD_TYPES = [
  { value: 'unlock_species', label: 'Unlock Species' },
  { value: 'unlock_dao', label: 'Unlock Dao' },
  { value: 'unlock_title', label: 'Unlock Title' },
  { value: 'grant_qi', label: 'Grant Qi Currency' },
  { value: 'unlock_cosmetic', label: 'Unlock Cosmetic' },
] as const;

export default function RewardBuilder({ rewards, onChange }: RewardBuilderProps) {
  const [species, setSpecies] = useState<Array<{ id: string; name: string; emoji: string }>>([]);
  const [daos, setDaos] = useState<Array<{ id: string; name: string; emoji: string }>>([]);
  const [titles, setTitles] = useState<Array<{ id: string; name: string; emoji: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Load available species, daos, and titles for selection
  useEffect(() => {
    const loadData = async () => {
      try {
        const [speciesData, daosData, titlesData] = await Promise.all([
          speciesAdminService.loadSpecies(),
          daosAdminService.loadDaos(),
          titlesAdminService.loadTitles(),
        ]);

        setSpecies(speciesData.map(s => ({ id: s.id, name: s.name, emoji: s.emoji })));
        setDaos(daosData.map(d => ({ id: d.id, name: d.name, emoji: d.emoji })));
        setTitles(titlesData.map(t => ({ id: t.id, name: t.name, emoji: t.emoji })));
      } catch (error) {
        console.error('Error loading data for rewards:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const addReward = () => {
    const newReward: AchievementReward = {
      type: 'grant_qi',
      value: 100,
      displayName: '100 Qi',
    };
    onChange([...rewards, newReward]);
  };

  const removeReward = (index: number) => {
    onChange(rewards.filter((_, i) => i !== index));
  };

  const updateReward = (index: number, updates: Partial<AchievementReward>) => {
    const updated = rewards.map((reward, i) =>
      i === index ? { ...reward, ...updates } : reward
    );
    onChange(updated);
  };

  const getValueInput = (reward: AchievementReward, index: number) => {
    if (loading) {
      return (
        <div className="text-slate-400 text-sm">Loading options...</div>
      );
    }

    switch (reward.type) {
      case 'unlock_species':
        return (
          <FormSelect
            label="Species to Unlock"
            value={typeof reward.value === 'string' ? reward.value : ''}
            onChange={(e) => {
              const selectedSpecies = species.find(s => s.id === e.target.value);
              updateReward(index, {
                value: e.target.value,
                displayName: selectedSpecies ? `Unlock ${selectedSpecies.emoji} ${selectedSpecies.name}` : '',
              });
            }}
          >
            <option value="">Select a species...</option>
            {species.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.name}
              </option>
            ))}
          </FormSelect>
        );

      case 'unlock_dao':
        return (
          <FormSelect
            label="Dao to Unlock"
            value={typeof reward.value === 'string' ? reward.value : ''}
            onChange={(e) => {
              const selectedDao = daos.find(d => d.id === e.target.value);
              updateReward(index, {
                value: e.target.value,
                displayName: selectedDao ? `Unlock ${selectedDao.emoji} ${selectedDao.name}` : '',
              });
            }}
          >
            <option value="">Select a dao...</option>
            {daos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.emoji} {d.name}
              </option>
            ))}
          </FormSelect>
        );

      case 'unlock_title':
        return (
          <FormSelect
            label="Title to Unlock"
            value={typeof reward.value === 'string' ? reward.value : ''}
            onChange={(e) => {
              const selectedTitle = titles.find(t => t.id === e.target.value);
              updateReward(index, {
                value: e.target.value,
                displayName: selectedTitle ? `Unlock ${selectedTitle.emoji} ${selectedTitle.name}` : '',
              });
            }}
          >
            <option value="">Select a title...</option>
            {titles.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.name}
              </option>
            ))}
          </FormSelect>
        );

      case 'grant_qi':
        return (
          <FormInput
            label="Qi Amount"
            type="number"
            min={1}
            step={10}
            value={typeof reward.value === 'number' ? reward.value : 0}
            onChange={(e) => {
              const amount = parseInt(e.target.value) || 0;
              updateReward(index, {
                value: amount,
                displayName: `${amount} Qi`,
              });
            }}
            required
          />
        );

      case 'unlock_cosmetic':
        return (
          <FormInput
            label="Cosmetic ID"
            type="text"
            value={typeof reward.value === 'string' ? reward.value : ''}
            onChange={(e) =>
              updateReward(index, {
                value: e.target.value,
              })
            }
            placeholder="e.g., golden_aura, special_effect"
            required
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-cyan-400">Rewards</h3>
        <Button onClick={addReward} variant="success">
          ➕ Add Reward
        </Button>
      </div>

      {rewards.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm">
            No rewards added yet. Click "Add Reward" to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rewards.map((reward, index) => (
            <div
              key={index}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-emerald-400">
                  Reward {index + 1}
                </h4>
                <Button
                  onClick={() => removeReward(index)}
                  variant="danger"
                  className="text-xs px-2 py-1"
                >
                  🗑️ Remove
                </Button>
              </div>

              <FormSelect
                label="Reward Type"
                value={reward.type}
                onChange={(e) => {
                  const newType = e.target.value as AchievementReward['type'];
                  // Reset value and displayName when type changes
                  const defaultValues: Record<AchievementReward['type'], { value: string | number; displayName: string }> = {
                    unlock_species: { value: '', displayName: '' },
                    unlock_dao: { value: '', displayName: '' },
                    unlock_title: { value: '', displayName: '' },
                    grant_qi: { value: 100, displayName: '100 Qi' },
                    unlock_cosmetic: { value: '', displayName: '' },
                  };
                  updateReward(index, {
                    type: newType,
                    ...defaultValues[newType],
                  });
                }}
              >
                {REWARD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </FormSelect>

              {getValueInput(reward, index)}

              <FormInput
                label="Display Name"
                type="text"
                value={reward.displayName}
                onChange={(e) =>
                  updateReward(index, {
                    displayName: e.target.value,
                  })
                }
                placeholder="e.g., Unlock Human Species, 100 Qi"
                required
              />

              <div className="bg-slate-900/50 border border-slate-600 rounded p-2">
                <p className="text-xs text-slate-400">
                  <strong className="text-cyan-400">Preview:</strong> {reward.displayName || '(no display name)'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <p className="text-sm text-slate-400">
          <strong className="text-cyan-400">Note:</strong> All rewards will be granted when the
          achievement is unlocked.
        </p>
      </div>
    </div>
  );
}
