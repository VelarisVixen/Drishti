import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const clientId = '541486884869-mo97r52fhuqiurlf768qn756fpc82plq.apps.googleusercontent.com';

const decodeJwt = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch (e) {
    console.error('[Google] Failed to decode id_token', e);
    return null;
  }
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');
        if (error) {
          console.error('[Google] Auth error:', error);
          toast({ title: 'Google Sign-in Failed', description: error, variant: 'destructive' });
          navigate('/login');
          return;
        }
        if (!code) {
          console.error('[Google] No code in callback URL');
          navigate('/login');
          return;
        }

        const codeVerifier = sessionStorage.getItem('google_code_verifier');
        if (!codeVerifier) {
          console.error('[Google] Missing code_verifier in sessionStorage');
          toast({ title: 'Authentication Error', description: 'Missing PKCE verifier.', variant: 'destructive' });
          navigate('/login');
          return;
        }

        const redirectUri = `${window.location.origin}/auth/callback`;

        const body = new URLSearchParams();
        body.append('client_id', clientId);
        body.append('grant_type', 'authorization_code');
        body.append('code', code);
        body.append('code_verifier', codeVerifier);
        body.append('redirect_uri', redirectUri);

        console.log('[Google] Exchanging code for tokens...');
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString()
        });

        const tokenJson = await tokenRes.json();
        if (!tokenRes.ok) {
          console.error('[Google] Token exchange failed:', tokenJson);
          toast({ title: 'Google Sign-in Failed', description: tokenJson.error_description || tokenJson.error || 'Token exchange failed', variant: 'destructive' });
          navigate('/login');
          return;
        }

        console.log('[Google] Token response:', tokenJson);
        const idToken = tokenJson.id_token;
        const accessToken = tokenJson.access_token;

        const profile = decodeJwt(idToken) || {};
        const user = {
          name: profile.name || '',
          email: profile.email || '',
          picture: profile.picture || '',
          raw: profile,
          idToken,
          accessToken
        };

        // Persist minimal user info
        localStorage.setItem('google_user', JSON.stringify(user));
        console.log('[Google] User stored in localStorage');

        toast({ title: 'Signed in', description: `Welcome ${user.name}` });
        // Redirect to welcome page
        navigate('/welcome');
      } catch (e) {
        console.error('[Google] Callback processing failed:', e);
        toast({ title: 'Sign-in Error', description: 'Could not complete sign-in.', variant: 'destructive' });
        navigate('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div>{loading ? 'Completing sign-in...' : 'Redirecting...'}</div>
      </div>
    </div>
  );
};

export default AuthCallback;
