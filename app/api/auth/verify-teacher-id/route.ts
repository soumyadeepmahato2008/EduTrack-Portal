import { NextRequest, NextResponse } from 'next/server';
import { verifyTeacherIdServer } from '@/lib/otpStore';
import { getAuthSession, isSameOrigin, setSessionCookie } from '@/lib/auth';
import { lockAccountRole } from '@/lib/accountRoles';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
  const session = await getAuthSession();
  if (!session || !['pending', 'teacher'].includes(session.role)) return NextResponse.json({ success: false, error: 'Verify your email before teacher verification.' }, { status: 401 });
  try {
    const body = await request.json();
    const teacherId = typeof body.teacherId === 'string' ? body.teacherId.trim() : '';
    if (!/^TCH-\d{6}$/i.test(teacherId)) return NextResponse.json({ success: false, error: 'A valid Teacher ID is required.' }, { status: 400 });
    const result = await verifyTeacherIdServer(session.email, teacherId);
    if (!result.valid) return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    if (!(await lockAccountRole(session.email, 'teacher'))) return NextResponse.json({ success: false, error: 'This account already has a different permanent role.' }, { status: 403 });
    const response = NextResponse.json({ success: true, message: result.message, teacherId: result.teacherId });
    setSessionCookie(response, session.email, 'teacher');
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
