import type { Session } from '@supabase/supabase-js';

/**
 * Session Storage Utilities
 * Manages secure storage and retrieval of authentication sessions in the browser
 * Handles storage quota errors and session expiration
 * Gracefully degrades to in-memory storage when persistent storage is unavailable
 * 
 * Requirements: 3.1, 3.2, 3.4
 */

const SESSION_STORAGE_KEY = 'slop_cultivator_session';
const SESSION_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes buffer before actual expiry

/**
 * In-memory session storage fallback
 * Used when localStorage is unavailable or quota is exceeded
 */
let inMemorySession: StoredSessionData | null = null;

/**
 * Track if we're using in-memory storage
 */
let usingInMemoryStorage = false;

/**
 * Callbacks for storage warnings
 */
type StorageWarningCallback = (message: string) => void;
const storageWarningCallbacks: Set<StorageWarningCallback> = new Set();

/**
 * Storage error types
 */
export class StorageQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

export class StorageAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageAccessError';
  }
}

/**
 * Stored session data structure
 */
interface StoredSessionData {
  session: Session;
  storedAt: number;
}

/**
 * Check if storage is available
 * Handles private browsing mode and storage access restrictions
 */
function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Store session securely in browser storage
 * Gracefully degrades to in-memory storage if persistent storage fails
 * 
 * @param session - The session to store
 * @throws {StorageQuotaError} When storage quota is exceeded (after falling back to memory)
 * @throws {StorageAccessError} When storage access is denied (after falling back to memory)
 * 
 * Requirements: 3.1, 3.2
 */
export function storeSession(session: Session): void {
  const sessionData: StoredSessionData = {
    session,
    storedAt: Date.now(),
  };

  // Try persistent storage first
  if (isStorageAvailable()) {
    try {
      const serialized = JSON.stringify(sessionData);
      localStorage.setItem(SESSION_STORAGE_KEY, serialized);
      usingInMemoryStorage = false;
      return;
    } catch (error) {
      // Check if it's a quota exceeded error
      if (error instanceof Error && 
          (error.name === 'QuotaExceededError' || 
           error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        // Fall back to in-memory storage
        inMemorySession = sessionData;
        usingInMemoryStorage = true;
        
        const warningMessage = 'Storage quota exceeded. Session will only persist in memory and will be lost on page refresh.';
        notifyStorageWarning(warningMessage);
        
        throw new StorageQuotaError(warningMessage);
      }
      
      // Other storage errors - fall back to in-memory
      inMemorySession = sessionData;
      usingInMemoryStorage = true;
      
      const warningMessage = `Failed to store session persistently: ${error instanceof Error ? error.message : 'Unknown error'}. Session will only persist in memory.`;
      notifyStorageWarning(warningMessage);
      
      throw new StorageAccessError(warningMessage);
    }
  } else {
    // Storage not available - use in-memory
    inMemorySession = sessionData;
    usingInMemoryStorage = true;
    
    const warningMessage = 'Storage access is denied (possibly private browsing mode). Session will only persist in memory and will be lost on page refresh.';
    notifyStorageWarning(warningMessage);
    
    throw new StorageAccessError(warningMessage);
  }
}

/**
 * Retrieve session from browser storage or in-memory fallback
 * Returns null if no session is stored
 * 
 * @param checkExpiration - If true, check expiration and return null for expired sessions (default: true)
 * @param autoClear - If true, automatically clear expired sessions (default: true)
 * @returns The stored session or null
 * 
 * Requirements: 3.1, 3.2
 */
export function retrieveSession(checkExpiration: boolean = true, autoClear: boolean = true): Session | null {
  // Try in-memory storage first if we're using it
  if (usingInMemoryStorage && inMemorySession) {
    // Check if session is expired (if requested)
    if (checkExpiration && isSessionExpired(inMemorySession.session)) {
      // Clean up expired session if autoClear is enabled
      if (autoClear) {
        inMemorySession = null;
      }
      return null;
    }
    return inMemorySession.session;
  }

  // Try persistent storage
  if (isStorageAvailable()) {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (!stored) {
        // Check in-memory as fallback
        if (inMemorySession) {
          if (checkExpiration && isSessionExpired(inMemorySession.session)) {
            if (autoClear) {
              inMemorySession = null;
            }
            return null;
          }
          return inMemorySession.session;
        }
        return null;
      }

      const sessionData: StoredSessionData = JSON.parse(stored);
      
      // Check if session is expired (if requested)
      if (checkExpiration && isSessionExpired(sessionData.session)) {
        // Clean up expired session if autoClear is enabled
        if (autoClear) {
          clearSession();
        }
        return null;
      }

      return sessionData.session;
    } catch (error) {
      console.error('Error retrieving session from storage:', error);
      // Try in-memory fallback
      if (inMemorySession) {
        if (checkExpiration && isSessionExpired(inMemorySession.session)) {
          if (autoClear) {
            inMemorySession = null;
          }
          return null;
        }
        return inMemorySession.session;
      }
      // Clear corrupted session data
      clearSession();
      return null;
    }
  } else {
    // Storage not available - check in-memory
    if (inMemorySession) {
      if (checkExpiration && isSessionExpired(inMemorySession.session)) {
        if (autoClear) {
          inMemorySession = null;
        }
        return null;
      }
      return inMemorySession.session;
    }
    return null;
  }
}

