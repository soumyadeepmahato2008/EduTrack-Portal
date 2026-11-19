import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, isSameOrigin } from '@/lib/auth';

export async function requireSession(request: NextRequest) {
  if (!isSameOrigin(request)) return { session: null, response: NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 }) };
  const session = await getAuthSession();
  if (!session || !['student', 'teacher'].includes(session.role)) return { session: null, response: NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 }) };
  return { session, response: null };
}

export async function requireTeacher(request: NextRequest) {
  if (!isSameOrigin(request)) return { session: null, response: NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 }) };
  const session = await getAuthSession();
  if (!session || session.role !== 'teacher') return { session: null, response: NextResponse.json({ success: false, error: 'Teacher authorization required.' }, { status: 403 }) };
  return { session, response: null };
}
