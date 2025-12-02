import * as React from "react";
import { cn } from "./utils";
import { type AssetEntry, isAssetReady } from "../../assets/asset-manifest";

export interface IconProps {
  /** Asset entry from the asset manifest */
  asset: AssetEntry;
  /** Size in pixels (applied to both width and height). Default: 24 */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Alt text for the image (defaults to asset name) */
  alt?: string;
  /** Optional callback when SVG fails to load */
  onError?: () => void;
}

/**
 * Icon component that renders SVG assets with emoji fallback support.
 * 
 * - Renders `<img>` for ready assets
 * - Renders `<span>` with fallback emoji for pending assets
 * - Handles load errors by falling back to emoji
 * 
 * @example
 * ```tsx
 * import { Icon } from '@/components/ui/icon';
 * import { weaponIcons } from '@/assets/asset-manifest';
 * 
 * <Icon asset={weaponIcons.sword} size={32} />
 * ```
 */
export function Icon({
  asset,
  size = 24,
  className,
  alt,
  onError,
}: IconProps): JSX.Element {
  const [hasError, setHasError] = React.useState(false);

  // Reset error state if asset changes
  React.useEffect(() => {
    setHasError(false);
  }, [asset.path]);

  const handleError = React.useCallback(() => {
    setHasError(true);
    
    // Log warning in development mode
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Icon] Failed to load SVG: ${asset.path}`);
    }
    
    onError?.();
  }, [asset.path, onError]);

  const shouldRenderSvg = isAssetReady(asset) && !hasError;
  const fallbackEmoji = asset.fallback || '❓';

  if (shouldRenderSvg) {
    return (
      <img
        src={`/${asset.path}`}
        alt={alt || asset.name}
        width={size}
        height={size}
        className={cn("object-contain", className)}
        onError={handleError}
      />
    );
  }

  // Render fallback emoji for pending assets or on error
  return (
    <span
      role="img"
      aria-label={alt || asset.name}
      className={cn(
        "inline-flex items-center justify-center",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.75,
        lineHeight: 1,
      }}
    >
      {fallbackEmoji}
    </span>
  );
}
