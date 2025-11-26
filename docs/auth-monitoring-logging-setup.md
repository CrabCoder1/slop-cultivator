# Authentication Monitoring and Logging Setup

This document describes the monitoring and logging infrastructure for the authentication system in Slop Cultivator.

## Overview

The authentication monitoring system tracks:
- Authentication success/failure rates
- OAuth provider response times
- Session duration and refresh rates
- Security patterns and suspicious activity
- Error context for debugging

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Auth Service Layer                         │
│  - signInWithProvider()                                     │
│  - signOut()                                                │
│  - refreshSession()                                         │
│  - onAuthStateChange()                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Auth Monitoring Service                         │
│  - trackSignIn()                                            │
│  - trackSignOut()                                           │
│  - trackSessionRefresh()                                    │
│  - trackSessionExpired()                                    │
│  - trackError()                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Local Storage                               │
│  - auth_metrics (aggregated metrics)                        │
│  - auth_events (recent event log)                           │
└─────────────────────────────────────────────────────────────┘
```

## Metrics Tracked

### Authentication Metrics

**Success/Failure Counts**:
- Total successful authentications
- Total failed authentications
- Success rate percentage

**Provider-Specific Metrics**:
- Success count per provider (Google, Discord)
- Failure count per provider
- Average response time per provider
- Last used timestamp per provider

**Session Metrics**:
- Number of active sessions
- Average session duration
- Session refresh count
- Session expiration count

**Security Metrics**:
- Failed authentication attempts
- Suspicious activity patterns
- Last failed attempt timestamp

## Implementation

### Auth Monitoring Service

Location: `shared/utils/auth-monitoring-service.ts`

The service provides the following methods:

```typescript
// Track authentication events
authMonitoringService.trackSignIn(provider, success, duration, error, userId);
authMonitoringService.trackSignOut(userId);
authMonitoringService.trackSessionRefresh(success, error);
authMonitoringService.trackSessionExpired(userId);
authMonitoringService.trackError(error, context);

// Retrieve metrics
const metrics = authMonitoringService.getMetrics();
const events = authMonitoringService.getRecentEvents(20);
const successRate = authMonitoringService.getSuccessRate();
const responseTimes = authMonitoringService.getProviderResponseTimes();

// Security monitoring
const hasSuspiciousActivity = authMonitoringService.hasSuspiciousActivity();

// Maintenance
authMonitoringService.resetMetrics();
authMonitoringService.clearOldEvents();
```

### Integration Points

The monitoring service should be integrated at the following points in the auth service:

**1. Sign-In Flow** (`signInWithProvider`):
```typescript
const startTime = Date.now();
// ... OAuth flow ...
const duration = Date.now() - startTime;

if (success) {
  authMonitoringService.trackSignIn(provider, true, duration, undefined, userId);
  authMonitoringService.startSession(userId);
} else {
  authMonitoringService.trackSignIn(provider, false, duration, error);
}
```

**2. Sign-Out Flow** (`signOut`):
```typescript
const userId = session?.user?.id;
// ... sign out logic ...
if (userId) {
  authMonitoringService.trackSignOut(userId);
}
```

**3. Session Refresh** (`refreshSession`):
```typescript
// ... refresh logic ...
if (success) {
  authMonitoringService.trackSessionRefresh(true);
} else {
  authMonitoringService.trackSessionRefresh(false, error);
}
```

**4. Session Expiration** (in session storage):
```typescript
if (isSessionExpired(session)) {
  authMonitoringService.trackSessionExpired(session.user?.id);
}
```

**5. Error Handling** (throughout auth service):
```typescript
catch (error) {
  authMonitoringService.trackError(error, { provider, userId });
  throw error;
}
```

## Data Storage

### Local Storage Schema

**auth_metrics**:
```json
{
  "successCount": 42,
  "failureCount": 3,
  "providerMetrics": {
    "google": {
      "provider": "google",
      "successCount": 25,
      "failureCount": 1,
      "averageResponseTime": 1250,
      "lastUsed": "2024-11-23T10:30:00Z"
    },
    "discord": {
      "provider": "discord",
      "successCount": 17,
      "failureCount": 2,
      "averageResponseTime": 980,
      "lastUsed": "2024-11-23T09:15:00Z"
    }
  },
  "sessionMetrics": {
    "activeSessions": 1,
    "averageDuration": 3600000,
    "refreshCount": 15,
    "expirationCount": 2
  },
  "securityMetrics": {
    "failedAttempts": 3,
    "suspiciousPatterns": 0,
    "lastFailedAttempt": "2024-11-23T08:45:00Z"
  }
}
```

**auth_events** (array of recent events):
```json
[
  {
    "type": "sign_in",
    "provider": "google",
    "success": true,
    "timestamp": "2024-11-23T10:30:00Z",
    "duration": 1250,
    "userId": "user-uuid-123"
  },
  {
    "type": "session_refresh",
    "success": true,
    "timestamp": "2024-11-23T11:30:00Z"
  },
  {
    "type": "error",
    "success": false,
    "timestamp": "2024-11-23T08:45:00Z",
    "error": {
      "message": "Network error",
      "status": 500
    },
    "provider": "discord"
  }
]
```

### Storage Limits

- Maximum stored events: 100 (oldest events are automatically removed)
- Metrics are aggregated and don't have a size limit
- Storage is per-browser (not synced across devices)

## Logging

### Development Logging

In development mode, errors are automatically logged to the console:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.error('[Auth Error]', {
    message: error.message,
    status: error.status,
    provider: context?.provider,
    timestamp: event.timestamp,
  });
}
```

