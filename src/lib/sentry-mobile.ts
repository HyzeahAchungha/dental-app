/**
 * Sentry initialization for the Expo mobile app.
 * Call this from the app entry point (_layout.tsx or index.tsx).
 * PII/PHI must never be sent in logs (see PLAN.md Security).
 */

import * as Sentry from '@sentry/react-native';

export function initSentry() {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Scrub sensitive data from error events
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      const sensitiveKeys = ['token', 'password', 'secret', 'key', 'phi', 'medical'];
      const scrub = (obj: Record<string, unknown> | undefined) => {
        if (!obj) return;
        for (const key of Object.keys(obj)) {
          if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
            delete obj[key];
          }
        }
      };
      scrub(event.extra);
      return event;
    },
  });
}

export { Sentry };
