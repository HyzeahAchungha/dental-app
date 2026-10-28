/**
 * Shared authentication utilities.
 * Clerk proves identity; authorization is determined server-side by
 * database-backed roles and clinic memberships (see PLAN.md Auth/Authz).
 */

import { clerk } from '@/lib/clerk';
import { sql } from '@/lib/db';
import { Role } from '@/types';

/**
 * Verifies a Clerk session token and returns the authenticated user's Clerk subject ID.
 * Server-side only.
 */
export async function verifyClerkToken(token: string): Promise<string | null> {
  try {
    const { claims } = await clerk.verifyToken(token);
    return claims.sub as string;
  } catch {
    return null;
  }
}

/**
 * Resolves the user's clinic memberships and roles for a given clinic.
 * Returns null if the user is not a member of the clinic.
 * Server-side only.
 */
export async function getUserClinicMembership(
  userId: string,
  clinicId: string
): Promise<{ role: Role } | null> {
  const rows = await sql`
    SELECT role FROM clinic_memberships
    WHERE user_id = ${userId} AND clinic_id = ${clinicId}
  `;
  if (rows.length === 0) return null;
  return { role: rows[0].role as Role };
}

/**
 * Checks whether a user has one of the allowed roles for a clinic.
 * Server-side only.
 */
export async function authorizeClinicAccess(
  userId: string,
  clinicId: string,
  allowedRoles: Role[]
): Promise<boolean> {
  const membership = await getUserClinicMembership(userId, clinicId);
  if (!membership) return false;
  return allowedRoles.includes(membership.role);
}

/**
 * Extracts the Clerk session token from an HTTP request headers.
 * Server-side only.
 */
export function getClerkTokenFromHeaders(headers: Headers): string | null {
  const auth = headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}
