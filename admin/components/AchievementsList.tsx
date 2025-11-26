import { useState } from 'react';
import type { Achievement } from '../../shared/types/composition-types';
import SelectableCard from './ui/SelectableCard';
import { Button } from './ui';

interface AchievementsListProps {
  achievements: Achievement[];
  selectedAchievement: Achievement | null;
  onSelect: (achievement: Achievement) => void;
  onNewAchievement: () => void;
}

export default function AchievementsList({
  achievements,
  selectedAchievement,
  onSelect,
  onNewAchievement,
}: AchievementsListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter achievements based on search query
  const filteredAchievements = achievements.filter((a) => {
    const query = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(query) ||
      a.key.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query)
    );
  });

  return (
    <div
      className="w-64 flex-shrink-0 border-r border-emerald-900/50 pr-6 mr-2 overflow-y-auto"
      style={{ paddingRight: '1.5rem' }}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-cyan-400">Select Achievement</h3>
        </div>

        <Button onClick={onNewAchievement} variant="success" className="w-full mb-4">
          + New Achievement
        </Button>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {filteredAchievements.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            {searchQuery ? 'No achievements match your search' : 'No achievements yet. Create one!'}
          </div>
        ) : (
          filteredAchievements.map((a) => (
            <SelectableCard
              key={a.id}
              isSelected={selectedAchievement?.id === a.id}
              onClick={() => onSelect(a)}
              className="w-full"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{a.name}</div>
                  <div className="text-xs text-slate-400 mt-1 truncate">
                    {a.description}
                  </div>
                  <div className="text-xs text-emerald-400 mt-1">
                    {a.conditions.length} condition{a.conditions.length !== 1 ? 's' : ''} • {a.rewards.length} reward{a.rewards.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </SelectableCard>
          ))
        )}
      </div>
    </div>
  );
}