/**
 * Check if a session is expired
 * Uses a buffer time to proactively detect expiring sessions
 * 
 * @param session - The session to check
 * @returns true if the session is expired or about to expire
 */
export function isSessionExpired(session: Session): boolean {
  if (!session.expires_at) {
    // If no expiry time, consider it expired
    return true;
  }

  const expiryTime = session.expires_at * 1000; // Convert to milliseconds
  const now = Date.now();
  
  // Consider expired if within buffer time of actual expiry
  return now >= (expiryTime - SESSION_EXPIRY_BUFFER_MS);
}

/**
 * Clear session from browser storage and in-memory storage
 * Should be called on sign-out or when session is expired
 * 
 * Requirements: 3.1, 3.2
 */
export function clearSession(): void {
  // Clear in-memory session
  inMemorySession = null;
  usingInMemoryStorage = false;

  // Clear persistent storage if available
  if (isStorageAvailable()) {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing session from storage:', error);
    }
  }
}

/**
 * Get time until session expires in milliseconds
 * Returns 0 if session is already expired
 * 
 * @param session - The session to check
 * @returns Milliseconds until expiry, or 0 if expired
 */
export function getTimeUntilExpiry(session: Session): number {
  if (!session.expires_at) {
    return 0;
  }

  const expiryTime = session.expires_at * 1000;
  const now = Date.now();
  const timeRemaining = expiryTime - now;

  return Math.max(0, timeRemaining);
}

/**
 * Check if session needs refresh
 * Returns true if session is within the buffer time before expiry
 * 
 * @param session - The session to check
 * @returns true if session should be refreshed
 */
export function shouldRefreshSession(session: Session): boolean {
  const timeUntilExpiry = getTimeUntilExpiry(session);
  return timeUntilExpiry > 0 && timeUntilExpiry <= SESSION_EXPIRY_BUFFER_MS;
}

/**
 * Clean up all expired sessions from storage
 * Can be called periodically to maintain storage hygiene
 */
export function cleanupExpiredSessions(): void {
  const session = retrieveSession();
  
  // retrieveSession already clears expired sessions
  // This function is here for explicit cleanup calls
  if (session && isSessionExpired(session)) {
    clearSession();
  }
}

/**
 * Check if currently using in-memory storage fallback
 * 
 * @returns true if using in-memory storage, false if using persistent storage
 * 
 * Requirements: 3.1, 3.2
 */
export function isUsingInMemoryStorage(): boolean {
  return usingInMemoryStorage;
}

/**
 * Register a callback to be notified of storage warnings
 * Useful for displaying warnings to users about persistence limitations
 * 
 * @param callback - Function to call when storage warning occurs
 * @returns Unsubscribe function
 * 
 * Requirements: 3.1, 3.2
 */
export function onStorageWarning(callback: StorageWarningCallback): () => void {
  storageWarningCallbacks.add(callback);
  return () => {
    storageWarningCallbacks.delete(callback);
  };
}

/**
 * Notify all registered callbacks of a storage warning
 * 
 * @private
 * @param message - Warning message to send
 */
function notifyStorageWarning(message: string): void {
  storageWarningCallbacks.forEach(callback => {
    try {
      callback(message);
    } catch (error) {
      console.error('Error in storage warning callback:', error);
    }
  });
}
