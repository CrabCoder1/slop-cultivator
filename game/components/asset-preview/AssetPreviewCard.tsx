/**
 * AssetPreviewCard - Displays a single asset at multiple sizes for visual validation
 * 
 * Requirements: 10.2, 10.3, 10.7
 */

import { Icon } from "../ui/icon";
import type { AssetEntry } from "../../assets/asset-manifest";

export interface AssetPreviewCardProps {
  /** The key/identifier for this asset */
  assetKey: string;
  /** The asset entry from the manifest */
  asset: AssetEntry;
}

/**
 * Renders an asset at 24x24, 48x48, and 64x64 sizes with metadata.
 * Provides visual distinction between pending and ready assets.
 */
export function AssetPreviewCard({ assetKey, asset }: AssetPreviewCardProps): JSX.Element {
  const isPending = asset.status !== 'ready';
  
  return (
    <div 
      className={`
        p-4 rounded-lg border-2 transition-all
        ${isPending 
          ? 'bg-gray-800/50 border-gray-600 opacity-70' 
          : 'bg-gray-800 border-green-600'
        }
      `}
      data-testid={`asset-card-${assetKey}`}
    >
      {/* Asset metadata */}
      <div className="mb-3">
        <div className="font-medium text-white text-sm truncate" title={asset.name}>
          {asset.name}
        </div>
        <div className="text-xs text-gray-400 font-mono truncate" title={assetKey}>
          {assetKey}
        </div>
        <div className={`
          inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium
          ${isPending 
            ? 'bg-yellow-600/30 text-yellow-400' 
            : 'bg-green-600/30 text-green-400'
          }
        `}>
          {asset.status}
        </div>
      </div>
      
      {/* Size previews - 24x24, 48x48, 64x64 */}
      <div className="flex items-end gap-3">
        {/* 24x24 */}
        <div className="flex flex-col items-center">
          <div 
            className="bg-gray-900 rounded p-1 flex items-center justify-center"
            style={{ width: 32, height: 32 }}
          >
            <Icon asset={asset} size={24} />
          </div>
          <span className="text-xs text-gray-500 mt-1">24</span>
        </div>
        
        {/* 48x48 */}
        <div className="flex flex-col items-center">
          <div 
            className="bg-gray-900 rounded p-1 flex items-center justify-center"
            style={{ width: 56, height: 56 }}
          >
            <Icon asset={asset} size={48} />
          </div>
          <span className="text-xs text-gray-500 mt-1">48</span>
        </div>
        
        {/* 64x64 */}
        <div className="flex flex-col items-center">
          <div 
            className="bg-gray-900 rounded p-1 flex items-center justify-center"
            style={{ width: 72, height: 72 }}
          >
            <Icon asset={asset} size={64} />
          </div>
          <span className="text-xs text-gray-500 mt-1">64</span>
        </div>
      </div>
      
      {/* Fallback indicator */}
      {asset.fallback && (
        <div className="mt-2 text-xs text-gray-500">
          Fallback: <span className="text-base">{asset.fallback}</span>
        </div>
      )}
    </div>
  );
}
