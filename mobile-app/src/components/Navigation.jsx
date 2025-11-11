
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, AlertTriangle, Settings, History } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 z-40"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="glass-dark rounded-t-3xl mx-4 mb-4 p-4">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/60 hover:text-white/80'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    className="w-1 h-1 bg-white rounded-full"
                    layoutId="activeIndicator"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;
