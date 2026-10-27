export const dynamic = 'force-dynamic';

import { sql } from '@/lib/db';
import { authorizeClinicAccess, getClerkTokenFromHeaders } from '@/lib/auth';

export async function POST(req: Request) {
  const token = getClerkTokenFromHeaders(req.headers);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const userId = await verifyToken(token);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }

  const { clinicId, serviceId, dentistId, startDatetime, endDatetime } =
    await req.json();

  if (!clinicId || !serviceId || !dentistId || !startDatetime || !endDatetime) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const allowed = await authorizeClinicAccess(
    userId,
    clinicId,
    ['owner', 'administrator', 'dentist', 'receptionist', 'patient']
  );
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  // Prevent overlapping appointments using PostgreSQL exclusion constraint at DB level
  try {
    const [appointment] = await sql`
      INSERT INTO appointments (patient_id, dentist_id, clinic_id, service_id, start_datetime, end_datetime, status)
      VALUES (${userId}, ${dentistId}, ${clinicId}, ${serviceId}, ${startDatetime}, ${endDatetime}, 'pending')
      RETURNING *
    `;
    return Response.json(appointment, { status: 201 });
  } catch (err) {
    // Exclusion constraint violation -> overlapping appointment
    return new Response(JSON.stringify({ error: 'Time slot overlaps with an existing appointment' }), {
      status: 409,
    });
  }
}

async function verifyToken(token: string): Promise<string | null> {
  const { clerk } = await import('@/lib/clerk');
  try {
    const { claims } = await clerk.verifyToken(token);
    return claims.sub as string;
  } catch {
    return null;
  }
}
