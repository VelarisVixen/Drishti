import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import {
  RefreshCw,
  MapPin,
  Clock,
  Filter,
  AlertTriangle,
  CheckCircle,
  Database,
  Users,
  Zap,
  Bell,
  Wifi,
  Eye
} from 'lucide-react';
import { usePanic } from '@/contexts/PanicContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const SOSAlerts = () => {
  const { realtimeAlerts, panicHistory } = usePanic();
  const { firebaseUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  // Combine SOS alerts (from panic context) and danger alerts for comprehensive view
  const allAlerts = React.useMemo(() => {
    const sosAlerts = (realtimeAlerts || []).map(alert => ({
      ...alert,
      type: alert.type || 'sos',
      title: alert.title || 'SOS Emergency Alert',
      severity: alert.severity || 'high',
      status: alert.status || 'pending',
      reportedBy: alert.reportedBy || 'SafeGuard User',
      location: alert.location || { address: 'Location unavailable' },
      message: alert.message || 'Emergency situation reported'
    }));

    const dangerAlerts = (alertHistory || []).map(alert => ({
      ...alert,
      type: alert.type || 'emergency',
      severity: alert.severity || 'medium',
      status: alert.status || 'active',
      reportedBy: alert.source || alert.reportedBy || 'Emergency Services',
      location: alert.location || { address: 'Location unavailable' },
      message: alert.message || 'Emergency alert received'
    }));

    return [...sosAlerts, ...dangerAlerts].sort((a, b) => {
      const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || Date.now());
      const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || Date.now());
      return bTime - aTime;
    });
  }, [realtimeAlerts, alertHistory]);


  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Alerts Updated",
        description: "Latest safety alerts have been loaded.",
        duration: 3000
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to fetch latest alerts. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'medical':
        return '🚑';
      case 'evacuation':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'fire':
        return '🔥';
      case 'violence':
        return '🛡️';
      default:
        return '⚠️';
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-500 text-white'
        };
      case 'medium':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-700',
          badge: 'bg-orange-500 text-white'
        };
      case 'low':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          badge: 'bg-yellow-500 text-gray-800'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          badge: 'bg-gray-500 text-white'
        };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'resolved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'monitoring':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / (1000 * 60));
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const filteredAlerts = allAlerts.filter(alert => {
    if (filter === 'all') return true;
    return (alert.severity || 'medium') === filter || (alert.status || 'pending') === filter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-amber-50 pb-24">
      <Helmet>
        <title>SOS Alerts - SafeGuard</title>
      </Helmet>

      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-red-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-orange-200/15 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-lg border-b border-yellow-200/50 px-6 py-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">SOS Alerts</h1>
              <p className="text-sm text-gray-600">Real-time emergency notifications</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>
        </motion.header>

        <div className="px-6 py-6 space-y-6">

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-red-200"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-700">
                  {allAlerts.filter(a => (a.status || 'pending') === 'active' || (a.status || 'pending') === 'pending').length}
                </div>
                <div className="text-xs text-gray-600">Active Alerts</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-green-200"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {allAlerts.filter(a => (a.status || 'pending') === 'resolved' || (a.status || 'pending') === 'completed').length}
                </div>
                <div className="text-xs text-gray-600">Resolved</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-200"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {allAlerts.filter(a => (a.status || 'pending') === 'monitoring' || (a.status || 'pending') === 'analyzing').length}
                </div>
                <div className="text-xs text-gray-600">Monitoring</div>
              </div>
            </motion.div>
          </div>

          {/* Filter Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 overflow-x-auto pb-2"
          >
            {['all', 'high', 'medium', 'low', 'active', 'resolved'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  filter === filterOption
                    ? 'bg-yellow-400 text-gray-800 shadow-md'
                    : 'bg-white/60 text-gray-600 hover:bg-white/80'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </motion.div>

          {/* Alerts List */}
          <div className="space-y-4">
            <AnimatePresence>
              {filteredAlerts.map((alert, index) => {
                const colors = getAlertColor(alert.severity);
                
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${colors.bg} backdrop-blur-sm rounded-2xl p-6 border ${colors.border}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{getAlertIcon(alert.type)}</div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-800">{alert.title || 'Emergency Alert'}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                            {(alert.severity || 'medium').toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(alert.status || 'pending')}`}>
                            {(alert.status || 'pending').toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 text-sm mb-3">{alert.message || 'No additional details available'}</p>

                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{alert.location?.address || 'Location unavailable'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(alert.timestamp || Date.now())}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{alert.reportedBy || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredAlerts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {allAlerts.length === 0 ? "No SOS Alerts Yet" : "All Clear!"}
              </h3>
              <p className="text-gray-600">
                {allAlerts.length === 0
                  ? "No emergency alerts have been created yet. Press the SOS button to create your first alert."
                  : "No alerts matching your filter criteria."
                }
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SOSAlerts;
