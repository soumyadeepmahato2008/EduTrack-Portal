import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export type SessionRole = 'pending' | 'student' | 'teacher';
export interface AuthSession {
  email: string;
  role: SessionRole;
  issuedAt: number;
  expiresAt: number;
}

const COOKIE_NAME = 'edutrack_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const DEV_SECRET = 'edutrack-local-development-secret-change-before-deploy';

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || (process.env.NODE_ENV !== 'production' ? DEV_SECRET : '');
  if (secret.length < 32) throw new Error('SESSION_SECRET must be configured with at least 32 characters.');
  return secret;
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function createSessionToken(email: string, role: SessionRole): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthSession = { email: email.toLowerCase().trim(), role, issuedAt: now, expiresAt: now + SESSION_TTL_SECONDS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token?: string): AuthSession | null {
  if (!token) return null;
  const [encoded, signature, extra] = token.split('.');
  if (!encoded || !signature || extra) return null;
  try {
    const expected = Buffer.from(sign(encoded));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const session = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AuthSession;
    if (!session.email || !['pending', 'student', 'teacher'].includes(session.role)) return null;
    if (!Number.isInteger(session.expiresAt) || session.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: Response, email: string, role: SessionRole): void {
  const token = createSessionToken(email, role);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.headers.append('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`);
}

export function clearSessionCookie(response: Response): void {
  response.headers.append('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE_NAME)?.value);
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
