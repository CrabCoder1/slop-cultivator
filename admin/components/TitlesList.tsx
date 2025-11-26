import { useState } from 'react';
import type { Title } from '../../shared/types/composition-types';
import SelectableCard from './ui/SelectableCard';
import { Button } from './ui';

interface TitlesListProps {
  titles: Title[];
  selectedTitle: Title | null;
  onSelect: (title: Title) => void;
  onNewTitle: () => void;
}

export default function TitlesList({
  titles,
  selectedTitle,
  onSelect,
  onNewTitle,
}: TitlesListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter titles based on search query
  const filteredTitles = titles.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(query) ||
      t.key.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    );
  });

  return (
    <div
      className="w-64 flex-shrink-0 border-r border-emerald-900/50 pr-6 mr-2 overflow-y-auto"
      style={{ paddingRight: '1.5rem' }}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-cyan-400">Select Title</h3>
        </div>

        <Button onClick={onNewTitle} variant="success" className="w-full mb-4">
          + New Title
        </Button>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {filteredTitles.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            {searchQuery ? 'No titles match your search' : 'No titles yet. Create one!'}
          </div>
        ) : (
          filteredTitles.map((t) => (
            <SelectableCard
              key={t.id}
              isSelected={selectedTitle?.id === t.id}
              onClick={() => onSelect(t)}
              className="w-full"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{t.name}</div>
                  <div className="text-xs text-slate-400 mt-1 truncate">
                    Prestige {t.prestigeLevel}
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
