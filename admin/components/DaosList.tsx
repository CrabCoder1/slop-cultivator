import { useState } from 'react';
import type { Dao } from '../../shared/types/composition-types';
import SelectableCard from './ui/SelectableCard';
import { Button } from './ui';

interface DaosListProps {
  daos: Dao[];
  selectedDao: Dao | null;
  onSelect: (dao: Dao) => void;
  onNewDao: () => void;
}

export default function DaosList({
  daos,
  selectedDao,
  onSelect,
  onNewDao,
}: DaosListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter daos based on search query
  const filteredDaos = daos.filter((d) => {
    const query = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(query) ||
      d.key.toLowerCase().includes(query) ||
      d.description.toLowerCase().includes(query)
    );
  });

  return (
    <div
      className="w-64 flex-shrink-0 border-r border-emerald-900/50 pr-6 mr-2 overflow-y-auto"
      style={{ paddingRight: '1.5rem' }}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-cyan-400">Select Dao</h3>
        </div>

        <Button onClick={onNewDao} variant="success" className="w-full mb-4">
          + New Dao
        </Button>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search daos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {filteredDaos.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            {searchQuery ? 'No daos match your search' : 'No daos yet. Create one!'}
          </div>
        ) : (
          filteredDaos.map((d) => (
            <SelectableCard
              key={d.id}
              isSelected={selectedDao?.id === d.id}
              onClick={() => onSelect(d)}
              className="w-full"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{d.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{d.name}</div>
                  <div className="text-xs text-slate-400 mt-1 truncate">
                    {d.description}
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
