/**
 * PreviewGrid - Displays assets grouped by category in a grid layout
 * 
 * Requirements: 10.1, 10.4
 */

import * as React from "react";
import { AssetPreviewCard } from "./AssetPreviewCard";
import type { AssetEntry } from "../../assets/asset-manifest";

export interface PreviewGridProps {
  /** Category title to display */
  title: string;
  /** Record of asset key to asset entry */
  assets: Record<string, AssetEntry>;
}

/**
 * Renders a grid of asset preview cards for a single category.
 * Shows category title and asset count.
 */
export function PreviewGrid({ title, assets }: PreviewGridProps): JSX.Element {
  const entries = Object.entries(assets);
  const readyCount = entries.filter(([, asset]) => asset.status === 'ready').length;
  const totalCount = entries.length;
  
  return (
    <section className="mb-8" data-testid={`preview-grid-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {/* Category header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <span className={`
            px-2 py-1 rounded text-sm font-medium
            ${readyCount === totalCount 
              ? 'bg-green-600/30 text-green-400' 
              : 'bg-yellow-600/30 text-yellow-400'
            }
          `}>
            {readyCount}/{totalCount} ready
          </span>
        </div>
      </div>
      
      {/* Asset grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {entries.map(([key, asset]) => (
          <AssetPreviewCard key={key} assetKey={key} asset={asset} />
        ))}
      </div>
    </section>
  );
}
