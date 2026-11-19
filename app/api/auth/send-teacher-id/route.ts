import { NextRequest, NextResponse } from 'next/server';
import { sendTeacherIdEmail, isEmailConfigured } from '@/lib/mailer';
import { consumeRateLimit, generateUniqueTeacherIdCode, storeTeacherId } from '@/lib/otpStore';
import { getAuthSession, isSameOrigin } from '@/lib/auth';
import { timingSafeEqual } from 'node:crypto';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
  const session = await getAuthSession();
  if (!session || session.role !== 'pending') return NextResponse.json({ success: false, error: 'Verify your email before requesting teacher verification.' }, { status: 401 });
  try {
    const body = await request.json();
    const teacherName = typeof body.teacherName === 'string' ? body.teacherName.trim().slice(0, 100) : 'Teacher';
    const registrationCode = typeof body.registrationCode === 'string' ? body.registrationCode : '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    if (!(await consumeRateLimit(`teacher-registration-ip:${ip}`, 3600, 5)) || !(await consumeRateLimit(`teacher-registration-email:${session.email}`, 3600, 5))) return NextResponse.json({ success: false, error: 'Too many teacher registration attempts. Try again later.' }, { status: 429 });
    const expectedCode = process.env.TEACHER_REGISTRATION_CODE || '';
    if (!expectedCode || expectedCode.length < 32) return NextResponse.json({ success: false, error: 'Teacher registration is disabled until a strong TEACHER_REGISTRATION_CODE is configured by the institution.' }, { status: 503 });
    const supplied = Buffer.from(registrationCode);
    const expected = Buffer.from(expectedCode);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return NextResponse.json({ success: false, error: 'Invalid teacher registration code.' }, { status: 403 });
    if (!isEmailConfigured && process.env.NODE_ENV === 'production') return NextResponse.json({ success: false, error: 'Email delivery is not configured.' }, { status: 503 });
    const teacherId = generateUniqueTeacherIdCode();
    await storeTeacherId(session.email, teacherId);
    if (!isEmailConfigured) return NextResponse.json({ success: true, devMode: true, message: 'Development teacher code generated.', devTeacherId: teacherId });
    await sendTeacherIdEmail(session.email, teacherName, teacherId);
    return NextResponse.json({ success: true, devMode: false, message: 'Teacher verification code sent to your verified email.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate teacher verification code.';
    return NextResponse.json({ success: false, error: message }, { status: message.includes('wait 60 seconds') ? 429 : 500 });
  }
}
