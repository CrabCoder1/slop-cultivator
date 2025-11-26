/**
 * Authentication Monitoring and Logging Service
 * 
 * Tracks authentication metrics, logs errors, and monitors security patterns.
 * This service provides insights into authentication system health and usage.
 */

import type { Session, AuthError } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface AuthMetrics {
  successCount: number;
  failureCount: number;
  providerMetrics: Record<string, ProviderMetrics>;
  sessionMetrics: SessionMetrics;
  securityMetrics: SecurityMetrics;
}

export interface ProviderMetrics {
  provider: string;
  successCount: number;
  failureCount: number;
  averageResponseTime: number;
  lastUsed: Date | null;
}

export interface SessionMetrics {
  activeSessions: number;
  averageDuration: number;
  refreshCount: number;
  expirationCount: number;
}

export interface SecurityMetrics {
  failedAttempts: number;
  suspiciousPatterns: number;
  lastFailedAttempt: Date | null;
}

export interface AuthEvent {
  type: 'sign_in' | 'sign_out' | 'session_refresh' | 'session_expired' | 'error';
  provider?: string;
  success: boolean;
  timestamp: Date;
  duration?: number;
  error?: AuthError;
  userId?: string;
}

// ============================================================================
// Storage Keys
// ============================================================================

const METRICS_STORAGE_KEY = 'auth_metrics';
const EVENTS_STORAGE_KEY = 'auth_events';
const MAX_STORED_EVENTS = 100;

// ============================================================================
// Monitoring Service
// ============================================================================

class AuthMonitoringService {
  private metrics: AuthMetrics;
  private events: AuthEvent[] = [];
  private sessionStartTimes: Map<string, Date> = new Map();

  constructor() {
    this.metrics = this.loadMetrics();
    this.events = this.loadEvents();
  }

  // ==========================================================================
  // Event Tracking
  // ==========================================================================

  /**
   * Track a sign-in attempt
   */
  trackSignIn(provider: string, success: boolean, duration: number, error?: AuthError, userId?: string): void {
    const event: AuthEvent = {
      type: 'sign_in',
      provider,
      success,
      timestamp: new Date(),
      duration,
      error,
      userId,
    };

    this.recordEvent(event);

    if (success) {
      this.metrics.successCount++;
      this.updateProviderMetrics(provider, true, duration);
    } else {
      this.metrics.failureCount++;
      this.updateProviderMetrics(provider, false, duration);
      this.updateSecurityMetrics(false);
    }

    this.saveMetrics();
  }

  /**
   * Track a sign-out event
   */
  trackSignOut(userId: string): void {
    const event: AuthEvent = {
      type: 'sign_out',
      success: true,
      timestamp: new Date(),
      userId,
    };

    this.recordEvent(event);

    // Calculate session duration if we have a start time
    const startTime = this.sessionStartTimes.get(userId);
    if (startTime) {
      const duration = Date.now() - startTime.getTime();
      this.updateSessionDuration(duration);
      this.sessionStartTimes.delete(userId);
    }

    this.saveMetrics();
  }

  /**
   * Track a session refresh
   */
  trackSessionRefresh(success: boolean, error?: AuthError): void {
    const event: AuthEvent = {
      type: 'session_refresh',
      success,
      timestamp: new Date(),
      error,
    };

    this.recordEvent(event);

    if (success) {
      this.metrics.sessionMetrics.refreshCount++;
    } else {
      this.updateSecurityMetrics(false);
    }

    this.saveMetrics();
  }

  /**
   * Track a session expiration
   */
  trackSessionExpired(userId?: string): void {
    const event: AuthEvent = {
      type: 'session_expired',
      success: true,
      timestamp: new Date(),
      userId,
    };

    this.recordEvent(event);
    this.metrics.sessionMetrics.expirationCount++;
    this.saveMetrics();
  }

