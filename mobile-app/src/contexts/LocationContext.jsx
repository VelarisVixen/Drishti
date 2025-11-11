import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const newLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      };

      setLocation(newLocation);
      
      // Backend integration hook - replace with actual API call
      await sendLocationToBackend(newLocation);
      
      return newLocation;
    } catch (err) {
      const errorMessage = err.message || 'Failed to get location';
      setError(errorMessage);
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Backend integration function - handles development mode gracefully
  const sendLocationToBackend = async (locationData) => {
    try {
      // Check if we're in development mode without backend
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('fly.dev')) {
        console.log('📍 Location updated (development mode):', locationData);
        return; // Skip backend call in development
      }

      // Production backend API call
      const response = await fetch('/api/location/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(locationData)
      });

      if (!response.ok) {
        throw new Error('Failed to send location to server');
      }

      console.log('Location sent to backend successfully');
    } catch (error) {
      console.warn('Backend location update failed (non-critical):', error.message);
      // Don't throw here to avoid breaking the location update flow
    }
  };

  const watchLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        setLocation(newLocation);
        sendLocationToBackend(newLocation);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );

    return watchId;
  };

  const stopWatchingLocation = (watchId) => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  };

  useEffect(() => {
    // Auto-get location on mount
    getCurrentLocation().catch(() => {
      // Error already handled in getCurrentLocation
    });
  }, []);

  const value = {
    location,
    isLoading,
    error,
    getCurrentLocation,
    watchLocation,
    stopWatchingLocation
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
