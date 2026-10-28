/**
 * Sentry error monitoring configuration.
 * PII/PHI must never be sent in logs (see PLAN.md Security).
 * Sensitive fields are scrubbed before transmission.
 */

import * as Sentry from '@sentry/react-native';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: !!process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    debug: process.env.NODE_ENV === 'development',
    beforeSend(event) {
      // Scrub Authorization headers and cookies
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      // Scrub sensitive keys from extra/contexts/tags
      const sensitiveKeys = ['token', 'password', 'secret', 'key', 'phi', 'medical', 'ssn', 'dob'];
      const scrub = (obj: Record<string, unknown> | undefined) => {
        if (!obj) return;
        for (const key of Object.keys(obj)) {
          if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
            delete obj[key];
          }
        }
      };
      scrub(event.extra);
      scrub(event.contexts?.user);
      scrub(event.tags);
      return event;
    },
  });
}

export { Sentry };
