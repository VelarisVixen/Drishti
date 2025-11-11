import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { toast } from '@/components/ui/use-toast';
import { auth, db, createOrUpdateUser, getUser, COLLECTIONS } from '@/lib/firebase';
import { ensureSupabaseUser } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setLoading(true);

    // Set up Firebase auth listener for real-time authentication
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const userProfile = await getUser(firebaseUser.uid);
          if (userProfile) {
            setUser(firebaseUser);
            setUserProfile(userProfile);
            setIsAuthenticated(true);
            console.log('✅ User authenticated and profile loaded from Firestore');
          } else {
            // User exists in Auth but no profile in Firestore
            console.log('User authenticated but no profile found');
            setUser(firebaseUser);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        // Check for legacy localStorage session (migration)
        const savedUser = localStorage.getItem('drishti_user_session');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            // Migrate to Firebase Auth
            await login(parsedUser);
            localStorage.removeItem('drishti_user_session'); // Clean up
          } catch (error) {
            console.error('Error migrating user:', error);
            localStorage.removeItem('drishti_user_session');
          }
        }
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (userData) => {
    setLoading(true);
    try {
      // Validate required fields
      if (!userData.name || !userData.email || !userData.phone) {
        throw new Error('Please fill in all required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate phone format
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(userData.phone.replace(/[\s\-\(\)]/g, ''))) {
        throw new Error('Please enter a valid phone number');
      }

      const processedUserData = {
        id: `user_${Date.now()}`,
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        phone: userData.phone.trim(),
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        safetyStatus: 'safe',
        locationPermission: 'pending'
      };

      let finalUserData;
      let shouldUseFallback = false;

      try {
        // Try to authenticate with Firebase
        const firebaseUser = await signInAnonymously(auth);
        const userId = firebaseUser.user.uid;

        finalUserData = {
          ...processedUserData,
          id: userId,
          firebaseUid: userId
        };

        // Try to save user profile to Firestore
        try {
          await createOrUpdateUser(userId, finalUserData);
          console.log('✅ User successfully saved to Firebase');
          // Supabase first-login sync (Firebase branch)
          try {
            console.log('[Supabase] Initiating first-login sync for user:', userId);
            const supabasePayload = {
              user_id: userId,
              name: finalUserData.name,
              email: finalUserData.email,
              phone: finalUserData.phone,
              role: finalUserData.role || 'citizen'
            };
            console.log('[Supabase] Payload prepared:', supabasePayload);
            const result = await ensureSupabaseUser(supabasePayload);
            console.log('[Supabase] ensureSupabaseUser result:', result);
          } catch (e) {
            console.error('[Supabase] First-login sync failed (Firebase branch):', e);
          }
        } catch (firestoreError) {
          console.warn('⚠️ Firestore save failed:', firestoreError.message);
          // Continue with Firebase Auth but without Firestore
        }
      } catch (authError) {
        console.warn('⚠️ Firebase Auth failed:', authError.message);
        shouldUseFallback = true;

        // Create fallback user data
        finalUserData = {
          ...processedUserData,
          id: `local_${Date.now()}`,
          firebaseUid: null,
          isLocalUser: true
        };
      }
      
      if (shouldUseFallback) {
        // Use local storage fallback
        localStorage.setItem('safeguard_user_session', JSON.stringify(finalUserData));
        setUser({ uid: finalUserData.id, isAnonymous: true }); // Mock Firebase user
        setUserProfile(finalUserData);
        setIsAuthenticated(true);

        toast({
          title: "Welcome to SafeGuard! 👋",
          description: `Hello ${finalUserData.name}! Running in local mode - Firebase needs configuration.`,
          duration: 6000
        });
      } else {
        // Firebase authentication successful
        setUser(firebaseUser.user);
        setUserProfile(finalUserData);
        setIsAuthenticated(true);

        toast({
          title: "Welcome to SafeGuard! 👋",
          description: `Hello ${finalUserData.name}! Your account is connected to Firebase.`,
          duration: 4000
        });
      }

      console.log('✅ User successfully created');
      // Supabase first-login sync (final safeguard - runs in both branches)
      try {
        console.log('[Supabase] Preparing first-login sync payload (final)...');
        const supabasePayload = {
          user_id: finalUserData.id,
          name: finalUserData.name,
          email: finalUserData.email,
          phone: finalUserData.phone,
          role: finalUserData.role || 'citizen'
        };
        console.log('[Supabase] Final payload:', supabasePayload);
        const result = await ensureSupabaseUser(supabasePayload);
        console.log('[Supabase] Final ensureSupabaseUser result:', result);
      } catch (e) {
        console.error('[Supabase] Final first-login sync failed:', e);
      }
      return finalUserData;
    } catch (error) {
      console.error('❌ Login error:', error);

      toast({
        title: "Login Failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
        duration: 5000
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Sign out from Firebase
      await auth.signOut();

      // Clear state (will be handled by auth listener)
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);

      // Clean up any remaining localStorage
      localStorage.removeItem('drishti_user_session');

      toast({
        title: "Goodbye! 👋",
        description: "You have been safely logged out from Firebase.",
        duration: 3000
      });

      console.log('✅ User successfully logged out from Firebase');
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast({
        title: "Logout Error",
        description: "There was an issue logging out. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user || !userProfile) return;

    try {
      const updatedProfile = {
        ...userProfile,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      // Update in Firestore
      await createOrUpdateUser(user.uid, updatedProfile);

      // Update local state
      setUserProfile(updatedProfile);

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        duration: 3000
      });

      console.log('✅ User profile updated in Firestore');
      return updatedProfile;
    } catch (error) {
      console.error('❌ Profile update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
        duration: 3000
      });
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUserProfile,
    firebaseUser: user,
    auth,
    db
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
