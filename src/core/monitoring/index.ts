/**
 * Error monitoring and crash reporting module.
 * Wraps Sentry / Crashlytics hooks for production builds.
 */

export interface CrashReporter {
    reportError(error: Error, context?: Record<string, unknown>): void;
    captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void;
}

class DefaultMonitoring implements CrashReporter {
    reportError(error: Error, context?: Record<string, unknown>): void {
        if (__DEV__) {
            console.error('[Monitoring:Error]', error, context);
        }
        // Hook Sentry.captureException(error, { extra: context }) here in production
    }

    captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
        if (__DEV__) {
            console.log(`[Monitoring:${level}]`, message);
        }
        // Hook Sentry.captureMessage(message, level) here in production
    }
}

export const monitoring = new DefaultMonitoring();

export function reportError(error: Error, context?: Record<string, unknown>) {
    monitoring.reportError(error, context);
}
