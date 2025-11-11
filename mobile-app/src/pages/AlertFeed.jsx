
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { RefreshCw, MapPin, Clock, Filter } from 'lucide-react';
import { useDangerAlert } from '@/contexts/DangerAlertContext';
import { toast } from '@/components/ui/use-toast';

const AlertFeed = () => {
  const { alertHistory, isConnected, fetchAlertsFromAPI } = useDangerAlert();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Backend integration hook - fetch latest alerts
      await fetchAlertsFromAPI();
      toast({
        title: "Alerts Updated",
        description: "Latest safety alerts have been loaded."
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to fetch latest alerts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'fire':
        return '🔥';
      case 'violence':
        return '⚠️';
      case 'medical':
        return '🚑';
      case 'evacuation':
        return '🚨';
      default:
        return '⚠️';
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'border-red-500/50 bg-red-500/10';
      case 'medium':
        return 'border-orange-500/50 bg-orange-500/10';
      case 'low':
        return 'border-yellow-500/50 bg-yellow-500/10';
      default:
        return 'border-red-500/50 bg-red-500/10';
    }
  };

  const filteredAlerts = alertHistory.filter(alert => {
    if (filter === 'all') return true;
    return alert.type === filter;
  });

  const alertTypes = ['all', 'fire', 'violence', 'medical', 'evacuation'];

  return (
    <>
      <Helmet>
        <title>Alert Feed - SafeGuard</title>
        <meta name="description" content="Real-time safety alerts and emergency notifications in your area" />
      </Helmet>

      <div className="min-h-screen p-6 pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Live Alerts</h1>
            <p className="text-white/70 text-sm">
              {isConnected ? 'Connected • Real-time monitoring' : 'Connecting...'}
            </p>
          </div>
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 glass rounded-xl hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw 
              size={20} 
              className={`text-white ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </motion.button>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-2 mb-6"
        >
          <div className="flex space-x-1 overflow-x-auto">
            {alertTypes.map((type) => (
              <motion.button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  filter === type
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Alert List */}
        <AnimatePresence>
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-3xl p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">All Clear!</h3>
              <p className="text-white/70">No safety alerts in your area right now.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass rounded-2xl p-4 border ${getAlertColor(alert.severity)}`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-semibold">{alert.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.severity === 'high' ? 'bg-red-500 text-white' :
                          alert.severity === 'medium' ? 'bg-orange-500 text-white' :
                          'bg-yellow-500 text-black'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm mb-3">{alert.message}</p>
                      <div className="flex items-center justify-between text-white/60 text-xs">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <MapPin size={12} />
                            <span>Nearby</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock size={12} />
                            <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <span className="text-white/40">
                          {alert.source || 'Emergency Services'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 glass rounded-2xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-yellow-400'
              }`}></div>
              <span className="text-white text-sm">
                {isConnected ? 'Real-time monitoring active' : 'Connecting to alert service...'}
              </span>
            </div>
            <span className="text-white/60 text-xs">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AlertFeed;
