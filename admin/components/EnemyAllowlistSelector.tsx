import { useState, useEffect } from 'react';
import type { PersonType } from '../../shared/types/person-types';
import { personTypeService } from '../../shared/utils/person-type-service';

interface EnemyAllowlistSelectorProps {
  selectedEnemyIds: string[];
  onChange: (enemyIds: string[]) => void;
}

export default function EnemyAllowlistSelector({
  selectedEnemyIds,
  onChange,
}: EnemyAllowlistSelectorProps) {
  const [attackerPersonTypes, setAttackerPersonTypes] = useState<PersonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAttackerPersonTypes();
  }, []);

  const loadAttackerPersonTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      const personTypes = await personTypeService.loadPersonTypes();
      
      // Filter to only person types with attacker configs
      const attackers = personTypes.filter(pt => pt.attackerConfig);
      
      setAttackerPersonTypes(attackers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enemy types');
      console.error('Error loading attacker person types:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (enemyId: string) => {
    const isSelected = selectedEnemyIds.includes(enemyId);
    
    if (isSelected) {
      // Remove from selection
      onChange(selectedEnemyIds.filter(id => id !== enemyId));
    } else {
      // Add to selection
      onChange([...selectedEnemyIds, enemyId]);
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded bg-slate-800/50 border border-slate-700">
        <p className="text-slate-400 text-center">Loading enemy types...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded bg-red-900/20 border border-red-500">
        <p className="text-red-400">Error: {error}</p>
        <button
          onClick={loadAttackerPersonTypes}
          className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (attackerPersonTypes.length === 0) {
    return (
      <div className="p-4 rounded bg-yellow-900/20 border border-yellow-700">
        <p className="text-yellow-400">
          No enemy types found. Please create person types with attacker configurations first.
        </p>
      </div>
    );
  }

  const hasValidationError = selectedEnemyIds.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-emerald-400">
          Allowed Enemy Types
        </label>
        <span className="text-xs text-slate-400">
          {selectedEnemyIds.length} of {attackerPersonTypes.length} selected
        </span>
      </div>

      {hasValidationError && (
        <div className="px-3 py-2 rounded bg-red-900/20 border border-red-500">
          <p className="text-red-400 text-sm">
            ⚠️ At least one enemy type must be selected
          </p>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto rounded border border-slate-700 bg-slate-900/50">
        <div className="divide-y divide-slate-700">
          {attackerPersonTypes.map((personType) => {
            const isSelected = selectedEnemyIds.includes(personType.id);
            
            return (
              <label
                key={personType.id}
                className={`
                  flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                  hover:bg-slate-800/50
                  ${isSelected ? 'bg-emerald-900/20' : ''}
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(personType.id)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 
                    focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                />
                
                <span className="text-2xl">{personType.emoji}</span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {personType.name}
                    </span>
                    {personType.attackerConfig && (
                      <span className={`
                        text-xs px-2 py-0.5 rounded
                        ${personType.attackerConfig.difficulty === 'boss' ? 'bg-purple-900/50 text-purple-300' : ''}
                        ${personType.attackerConfig.difficulty === 'elite' ? 'bg-red-900/50 text-red-300' : ''}
                        ${personType.attackerConfig.difficulty === 'rare' ? 'bg-blue-900/50 text-blue-300' : ''}
                        ${personType.attackerConfig.difficulty === 'uncommon' ? 'bg-green-900/50 text-green-300' : ''}
                        ${personType.attackerConfig.difficulty === 'common' ? 'bg-slate-700 text-slate-300' : ''}
                      `}>
                        {personType.attackerConfig.difficulty}
                      </span>
                    )}
                  </div>
                  
                  {personType.attackerConfig && (
                    <div className="text-xs text-slate-400 mt-1">
                      HP: {personType.baseStats.health} | 
                      DMG: {personType.baseStats.damage} | 
                      Reward: {personType.attackerConfig.reward} Qi | 
                      Wave {personType.attackerConfig.firstAppearance}+
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Select which enemy types can spawn on this map. At least one enemy type is required.
      </p>
    </div>
  );
}