### Production Logging

For production, consider integrating with external logging services:

**Option 1: Supabase Logs**
- Authentication events are automatically logged by Supabase
- Access logs via Supabase Dashboard → Logs → Auth

**Option 2: External Service (Sentry, LogRocket, etc.)**
```typescript
// Example integration with Sentry
import * as Sentry from '@sentry/react';

authMonitoringService.trackError(error, context);
Sentry.captureException(error, {
  tags: {
    provider: context?.provider,
    type: 'auth_error',
  },
  extra: {
    userId: context?.userId,
    metrics: authMonitoringService.getMetrics(),
  },
});
```

## Monitoring Dashboard

### Viewing Metrics in Development

Add a debug panel to your app:

```typescript
import { authMonitoringService, formatMetrics } from '@/shared/utils/auth-monitoring-service';

function AuthDebugPanel() {
  const [metrics, setMetrics] = useState(authMonitoringService.getMetrics());
  const [events, setEvents] = useState(authMonitoringService.getRecentEvents(10));

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(authMonitoringService.getMetrics());
      setEvents(authMonitoringService.getRecentEvents(10));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="auth-debug-panel">
      <h3>Authentication Metrics</h3>
      <pre>{formatMetrics(metrics)}</pre>
      
      <h3>Recent Events</h3>
      <ul>
        {events.map((event, i) => (
          <li key={i}>
            {event.timestamp.toLocaleTimeString()} - {event.type} - 
            {event.success ? '✓' : '✗'} {event.provider}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Browser Console Commands

Access metrics from the browser console:

```javascript
// Get current metrics
authMonitoringService.getMetrics()

// Get success rate
authMonitoringService.getSuccessRate()

// Get recent events
authMonitoringService.getRecentEvents(20)

// Check for suspicious activity
authMonitoringService.hasSuspiciousActivity()

// Export metrics as JSON
exportMetrics()

// Reset all metrics
authMonitoringService.resetMetrics()
```

## Security Monitoring

### Suspicious Activity Detection

The system automatically detects suspicious patterns:

**Criteria**:
- 5 or more failed authentication attempts within 5 minutes
- Rapid succession of authentication attempts
- Multiple providers failing simultaneously

**Response**:
```typescript
if (authMonitoringService.hasSuspiciousActivity()) {
  // Log security event
  console.warn('[Security] Suspicious authentication activity detected');
  
  // Optionally: Rate limit, show CAPTCHA, notify admins
  // This is application-specific and should be implemented based on requirements
}
```

### Failed Attempt Tracking

Failed attempts are tracked with context:

```typescript
const metrics = authMonitoringService.getMetrics();
console.log(`Failed attempts: ${metrics.securityMetrics.failedAttempts}`);
console.log(`Last failed: ${metrics.securityMetrics.lastFailedAttempt}`);
```

## Performance Monitoring

### Provider Response Times

Track OAuth provider performance:

```typescript
const responseTimes = authMonitoringService.getProviderResponseTimes();
console.log('Provider Response Times:', responseTimes);
// { google: 1250, discord: 980 }

