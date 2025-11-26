import type { AchievementCondition } from '../../shared/types/composition-types';
import { FormSelect, FormInput, Button } from './ui';

interface ConditionBuilderProps {
  conditions: AchievementCondition[];
  onChange: (conditions: AchievementCondition[]) => void;
}

const CONDITION_TYPES = [
  { value: 'wave_complete', label: 'Wave Complete' },
  { value: 'cultivator_deploy_count', label: 'Cultivator Deploy Count' },
  { value: 'enemy_defeat_count', label: 'Enemy Defeat Count' },
  { value: 'score_threshold', label: 'Score Threshold' },
  { value: 'castle_health_preserved', label: 'Castle Health Preserved' },
  { value: 'win_without_damage', label: 'Win Without Damage' },
] as const;

const COMPARISON_OPERATORS = [
  { value: 'equals', label: 'Equals (=)' },
  { value: 'greater_than', label: 'Greater Than (>)' },
  { value: 'less_than', label: 'Less Than (<)' },
  { value: 'greater_or_equal', label: 'Greater or Equal (≥)' },
] as const;

export default function ConditionBuilder({ conditions, onChange }: ConditionBuilderProps) {
  const addCondition = () => {
    const newCondition: AchievementCondition = {
      type: 'wave_complete',
      targetValue: 1,
      comparisonOperator: 'greater_or_equal',
      isTrackable: true,
      progressLabel: '',
    };
    onChange([...conditions, newCondition]);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<AchievementCondition>) => {
    const updated = conditions.map((condition, i) =>
      i === index ? { ...condition, ...updates } : condition
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-cyan-400">Conditions</h3>
        <Button onClick={addCondition} variant="success">
          ➕ Add Condition
        </Button>
      </div>

      {conditions.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm">
            No conditions added yet. Click "Add Condition" to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {conditions.map((condition, index) => (
            <div
              key={index}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-emerald-400">
                  Condition {index + 1}
                </h4>
                <Button
                  onClick={() => removeCondition(index)}
                  variant="danger"
                  className="text-xs px-2 py-1"
                >
                  🗑️ Remove
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormSelect
                  label="Condition Type"
                  value={condition.type}
                  onChange={(e) =>
                    updateCondition(index, {
                      type: e.target.value as AchievementCondition['type'],
                    })
                  }
                >
                  {CONDITION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </FormSelect>

                <FormSelect
                  label="Comparison Operator"
                  value={condition.comparisonOperator}
                  onChange={(e) =>
                    updateCondition(index, {
                      comparisonOperator: e.target.value as AchievementCondition['comparisonOperator'],
                    })
                  }
                >
                  {COMPARISON_OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <FormInput
                label="Target Value"
                type="number"
                min={0}
                step={condition.type === 'castle_health_preserved' ? 0.01 : 1}
                value={condition.targetValue}
                onChange={(e) =>
                  updateCondition(index, {
                    targetValue: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`trackable-${index}`}
                  checked={condition.isTrackable}
                  onChange={(e) =>
                    updateCondition(index, {
                      isTrackable: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-emerald-800 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <label
                  htmlFor={`trackable-${index}`}
                  className="text-sm text-emerald-400 cursor-pointer"
                >
                  Is Trackable (show progress to player)
                </label>
              </div>

              {condition.isTrackable && (
                <FormInput
                  label="Progress Label (optional)"
                  type="text"
                  value={condition.progressLabel || ''}
                  onChange={(e) =>
                    updateCondition(index, {
                      progressLabel: e.target.value || undefined,
                    })
                  }
                  placeholder="e.g., Enemies Defeated, Waves Completed"
                />
              )}

              <div className="bg-slate-900/50 border border-slate-600 rounded p-2">
                <p className="text-xs text-slate-400">
                  <strong className="text-cyan-400">Example:</strong>{' '}
                  {getConditionDescription(condition)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <p className="text-sm text-slate-400">
          <strong className="text-cyan-400">Note:</strong> All conditions must be met for the
          achievement to unlock (AND logic).
        </p>
      </div>
    </div>
  );
}

function getConditionDescription(condition: AchievementCondition): string {
  const operatorText = {
    equals: 'equals',
    greater_than: 'is greater than',
    less_than: 'is less than',
    greater_or_equal: 'is at least',
  }[condition.comparisonOperator];

  const typeText = {
    wave_complete: 'Wave number',
    cultivator_deploy_count: 'Cultivators deployed',
    enemy_defeat_count: 'Enemies defeated',
    score_threshold: 'Score',
    castle_health_preserved: 'Castle health percentage',
    win_without_damage: 'Win without damage',
  }[condition.type];

  return `${typeText} ${operatorText} ${condition.targetValue}`;
}
