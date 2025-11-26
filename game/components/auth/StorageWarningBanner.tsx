import { Button } from '../ui/button';

/**
 * Props for StorageWarningBanner component
 */
export interface StorageWarningBannerProps {
  message: string;
  onDismiss: () => void;
}

/**
 * Storage Warning Banner Component
 * Displays warnings about storage limitations to users
 * 
 * Features:
 * - User-friendly warning message
 * - Dismiss button
 * - Prominent styling to ensure visibility
 * - Explains persistence limitations
 * 
 * Requirements: 3.1, 3.2
 */
export function StorageWarningBanner({ message, onDismiss }: StorageWarningBannerProps) {
  return (
    <div className="w-full bg-amber-900/50 border-2 border-amber-600 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">⚠️</div>
        <div className="flex-1">
          <h3 className="text-amber-200 font-semibold mb-1">Session Storage Warning</h3>
          <p className="text-amber-200 text-sm mb-2">{message}</p>
          <p className="text-amber-300 text-xs mb-3">
            Your session will remain active during this browser session, but you may need to sign in again if you close the browser or refresh the page.
          </p>
          
          <Button
            onClick={onDismiss}
            size="sm"
            className="bg-amber-700 hover:bg-amber-600 text-white"
          >
            I Understand
          </Button>
        </div>
      </div>
    </div>
  );
}
