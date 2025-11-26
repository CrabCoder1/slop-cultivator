import { useState } from 'react';
import ItemEditor from './components/ItemEditor';
import SkillEditor from './components/SkillEditor';
import MapEditor from './components/MapEditor';
import TileEditor from './components/TileEditor';
import PeopleEditor from './components/PeopleEditor';
import SpeciesEditor from './components/SpeciesEditor';
import DaosEditor from './components/DaosEditor';
import TitlesEditor from './components/TitlesEditor';
import AchievementsEditor from './components/AchievementsEditor';
import ProfilesEditor from './components/ProfilesEditor';

type Tab = 'profiles' | 'species' | 'daos' | 'titles' | 'achievements' | 'cultivators' | 'items' | 'skills' | 'maps' | 'tiles';

export default function AdminApp() {
  const [activeTab, setActiveTab] = useState<Tab>('profiles');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'profiles', label: 'Profiles', icon: '👤' },
    { id: 'species', label: 'Species', icon: '🧬' },
    { id: 'daos', label: 'Daos', icon: '⚔️' },
    { id: 'titles', label: 'Titles', icon: '👑' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'cultivators', label: 'Cultivators', icon: '👥' },
    { id: 'items', label: 'Items', icon: '💎' },
    { id: 'skills', label: 'Skills', icon: '✨' },
    { id: 'maps', label: 'Maps', icon: '🗺️' },
    { id: 'tiles', label: 'Tiles', icon: '🔲' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Fixed Top Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-emerald-900/50 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-amber-400">
                ⚔️ Slop Cultivator Admin Tool
              </h1>
              <p className="text-emerald-400 text-sm mt-1">
                Development tool for tweaking game parameters
              </p>
            </div>
            <div className="text-slate-500 text-xs">
              ⚠️ Dev Tool Only
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-5 py-2.5 rounded-lg font-semibold transition-all whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-br from-purple-900 to-indigo-900 text-amber-200 border-2 border-amber-500'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content Area - Editors handle their own master-detail layout */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full">
          {activeTab === 'profiles' && <ProfilesEditor />}
          {activeTab === 'species' && <SpeciesEditor />}
          {activeTab === 'daos' && <DaosEditor />}
          {activeTab === 'titles' && <TitlesEditor />}
          {activeTab === 'achievements' && <AchievementsEditor />}
          {activeTab === 'cultivators' && <PeopleEditor />}
          {activeTab === 'items' && <ItemEditor />}
          {activeTab === 'skills' && <SkillEditor />}
          {activeTab === 'maps' && <MapEditor />}
          {activeTab === 'tiles' && <TileEditor />}
        </div>
      </main>
    </div>
  );
}
