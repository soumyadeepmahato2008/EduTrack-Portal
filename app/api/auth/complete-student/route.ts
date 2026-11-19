import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, isSameOrigin, setSessionCookie } from '@/lib/auth';
import { lockAccountRole } from '@/lib/accountRoles';
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
  const session = await getAuthSession();
  if (!session || !['pending', 'student'].includes(session.role)) return NextResponse.json({ success: false, error: 'A verified student session is required.' }, { status: 401 });
  if (!(await lockAccountRole(session.email, 'student'))) return NextResponse.json({ success: false, error: 'This account already has a different permanent role.' }, { status: 403 });
  const response = NextResponse.json({ success: true, email: session.email, role: 'student' });
  setSessionCookie(response, session.email, 'student');
  return response;
}
