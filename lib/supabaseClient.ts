import { createClient } from '@supabase/supabase-js';

// This client is imported only by server API routes. Never expose the service-role key
// through a NEXT_PUBLIC_ variable or import this module into client components.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && serviceRoleKey && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null;
