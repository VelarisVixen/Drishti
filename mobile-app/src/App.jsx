import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DangerAlertProvider } from '@/contexts/DangerAlertContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { PanicProvider } from '@/contexts/PanicContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import SOSAlerts from '@/pages/SOSAlerts';
import Settings from '@/pages/Settings';
import SOSHistory from '@/pages/SOSHistory';
import Welcome from '@/pages/Welcome';
import AuthCallback from '@/pages/AuthCallback';
import BottomNavigation from '@/components/BottomNavigation';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SafeGuard...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SafeGuard...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Main App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/welcome" element={<Welcome />} />

      {/* Protected routes with shared layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
            <BottomNavigation />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sos-alerts"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <SOSAlerts />
            </ErrorBoundary>
            <BottomNavigation />
          </ProtectedRoute>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <SOSHistory />
            </ErrorBoundary>
            <BottomNavigation />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Settings />
            </ErrorBoundary>
            <BottomNavigation />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <Helmet>
        <title>SafeGuard - Personal Safety Dashboard</title>
        <meta name="description" content="Modern personal safety app with AI-powered monitoring and emergency features" />
        <meta name="theme-color" content="#fbbf24" />
      </Helmet>
      
      <AuthProvider>
        <LocationProvider>
          <PanicProvider>
            <DangerAlertProvider>
              <AppRoutes />
              <Toaster />
            </DangerAlertProvider>
          </PanicProvider>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
