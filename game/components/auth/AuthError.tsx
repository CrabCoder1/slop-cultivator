import { Button } from '../ui/button';
import { OAuthError, OAuthErrorType } from '../../../shared/utils/auth-service';

/**
 * Props for AuthError component
 */
export interface AuthErrorProps {
  error: string | Error | OAuthError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Authentication Error Component
 * Displays user-friendly error messages with retry mechanism
 * 
 * Features:
 * - User-friendly error message display
 * - Retry mechanism for failed authentication
 * - Dismiss option to clear error
 * - Consistent styling with application theme
 * 
 * Requirements: 2.4
 */
export function AuthError({ error, onRetry, onDismiss }: AuthErrorProps) {
  /**
   * Get user-friendly error message based on error type
   */
  const getFriendlyMessage = (): string => {
    // Handle OAuthError with specific type
    if (error instanceof OAuthError) {
      return error.userMessage;
    }

    // Handle regular Error or string
    const errorMessage = typeof error === 'string' ? error : error.message;

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }

    // OAuth errors
    if (errorMessage.includes('oauth') || errorMessage.includes('authorization')) {
      return 'Authentication failed. Please try again or use a different sign-in method.';
    }

    // Session errors
    if (errorMessage.includes('session') || errorMessage.includes('expired')) {
      return 'Your session has expired. Please sign in again.';
    }

    // Storage errors
    if (errorMessage.includes('storage') || errorMessage.includes('quota')) {
      return 'Unable to save session. Please check your browser settings.';
    }

    // Generic error
    return errorMessage || 'An unexpected error occurred. Please try again.';
  };

  const friendlyMessage = getFriendlyMessage();

  /**
   * Determine if retry should be shown based on error type
   */
  const shouldShowRetry = (): boolean => {
    if (error instanceof OAuthError) {
      // Don't show retry for user-denied or invalid config errors
      return error.type !== OAuthErrorType.USER_DENIED && 
             error.type !== OAuthErrorType.INVALID_CONFIG;
    }
    return true;
  };

  return (
    <div className="w-full p-4 bg-red-900/50 border border-red-600 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">⚠️</div>
        <div className="flex-1">
          <h3 className="text-red-200 font-semibold mb-1">Authentication Error</h3>
          <p className="text-red-200 text-sm mb-3">{friendlyMessage}</p>
          
          <div className="flex gap-2">
            {onRetry && shouldShowRetry() && (
              <Button
                onClick={onRetry}
                size="sm"
                className="bg-red-700 hover:bg-red-600 text-white"
              >
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button
                onClick={onDismiss}
                size="sm"
                variant="outline"
                className="border-red-600 text-red-200 hover:bg-red-900/30"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Props for AuthLoadingState component
 */
export interface AuthLoadingStateProps {
  message?: string;
}

/**
 * Authentication Loading State Component
 * Displays loading indicator during authentication
 * 
 * Features:
 * - Animated loading spinner
 * - Optional custom message
 * - Consistent styling with application theme
 * 
 * Requirements: 2.4
 */
export function AuthLoadingState({ message = 'Authenticating...' }: AuthLoadingStateProps) {
  return (
    <div className="w-full p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-300 text-sm">{message}</p>
      </div>
    </div>
  );
}

/**
 * Props for inline error display
 */
export interface InlineAuthErrorProps {
  error: string | Error | OAuthError;
  className?: string;
}

/**
 * Inline Authentication Error Component
 * Compact error display for inline use in forms
 * 
 * Features:
 * - Compact error display
 * - User-friendly error messages
 * - Consistent styling
 * 
 * Requirements: 2.4
 */
export function InlineAuthError({ error, className = '' }: InlineAuthErrorProps) {
  const errorMessage = error instanceof OAuthError 
    ? error.userMessage 
    : (typeof error === 'string' ? error : error.message);

  return (
    <div className={`p-3 bg-red-900/50 border border-red-600 rounded-lg text-red-200 text-sm ${className}`}>
      {errorMessage}
    </div>
  );
}
