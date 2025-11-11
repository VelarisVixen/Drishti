import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using env variables (do NOT log secrets)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase] Initializing client...');
if (!supabaseUrl) console.error('[Supabase] Missing VITE_SUPABASE_URL');
if (!supabaseAnonKey) console.error('[Supabase] Missing VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
console.log('[Supabase] Client initialized:', { urlPresent: !!supabaseUrl, keyPresent: !!supabaseAnonKey });

// Helper: ensure user exists in public.users table on first login
// Expected shape: { user_id: string, name: string, email: string, phone: string, role?: string }
export async function ensureSupabaseUser(user) {
  console.log('[Supabase] ensureSupabaseUser() called');
  console.log('[Supabase] Incoming user payload:', {
    has_user_id: !!user?.user_id,
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    role: user?.role || 'citizen'
  });

  // Basic validation
  if (!user || !user.user_id) {
    console.error('[Supabase] Invalid user payload: user_id is required');
    throw new Error('user_id is required');
  }
  if (!user.name || !user.email || !user.phone) {
    console.error('[Supabase] Missing required fields (name, email, phone)');
    throw new Error('name, email, phone are required');
  }

  const payload = {
    user_id: String(user.user_id),
    name: String(user.name).trim(),
    email: String(user.email).toLowerCase().trim(),
    phone: String(user.phone).trim(),
    role: (user.role || 'citizen'),
    joined_at: new Date().toISOString()
  };

  console.log('[Supabase] Checking if user already exists by user_id...');
  const { data: existingById, error: selectErr } = await supabase
    .from('users')
    .select('user_id')
    .eq('user_id', payload.user_id)
    .maybeSingle();

  if (selectErr) {
    console.error('[Supabase] Select error:', selectErr);
  } else {
    console.log('[Supabase] Select result:', existingById);
  }

  if (existingById) {
    console.log('[Supabase] User already exists in Supabase, skipping insert. user_id =', payload.user_id);
    return { status: 'exists', user_id: payload.user_id };
  }

  console.log('[Supabase] Inserting new user into Supabase users table...');
  const { data, error } = await supabase
    .from('users')
    .insert([payload])
    .select('user_id');

  if (error) {
    console.error('[Supabase] Insert error:', error);
    throw error;
  }

  console.log('[Supabase] Insert success:', data);
  return { status: 'inserted', user_id: payload.user_id, data };
}
