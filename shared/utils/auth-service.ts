import { supabase } from '../../game/utils/supabase/client';
import type { Session, User, AuthChangeEvent, SupabaseClient } from '@supabase/supabase-js';
import { 
  storeSession, 
  retrieveSession, 
  clearSession, 
  isSessionExpired,
  shouldRefreshSession,
  getTimeUntilExpiry,
  StorageQuotaError,
  StorageAccessError
} from './session-storage';
import { authMonitoringService } from './auth-monitoring-service';

/**
 * Supported OAuth providers for authentication
 */
export type OAuthProvider = 'google' | 'discord';

/**
 * Callback type for session expiration events
 */
export type SessionExpiredCallback = () => void;

/**
 * OAuth error types for better error handling
 */
export enum OAuthErrorType {
  NETWORK_FAILURE = 'NETWORK_FAILURE',
  USER_DENIED = 'USER_DENIED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  UNKNOWN = 'UNKNOWN'
}

/**
 * OAuth error with type and user-friendly message
 */
export class OAuthError extends Error {
  constructor(
    public type: OAuthErrorType,
    public userMessage: string,
    public originalError?: Error
  ) {
    super(userMessage);
    this.name = 'OAuthError';
  }
}

/**
 * Authentication service for managing user authentication with OAuth providers
 * Supports Google and Discord OAuth authentication via Supabase
 * 
 * @param supabaseClient - Optional Supabase client for dependency injection (defaults to production client)
 */
export class AuthService {
  private supabaseClient: SupabaseClient;
  private sessionExpiredCallbacks: Set<SessionExpiredCallback> = new Set();
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing: boolean = false;

