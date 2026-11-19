import { NextRequest, NextResponse } from 'next/server';
import { sendOtpEmail, isEmailConfigured } from '@/lib/mailer';
import { consumeRateLimit, generateOtpCode, storeOtp } from '@/lib/otpStore';
import { isSameOrigin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@gmail\.com$/i.test(email)) return NextResponse.json({ success: false, error: 'Please enter a valid Gmail address.' }, { status: 400 });
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    if (!(await consumeRateLimit(`send-otp:${ip}`, 900, 5))) return NextResponse.json({ success: false, error: 'Too many OTP requests. Please try again later.' }, { status: 429 });
    if (!isEmailConfigured && process.env.NODE_ENV === 'production') return NextResponse.json({ success: false, error: 'Email delivery is not configured.' }, { status: 503 });
    const otp = generateOtpCode();
    await storeOtp(email, otp);
    if (!isEmailConfigured) {
      return NextResponse.json({ success: true, devMode: true, message: 'Development OTP generated.', devOtp: otp });
    }
    await sendOtpEmail(email, otp);
    return NextResponse.json({ success: true, devMode: false, message: 'OTP sent. It is valid for 10 minutes.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to send OTP.';
    const status = message.includes('wait 60 seconds') ? 429 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
