/**
 * Database Error Handler Utility
 * Provides centralized error handling and retry logic for database operations
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

/**
 * Database error types
 */
export enum DatabaseErrorType {
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  RLS_POLICY_VIOLATION = 'RLS_POLICY_VIOLATION',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Database error with type and user-friendly message
 */
export class DatabaseError extends Error {
  constructor(
    public type: DatabaseErrorType,
    public userMessage: string,
    public originalError?: Error
  ) {
    super(userMessage);
    this.name = 'DatabaseError';
  }
}

/**
 * Retry configuration for database operations
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Handle database errors and convert to user-friendly messages
 * 
 * @param error - The error from database operation
 * @returns DatabaseError with type and user-friendly message
 * 
 * Requirements: 6.1, 6.2, 6.3
 */
export function handleDatabaseError(error: any): DatabaseError {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';

  // Connection timeouts
  if (errorMessage.includes('timeout') || 
      errorMessage.includes('connection') ||
      errorMessage.includes('network') ||
      errorCode === 'ETIMEDOUT' ||
      errorCode === 'ECONNREFUSED') {
    return new DatabaseError(
      DatabaseErrorType.CONNECTION_TIMEOUT,
      'Unable to connect to the database. Please check your internet connection and try again.',
      error
    );
  }

  // RLS policy violations
  if (errorMessage.includes('policy') || 
      errorMessage.includes('permission') ||
      errorMessage.includes('forbidden') ||
      errorCode === '42501' || // Insufficient privilege
      errorCode === 'PGRST301') { // RLS policy violation
    return new DatabaseError(
      DatabaseErrorType.RLS_POLICY_VIOLATION,
      'You do not have permission to perform this action.',
      error
    );
  }

  // Constraint violations
  if (errorMessage.includes('unique') || 
      errorMessage.includes('duplicate') ||
      errorMessage.includes('constraint') ||
      errorCode === '23505' || // Unique violation
      errorCode === '23503' || // Foreign key violation
      errorCode === '23502') { // Not null violation
    return new DatabaseError(
      DatabaseErrorType.CONSTRAINT_VIOLATION,
      'This operation conflicts with existing data. Please check your input and try again.',
      error
    );
  }

  // Not found
  if (errorCode === 'PGRST116') {
    return new DatabaseError(
      DatabaseErrorType.NOT_FOUND,
      'The requested resource was not found.',
      error
    );
  }

  // Unknown error
  return new DatabaseError(
    DatabaseErrorType.UNKNOWN,
    'An unexpected database error occurred. Please try again.',
    error
  );
}

/**
 * Check if an error is retryable
 * 
 * @param error - The database error to check
 * @returns true if the error should be retried
 */
export function isRetryableError(error: DatabaseError): boolean {
  // Don't retry RLS violations, constraint violations, or not found errors
  return error.type !== DatabaseErrorType.RLS_POLICY_VIOLATION &&
         error.type !== DatabaseErrorType.CONSTRAINT_VIOLATION &&
         error.type !== DatabaseErrorType.NOT_FOUND;
}

/**
 * Retry a database operation with exponential backoff
 * 
 * @param operation - The async operation to retry
 * @param operationName - Name of the operation for logging
 * @param config - Retry configuration (optional, uses defaults if not provided)
 * @returns Promise resolving to the operation result
 * 
 * Requirements: 6.1, 6.2, 6.3
 */
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Convert to DatabaseError if not already
      const dbError = error instanceof DatabaseError 
        ? error 
        : handleDatabaseError(error);
      
      // Check if error is retryable
      if (!isRetryableError(dbError)) {
        throw dbError;
      }

      // If this was the last attempt, throw the error
      if (attempt === config.maxRetries) {
        console.error(`${operationName} failed after ${config.maxRetries} retries:`, error);
        throw dbError;
      }

      // Wait before retrying
      console.warn(`${operationName} failed (attempt ${attempt + 1}/${config.maxRetries + 1}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error(`${operationName} failed`);
}

/**
 * Wrap a database operation with error handling
 * Converts errors to DatabaseError but does not retry
 * 
 * @param operation - The async operation to wrap
 * @param operationName - Name of the operation for logging
 * @returns Promise resolving to the operation result
 */
export async function wrapDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`${operationName} failed:`, error);
    throw error instanceof DatabaseError ? error : handleDatabaseError(error);
  }
}
