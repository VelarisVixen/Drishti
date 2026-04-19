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
      // Validate stream exists
      if (!stream || !stream.active) {
        throw new Error('Stream is not active or available');
      }

      // Check if stream has the required tracks
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      console.log('[Supabase] Stream tracks - audio:', audioTracks.length, 'video:', videoTracks.length);

      if (videoTracks.length === 0) {
        throw new Error('No video tracks available in stream');
      }

      // Check track states - wait a bit for tracks to be ready
      const videoTrack = videoTracks[0];
      console.log('[Supabase] Video track state:', videoTrack.readyState);

      if (videoTrack.readyState !== 'live') {
        console.warn('[Supabase] Video track not live, attempting anyway. State:', videoTrack.readyState);
      }

      // Determine the best supported MIME type for this environment
      let mimeType = '';
      let selectedMimeType = null;

      const mimeTypesToTry = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp8',
        'video/webm;codecs=vp9',
        'video/webm;codecs=h264',
        'video/webm',
        'video/mp4'
      ];

      for (const mime of mimeTypesToTry) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          console.log('[Supabase] Selected MIME type:', mime);
          break;
        }
      }

      // If no MIME type matched, use empty string (browser default)
      if (!selectedMimeType) {
        console.warn('[Supabase] No supported MIME type found, using browser default');
        selectedMimeType = '';
      }

      console.log('[Supabase] Using MIME type:', selectedMimeType || 'default', 'for', durationMs, 'ms recording');

      // Create MediaRecorder with appropriate options
      let mediaRecorder;
      try {
        if (selectedMimeType) {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: selectedMimeType,
            audioBitsPerSecond: 128000,
            videoBitsPerSecond: 2500000
          });
        } else {
          // Use default options without MIME type
          mediaRecorder = new MediaRecorder(stream);
        }
      } catch (recorderError) {
        console.error('[Supabase] Failed to create MediaRecorder:', recorderError.message);
        throw new Error(`MediaRecorder creation failed: ${recorderError.message}`);
      }

      const chunks = [];
      let timeout;
      let recordingStarted = false;
      let dataReceived = false;

      mediaRecorder.onstart = () => {
        recordingStarted = true;
        console.log('[Supabase] ✅ MediaRecorder started successfully');
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          dataReceived = true;
          console.log('[Supabase] 📦 Data chunk received, size=', e.data.size, 'bytes');
          chunks.push(e.data);
        } else {
          console.log('[Supabase] ⚠️ Empty data chunk received');
        }
      };

      mediaRecorder.onstop = () => {
        clearTimeout(timeout);
        console.log('[Supabase] 🛑 Recorder stopped. Chunks=', chunks.length, 'recordingStarted=', recordingStarted, 'dataReceived=', dataReceived);

        // Use the appropriate MIME type for the blob
        const blobMimeType = selectedMimeType || 'video/webm';
        const blob = new Blob(chunks, { type: blobMimeType });
        console.log('[Supabase] ✅ Recording complete, blob size=', blob.size, 'bytes, type=', blob.type);

        if (blob.size === 0) {
          console.error('[Supabase] ❌ ERROR: blob size is 0 - no data was captured during recording');
          reject(new Error('Video recording produced empty blob - no data captured'));
          return;
        }

        if (blob.size < 5000) {
          console.warn('[Supabase] ⚠️ Warning: blob is very small (', blob.size, 'bytes), recording may be incomplete');
        }

        resolve(blob);
      };

      mediaRecorder.onerror = (e) => {
        clearTimeout(timeout);
        const errorMsg = e.error ? e.error : (e.message || String(e));
        console.error('[Supabase] ❌ mediaRecorder error event:', errorMsg);
        reject(new Error(`MediaRecorder error: ${errorMsg}`));
      };

      // Start recording with timeslice to ensure data is periodically captured
      console.log('[Supabase] 🎬 Starting MediaRecorder with 500ms timeslice...');
      try {
        mediaRecorder.start(500); // Request data every 500ms
        console.log('[Supabase] ✅ Recording started, will auto-stop in', durationMs, 'ms');
      } catch (startError) {
        console.error('[Supabase] ❌ Failed to start MediaRecorder:', startError.message);
        throw new Error(`Failed to start MediaRecorder: ${startError.message}`);
      }

      // Set timeout to stop recording after duration
      timeout = setTimeout(() => {
        console.log('[Supabase] ⏱️ Recording duration reached, stopping recorder');
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, durationMs);

    } catch (e) {
      console.error('[Supabase] ❌ recordStreamToBlob exception:', e.message || e);
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
  console.log('[Supabase] ⏹️ Starting video recording...');
  const blob = await recordStreamToBlob(stream, durationMs);
  console.log('[Supabase] ✅ Video blob created, size=', blob.size, 'bytes, type=', blob.type);

  // Validate blob size - must have actual video data
  if (blob.size < 5000) {
    throw new Error(`Video recording failed: blob too small (${blob.size} bytes). Ensure camera has permission and is working.`);
  }

  const fileName = `sos-videos/${userId}_${Date.now()}.webm`;
  console.log('[Supabase] 📤 Uploading video file to bucket "', bucket, '", fileName=', fileName, 'size=', blob.size);

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('[Supabase] ❌ Upload error:', uploadError.message || uploadError);
      throw new Error(`Upload failed: ${uploadError.message || uploadError}`);
    }

    console.log('[Supabase] ✅ Upload to storage successful:', uploadData);

    // Get public URL
    console.log('[Supabase] 🔗 Getting public URL for file:', fileName);
    const urlData = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // getPublicUrl returns { data: { publicUrl: string }, error: null } or { data: null, error: {...} }
    let publicUrl = null;
    if (urlData && urlData.data) {
      publicUrl = urlData.data.publicUrl;
    }

    console.log('[Supabase] Public URL response:', urlData);
    console.log('[Supabase] Extracted publicUrl:', publicUrl);

    if (!publicUrl) {
      throw new Error('Failed to get public URL for uploaded video');
    }

    console.log('[Supabase] ✅ Video uploaded successfully, URL=', publicUrl, 'size=', blob.size, 'bytes');
    return { videoUrl: publicUrl, raw: uploadData };
  } catch (e) {
    console.error('[Supabase] ❌ uploadStreamToSupabase failed:', e.message || e);
    throw e;
  }
}
