import React from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();
  const googleUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('google_user') || 'null') : null;

  const signOut = () => {
    localStorage.removeItem('google_user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-yellow-100 shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome to Drishti</h1>
        <p className="text-gray-600 mb-6">Empowering communities with real-time safety and situational awareness.</p>

        {googleUser ? (
          <div className="space-y-3">
            <img src={googleUser.picture} alt="avatar" className="w-24 h-24 rounded-full mx-auto" />
            <div className="text-lg font-semibold">{googleUser.name}</div>
            <div className="text-sm text-gray-600">{googleUser.email}</div>
            <button onClick={signOut} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl">Sign out</button>
          </div>
        ) : (
          <div>
            <p className="text-gray-700">You're not signed in with Google.</p>
            <button onClick={() => navigate('/login')} className="mt-4 px-4 py-2 bg-yellow-400 rounded-xl">Go to Login</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Welcome;
