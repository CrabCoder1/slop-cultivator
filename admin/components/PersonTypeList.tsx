import { useState } from 'react';
import type { PersonType } from '../../shared/types/person-types';
import type { Species, Dao, Title } from '../../shared/types/composition-types';
import SelectableCard from './ui/SelectableCard';
import { Button, FormInput } from './ui';

interface PersonTypeListProps {
  personTypes: PersonType[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onCreateNew: () => void;
  onDelete: (personType: PersonType) => void;
  species: Species[];
  daos: Dao[];
  titles: Title[];
}

export default function PersonTypeList({
  personTypes,
  selectedIndex,
  onSelect,
  onCreateNew,
  onDelete,
  species,
  daos,
  titles,
}: PersonTypeListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'defender' | 'attacker'>('all');
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
  const [daoFilter, setDaoFilter] = useState<string>('all');
  const [titleFilter, setTitleFilter] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Helper to get composition component names
  const getSpeciesName = (speciesId?: string) => {
    if (!speciesId) return null;
    const s = species.find(sp => sp.id === speciesId);
    return s ? `${s.emoji} ${s.name}` : null;
  };

  const getDaoName = (daoId?: string) => {
    if (!daoId) return null;
    const d = daos.find(dao => dao.id === daoId);
    return d ? `${d.emoji} ${d.name}` : null;
  };

  const getTitleName = (titleId?: string) => {
    if (!titleId) return null;
    const t = titles.find(title => title.id === titleId);
    return t ? `${t.emoji} ${t.name}` : null;
  };

  // Filter person types based on search and filters
  const filteredPersonTypes = personTypes.filter(pt => {
    // Search filter
    const speciesName = getSpeciesName(pt.speciesId);
    const daoName = getDaoName(pt.daoId);
    const titleName = getTitleName(pt.titleId);
    
    const matchesSearch = 
      pt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pt.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (speciesName && speciesName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (daoName && daoName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (titleName && titleName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Role filter
    if (roleFilter === 'defender') {
      if (!pt.defenderConfig) return false;
    } else if (roleFilter === 'attacker') {
      if (!pt.attackerConfig) return false;
    }

    // Species filter
    if (speciesFilter !== 'all' && pt.speciesId !== speciesFilter) {
      return false;
    }

    // Dao filter
    if (daoFilter !== 'all' && pt.daoId !== daoFilter) {
      return false;
    }

    // Title filter
    if (titleFilter !== 'all' && pt.titleId !== titleFilter) {
      return false;
    }

    return true;
  });

  const handleDelete = (personType: PersonType) => {
    if (showDeleteConfirm === personType.id) {
      onDelete(personType);
      setShowDeleteConfirm(null);
    } else {
      setShowDeleteConfirm(personType.id);
      // Auto-cancel after 3 seconds
      setTimeout(() => {
        setShowDeleteConfirm(null);
      }, 3000);
    }
  };

  const getRoleBadge = (personType: PersonType) => {
    const hasDefender = personType.defenderConfig !== undefined;
    const hasAttacker = personType.attackerConfig !== undefined;

    if (hasDefender && hasAttacker) {
      return <span className="text-xs text-purple-400">⚡ Both</span>;
    } else if (hasDefender) {
      return <span className="text-xs text-blue-400">🛡️ Defender</span>;
    } else if (hasAttacker) {
      return <span className="text-xs text-red-400">⚔️ Attacker</span>;
    }
    return null;
  };

  return (
    <div 
      className="w-64 flex-shrink-0 border-r border-emerald-900/50 pr-6 mr-2 overflow-y-auto"
      style={{ paddingRight: '1.5rem' }}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-cyan-400">Person Types</h3>
        </div>

        {/* Create New Button */}
        <Button onClick={onCreateNew} variant="success" className="w-full mb-4">
          ➕ New Person Type
        </Button>

        {/* Search Input */}
        <div className="mb-4">
          <FormInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="text-sm"
          />
        </div>

        {/* Role Filter */}
        <div className="mb-4 flex gap-1">
          <button
            onClick={() => setRoleFilter('all')}
            className={`flex-1 px-2 py-1 text-xs rounded transition-all ${
              roleFilter === 'all'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setRoleFilter('defender')}
            className={`flex-1 px-2 py-1 text-xs rounded transition-all ${
              roleFilter === 'defender'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            🛡️
          </button>
          <button
            onClick={() => setRoleFilter('attacker')}
            className={`flex-1 px-2 py-1 text-xs rounded transition-all ${
              roleFilter === 'attacker'
                ? 'bg-red-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            ⚔️
          </button>
        </div>

        {/* Composition Filters */}
        <div className="mb-4 space-y-2">
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="w-full px-2 py-1 text-xs rounded bg-slate-800 text-slate-300 border border-slate-700"
          >
            <option value="all">All Species</option>
            {species.map(s => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>

          <select
            value={daoFilter}
            onChange={(e) => setDaoFilter(e.target.value)}
            className="w-full px-2 py-1 text-xs rounded bg-slate-800 text-slate-300 border border-slate-700"
          >
            <option value="all">All Daos</option>
            {daos.map(d => (
              <option key={d.id} value={d.id}>
                {d.emoji} {d.name}
              </option>
            ))}
          </select>

          <select
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            className="w-full px-2 py-1 text-xs rounded bg-slate-800 text-slate-300 border border-slate-700"
          >
            <option value="all">All Titles</option>
            {titles.map(t => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Person Type List */}
        {filteredPersonTypes.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No person types found
          </div>
        ) : (
          filteredPersonTypes.map((personType) => {
            const originalIndex = personTypes.indexOf(personType);
            const isSelected = selectedIndex === originalIndex;

            return (
              <div key={personType.id} className="relative">
                <SelectableCard
                  isSelected={isSelected}
                  onClick={() => onSelect(originalIndex)}
                  className="w-full"
                >
                  <div className="flex items-start gap-2">
                    <div className="text-2xl flex-shrink-0">{personType.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{personType.name}</div>
                      <div className="text-xs text-slate-400 truncate">{personType.key}</div>
                      <div className="mt-1">{getRoleBadge(personType)}</div>
                      
                      {/* Composition Info */}
                      {(personType.speciesId || personType.daoId || personType.titleId) && (
                        <div className="mt-2 pt-2 border-t border-slate-700 space-y-1">
                          {personType.speciesId && (
                            <div className="text-xs text-slate-400 truncate">
                              {getSpeciesName(personType.speciesId)}
                            </div>
                          )}
                          {personType.daoId && (
                            <div className="text-xs text-slate-400 truncate">
                              {getDaoName(personType.daoId)}
                            </div>
                          )}
                          {personType.titleId && (
                            <div className="text-xs text-slate-400 truncate">
                              {getTitleName(personType.titleId)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </SelectableCard>

                {/* Delete Button */}
                {isSelected && (
                  <button
                    onClick={() => handleDelete(personType)}
                    className={`absolute top-2 right-2 px-2 py-1 text-xs rounded transition-all ${
                      showDeleteConfirm === personType.id
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-red-600 hover:text-white'
                    }`}
                  >
                    {showDeleteConfirm === personType.id ? '⚠️ Confirm?' : '🗑️'}
                  </button>
                )}
              </div>
            );
          })
        )}

        {/* Results Count */}
        {searchQuery && (
          <div className="text-xs text-slate-400 text-center mt-4">
            Showing {filteredPersonTypes.length} of {personTypes.length}
          </div>
        )}
      </div>
    </div>
  );
}
