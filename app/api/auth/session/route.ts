import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
export async function GET() {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ authenticated: true, email: session.email, role: session.role }, { headers: { 'Cache-Control': 'no-store' } });
}
