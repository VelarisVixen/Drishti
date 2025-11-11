import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings, AlertTriangle, History, Home } from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      color: 'text-blue-600',
      activeColor: 'text-blue-700'
    },
    {
      id: 'alerts',
      label: 'SOS Alerts',
      icon: AlertTriangle,
      path: '/sos-alerts',
      color: 'text-red-600',
      activeColor: 'text-red-700'
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      path: '/history',
      color: 'text-green-600',
      activeColor: 'text-green-700'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      color: 'text-purple-600',
      activeColor: 'text-purple-700'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      {/* Background with blur effect */}
      <div className="bg-white/95 backdrop-blur-lg border-t border-yellow-200/50 shadow-lg">
        <div className="safe-area-inset-bottom">
          <div className="grid grid-cols-4 gap-1 px-2 py-3">
            {navItems.map((item) => {
              const isCurrentActive = isActive(item.path);
              const Icon = item.icon;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className="relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 active:scale-95"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Active indicator background */}
                  {isCurrentActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-yellow-100 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  
                  {/* Icon and label container */}
                  <div className="relative z-10 flex flex-col items-center">
                    <motion.div
                      className="relative"
                      animate={{
                        scale: isCurrentActive ? 1.1 : 1,
                        y: isCurrentActive ? -1 : 0
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Icon 
                        size={20} 
                        className={`${
                          isCurrentActive ? item.activeColor : 'text-gray-500'
                        } transition-colors duration-200`}
                      />
                      
                      {/* Active dot indicator */}
                      {isCurrentActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
                        />
                      )}
                    </motion.div>
                    
                    <motion.span
                      className={`text-xs font-medium mt-1 ${
                        isCurrentActive ? 'text-gray-800' : 'text-gray-500'
                      } transition-colors duration-200`}
                      animate={{
                        opacity: isCurrentActive ? 1 : 0.8,
                        fontWeight: isCurrentActive ? 600 : 500
                      }}
                    >
                      {item.label}
                    </motion.span>
                  </div>
                  
                  {/* Ripple effect on tap */}
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    initial={{ scale: 0, opacity: 0 }}
                    whileTap={{ 
                      scale: 1.2, 
                      opacity: [0, 0.3, 0],
                      transition: { duration: 0.3 }
                    }}
                    style={{
                      background: isCurrentActive ? item.activeColor : item.color,
                    }}
                  />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white/95"></div>
    </motion.div>
  );
};

export default BottomNavigation;
