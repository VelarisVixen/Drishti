import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const LoadingSpinner = ({ message = "Loading...", size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative"
      >
        {/* Spinning border */}
        <div className={`${sizeClasses[size]} border-4 border-yellow-200 border-t-yellow-400 rounded-full animate-spin`}></div>
        
        {/* Center icon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Shield className={`${iconSizes[size]} text-yellow-600`} />
        </motion.div>
      </motion.div>

      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 text-center"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner;
