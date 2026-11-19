import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, verifyOtpServer } from '@/lib/otpStore';
import { isSameOrigin, setSessionCookie } from '@/lib/auth';
import { getAccountRole } from '@/lib/accountRoles';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
    if (!/^[^\s@]+@gmail\.com$/i.test(email) || !/^\d{6}$/.test(otp)) return NextResponse.json({ success: false, error: 'A valid Gmail address and six-digit OTP are required.' }, { status: 400 });
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    if (!(await consumeRateLimit(`verify-otp:${ip}`, 900, 30))) return NextResponse.json({ success: false, error: 'Too many verification requests. Please try again later.' }, { status: 429 });
    const result = await verifyOtpServer(email, otp);
    if (!result.valid) return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    const accountRole = await getAccountRole(email);
    const role = accountRole || 'pending';
    const response = NextResponse.json({ success: true, message: result.message, role });
    setSessionCookie(response, email, role);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
