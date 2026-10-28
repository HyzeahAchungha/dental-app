/**
 * Clinic management service - shared business logic for clinics,
 * staff membership, services, pricing, and schedules.
 * Enforces clinic-level data isolation and role-based permissions.
 */

import { sql } from '@/lib/db';
import { authorizeClinicAccess } from '@/lib/auth';
import { Role } from '@/types';

export async function getClinic(userId: string, clinicId: string) {
  const allowed = await authorizeClinicAccess(userId, clinicId, [
    'owner',
    'administrator',
    'dentist',
    'receptionist',
    'patient',
  ]);
  if (!allowed) {
    throw new Error('Forbidden: clinic access denied');
  }

  const [clinic] = await sql`SELECT * FROM clinics WHERE id = ${clinicId}`;
  return clinic;
}

export async function listStaff(userId: string, clinicId: string) {
  const allowed = await authorizeClinicAccess(userId, clinicId, [
    'owner',
    'administrator',
  ]);
  if (!allowed) {
    throw new Error('Forbidden: only owners and administrators can list staff');
  }

  return sql`
    SELECT cm.*, u.email, u.phone FROM clinic_memberships cm
    JOIN user_identities u ON u.id = cm.user_id
    WHERE cm.clinic_id = ${clinicId}
  `;
}

export async function inviteStaff(params: {
  clinicId: string;
  userId: string;
  role: Role;
  invitedBy: string;
}) {
  const { clinicId, userId, role, invitedBy } = params;

  const allowed = await authorizeClinicAccess(invitedBy, clinicId, [
    'owner',
    'administrator',
  ]);
  if (!allowed) {
    throw new Error('Forbidden: only owners and administrators can invite staff');
  }

  const [membership] = await sql`
    INSERT INTO clinic_memberships (user_id, clinic_id, role)
    VALUES (${userId}, ${clinicId}, ${role})
    ON CONFLICT (user_id, clinic_id) DO UPDATE SET role = EXCLUDED.role
    RETURNING *
  `;
  return membership;
}

export async function listServices(userId: string, clinicId: string) {
  const allowed = await authorizeClinicAccess(userId, clinicId, [
    'owner',
    'administrator',
    'dentist',
    'receptionist',
    'patient',
  ]);
  if (!allowed) {
    throw new Error('Forbidden: clinic access denied');
  }

  return sql`SELECT * FROM services WHERE clinic_id = ${clinicId}`;
}

export async function createService(params: {
  clinicId: string;
  name: string;
  description?: string;
  price?: number;
  duration: number;
  bufferTime: number;
  createdBy: string;
}) {
  const { clinicId, name, description, price, duration, bufferTime, createdBy } = params;

  const allowed = await authorizeClinicAccess(createdBy, clinicId, [
    'owner',
    'administrator',
  ]);
  if (!allowed) {
    throw new Error('Forbidden: only owners and administrators can create services');
  }

  const [service] = await sql`
    INSERT INTO services (clinic_id, name, description, price, duration, buffer_time)
    VALUES (${clinicId}, ${name}, ${description ?? null}, ${price ?? null}, ${duration}, ${bufferTime})
    RETURNING *
  `;
  return service;
}