// Alert if response time is too high
Object.entries(responseTimes).forEach(([provider, time]) => {
  if (time > 3000) {
    console.warn(`${provider} response time is high: ${time}ms`);
  }
});
```

### Session Duration Tracking

Monitor average session duration:

```typescript
const metrics = authMonitoringService.getMetrics();
const avgDuration = metrics.sessionMetrics.averageDuration;
const hours = (avgDuration / (1000 * 60 * 60)).toFixed(2);
console.log(`Average session duration: ${hours} hours`);
```

## Alerts and Notifications

### Setting Up Alerts

Implement custom alerts based on metrics:

```typescript
// Check metrics periodically
setInterval(() => {
  const metrics = authMonitoringService.getMetrics();
  const successRate = authMonitoringService.getSuccessRate();

  // Alert on low success rate
  if (successRate < 80 && metrics.successCount + metrics.failureCount > 10) {
    console.error(`⚠️ Auth success rate is low: ${successRate.toFixed(2)}%`);
    // Send notification to admins
  }

  // Alert on suspicious activity
  if (authMonitoringService.hasSuspiciousActivity()) {
    console.error('⚠️ Suspicious authentication activity detected');
    // Send security alert
  }

  // Alert on provider issues
  const responseTimes = authMonitoringService.getProviderResponseTimes();
  Object.entries(responseTimes).forEach(([provider, time]) => {
    if (time > 5000) {
      console.error(`⚠️ ${provider} is responding slowly: ${time}ms`);
      // Send performance alert
    }
  });
}, 60000); // Check every minute
```

## Data Export

### Exporting Metrics

Export metrics for external analysis:

```typescript
import { exportMetrics } from '@/shared/utils/auth-monitoring-service';

// Export as JSON string
const metricsJson = exportMetrics();

// Send to analytics service
fetch('/api/analytics/auth-metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: metricsJson,
});

// Or download as file
const blob = new Blob([metricsJson], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `auth-metrics-${Date.now()}.json`;
a.click();
```

## Maintenance

### Clearing Old Data

Periodically clear old events to prevent storage bloat:

```typescript
// Clear old events (keeps only most recent 100)
authMonitoringService.clearOldEvents();

// Or reset all metrics (use with caution)
authMonitoringService.resetMetrics();
```

### Storage Cleanup

Implement automatic cleanup:

```typescript
// Run cleanup daily
setInterval(() => {
  authMonitoringService.clearOldEvents();
}, 24 * 60 * 60 * 1000);
```

## Best Practices

1. **Don't log sensitive data**: Never log passwords, tokens, or PII
2. **Aggregate metrics**: Store aggregated metrics, not individual user data
3. **Limit event storage**: Keep only recent events (100 max)
4. **Monitor in production**: Set up alerts for critical issues
5. **Regular cleanup**: Clear old data periodically
6. **Privacy compliance**: Ensure logging complies with privacy regulations
7. **Performance impact**: Monitoring should have minimal performance impact

## Troubleshooting

### High Failure Rate

If you see a high authentication failure rate:

1. Check provider metrics to identify which provider is failing
2. Review recent error events for common error messages
3. Verify OAuth configuration in provider dashboards
4. Check Supabase logs for detailed error information
5. Test authentication flow manually

### Slow Response Times

If provider response times are high:

1. Check provider status pages (Google, Discord)
2. Verify network connectivity
3. Check for rate limiting
4. Consider implementing caching or retry logic

### Suspicious Activity

If suspicious activity is detected:

1. Review recent failed attempts
2. Check for patterns (same IP, rapid attempts)
3. Consider implementing rate limiting
4. Enable CAPTCHA for repeated failures
5. Notify security team if necessary

## Future Enhancements

Potential improvements to the monitoring system:

1. **Server-side logging**: Send metrics to backend for centralized monitoring
2. **Real-time dashboards**: Build admin dashboard for live metrics
3. **Advanced analytics**: Track user journeys, conversion rates
4. **Anomaly detection**: ML-based detection of unusual patterns
5. **Integration with APM**: Connect with Application Performance Monitoring tools
6. **Custom alerts**: Configurable alert thresholds and notifications
7. **Audit logs**: Comprehensive audit trail for compliance

## Support

For issues with monitoring:
- Check browser console for errors
- Verify localStorage is accessible
- Review this documentation
- Check Supabase dashboard logs
- Consult [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
