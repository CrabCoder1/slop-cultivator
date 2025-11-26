import { useState } from 'react';
import type { Species } from '../../shared/types/composition-types';
import SelectableCard from './ui/SelectableCard';
import { Button } from './ui';

interface SpeciesListProps {
  species: Species[];
  selectedSpecies: Species | null;
  onSelect: (species: Species) => void;
  onNewSpecies: () => void;
}

export default function SpeciesList({
  species,
  selectedSpecies,
  onSelect,
  onNewSpecies,
}: SpeciesListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter species based on search query
  const filteredSpecies = species.filter((s) => {
    const query = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.key.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query)
    );
  });

  return (
    <div
      className="w-64 flex-shrink-0 border-r border-emerald-900/50 pr-6 mr-2 overflow-y-auto"
      style={{ paddingRight: '1.5rem' }}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-cyan-400">Select Species</h3>
        </div>

        <Button onClick={onNewSpecies} variant="success" className="w-full mb-4">
          + New Species
        </Button>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search species..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {filteredSpecies.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            {searchQuery ? 'No species match your search' : 'No species yet. Create one!'}
          </div>
        ) : (
          filteredSpecies.map((s) => (
            <SelectableCard
              key={s.id}
              isSelected={selectedSpecies?.id === s.id}
              onClick={() => onSelect(s)}
              className="w-full"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{s.name}</div>
                  <div className="text-xs text-slate-400 mt-1 truncate">
                    {s.description}
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
