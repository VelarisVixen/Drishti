import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Mail, Phone, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(formData);
      // Navigation will be handled by App.jsx based on authentication state
    } catch (error) {
      // Error is already handled in the login function with toast
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.email.trim() && formData.phone.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-amber-50 flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-yellow-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-100/40 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-yellow-200/50 p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-2xl mb-4 shadow-lg"
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-800 mb-2"
            >
              Welcome to SafeGuard
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600"
            >
              Your safety, our priority
            </motion.p>
          </div>

          {/* Login Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-yellow-600" />
                Full Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-white/70 border border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200 text-gray-800 placeholder-gray-500"
                required
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-yellow-600" />
                Email Address
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-white/70 border border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200 text-gray-800 placeholder-gray-500"
                required
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-yellow-600" />
                Phone Number
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 bg-white/70 border border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200 text-gray-800 placeholder-gray-500"
                required
              />
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={!isFormValid || isLoading}
              whileHover={{ scale: isFormValid ? 1.02 : 1 }}
              whileTap={{ scale: isFormValid ? 0.98 : 1 }}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                isFormValid && !isLoading
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Get Started
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-gray-500">
              By continuing, you agree to our privacy policy and terms of service
            </p>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
};

export default Login;
