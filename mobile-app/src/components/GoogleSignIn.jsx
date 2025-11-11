import React from 'react';

// PKCE helpers
const generateCodeVerifier = () => {
  const array = new Uint32Array(56/2);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hash);
};

const base64UrlEncode = (arrayBuffer) => {
  // base64url encode
  let str = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const clientId = '1069463850395-r7tefqv5lucgbn9vnl322gaepqmvpb19.apps.googleusercontent.com';

const GoogleSignIn = ({ className }) => {
  const startAuth = async () => {
    try {
      console.log('[Google] Starting PKCE sign-in flow');
      const codeVerifier = generateCodeVerifier();
      const hashed = await sha256(codeVerifier);
      const codeChallenge = base64UrlEncode(hashed);

      // store verifier for callback
      sessionStorage.setItem('google_code_verifier', codeVerifier);

      const redirectUri = `${window.location.origin}/auth/callback`;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        include_granted_scopes: 'true',
        access_type: 'offline',
        prompt: 'consent',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      console.log('[Google] Redirecting to:', authUrl);
      window.location.href = authUrl;
    } catch (e) {
      console.error('[Google] Failed to start auth:', e);
      alert('Failed to start Google sign-in. See console for details.');
    }
  };

  return (
    <button onClick={startAuth} className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm ${className || ''}`}>
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
      <span>Sign in with Google</span>
    </button>
  );
};

export default GoogleSignIn;
