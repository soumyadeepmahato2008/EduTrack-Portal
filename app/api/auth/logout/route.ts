import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, isSameOrigin } from '@/lib/auth';
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false }, { status: 403 });
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