  constructor(supabaseClient: SupabaseClient = supabase) {
    this.supabaseClient = supabaseClient;
  }
  /**
   * Sign in with an OAuth provider (Google or Discord) using PKCE flow
   * Redirects the user to the provider's OAuth consent screen
   * 
   * PKCE (Proof Key for Code Exchange) is automatically handled by Supabase Auth
   * when flowType is set to 'pkce' in the client configuration. The library:
   * 1. Generates a cryptographically secure code verifier
   * 2. Creates a SHA-256 code challenge from the verifier
   * 3. Includes the challenge in the OAuth authorization URL
   * 4. Stores the verifier securely for use during callback
   * 5. Verifies the code on callback to prevent interception attacks
   * 
   * @param provider - The OAuth provider to use ('google' or 'discord')
   * @returns Promise resolving to the OAuth response with URL for redirect
   * 
   * Requirements: 1.2, 1.3, 2.4
   */
  async signInWithProvider(provider: OAuthProvider): Promise<{ url: string | null; error: OAuthError | null }> {
    try {
      const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
          // Redirect to root since we don't have routing
          // Supabase will automatically detect and process OAuth params
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return { url: null, error: this.handleOAuthError(error, provider) };
      }

      return { url: data.url, error: null };
    } catch (error) {
      return { url: null, error: this.handleOAuthError(error as Error, provider) };
    }
  }

  /**
   * Handle OAuth errors and convert to user-friendly messages
   * 
   * @private
   * @param error - The error from OAuth operation
   * @param provider - The OAuth provider being used
   * @returns OAuthError with type and user-friendly message
   * 
   * Requirements: 2.4
   */
  private handleOAuthError(error: Error, provider: OAuthProvider): OAuthError {
    const errorMessage = error.message.toLowerCase();

    // Network failures
    if (errorMessage.includes('network') || 
        errorMessage.includes('fetch') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection')) {
      return new OAuthError(
        OAuthErrorType.NETWORK_FAILURE,
        'Unable to connect to the authentication service. Please check your internet connection and try again.',
        error
      );
    }

    // User denied permissions
    if (errorMessage.includes('denied') || 
        errorMessage.includes('cancelled') || 
        errorMessage.includes('rejected')) {
      return new OAuthError(
        OAuthErrorType.USER_DENIED,
        'Authentication was cancelled. Please try again if you want to sign in.',
        error
      );
    }

    // Invalid OAuth configuration
    if (errorMessage.includes('client_id') || 
        errorMessage.includes('redirect_uri') || 
        errorMessage.includes('configuration') ||
        errorMessage.includes('invalid_request')) {
      return new OAuthError(
        OAuthErrorType.INVALID_CONFIG,
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication is not properly configured. Please contact support.`,
        error
      );
    }

    // Provider unavailable
    if (errorMessage.includes('unavailable') || 
        errorMessage.includes('service') || 
        errorMessage.includes('503') ||
        errorMessage.includes('502')) {
      return new OAuthError(
        OAuthErrorType.PROVIDER_UNAVAILABLE,
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication service is temporarily unavailable. Please try again later.`,
        error
      );
    }

    // Unknown error
    return new OAuthError(
      OAuthErrorType.UNKNOWN,
      'An unexpected error occurred during authentication. Please try again.',
      error
    );
  }

  /**
   * Handle OAuth callback after redirect from provider
   * Exchanges the authorization code for a session and stores it
   * This is called automatically by Supabase when the user returns from OAuth provider
   * Starts automatic token refresh for the new session
   * 
   * OAuth State Parameter Validation:
   * Supabase Auth automatically handles state parameter validation to prevent CSRF attacks.
   * The state parameter is:
   * 1. Generated uniquely for each OAuth request
   * 2. Stored securely in the browser session
   * 3. Validated on callback to ensure the request originated from this application
   * 4. Used to prevent cross-site request forgery attacks
   * 
   * If state validation fails, Supabase Auth will reject the callback and return an error.
   * 
   * @returns Promise resolving to the session created from the OAuth callback
   * 
   * Requirements: 1.2, 1.3, 2.4
   */
  async handleOAuthCallback(): Promise<{ session: Session | null; error: OAuthError | null }> {
    try {
      // Supabase automatically handles the OAuth callback and exchanges the code for a session
      // This includes:
      // - Validating the state parameter to prevent CSRF attacks
      // - Exchanging the authorization code for tokens using PKCE
      // - Creating a new session with the tokens
      const { data, error } = await this.supabaseClient.auth.getSession();
      
      if (error) {
        // Determine provider from error context if available
        const provider = 'google' as OAuthProvider; // Default, actual provider may vary
        return { session: null, error: this.handleOAuthError(error, provider) };
      }

      // Store the session if we got one
      if (data.session) {
        try {
          storeSession(data.session);
        } catch (storageError) {
          if (storageError instanceof StorageQuotaError) {
            console.warn('Storage quota exceeded. Session will not persist across refreshes.');
          } else if (storageError instanceof StorageAccessError) {
            console.warn('Storage access denied. Session will not persist across refreshes.');
          }
          // Continue even if storage fails - session is still valid
        }
        
        // Start automatic token refresh
        this.startAutoRefresh(data.session);
      }

      return { session: data.session, error: null };
    } catch (error) {
      const provider = 'google' as OAuthProvider; // Default, actual provider may vary
      return { session: null, error: this.handleOAuthError(error as Error, provider) };
    }
  }

  /**
   * Get the current session
   * First checks browser storage, then falls back to Supabase
   * Handles expired sessions by clearing them and returning null
   * Starts automatic token refresh if session is valid
   * 
   * @returns Promise resolving to the current session or null if not authenticated
   */
  async getSession(): Promise<Session | null> {
    try {
      // First try to get from local storage (don't check expiration or auto-clear so we can handle it)
      const storedSession = retrieveSession(false, false);
      
      if (storedSession) {
        // Check if session is expired
        if (isSessionExpired(storedSession)) {
          // Session is expired - clear it and trigger re-authentication
          this.handleExpiredSession();
          return null;
        }
        
        // Check if session needs refresh and start auto-refresh if not already running
        if (shouldRefreshSession(storedSession) && !this.refreshTimer) {
          this.startAutoRefresh(storedSession);
        }
        
        return storedSession;
      }

      // Fall back to Supabase if no valid stored session
      const { data, error } = await this.supabaseClient.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }

      // Check if the Supabase session is expired
      if (data.session && isSessionExpired(data.session)) {
        this.handleExpiredSession();
        return null;
      }

      // Store the session if we got one from Supabase
      if (data.session) {
        try {
          storeSession(data.session);
        } catch (storageError) {
          if (storageError instanceof StorageQuotaError) {
            console.warn('Storage quota exceeded. Session will not persist across refreshes.');
          } else if (storageError instanceof StorageAccessError) {
            console.warn('Storage access denied. Session will not persist across refreshes.');
          }
          // Continue even if storage fails - session is still valid in memory
        }
        
        // Start automatic token refresh
        this.startAutoRefresh(data.session);
      }

      return data.session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Refresh the current session using the refresh token
   * Stores the refreshed session in browser storage
   * Restarts automatic token refresh for the new session
   * 
   * @returns Promise resolving to the refreshed session or null if refresh fails
   */
  async refreshSession(): Promise<Session | null> {
    try {
      const { data, error } = await this.supabaseClient.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return null;
      }

      // Store the refreshed session
      if (data.session) {
        try {
          storeSession(data.session);
        } catch (storageError) {
          if (storageError instanceof StorageQuotaError) {
            console.warn('Storage quota exceeded. Session will not persist across refreshes.');
          } else if (storageError instanceof StorageAccessError) {
            console.warn('Storage access denied. Session will not persist across refreshes.');
          }
          // Continue even if storage fails - session is still valid
        }
        
        // Restart automatic token refresh with the new session
        // Only restart if this is a manual refresh (not called from performAutoRefresh)
        if (!this.isRefreshing) {
          this.startAutoRefresh(data.session);
        }
      }

      return data.session;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
  }

  /**
   * Sign out the current user
   * Clears the session from Supabase and browser storage
   * Stops automatic token refresh
   * 
   * @returns Promise resolving when sign out is complete
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      // Stop automatic refresh
      this.stopAutoRefresh();
      
      const { error } = await this.supabaseClient.auth.signOut();
      
      // Clear session from storage regardless of Supabase result
      clearSession();
      
      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      // Still clear local storage even if Supabase call fails
      clearSession();
      return { error: error as Error };
    }
  }

  /**
   * Subscribe to authentication state changes
   * 
   * @param callback - Function to call when auth state changes
   * @returns Unsubscribe function to stop listening to auth changes
   */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ): () => void {
    const { data: { subscription } } = this.supabaseClient.auth.onAuthStateChange(callback);
    
    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Get the current authenticated user
   * 
   * @returns Promise resolving to the current user or null if not authenticated
   */
  async getUser(): Promise<User | null> {
    try {
      const { data, error } = await this.supabaseClient.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        return null;
      }

      return data.user;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Start automatic token refresh monitoring
   * Monitors token expiration time and refreshes proactively before expiration
   * 
   * @param session - The session to monitor
   * 
   * Requirements: 3.2, 3.4
   */
  startAutoRefresh(session: Session | null): void {
    // Clear any existing refresh timer
    this.stopAutoRefresh();

    if (!session) {
      return;
    }

    // Calculate when to refresh (5 minutes before expiry, as defined in session-storage)
    const timeUntilRefresh = getTimeUntilExpiry(session);

    if (timeUntilRefresh <= 0) {
      // Session is already expired or about to expire, refresh immediately
      this.performAutoRefresh();
      return;
    }

    // Schedule refresh before expiration
    this.refreshTimer = setTimeout(() => {
      this.performAutoRefresh();
    }, timeUntilRefresh);
  }

  /**
   * Stop automatic token refresh monitoring
   * Clears any scheduled refresh timers
   * 
   * Requirements: 3.2, 3.4
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Perform automatic token refresh
   * Handles refresh failures by triggering re-authentication
   * 
   * @private
   * Requirements: 3.2, 3.4
   */
  private async performAutoRefresh(): Promise<void> {
    // Prevent concurrent refresh attempts
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;

    try {
      const refreshedSession = await this.refreshSession();

      if (refreshedSession) {
        // Successfully refreshed - schedule next refresh
        this.startAutoRefresh(refreshedSession);
      } else {
        // Refresh failed - handle as expired session
        this.handleExpiredSession();
      }
    } catch (error) {
      console.error('Error during automatic token refresh:', error);
      // Handle refresh failure as expired session
      this.handleExpiredSession();
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Handle expired session
   * Clears expired session data and triggers re-authentication callbacks
   * 
   * Requirements: 3.3
   */
  private handleExpiredSession(): void {
    // Stop any active refresh timers
    this.stopAutoRefresh();
    
    // Clear expired session data from storage
    clearSession();
    
    // Notify all registered callbacks that session has expired
    this.sessionExpiredCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in session expired callback:', error);
      }
    });
  }

  /**
   * Register a callback to be called when session expires
   * This allows UI components to trigger re-authentication flow
   * 
   * @param callback - Function to call when session expires
   * @returns Unsubscribe function to stop listening to session expiration
   * 
   * Requirements: 3.3
   */
  onSessionExpired(callback: SessionExpiredCallback): () => void {
    this.sessionExpiredCallbacks.add(callback);
    
    return () => {
      this.sessionExpiredCallbacks.delete(callback);
    };
  }

  /**
   * Check if the current session is expired
   * 
   * @returns Promise resolving to true if session is expired, false otherwise
   * 
   * Requirements: 3.3
   */
  async isSessionExpired(): Promise<boolean> {
    try {
      const storedSession = retrieveSession();
      
      if (!storedSession) {
        return true; // No session means it's "expired"
      }

      return isSessionExpired(storedSession);
    } catch (error) {
      console.error('Error checking session expiration:', error);
      return true; // Assume expired on error
    }
  }
}

// Export a singleton instance using the production Supabase client
// This is what production code should use
export const authService = new AuthService();