  /**
   * Track an authentication error
   */
  trackError(error: AuthError, context?: { provider?: string; userId?: string }): void {
    const event: AuthEvent = {
      type: 'error',
      success: false,
      timestamp: new Date(),
      error,
      provider: context?.provider,
      userId: context?.userId,
    };

    this.recordEvent(event);
    this.updateSecurityMetrics(false);
    this.saveMetrics();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Auth Error]', {
        message: error.message,
        status: error.status,
        provider: context?.provider,
        timestamp: event.timestamp,
      });
    }
  }

  /**
   * Mark the start of a session
   */
  startSession(userId: string): void {
    this.sessionStartTimes.set(userId, new Date());
    this.metrics.sessionMetrics.activeSessions++;
    this.saveMetrics();
  }

  // ==========================================================================
  // Metrics Retrieval
  // ==========================================================================

  /**
   * Get current authentication metrics
   */
  getMetrics(): AuthMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent authentication events
   */
  getRecentEvents(limit: number = 20): AuthEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get metrics for a specific provider
   */
  getProviderMetrics(provider: string): ProviderMetrics | null {
    return this.metrics.providerMetrics[provider] || null;
  }

  /**
   * Get authentication success rate
   */
  getSuccessRate(): number {
    const total = this.metrics.successCount + this.metrics.failureCount;
    if (total === 0) return 0;
    return (this.metrics.successCount / total) * 100;
  }

  /**
   * Get provider response times
   */
  getProviderResponseTimes(): Record<string, number> {
    const times: Record<string, number> = {};
    for (const [provider, metrics] of Object.entries(this.metrics.providerMetrics)) {
      times[provider] = metrics.averageResponseTime;
    }
    return times;
  }

  /**
   * Check if there are suspicious security patterns
   */
  hasSuspiciousActivity(): boolean {
    // Check for multiple failed attempts in short time
    const recentFailures = this.events
      .filter(e => !e.success && Date.now() - e.timestamp.getTime() < 5 * 60 * 1000) // Last 5 minutes
      .length;

    return recentFailures >= 5;
  }

  // ==========================================================================
  // Reset and Clear
  // ==========================================================================

  /**
   * Reset all metrics (useful for testing or fresh start)
   */
  resetMetrics(): void {
    this.metrics = this.createEmptyMetrics();
    this.events = [];
    this.sessionStartTimes.clear();
    this.saveMetrics();
    this.saveEvents();
  }

  /**
   * Clear old events (keep only recent ones)
   */
  clearOldEvents(): void {
    if (this.events.length > MAX_STORED_EVENTS) {
      this.events = this.events.slice(-MAX_STORED_EVENTS);
      this.saveEvents();
    }
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  private recordEvent(event: AuthEvent): void {
    this.events.push(event);
    
    // Keep only the most recent events
    if (this.events.length > MAX_STORED_EVENTS) {
      this.events = this.events.slice(-MAX_STORED_EVENTS);
    }
    
    this.saveEvents();
  }

  private updateProviderMetrics(provider: string, success: boolean, duration: number): void {
    if (!this.metrics.providerMetrics[provider]) {
      this.metrics.providerMetrics[provider] = {
        provider,
        successCount: 0,
        failureCount: 0,
        averageResponseTime: 0,
        lastUsed: null,
      };
    }

    const metrics = this.metrics.providerMetrics[provider];
    
    if (success) {
      metrics.successCount++;
    } else {
      metrics.failureCount++;
    }

    // Update average response time
    const totalAttempts = metrics.successCount + metrics.failureCount;
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (totalAttempts - 1) + duration) / totalAttempts;

    metrics.lastUsed = new Date();
  }

  private updateSessionDuration(duration: number): void {
    const currentAvg = this.metrics.sessionMetrics.averageDuration;
    const count = this.metrics.sessionMetrics.activeSessions;
    
    // Calculate new average
    this.metrics.sessionMetrics.averageDuration = 
      (currentAvg * (count - 1) + duration) / count;
  }

  private updateSecurityMetrics(success: boolean): void {
    if (!success) {
      this.metrics.securityMetrics.failedAttempts++;
      this.metrics.securityMetrics.lastFailedAttempt = new Date();

      // Check for suspicious patterns
      if (this.hasSuspiciousActivity()) {
        this.metrics.securityMetrics.suspiciousPatterns++;
      }
    }
  }

  private createEmptyMetrics(): AuthMetrics {
    return {
      successCount: 0,
      failureCount: 0,
      providerMetrics: {},
      sessionMetrics: {
        activeSessions: 0,
        averageDuration: 0,
        refreshCount: 0,
        expirationCount: 0,
      },
      securityMetrics: {
        failedAttempts: 0,
        suspiciousPatterns: 0,
        lastFailedAttempt: null,
      },
    };
  }

  // ==========================================================================
  // Storage Methods
  // ==========================================================================

  private loadMetrics(): AuthMetrics {
    try {
      const stored = localStorage.getItem(METRICS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (parsed.securityMetrics?.lastFailedAttempt) {
          parsed.securityMetrics.lastFailedAttempt = new Date(parsed.securityMetrics.lastFailedAttempt);
        }
        for (const provider in parsed.providerMetrics) {
          if (parsed.providerMetrics[provider].lastUsed) {
            parsed.providerMetrics[provider].lastUsed = new Date(parsed.providerMetrics[provider].lastUsed);
          }
        }
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load auth metrics:', error);
    }
    return this.createEmptyMetrics();
  }

  private saveMetrics(): void {
    try {
      localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Failed to save auth metrics:', error);
    }
  }

  private loadEvents(): AuthEvent[] {
    try {
      const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load auth events:', error);
    }
    return [];
  }

  private saveEvents(): void {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save auth events:', error);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const authMonitoringService = new AuthMonitoringService();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format metrics for display or logging
 */
export function formatMetrics(metrics: AuthMetrics): string {
  const successRate = metrics.successCount + metrics.failureCount > 0
    ? ((metrics.successCount / (metrics.successCount + metrics.failureCount)) * 100).toFixed(2)
    : '0.00';

  return `
Authentication Metrics:
- Success Rate: ${successRate}%
- Total Successes: ${metrics.successCount}
- Total Failures: ${metrics.failureCount}
- Active Sessions: ${metrics.sessionMetrics.activeSessions}
- Session Refreshes: ${metrics.sessionMetrics.refreshCount}
- Failed Attempts: ${metrics.securityMetrics.failedAttempts}
- Suspicious Patterns: ${metrics.securityMetrics.suspiciousPatterns}

Provider Metrics:
${Object.entries(metrics.providerMetrics).map(([provider, m]) => 
  `- ${provider}: ${m.successCount} successes, ${m.failureCount} failures, ${m.averageResponseTime.toFixed(0)}ms avg`
).join('\n')}
  `.trim();
}

/**
 * Log metrics to console (development only)
 */
export function logMetrics(): void {
  if (process.env.NODE_ENV === 'development') {
    const metrics = authMonitoringService.getMetrics();
    console.log(formatMetrics(metrics));
  }
}

/**
 * Export metrics as JSON for external monitoring
 */
export function exportMetrics(): string {
  const metrics = authMonitoringService.getMetrics();
  return JSON.stringify(metrics, null, 2);
}
