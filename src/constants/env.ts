/**
 * Environment variables with validation.
 * Server-side secrets (DATABASE_URL, CLERK_SECRET_KEY, etc.) are only
 * accessible in Node.js contexts. Client-safe values are prefixed with
 * EXPO_PUBLIC_ for use in the Expo mobile app.
 */

export const ENV = {
  CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY || '',
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
  CLERK_ISSUER_URL: process.env.CLERK_ISSUER_URL || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
  STREAM_API_KEY: process.env.EXPO_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY || '',
  STREAM_API_SECRET: process.env.STREAM_API_SECRET || '',
  IMAGEKIT_PUBLIC_KEY: process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY || '',
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY || '',
  IMAGEKIT_URL_ENDPOINT:
    process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT || '',
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY || '',
  INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY || '',
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
} as const;

export function validateEnv() {
  const required: (keyof typeof ENV)[] = [];
  const missing = required.filter((key) => !ENV[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
