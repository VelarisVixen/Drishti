
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Shield, MapPin, Users, Clock } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { usePanic } from '@/contexts/PanicContext';
import { useDangerAlert } from '@/contexts/DangerAlertContext';

const Home = () => {
  const { location, isLoading: locationLoading } = useLocation();
  const { panicHistory } = usePanic();
  const { alertHistory, isConnected } = useDangerAlert();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      icon: Shield,
      label: 'Safety Status',
      value: isConnected ? 'Protected' : 'Connecting...',
      color: isConnected ? 'text-green-400' : 'text-yellow-400'
    },
    {
      icon: MapPin,
      label: 'Location',
      value: location ? 'Active' : 'Getting...',
      color: location ? 'text-blue-400' : 'text-orange-400'
    },
    {
      icon: Users,
      label: 'Nearby Alerts',
      value: alertHistory.length.toString(),
      color: 'text-purple-400'
    },
    {
      icon: Clock,
      label: 'Last Check',
      value: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: 'text-pink-400'
    }
  ];

  return (
    <>
      <Helmet>
        <title>SafeGuard - Your Safety Companion</title>
        <meta name="description" content="Stay safe with real-time crowd safety monitoring and emergency alerts" />
      </Helmet>

      <div className="min-h-screen p-6 pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            className="w-20 h-20 mx-auto mb-4 glass rounded-2xl flex items-center justify-center"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Shield size={32} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">SafeGuard</h1>
          <p className="text-white/70">Your personal safety companion</p>
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-6 mb-6"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              Welcome Back! 👋
            </h2>
            <p className="text-white/80 text-sm">
              Stay alert, stay safe. We're monitoring your area for any safety concerns.
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="glass rounded-2xl p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl bg-white/10 ${stat.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">{stat.label}</p>
                    <p className={`font-semibold ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-3xl p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <motion.button
              className="w-full glass-dark rounded-2xl p-4 text-left hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Backend integration hook for location sharing
                console.log('Share location with contacts');
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <MapPin size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Share Location</p>
                  <p className="text-white/60 text-sm">Send your location to emergency contacts</p>
                </div>
              </div>
            </motion.button>

            <motion.button
              className="w-full glass-dark rounded-2xl p-4 text-left hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Backend integration hook for safe check-in
                console.log('Safe check-in');
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Shield size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Safe Check-in</p>
                  <p className="text-white/60 text-sm">Let your contacts know you're safe</p>
                </div>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Recent Activity */}
        {(panicHistory.length > 0 || alertHistory.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass rounded-3xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {alertHistory.slice(0, 3).map((alert, index) => (
                <div key={alert.id} className="flex items-center space-x-3 p-3 glass-dark rounded-xl">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-sm">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{alert.title}</p>
                    <p className="text-white/60 text-xs">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {panicHistory.slice(0, 2).map((panic, index) => (
                <div key={panic.id} className="flex items-center space-x-3 p-3 glass-dark rounded-xl">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-sm">🚨</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Panic Alert Sent</p>
                    <p className="text-white/60 text-xs">
                      {new Date(panic.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default Home;
