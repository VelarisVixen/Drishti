import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  uploadVideoAndGetURL,
  createSOSAlert,
  subscribeToSOSAlerts,
  createNotificationLog
} from '@/lib/firebase';

const PanicContext = createContext();

export const usePanic = () => {
  const context = useContext(PanicContext);
  if (!context) {
    throw new Error('usePanic must be used within a PanicProvider');
  }
  return context;
};

const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let platform = 'unknown';
    if (/android/i.test(ua)) {
        platform = 'android';
    } else if (/iPad|iPhone|iPod/.test(ua)) {
        platform = 'ios';
    } else if (/Win/.test(ua)) {
        platform = 'windows';
    } else if (/Mac/.test(ua)) {
        platform = 'macos';
    }

    return {
        platform,
        version: navigator.appVersion,
        model: 'Web Browser'
    };
};

export const PanicProvider = ({ children }) => {
  const [isActivated, setIsActivated] = useState(false); // For button feedback only
  const [hasActiveAlerts, setHasActiveAlerts] = useState(false); // For actual alert monitoring
  const [isProcessing, setIsProcessing] = useState(false);
  const [panicHistory, setPanicHistory] = useState([]);
  const [realtimeAlerts, setRealtimeAlerts] = useState([]);
  const { location, getCurrentLocation } = useLocation();
  const { firebaseUser, userProfile } = useAuth();

  // Load SOS alerts (Firebase or local storage)
  useEffect(() => {
    if (!firebaseUser?.uid || !userProfile) return;

    const isLocalMode = userProfile.isLocalUser || firebaseUser.uid.startsWith('local_');

    if (isLocalMode) {
      // Load from localStorage for local mode
      console.log('��� Loading SOS alerts from local storage...');
      const localAlerts = JSON.parse(localStorage.getItem('local_sos_alerts') || '[]');
      setPanicHistory(localAlerts);
      setRealtimeAlerts(localAlerts);

      // Check for pending/active alerts (separate from button state)
      const activeAlert = localAlerts.find(alert => alert.status === 'pending' || alert.status === 'active');
      setHasActiveAlerts(!!activeAlert);
    } else {
      // Set up Firebase real-time subscription
      console.log('🔄 Setting up real-time SOS alerts subscription...');
      const unsubscribe = subscribeToSOSAlerts((alerts) => {
        console.log('🚨 Received real-time SOS alerts:', alerts.length);
        setPanicHistory(alerts);
        setRealtimeAlerts(alerts);

        // Check for pending/active alerts (separate from button state)
        const activeAlert = alerts.find(alert => alert.status === 'pending' || alert.status === 'active');
        setHasActiveAlerts(!!activeAlert);
      });

      return () => {
        console.log('🚫 Cleaning up SOS alerts subscription');
        unsubscribe();
      };
    }
  }, [firebaseUser?.uid, userProfile]);

  const activatePanic = async (message, stream) => {
    if (!firebaseUser?.uid || !userProfile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send SOS alerts.",
        variant: "destructive",
        duration: 5000
      });
      return;
    }

    const isLocalMode = userProfile.isLocalUser || firebaseUser.uid.startsWith('local_');

    // Clear any existing timeout before starting new process
    if (window.panicButtonTimeout) {
      clearTimeout(window.panicButtonTimeout);
      window.panicButtonTimeout = null;
    }

    setIsProcessing(true);
    try {
      // Get current location
      let currentLocation = location;
      if (!currentLocation) {
        toast({ title: "Getting Location...", description: "Please wait while we fetch your precise location." });
        currentLocation = await getCurrentLocation();
      }

      // Upload video to Firebase Storage (optional - don't fail if it doesn't work)
      let videoData = { videoUrl: null, videoThumbnail: null, videoDuration: 0 };
      if (stream) {
        try {
          toast({ title: "Uploading Video...", description: "Your emergency video is being securely uploaded to Firebase..." });
          videoData = await uploadVideoAndGetURL(stream, firebaseUser.uid);
          console.log('✅ Video uploaded successfully');
        } catch (videoError) {
          console.warn('⚠️ Video upload failed, continuing with SOS alert without video:', videoError.message);
          toast({
            title: "Video Upload Failed",
            description: "SOS alert will be sent without video. Emergency services will still be notified.",
            duration: 5000
          });
          // Continue with empty video data
        }
      }

      const deviceInfo = getDeviceInfo();

      // Create SOS alert data according to new schema
      const sosAlertData = {
        // REQUIRED FIELDS for new schema
        userId: firebaseUser.uid,
        message: message || "Emergency SOS activated without a message.",
        videoUrl: videoData.videoUrl,
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          address: `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` // Simple coordinate-based address
        }
      };

      let alertId;

      if (isLocalMode) {
        // Save to localStorage for local mode
        console.log('🚨 Creating SOS alert in local storage...');
        alertId = `local_sos_${Date.now()}`;
        const localAlerts = JSON.parse(localStorage.getItem('local_sos_alerts') || '[]');
        localAlerts.unshift({ ...sosAlertData, id: alertId, timestamp: new Date() });
        localStorage.setItem('local_sos_alerts', JSON.stringify(localAlerts));

        // Update local state immediately
        setPanicHistory(localAlerts);
        setRealtimeAlerts(localAlerts);
      } else {
        // Save to Firestore (real-time)
        console.log('🚨 Creating SOS alert in Firestore...');
        alertId = await createSOSAlert(sosAlertData);

        // Only log notification if SOS alert was successfully created
        if (alertId) {
          try {
            await createNotificationLog({
              reportId: alertId, // Use reportId instead of alertId to match schema
              userId: firebaseUser.uid,
              type: 'sos_alert_created',
              message: `SOS alert created: ${message || 'Emergency activated'}`,
              metadata: {
                location: currentLocation,
                hasVideo: !!videoData.videoUrl
              }
            });
          } catch (logError) {
            console.warn('⚠️ Failed to create notification log:', logError.message);
            // Don't fail the entire operation if logging fails
          }
        }
      }

      // Send to backend services
      await sendPanicAlertToBackend({
        ...sosAlertData,
        alertId
      });

      setIsActivated(true);

      const hasVideo = !!videoData.videoUrl;

      if (isLocalMode) {
        toast({
          title: "🚨 SOS Alert Created!",
          description: `Emergency alert saved locally${hasVideo ? ' with video' : ' (no video)'}. Ready to send another if needed.`,
          duration: 5000,
        });
        console.log('✅ SOS Alert successfully created locally:', alertId, hasVideo ? 'with video' : 'without video');
      } else {
        toast({
          title: "🚨 SOS Alert Sent!",
          description: `Emergency alert sent successfully${hasVideo ? ' with video' : ' (no video)'}. You can send another alert if needed.`,
          duration: 5000,
        });
        console.log('✅ SOS Alert successfully created in Firestore:', alertId, hasVideo ? 'with video' : 'without video');
      }

      // Auto-reset button state after 2 seconds to allow sending multiple alerts quickly
      const resetTimeout = setTimeout(() => {
        console.log('🔄 Resetting button state to allow next alert');
        setIsActivated(false);
      }, 2000);

      // Store the timeout so it can be cleared if needed
      window.panicButtonTimeout = resetTimeout;

    } catch (error) {
      console.error("❌ Panic Activation Error:", error);

      // Log error (only for Firebase mode)
      if (firebaseUser?.uid && !isLocalMode) {
        await createNotificationLog({
          reportId: `error_${Date.now()}`, // Dummy reportId for error cases
          userId: firebaseUser.uid,
          type: 'sos_alert_failed',
          message: `SOS alert failed: ${error.message}`,
          metadata: { error: error.message }
        }).catch(console.error);
      }

      toast({
        title: "SOS Alert Failed",
        description: error.message || "Failed to send SOS alert. Please try again.",
        variant: "destructive",
        duration: 8000
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const sendPanicAlertToBackend = async (payload) => {
    try {
      console.log('📶 Sending SOS alert to backend services...');

      // Check if we're in development mode
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('fly.dev')) {
        console.log('🆘 SOS Alert processed (development mode):', payload.alertId);

        // Simulate realistic backend delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast({
          title: "Development Mode",
          description: "SOS alert saved to Firebase. In production, emergency services would be notified.",
          duration: 5000
        });
        return;
      }

      // Production backend API call
      const response = await fetch('/api/sos/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await firebaseUser.getIdToken()}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server returned an error' }));
        throw new Error(`Server Error: ${response.status} - ${errorData.message}`);
      }

      const result = await response.json();
      console.log('✅ SOS alert sent to backend successfully:', result);

      toast({
        title: "Emergency Services Notified",
        description: "Your SOS alert has been sent to emergency services.",
        duration: 5000
      });
    } catch (error) {
      console.error('❌ Backend SOS alert failed:', error);

      // In development mode, don't fail completely since Firebase storage worked
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('fly.dev')) {
        console.warn('⚠️ Backend not available, but alert saved to Firebase');
        return;
      }

      throw error;
    }
  };

  const deactivatePanic = () => {
    // Clear any pending timeout
    if (window.panicButtonTimeout) {
      clearTimeout(window.panicButtonTimeout);
      window.panicButtonTimeout = null;
    }
    setIsActivated(false);
    console.log('🔄 Button manually deactivated');
  };

  const clearHistory = async () => {
    if (!firebaseUser?.uid) return;

    try {
      // Note: In production, you might want to soft-delete or archive instead of clearing
      // For now, we'll just clear the local state as Firestore data persists
      setPanicHistory([]);
      setRealtimeAlerts([]);

      // Log the action
      await createNotificationLog({
        reportId: `history_clear_${Date.now()}`, // Dummy reportId for non-SOS actions
        userId: firebaseUser.uid,
        type: 'history_cleared',
        message: 'User cleared SOS alert history from local view'
      });

      toast({
        title: "Local History Cleared",
        description: "SOS alert history cleared from local view. Data remains in Firebase."
      });

      console.log('✅ Local SOS history cleared');
    } catch (error) {
      console.error('❌ Error clearing history:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear history. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetButtonState = () => {
    console.log('🔄 Manually resetting button state');
    if (window.panicButtonTimeout) {
      clearTimeout(window.panicButtonTimeout);
      window.panicButtonTimeout = null;
    }
    setIsActivated(false);
  };

  const value = {
    isActivated,
    hasActiveAlerts,
    isProcessing,
    setIsProcessing,
    panicHistory,
    realtimeAlerts,
    activatePanic,
    deactivatePanic,
    clearHistory,
    resetButtonState
  };

  // Global debug function for testing
  React.useEffect(() => {
    window.debugSOSButton = () => {
      console.log('🐛 SOS Button Debug Info:', {
        isActivated,
        hasActiveAlerts,
        isProcessing,
        panicHistoryCount: panicHistory.length,
        timeoutExists: !!window.panicButtonTimeout
      });
    };
    window.resetSOSButton = resetButtonState;
  }, [isActivated, hasActiveAlerts, isProcessing, panicHistory.length]);

  return (
    <PanicContext.Provider value={value}>
      {children}
    </PanicContext.Provider>
  );
};
