import { useState, useEffect } from 'react';
import { ENEMY_CODEX, EnemyCodexEntry } from '@/utils/enemy-codex';
import { FormInput, FormTextarea, FormSelect, Button } from './ui';
import SelectableCard from './ui/SelectableCard';

export default function EnemyEditor() {
  const [enemies, setEnemies] = useState<EnemyCodexEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEnemies(Object.values(ENEMY_CODEX));
  }, []);

  const updateField = <K extends keyof EnemyCodexEntry>(
    field: K,
    value: EnemyCodexEntry[K]
  ) => {
    setEnemies((prev) => {
      const updated = [...prev];
      updated[selectedIndex] = { ...updated[selectedIndex], [field]: value };
      return updated;
    });
    setHasChanges(true);
  };

  const updateStat = (stat: 'health' | 'speed' | 'reward' | 'damage', value: number) => {
    setEnemies((prev) => {
      const updated = [...prev];
      updated[selectedIndex] = {
        ...updated[selectedIndex],
        baseStats: { ...updated[selectedIndex].baseStats, [stat]: value },
      };
      return updated;
    });
    setHasChanges(true);
  };

  const exportConfig = () => {
    const config = JSON.stringify(enemies, null, 2);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enemies-config.json';
    a.click();
    URL.revokeObjectURL(url);
    setHasChanges(false);
  };

  // Show loading state while data is being loaded
  if (enemies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-cyan-400 text-lg">Loading enemies...</p>
      </div>
    );
  }
  
  const current = enemies[selectedIndex];
  if (!current) return null;

  const difficultyColors = {
    common: 'bg-gray-600',
    uncommon: 'bg-emerald-600',
    rare: 'bg-cyan-600',
    elite: 'bg-fuchsia-600',
    boss: 'bg-red-600',
  };

  return (
    <div className="flex gap-6 p-6" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Master List */}
      <div 
        className="w-64 flex-shrink-0 border-r border-emerald-900/50 pr-6 mr-2 overflow-y-auto"
        style={{ paddingRight: '1.5rem' }}
      >
        <div className="space-y-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-cyan-400">Select Enemy</h3>
        </div>
          {enemies.map((enemy, index) => (
            <SelectableCard
              key={enemy.id}
              isSelected={selectedIndex === index}
              onClick={() => setSelectedIndex(index)}
              className="w-full"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{enemy.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{enemy.name}</div>
                  <div className={`text-xs px-2 py-0.5 rounded mt-1 inline-block font-bold ${difficultyColors[enemy.difficulty]}`}>
                    {enemy.difficulty}
                  </div>
                </div>
              </div>
            </SelectableCard>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 space-y-6 overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
            {current.emoji} {current.name}
          </h2>
          <Button onClick={exportConfig} disabled={!hasChanges} variant="success">
            💾 Export Config
          </Button>
        </div>

        {/* Editor Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <FormInput
              label="Name"
              type="text"
              value={current.name}
              onChange={(e) => updateField('name', e.target.value)}
            />

            <FormInput
              label="Emoji"
              type="text"
              value={current.emoji}
              onChange={(e) => updateField('emoji', e.target.value)}
              maxLength={2}
              className="text-2xl"
            />

            <FormSelect
              label="Difficulty"
              value={current.difficulty}
              onChange={(e) => updateField('difficulty', e.target.value as any)}
            >
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="elite">Elite</option>
              <option value="boss">Boss</option>
            </FormSelect>

            <FormInput
              label="First Appearance (Wave)"
              type="number"
              value={current.firstAppearance}
              onChange={(e) => updateField('firstAppearance', parseInt(e.target.value))}
            />

            <FormTextarea
              label="Description"
              value={current.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
            />

            <FormTextarea
              label="Lore"
              value={current.lore}
              onChange={(e) => updateField('lore', e.target.value)}
              rows={4}
            />
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-4">
            <FormInput
              label="Base Health"
              type="number"
              value={current.baseStats.health}
              onChange={(e) => updateStat('health', parseInt(e.target.value))}
            />

            <FormInput
              label="Damage (per attack)"
              type="number"
              value={current.baseStats.damage}
              onChange={(e) => updateStat('damage', parseInt(e.target.value))}
            />

            <FormInput
              label="Speed (multiplier)"
              type="number"
              step="0.1"
              value={current.baseStats.speed}
              onChange={(e) => updateStat('speed', parseFloat(e.target.value))}
            />

            <FormInput
              label="Qi Reward"
              type="number"
              value={current.baseStats.reward}
              onChange={(e) => updateStat('reward', parseInt(e.target.value))}
            />

            {/* Scaled Stats Preview */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-5 mt-6 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20">
              <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent mb-3">
                Scaled Stats (Wave 10)
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-cyan-300 font-semibold">Health:</span>
                  <span className="text-white font-bold">
                    {Math.round(current.baseStats.health * Math.pow(1.3, 9))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300 font-semibold">Damage:</span>
                  <span className="text-white font-bold">
                    {current.baseStats.damage}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300 font-semibold">Speed:</span>
                  <span className="text-white font-bold">
                    {current.baseStats.speed.toFixed(1)}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300 font-semibold">Reward:</span>
                  <span className="text-white font-bold">
                    {current.baseStats.reward} Qi
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-5 border-2 border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/20">
              <h3 className="text-lg font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent mb-3">
                Scaled Stats (Wave 20)
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-cyan-300 font-semibold">Health:</span>
                  <span className="text-white font-bold">
                    {Math.round(current.baseStats.health * Math.pow(1.3, 19))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300 font-semibold">Damage:</span>
                  <span className="text-white font-bold">
                    {current.baseStats.damage}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300 font-semibold">Speed:</span>
                  <span className="text-white font-bold">
                    {current.baseStats.speed.toFixed(1)}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300 font-semibold">Reward:</span>
                  <span className="text-white font-bold">
                    {current.baseStats.reward} Qi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
