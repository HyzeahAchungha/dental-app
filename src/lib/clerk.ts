/**
 * Clerk server-side authentication client.
 * Clerk proves identity; authorization is determined by database-backed
 * roles and clinic memberships (see src/lib/auth.ts).
 */

import { Clerk } from '@clerk/clerk-sdk-node';

export const clerk = new Clerk({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export type ClerkClient = typeof clerk;
