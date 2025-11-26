import type { Achievement } from '../../shared/types/composition-types';
import { FormInput, FormTextarea, Button } from './ui';
import ConditionBuilder from './ConditionBuilder';
import RewardBuilder from './RewardBuilder';

interface AchievementsFormProps {
  achievement: Achievement | null;
  isCreatingNew: boolean;
  onSave: () => void;
  onDelete: () => void;
  onFieldChange: <K extends keyof Achievement>(field: K, value: Achievement[K]) => void;
}

export default function AchievementsForm({
  achievement,
  isCreatingNew,
  onSave,
  onDelete,
  onFieldChange,
}: AchievementsFormProps) {
  if (!achievement) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500 text-lg">
          Select an achievement or create a new one to get started
        </p>
      </div>
    );
  }

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!achievement.name || achievement.name.trim().length < 1) {
      errors.push('Name is required');
    }

    if (!achievement.key || achievement.key.trim().length < 1) {
      errors.push('Key is required');
    }

    if (achievement.key && !/^[a-z0-9_]+$/.test(achievement.key)) {
      errors.push('Key must contain only lowercase letters, numbers, and underscores');
    }

    if (!achievement.emoji || achievement.emoji.trim().length < 1) {
      errors.push('Emoji is required');
    }

    if (!achievement.description || achievement.description.trim().length < 1) {
      errors.push('Description is required');
    }

    if (!Array.isArray(achievement.conditions) || achievement.conditions.length === 0) {
      errors.push('At least one condition is required');
    }

    if (!Array.isArray(achievement.rewards) || achievement.rewards.length === 0) {
      errors.push('At least one reward is required');
    }

    if (typeof achievement.sortOrder !== 'number') {
      errors.push('Sort order must be a number');
    }

    // Validate conditions
    achievement.conditions.forEach((condition, index) => {
      if (!condition.type) {
        errors.push(`Condition ${index + 1}: Type is required`);
      }
      if (typeof condition.targetValue !== 'number') {
        errors.push(`Condition ${index + 1}: Target value must be a number`);
      }
      if (!condition.comparisonOperator) {
        errors.push(`Condition ${index + 1}: Comparison operator is required`);
      }
      if (typeof condition.isTrackable !== 'boolean') {
        errors.push(`Condition ${index + 1}: isTrackable must be set`);
      }
    });

    // Validate rewards
    achievement.rewards.forEach((reward, index) => {
      if (!reward.type) {
        errors.push(`Reward ${index + 1}: Type is required`);
      }
      if (reward.value === undefined || reward.value === null || reward.value === '') {
        errors.push(`Reward ${index + 1}: Value is required`);
      }
      if (!reward.displayName || reward.displayName.trim().length < 1) {
        errors.push(`Reward ${index + 1}: Display name is required`);
      }
    });

    return errors;
  };

  const errors = validateForm();
  const canSave = errors.length === 0;

  return (
    <div className="flex-1 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
          {achievement.emoji} {achievement.name || 'New Achievement'}
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
            value={achievement.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            placeholder="e.g., Wave Master, First Blood"
            required
          />

          <FormInput
            label="Key (unique identifier)"
            type="text"
            value={achievement.key}
            onChange={(e) => onFieldChange('key', e.target.value.toLowerCase())}
            placeholder="e.g., wave_master, first_blood"
            required
            disabled={!isCreatingNew}
          />
        </div>

        <FormInput
          label="Emoji"
          type="text"
          value={achievement.emoji}
          onChange={(e) => onFieldChange('emoji', e.target.value)}
          placeholder="🏆"
          maxLength={4}
          className="text-2xl"
          required
        />

        <FormTextarea
          label="Description"
          value={achievement.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="What the player accomplished to earn this achievement"
          rows={2}
          required
        />

        <FormInput
          label="Sort Order"
          type="number"
          min={0}
          step={1}
          value={achievement.sortOrder}
          onChange={(e) => onFieldChange('sortOrder', parseInt(e.target.value) || 0)}
          required
        />

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">
            <strong className="text-cyan-400">Sort Order:</strong> Lower numbers appear first in the achievements list (0 = highest priority)
          </p>
        </div>
      </div>

      {/* Conditions */}
      <ConditionBuilder
        conditions={achievement.conditions}
        onChange={(conditions) => onFieldChange('conditions', conditions)}
      />

      {/* Rewards */}
      <RewardBuilder
        rewards={achievement.rewards}
        onChange={(rewards) => onFieldChange('rewards', rewards)}
      />
    </div>
  );
}
