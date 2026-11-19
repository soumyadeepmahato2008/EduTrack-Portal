import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

const localRoles = (globalThis as typeof globalThis & { _eduAccountRoles?: Map<string, 'student' | 'teacher'> })._eduAccountRoles
  ?? ((globalThis as typeof globalThis & { _eduAccountRoles?: Map<string, 'student' | 'teacher'> })._eduAccountRoles = new Map());

export async function getAccountRole(email: string): Promise<'student' | 'teacher' | null> {
  const normalized = email.toLowerCase().trim();
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('account_roles').select('role').eq('email', normalized).maybeSingle();
    if (error) throw new Error('Could not load the account role. Check the account_roles table.');
    return data?.role === 'student' || data?.role === 'teacher' ? data.role : null;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Production account-role storage is not configured.');
  return localRoles.get(normalized) || null;
}

export async function lockAccountRole(email: string, role: 'student' | 'teacher'): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const existing = await getAccountRole(normalized);
  if (existing) return existing === role;
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('account_roles').insert({ email: normalized, role });
    if (!error) return true;
    if (error.code === '23505') return (await getAccountRole(normalized)) === role;
    throw new Error('Could not save the permanent account role.');
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Production account-role storage is not configured.');
  localRoles.set(normalized, role);
  return true;
}
