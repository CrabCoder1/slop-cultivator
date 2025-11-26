import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '../../../shared/utils/auth-service';
import { profileService } from '../../../shared/utils/profile-service';
import { guestMigrationService } from '../../../shared/utils/guest-migration-service';
import { onStorageWarning, isUsingInMemoryStorage } from '../../../shared/utils/session-storage';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '../../../shared/utils/profile-service';

/**
 * Authentication context value interface
 * Provides authentication state and methods throughout the application
 */
export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuestMode: boolean;
  hasGuestData: boolean;
  storageWarning: string | null;
  isUsingInMemoryStorage: boolean;
  signOut: () => Promise<void>;
  enableGuestMode: () => void;
  dismissStorageWarning: () => void;
}

/**
 * Authentication context
 * Provides authentication state to all child components
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Props for AuthProvider component
 */
export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Guest mode storage key
 */
const GUEST_MODE_KEY = 'wuxia_guest_mode';

/**
 * Authentication Provider Component
 * Manages authentication state and session lifecycle
 * 
 * Features:
 * - Restores session on mount from browser storage
 * - Listens for auth state changes
 * - Handles session expiration
 * - Provides authentication methods to children
 * - Supports guest mode for unauthenticated play
 * 
 * Requirements: 1.1, 2.1, 5.1, 5.2, 7.4
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [hasGuestData, setHasGuestData] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [usingInMemory, setUsingInMemory] = useState(false);

  /**
   * Load user profile from database with timeout
   */
  const loadProfile = useCallback(async (userId: string) => {
    try {
      console.log('[loadProfile] Starting profile load for:', userId);
      
      // Add timeout to prevent infinite hanging (reduced to 3s for faster failures)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 3000)
      );
      
      const profilePromise = profileService.getProfile(userId);
      
      const userProfile = await Promise.race([profilePromise, timeoutPromise]) as UserProfile | null;
      
      console.log('[loadProfile] Profile loaded:', userProfile);
      return userProfile;
    } catch (error) {
      console.error('[loadProfile] Error loading profile:', error);
      // Return null instead of throwing - app can continue without profile
      return null;
    }
  }, []);

  /**
   * Initialize authentication state on mount
   * Restores session from browser storage if available
   * Also checks for guest mode flag and guest data
   * 
   * Note: OAuth callback is handled automatically by Supabase's detectSessionInUrl
   * We don't need to manually detect or process OAuth params
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check for guest data
        const hasData = guestMigrationService.hasGuestData();
        setHasGuestData(hasData);
        
        // Check if user was in guest mode
        const guestModeFlag = localStorage.getItem(GUEST_MODE_KEY);
        if (guestModeFlag === 'true') {
          setIsGuestMode(true);
          setIsLoading(false);
          return;
        }
        
        // Try to restore session from storage
        // If this is an OAuth callback, Supabase will automatically:
        // 1. Detect OAuth params in URL (via detectSessionInUrl: true)
        // 2. Exchange code for session
        // 3. Store session in localStorage
        // 4. Fire onAuthStateChange with SIGNED_IN event
        // 5. Clean up URL automatically
        const currentSession = await authService.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Mark auth as loaded immediately - profile can load in background
          setIsLoading(false);
          
          // Load user profile in background (non-blocking)
          loadProfile(currentSession.user.id).then(userProfile => {
            setProfile(userProfile);
          }).catch(error => {
            console.error('Background profile load failed:', error);
            // Continue without profile - not critical
          });
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsLoading(false);
      }
    };

    initAuth();
  }, [loadProfile]);

  /**
   * Subscribe to authentication state changes
   * Updates local state when auth state changes (sign in, sign out, token refresh)
   */
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event, newSession);
      
      setSession(newSession);
      setUser(newSession?.user || null);
      
      // Load profile when user signs in
      if (newSession?.user) {
        console.log('Loading profile for user:', newSession.user.id);
        
        // Mark auth as loaded immediately - profile can load in background
        setIsLoading(false);
        
        // Load profile in background (non-blocking)
        loadProfile(newSession.user.id).then(userProfile => {
          console.log('Profile loaded successfully:', userProfile);
          setProfile(userProfile);
        }).catch(error => {
          console.error('Error loading profile in auth state change:', error);
          // Continue anyway - user can still use the app
        });
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadProfile]);

  /**
   * Subscribe to session expiration events
   * Clears local state and triggers re-authentication when session expires
   */
  useEffect(() => {
    const unsubscribe = authService.onSessionExpired(() => {
      console.log('Session expired, clearing state');
      setSession(null);
      setUser(null);
      setProfile(null);
      // UI components can listen to isAuthenticated to show login screen
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Subscribe to storage warnings
   * Displays warnings to users about persistence limitations
   * 
   * Requirements: 3.1, 3.2
   */
  useEffect(() => {
    const unsubscribe = onStorageWarning((message) => {
      console.warn('Storage warning:', message);
      setStorageWarning(message);
      setUsingInMemory(isUsingInMemoryStorage());
    });

    // Check initial state
    setUsingInMemory(isUsingInMemoryStorage());

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Dismiss storage warning
   */
  const dismissStorageWarning = useCallback(() => {
    setStorageWarning(null);
  }, []);

  /**
   * Sign out the current user
   * Clears session and redirects to login
   * Also clears guest mode if active
   */
  const signOut = useCallback(async () => {
    try {
      // If in guest mode, just clear the flag
      if (isGuestMode) {
        localStorage.removeItem(GUEST_MODE_KEY);
        setIsGuestMode(false);
        return;
      }
      
      // Otherwise, sign out from authenticated session
      await authService.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, [isGuestMode]);

  /**
   * Enable guest mode
   * Allows gameplay without authentication
   * Stores guest mode flag in localStorage
   * 
   * Requirements: 5.1, 5.2
   */
  const enableGuestMode = useCallback(() => {
    localStorage.setItem(GUEST_MODE_KEY, 'true');
    setIsGuestMode(true);
    setIsLoading(false);
  }, []);

  const value: AuthContextValue = {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!session && !!user,
    isGuestMode,
    hasGuestData,
    storageWarning,
    isUsingInMemoryStorage: usingInMemory,
    signOut,
    enableGuestMode,
    dismissStorageWarning,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 * Must be used within an AuthProvider
 * 
 * @returns Authentication context value
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
