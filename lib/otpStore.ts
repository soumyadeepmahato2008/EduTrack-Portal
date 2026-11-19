import { createHash, randomInt } from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface ChallengeRecord { hash: string; expiresAt: number; attempts: number; sentAt: number; }
const globalForChallenges = globalThis as typeof globalThis & { _eduChallenges?: Map<string, ChallengeRecord>; _eduRateLimits?: Map<string, { startedAt: number; count: number }> };
const memoryChallenges = globalForChallenges._eduChallenges ?? (globalForChallenges._eduChallenges = new Map());
const memoryRateLimits = globalForChallenges._eduRateLimits ?? (globalForChallenges._eduRateLimits = new Map());

function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function digest(value: string): string {
  const pepper = process.env.SESSION_SECRET || (process.env.NODE_ENV !== 'production' ? 'local-only-challenge-pepper' : '');
  if (pepper.length < 32) throw new Error('SESSION_SECRET must be configured with at least 32 characters.');
  return createHash('sha256').update(`${pepper}:${value}`).digest('hex');
}

async function saveChallenge(email: string, purpose: 'login' | 'teacher', code: string): Promise<void> {
  const key = `${purpose}:${email.toLowerCase().trim()}`;
  const now = Date.now();
  const client = adminClient();
  if (client) {
    const { data: existing, error: readError } = await client.from('auth_challenges').select('sent_at').eq('email', email).eq('purpose', purpose).maybeSingle();
    if (readError) throw new Error('Authentication storage is unavailable. Check the auth_challenges table.');
    if (existing?.sent_at && now - new Date(existing.sent_at).getTime() < 60_000) throw new Error('Please wait 60 seconds before requesting another code.');
    const { error } = await client.from('auth_challenges').upsert({ email, purpose, code_hash: digest(code), expires_at: new Date(now + 10 * 60_000).toISOString(), attempts: 0, sent_at: new Date(now).toISOString() }, { onConflict: 'email,purpose' });
    if (error) throw new Error('Could not store the verification challenge.');
    return;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Production authentication requires SUPABASE_SERVICE_ROLE_KEY and the auth_challenges table.');
  const previous = memoryChallenges.get(key);
  if (previous && now - previous.sentAt < 60_000) throw new Error('Please wait 60 seconds before requesting another code.');
  memoryChallenges.set(key, { hash: digest(code), expiresAt: now + 10 * 60_000, attempts: 0, sentAt: now });
}

async function checkChallenge(email: string, purpose: 'login' | 'teacher', code: string): Promise<{ valid: boolean; message: string }> {
  const normalized = email.toLowerCase().trim();
  const client = adminClient();
  if (client) {
    const { data, error } = await client.from('auth_challenges').select('*').eq('email', normalized).eq('purpose', purpose).maybeSingle();
    if (error) throw new Error('Authentication storage is unavailable.');
    if (!data) return { valid: false, message: 'No verification code found. Please request a new one.' };
    if (new Date(data.expires_at).getTime() <= Date.now()) {
      await client.from('auth_challenges').delete().eq('email', normalized).eq('purpose', purpose);
      return { valid: false, message: 'The code has expired. Please request a new one.' };
    }
    const attempts = Number(data.attempts || 0) + 1;
    if (attempts > 5) {
      await client.from('auth_challenges').delete().eq('email', normalized).eq('purpose', purpose);
      return { valid: false, message: 'Too many attempts. Please request a fresh code.' };
    }
    if (digest(code.trim()) !== data.code_hash) {
      await client.from('auth_challenges').update({ attempts }).eq('email', normalized).eq('purpose', purpose);
      return { valid: false, message: 'Incorrect code. Please try again.' };
    }
    await client.from('auth_challenges').delete().eq('email', normalized).eq('purpose', purpose);
    return { valid: true, message: 'Verification successful.' };
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Production authentication storage is not configured.');
  const key = `${purpose}:${normalized}`;
  const record = memoryChallenges.get(key);
  if (!record) return { valid: false, message: 'No verification code found. Please request a new one.' };
  if (record.expiresAt <= Date.now()) { memoryChallenges.delete(key); return { valid: false, message: 'The code has expired. Please request a new one.' }; }
  record.attempts += 1;
  if (record.attempts > 5) { memoryChallenges.delete(key); return { valid: false, message: 'Too many attempts. Please request a fresh code.' }; }
  if (digest(code.trim()) !== record.hash) return { valid: false, message: 'Incorrect code. Please try again.' };
  memoryChallenges.delete(key);
  return { valid: true, message: 'Verification successful.' };
}


export async function consumeRateLimit(bucket: string, windowSeconds: number, limit: number): Promise<boolean> {
  const key = digest(bucket);
  const client = adminClient();
  if (client) {
    const { data, error } = await client.rpc('consume_auth_rate_limit', {
      p_bucket_key: key,
      p_window_seconds: windowSeconds,
      p_limit: limit,
    });
    if (error) throw new Error('Rate-limit storage is unavailable. Apply the latest Supabase schema.');
    return data === true;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Production rate limiting requires Supabase service-role configuration.');
  const now = Date.now();
  const current = memoryRateLimits.get(key);
  if (!current || now - current.startedAt >= windowSeconds * 1000) {
    memoryRateLimits.set(key, { startedAt: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

export function generateOtpCode(): string { return randomInt(100000, 1000000).toString(); }
export function generateUniqueTeacherIdCode(): string { return `TCH-${randomInt(100000, 1000000)}`; }
export async function storeOtp(email: string, code: string): Promise<void> { return saveChallenge(email, 'login', code); }
export async function storeTeacherId(email: string, code: string): Promise<void> { return saveChallenge(email, 'teacher', code); }
export async function verifyOtpServer(email: string, code: string) { return checkChallenge(email, 'login', code); }
export async function verifyTeacherIdServer(email: string, code: string) {
  const result = await checkChallenge(email, 'teacher', code);
  return { ...result, teacherId: result.valid ? code.trim().toUpperCase() : undefined };
}
