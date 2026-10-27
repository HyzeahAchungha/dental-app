export const dynamic = 'force-dynamic';

import { sql } from '@/lib/db';
import { authorizeClinicAccess, getClerkTokenFromHeaders } from '@/lib/auth';

export async function GET(req: Request) {
  const token = getClerkTokenFromHeaders(req.headers);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const userId = await verifyToken(token);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get('clinicId');

  if (!clinicId) {
    return new Response(JSON.stringify({ error: 'clinicId required' }), { status: 400 });
  }

  const allowed = await authorizeClinicAccess(
    userId,
    clinicId,
    ['owner', 'administrator', 'dentist', 'receptionist']
  );
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const dentists = await sql`
    SELECT * FROM dentists WHERE clinic_id = ${clinicId}
  `;

  return Response.json(dentists);
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
