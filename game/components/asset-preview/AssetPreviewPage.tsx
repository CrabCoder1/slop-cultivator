/**
 * AssetPreviewPage - Development-only page for visual validation of all SVG assets
 * 
 * Requirements: 10.1, 10.5
 */

import { PreviewGrid } from "./PreviewGrid";
import {
  uiIcons,
  weaponIcons,
  skillIcons,
  itemIcons,
  statIcons,
  speciesSprites,
  combatEffects,
  magicEffects,
  movementEffects,
  statusEffects,
  levelBadges,
  getAssetStats,
} from "../../assets/asset-manifest";

/**
 * Main asset preview page component.
 * Combines all category grids with overall stats header.
 * Accessible at `/asset-preview` in development mode.
 */
export function AssetPreviewPage(): JSX.Element {
  const stats = getAssetStats();
  const completionPercent = Math.round((stats.ready / stats.total) * 100);
  
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6" data-testid="asset-preview-page">
      {/* Page header with overall stats */}
      <header className="mb-8 pb-6 border-b border-gray-800">
        <h1 className="text-3xl font-bold mb-4">SVG Asset Preview</h1>
        <p className="text-gray-400 mb-4">
          Visual validation tool for game assets. Review assets at multiple sizes before marking as ready.
        </p>
        
        {/* Stats summary */}
        <div className="flex flex-wrap gap-4">
          <div className="bg-gray-800 rounded-lg px-4 py-3">
            <div className="text-2xl font-bold text-green-400">{stats.ready}</div>
            <div className="text-sm text-gray-400">Ready</div>
          </div>
          <div className="bg-gray-800 rounded-lg px-4 py-3">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </div>
          <div className="bg-gray-800 rounded-lg px-4 py-3">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total</div>
          </div>
          <div className="bg-gray-800 rounded-lg px-4 py-3">
            <div className="text-2xl font-bold text-blue-400">{completionPercent}%</div>
            <div className="text-sm text-gray-400">Complete</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </header>
      
      {/* Category grids */}
      <main>
        <PreviewGrid title="UI Icons" assets={uiIcons} />
        <PreviewGrid title="Weapons" assets={weaponIcons} />
        <PreviewGrid title="Skills" assets={skillIcons} />
        <PreviewGrid title="Items" assets={itemIcons} />
        <PreviewGrid title="Stats" assets={statIcons} />
        <PreviewGrid title="Species" assets={speciesSprites} />
        <PreviewGrid title="Combat Effects" assets={combatEffects} />
        <PreviewGrid title="Magic Effects" assets={magicEffects} />
        <PreviewGrid title="Movement Effects" assets={movementEffects} />
        <PreviewGrid title="Status Effects" assets={statusEffects} />
        <PreviewGrid title="Level Badges" assets={levelBadges} />
      </main>
      
      {/* Footer */}
      <footer className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>Development-only preview page. Assets are displayed at 24×24, 48×48, and 64×64 pixels.</p>
        <p className="mt-1">
          <a href="/" className="text-blue-400 hover:underline">← Back to Game</a>
        </p>
      </footer>
    </div>
  );
}
