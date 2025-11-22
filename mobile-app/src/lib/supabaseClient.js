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

  // Create a fully chainable stub that supports all query methods
  const createChainableStub = () => {
    const stub = {
      select: () => stub,
      insert: () => stub,
      update: () => stub,
      delete: () => stub,
      order: () => stub,
      limit: () => stub,
      eq: () => stub,
      neq: () => stub,
      gt: () => stub,
      gte: () => stub,
      lt: () => stub,
      lte: () => stub,
      like: () => stub,
      ilike: () => stub,
      in: () => stub,
      contains: () => stub,
      containedBy: () => stub,
      range: () => stub,
      rangeLte: () => stub,
      rangeGte: () => stub,
      rangeAdjacent: () => stub,
      overlaps: () => stub,
      textSearch: () => stub,
      match: () => stub,
      not: () => stub,
      or: () => stub,
      and: () => stub,
      filter: () => stub,
      maybeSingle: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      then: (resolve) => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      catch: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      // Make it compatible with Promise
      [Symbol.toStringTag]: 'Promise'
    };
    return stub;
  };

  _supabase = {
    from: (/*table*/) => createChainableStub(),
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
      // Check if stream is valid
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      console.log('[Supabase] Stream tracks - audio:', audioTracks.length, 'video:', videoTracks.length);

      if (videoTracks.length === 0) {
        throw new Error('No video tracks available in stream');
      }

      // Check track states
      const videoTrack = videoTracks[0];
      if (videoTrack.readyState !== 'live') {
        throw new Error(`Video track not live, state: ${videoTrack.readyState}`);
      }

      // Use the appropriate MIME type based on browser support
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }

      console.log('[Supabase] Using MIME type:', mimeType, 'for', durationMs, 'ms recording');

      const mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000, videoBitsPerSecond: 2500000 });
      const chunks = [];
      let timeout;
      let recordingStarted = false;

      mediaRecorder.onstart = () => {
        recordingStarted = true;
        console.log('[Supabase] MediaRecorder started successfully');
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log('[Supabase] Data chunk received, size=', e.data.size, 'bytes');
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        clearTimeout(timeout);
        console.log('[Supabase] Recorder stopped, total chunks=', chunks.length, 'recordingStarted=', recordingStarted);
        const blob = new Blob(chunks, { type: mimeType });
        console.log('[Supabase] ✅ Recording complete, blob size=', blob.size, 'bytes, type=', blob.type);

        if (blob.size === 0) {
          console.error('[Supabase] ❌ ERROR: blob size is 0, recording failed completely');
          reject(new Error('Video recording produced empty blob'));
          return;
        }

        if (blob.size < 5000) {
          console.warn('[Supabase] ⚠️ Warning: blob is very small (', blob.size, 'bytes), may indicate recording issue');
        }

        resolve(blob);
      };

      mediaRecorder.onerror = (e) => {
        clearTimeout(timeout);
        console.error('[Supabase] ❌ mediaRecorder error:', e.error || e);
        reject(new Error(`MediaRecorder error: ${e.error || e}`));
      };

      // Start recording with timeslice to ensure data is periodically available
      console.log('[Supabase] Starting MediaRecorder.start() with 500ms timeslice');
      mediaRecorder.start(500); // Request data every 500ms for better capture
      console.log('[Supabase] Recording started, will stop in', durationMs, 'ms');

      timeout = setTimeout(() => {
        console.log('[Supabase] Recording timeout reached, stopping recorder');
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, durationMs);
    } catch (e) {
      console.error('[Supabase] ❌ recordStreamToBlob failed:', e.message || e);
      reject(e);
    }
  });
};

// Helper: upload video blob to Supabase storage bucket and return public URL
export async function uploadStreamToSupabase(stream, userId, options = {}) {
  const bucket = options.bucket || 'first_bucket';
  const durationMs = options.durationMs || 15000;
  console.log('[Supabase] uploadStreamToSupabase() starting for user=', userId, 'bucket=', bucket);

  // Validate stream
  if (!stream) {
    throw new Error('Stream is required for video upload');
  }

  // Record stream to blob
  const blob = await recordStreamToBlob(stream, durationMs);
  console.log('[Supabase] Video blob created, size=', blob.size, 'bytes, type=', blob.type);

  // Validate blob size
  if (blob.size < 1000) {
    console.warn('[Supabase] ⚠️ Warning: Video blob is very small (', blob.size, 'bytes), recording may have failed');
  }

  const fileName = `sos-videos/${userId}_${Date.now()}.mp4`;
  console.log('[Supabase] Uploading video file to bucket, fileName=', fileName, 'size=', blob.size);

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('[Supabase] ❌ Upload error:', uploadError.message || uploadError);
      throw uploadError;
    }

    console.log('[Supabase] ✅ Upload response:', uploadData);

    // Get public URL
    const { data: publicUrlData, error: publicUrlError } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (publicUrlError) {
      console.error('[Supabase] ❌ getPublicUrl error:', publicUrlError.message || publicUrlError);
      throw publicUrlError;
    }

    const publicUrl = (publicUrlData && (publicUrlData.publicUrl || publicUrlData.public_url)) || null;
    console.log('[Supabase] ✅ Video uploaded successfully, URL=', publicUrl, 'size=', blob.size);
    return { videoUrl: publicUrl, raw: uploadData };
  } catch (e) {
    console.error('[Supabase] ❌ uploadStreamToSupabase failed:', e.message || e);
    throw e;
  }
}
