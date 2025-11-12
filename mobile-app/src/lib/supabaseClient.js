import { createClient } from '@supabase/supabase-js';

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using env variables (do NOT log secrets)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase] Initializing client...');
if (!supabaseUrl) console.error('[Supabase] Missing VITE_SUPABASE_URL');
if (!supabaseAnonKey) console.error('[Supabase] Missing VITE_SUPABASE_ANON_KEY');

let _supabase = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('[Supabase] Client initialized:', { urlPresent: true, keyPresent: true });
  } else {
    throw new Error('Missing Supabase env');
  }
} catch (e) {
  console.warn('[Supabase] Failed to initialize real client, creating stub client. Reason:', e.message || e);
  // Minimal stub implementation to avoid runtime crashes in environments without env vars
  const noop = async () => ({ data: null, error: { message: 'Supabase not configured' } });
  const chainable = () => ({ select: noop, eq: () => ({ maybeSingle: noop }), maybeSingle: noop, order: () => ({ limit: noop }), limit: noop, insert: noop });
  _supabase = {
    from: (/*table*/) => chainable(),
    storage: {
      from: (/*bucket*/) => ({
        upload: async () => ({ data: null, error: { message: 'Supabase storage not configured' } }),
        getPublicUrl: () => ({ publicUrl: null })
      })
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({}),
      unsubscribe: () => {}
    })
  };
}

export const supabase = _supabase;

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

// Helper: record a media stream for a fixed duration and return a blob
const recordStreamToBlob = (stream, durationMs = 15000) => {
  console.log('[Supabase] recordStreamToBlob() called with durationMs=', durationMs);
  return new Promise((resolve, reject) => {
    try {
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      let timeout;

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        clearTimeout(timeout);
        const blob = new Blob(chunks, { type: 'video/mp4' });
        console.log('[Supabase] Recording complete, blob size=', blob.size);
        resolve(blob);
      };
      mediaRecorder.onerror = (e) => {
        clearTimeout(timeout);
        console.error('[Supabase] mediaRecorder error', e);
        reject(e);
      };

      mediaRecorder.start();
      timeout = setTimeout(() => {
        if (mediaRecorder.state === 'recording') mediaRecorder.stop();
      }, durationMs);
    } catch (e) {
      console.error('[Supabase] recordStreamToBlob failed:', e);
      reject(e);
    }
  });
};

// Helper: upload video blob to Supabase storage bucket and return public URL
export async function uploadStreamToSupabase(stream, userId, options = {}) {
  const bucket = options.bucket || 'first_bucket';
  const durationMs = options.durationMs || 15000;
  console.log('[Supabase] uploadStreamToSupabase() starting for user=', userId, 'bucket=', bucket);

  // Record stream to blob
  const blob = await recordStreamToBlob(stream, durationMs);

  const fileName = `sos-videos/${userId}_${Date.now()}.mp4`;
  console.log('[Supabase] Uploading video file to bucket, fileName=', fileName);

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('[Supabase] upload error:', uploadError);
      throw uploadError;
    }

    console.log('[Supabase] Upload response:', uploadData);

    // Get public URL
    const { data: publicUrlData, error: publicUrlError } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (publicUrlError) {
      console.error('[Supabase] getPublicUrl error:', publicUrlError);
      throw publicUrlError;
    }

    console.log('[Supabase] Public URL obtained:', publicUrlData?.publicUrl || publicUrlData);
    const publicUrl = (publicUrlData && (publicUrlData.publicUrl || publicUrlData.public_url)) || null;
    return { videoUrl: publicUrl, raw: uploadData };
  } catch (e) {
    console.error('[Supabase] uploadStreamToSupabase failed:', e);
    throw e;
  }
}
