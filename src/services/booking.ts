/**
 * Booking service - shared business logic for appointments.
 * Enforces clinic-level data isolation, role-based permissions,
 * and overlapping-appointment prevention (see PLAN.md).
 */

import { sql } from '@/lib/db';
import { authorizeClinicAccess } from '@/lib/auth';
import { Role } from '@/types';

export async function listAppointmentsForClinic(
  userId: string,
  clinicId: string,
  role: Role
) {
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

  // Patients see only their own appointments; staff see all clinic appointments
  if (role === 'patient') {
    return sql`
      SELECT * FROM appointments
      WHERE clinic_id = ${clinicId} AND patient_id = ${userId}
      ORDER BY start_datetime
    `;
  }

  return sql`
    SELECT * FROM appointments
    WHERE clinic_id = ${clinicId}
    ORDER BY start_datetime
  `;
}

export async function createAppointment(params: {
  patientId: string;
  dentistId: string;
  clinicId: string;
  serviceId: string;
  startDatetime: Date;
  endDatetime: Date;
  notes?: string;
}) {
  const { patientId, dentistId, clinicId, serviceId, startDatetime, endDatetime, notes } = params;

  const allowed = await authorizeClinicAccess(patientId, clinicId, [
    'owner',
    'administrator',
    'dentist',
    'receptionist',
    'patient',
  ]);
  if (!allowed) {
    throw new Error('Forbidden: clinic access denied');
  }

  try {
    const [appointment] = await sql`
      INSERT INTO appointments (patient_id, dentist_id, clinic_id, service_id, start_datetime, end_datetime, status, notes)
      VALUES (${patientId}, ${dentistId}, ${clinicId}, ${serviceId}, ${startDatetime}, ${endDatetime}, 'pending', ${notes ?? null})
      RETURNING *
    `;
    return appointment;
  } catch (err) {
    // PostgreSQL exclusion constraint violation -> overlapping appointment
    throw new Error('Time slot overlaps with an existing appointment');
  }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  clinicId: string,
  userId: string,
  status: 'confirmed' | 'rejected' | 'cancelled'
) {
  // Only clinic staff can confirm/reject/cancel
  const allowed = await authorizeClinicAccess(userId, clinicId, [
    'owner',
    'administrator',
    'dentist',
    'receptionist',
  ]);
  if (!allowed) {
    throw new Error('Forbidden: insufficient role to modify appointment status');
  }

  const [appointment] = await sql`
    UPDATE appointments
    SET status = ${status}
    WHERE id = ${appointmentId} AND clinic_id = ${clinicId}
    RETURNING *
  `;

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Release slot on cancellation/rejection
  if (status === 'cancelled' || status === 'rejected') {
    // Slot is released by virtue of status no longer being pending/confirmed
  }

  return appointment;
}
