import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  createSystemAlert,
  subscribeToSystemAlerts,
  createNotificationLog
} from '@/lib/firebase';

const DangerAlertContext = createContext();

export const useDangerAlert = () => {
  const context = useContext(DangerAlertContext);
  if (!context) {
    throw new Error('useDangerAlert must be used within a DangerAlertProvider');
  }
  return context;
};

export const DangerAlertProvider = ({ children }) => {
  const [activeAlert, setActiveAlert] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { location } = useLocation();
  const { firebaseUser } = useAuth();

  // Real-time Firebase subscription for danger alerts
  useEffect(() => {
    if (!location) return;

    console.log('🔄 Setting up real-time system alerts subscription...');
    setIsConnected(true);

    const unsubscribe = subscribeToSystemAlerts((alerts) => {
      console.log('⚠️ Received real-time system alerts:', alerts.length);
      setAlertHistory(alerts);

      // Check for new active alerts
      const newActiveAlert = alerts.find(alert =>
        alert.isActive &&
        (!activeAlert || alert.id !== activeAlert.id)
      );

      if (newActiveAlert) {
        handleIncomingAlert(newActiveAlert);
      }
    });

    // Simulate periodic danger alerts for demo (remove in production)
    const demoInterval = setInterval(() => {
      if (Math.random() > 0.9) { // 10% chance every 30 seconds
        simulateIncomingAlert();
      }
    }, 30000);

    return () => {
      console.log('🚫 Cleaning up system alerts subscription');
      unsubscribe();
      clearInterval(demoInterval);
      setIsConnected(false);
    };
  }, [location, activeAlert]);

  // Create a new system alert (for testing or admin use)
  const createNewSystemAlert = async (alertData) => {
    try {
      if (!firebaseUser?.uid) {
        throw new Error('User must be authenticated to create alerts');
      }

      const alertId = await createSystemAlert({
        ...alertData,
        createdBy: firebaseUser.uid,
        location: alertData.location || location
      });

      // Log the action
      await createNotificationLog({
        reportId: alertId,
        type: 'system_alert_created',
        emergencyServices: [],
        publicRecipients: [],
        status: 'sent'
      });

      console.log('✅ System alert created:', alertId);
      return alertId;
    } catch (error) {
      console.error('❌ Error creating system alert:', error);
      throw error;
    }
  };

  // Simulate incoming alert for demo (will create real Firestore entry)
  const simulateIncomingAlert = async () => {
    if (!location || !firebaseUser?.uid) return;

    const alertTypes = ['fire', 'violence', 'medical', 'evacuation'];
    const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];

    const mockAlert = {
      id: `alert_${Date.now()}`,
      title: `${randomType.charAt(0).toUpperCase() + randomType.slice(1)} Alert`,
      message: `Emergency situation reported in your area. Please stay alert and follow safety protocols.`,
      severity: Math.random() > 0.5 ? 'high' : 'medium',
      location: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      radius: 500, // meters
      duration: 60, // minutes
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    };

    try {
      // Create real Firestore entry
      const alertId = await createSystemAlert(mockAlert);
      console.log('🚨 Simulated system alert created in Firestore:', alertId);
    } catch (error) {
      console.error('❌ Error creating simulated alert:', error);
    }
  };

  const handleIncomingAlert = (alertData) => {
    if (!location) return;

    // Calculate distance to alert
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      alertData.location.latitude,
      alertData.location.longitude
    );

    // Check if user is within alert radius
    if (distance <= alertData.radius) {
      setActiveAlert(alertData);

      // Trigger vibration if available
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }

      // Log notification received
      if (firebaseUser?.uid) {
        createNotificationLog({
          userId: firebaseUser.uid,
          type: 'danger_alert_received',
          alertId: alertData.id,
          message: `Danger alert received: ${alertData.title}`,
          metadata: {
            alertType: alertData.type,
            severity: alertData.severity,
            distance: Math.round(distance)
          }
        }).catch(console.error);
      }

      toast({
        title: `⚠️ ${alertData.title}`,
        description: alertData.message,
        variant: "destructive",
        duration: 10000
      });

      console.log('⚠️ Danger alert displayed to user:', alertData.title);
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };


  const clearAlertHistory = async () => {
    try {
      // Clear local state (Firestore data persists)
      setAlertHistory([]);
      setActiveAlert(null);

      // Log the action
      if (firebaseUser?.uid) {
        await createNotificationLog({
          userId: firebaseUser.uid,
          type: 'alert_history_cleared',
          message: 'User cleared danger alert history from local view'
        });
      }

      toast({
        title: "Local History Cleared",
        description: "Alert history cleared from local view. Data remains in Firebase."
      });

      console.log('✅ Local danger alert history cleared');
    } catch (error) {
      console.error('❌ Error clearing alert history:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear history. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Dismiss current active alert
  const dismissAlert = async () => {
    if (!activeAlert) return;

    try {
      setActiveAlert(null);

      // Log dismissal
      if (firebaseUser?.uid) {
        await createNotificationLog({
          userId: firebaseUser.uid,
          type: 'danger_alert_dismissed',
          alertId: activeAlert.id,
          message: `User dismissed danger alert: ${activeAlert.title}`
        });
      }

      console.log('✅ Danger alert dismissed by user');
    } catch (error) {
      console.error('❌ Error logging alert dismissal:', error);
    }
  };

  const value = {
    activeAlert,
    alertHistory,
    isConnected,
    dismissAlert,
    clearAlertHistory,
    createNewSystemAlert,
    simulateIncomingAlert
  };

  return (
    <DangerAlertContext.Provider value={value}>
      {children}
    </DangerAlertContext.Provider>
  );
};
