import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getClerkTokenFromHeaders } from '@/lib/auth';

export async function GET(req: Request) {
  const token = getClerkTokenFromHeaders(req.headers);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const userId = await verifyToken(token);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }

  // Return clinics the user is a member of
  const memberships = await sql`
    SELECT c.* FROM clinics c
    JOIN clinic_memberships cm ON cm.clinic_id = c.id
    WHERE cm.user_id = ${userId}
  `;

  return NextResponse.json(memberships);
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
