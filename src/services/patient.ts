/**
 * Patient relationship service - shared business logic for patient
 * onboarding, clinic linking, and patient profiles.
 * Supports one patient account linked to multiple clinics with
 * per-clinic record access (see PLAN.md).
 */

import { sql } from '@/lib/db';
import { authorizeClinicAccess } from '@/lib/auth';
import { Role } from '@/types';

export async function getPatientProfile(userId: string) {
  const [profile] = await sql`SELECT * FROM patient_profiles WHERE user_id = ${userId}`;
  return profile;
}

export async function createPatientProfile(params: {
  userId: string;
  name: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
  clinicId: string;
  onboardingAnswers?: Record<string, unknown>;
  consentRecords?: Record<string, unknown>;
}) {
  const {
    userId,
    name,
    dateOfBirth,
    phone,
    email,
    clinicId,
    onboardingAnswers,
    consentRecords,
  } = params;

  const [profile] = await sql`
    INSERT INTO patient_profiles (user_id, name, date_of_birth, phone, email, onboarding_answers, consent_records)
    VALUES (${userId}, ${name}, ${dateOfBirth}, ${phone ?? null}, ${email ?? null}, ${JSON.stringify(onboardingAnswers ?? {})}, ${JSON.stringify(consentRecords ?? {})})
    RETURNING *
  `;

  // Link patient to the selected clinic
  await sql`
    INSERT INTO clinic_memberships (user_id, clinic_id, role)
    VALUES (${userId}, ${clinicId}, 'patient')
    ON CONFLICT (user_id, clinic_id) DO NOTHING
  `;

  return profile;
}

export async function listPatientClinics(userId: string) {
  return sql`
    SELECT c.* FROM clinics c
    JOIN clinic_memberships cm ON cm.clinic_id = c.id
    WHERE cm.user_id = ${userId} AND cm.role = 'patient'
  `;
}

export async function linkPatientToClinic(userId: string, clinicId: string) {
  const [membership] = await sql`
    INSERT INTO clinic_memberships (user_id, clinic_id, role)
    VALUES (${userId}, ${clinicId}, 'patient')
    ON CONFLICT (user_id, clinic_id) DO NOTHING
    RETURNING *
  `;
  return membership;
}

export async function getPatientRecords(userId: string, clinicId: string, requestingUserId: string) {
  // Patients can only view their own records; staff can view records for linked patients
  const isPatientOwner = userId === requestingUserId;

  if (!isPatientOwner) {
    const allowed = await authorizeClinicAccess(requestingUserId, clinicId, [
      'owner',
      'administrator',
      'dentist',
    ]);
    if (!allowed) {
      throw new Error('Forbidden: insufficient role to view patient records');
    }
  }

  const [profile] = await sql`SELECT * FROM patient_profiles WHERE user_id = ${userId}`;
  const records = await sql`
    SELECT * FROM dental_records
    WHERE patient_id = ${userId} AND clinic_id = ${clinicId}
    ORDER BY timestamp DESC
  `;

  return { profile, records };
}
