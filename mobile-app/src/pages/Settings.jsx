import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { 
  Bell, 
  MapPin, 
  Shield, 
  Globe, 
  Sun, 
  Volume2, 
  Smartphone,
  Users,
  HelpCircle,
  User,
  LogOut
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Settings = () => {
  const { userProfile, logout } = useAuth();
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      notifications: true,
      locationSharing: true,
      emergencyContacts: true,
      language: 'en',
      lightMode: true,
      soundAlerts: true,
      vibration: true,
      autoShare: false
    };
  });

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    
    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved.",
      duration: 3000
    });
  };

  const handleLogout = async () => {
    await logout();
  };

  const settingSections = [
    {
      title: 'Safety & Alerts',
      icon: Shield,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      settings: [
        {
          key: 'notifications',
          label: 'Push Notifications',
          description: 'Receive emergency alerts and safety notifications',
          type: 'toggle'
        },
        {
          key: 'soundAlerts',
          label: 'Sound Alerts',
          description: 'Play sounds for emergency notifications',
          type: 'toggle'
        },
        {
          key: 'vibration',
          label: 'Vibration',
          description: 'Vibrate device for emergency alerts',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Location & Privacy',
      icon: MapPin,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      settings: [
        {
          key: 'locationSharing',
          label: 'Location Sharing',
          description: 'Share your location for emergency services',
          type: 'toggle'
        },
        {
          key: 'autoShare',
          label: 'Auto-Share Location',
          description: 'Automatically share location during SOS',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'App Preferences',
      icon: Smartphone,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      settings: [
        {
          key: 'language',
          label: 'Language',
          description: 'Choose your preferred language',
          type: 'select',
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
            { value: 'hi', label: 'Hindi' }
          ]
        }
      ]
    }
  ];

  const ToggleSwitch = ({ checked, onChange }) => (
    <motion.button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 ${
        checked ? 'bg-yellow-400' : 'bg-gray-300'
      }`}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
        layout
      />
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-amber-50 pb-24">
      <Helmet>
        <title>Settings - SafeGuard</title>
      </Helmet>

      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-amber-200/15 rounded-full blur-3xl"></div>
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
              <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
              <p className="text-sm text-gray-600">Manage your safety preferences</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.header>

        <div className="px-6 py-6 space-y-6">

          {/* User Profile Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-yellow-200/50"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-800">{userProfile?.name}</h2>
                <p className="text-sm text-gray-600">{userProfile?.email}</p>
                <p className="text-xs text-gray-500">Member since {new Date(userProfile?.createdAt).toLocaleDateString()}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.section>

          {/* Settings Sections */}
          {settingSections.map((section, sectionIndex) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + sectionIndex * 0.1 }}
              className={`${section.bgColor} backdrop-blur-sm rounded-2xl p-6 border ${section.borderColor}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center`}>
                  <section.icon className={`w-5 h-5 ${section.iconColor}`} />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">{section.title}</h2>
              </div>

              <div className="space-y-4">
                {section.settings.map((setting) => (
                  <div key={setting.key} className="bg-white/60 rounded-xl p-4 border border-white/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{setting.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                      </div>
                      
                      <div className="ml-4">
                        {setting.type === 'toggle' && (
                          <ToggleSwitch
                            checked={settings[setting.key]}
                            onChange={(value) => updateSetting(setting.key, value)}
                          />
                        )}
                        
                        {setting.type === 'select' && (
                          <select
                            value={settings[setting.key]}
                            onChange={(e) => updateSetting(setting.key, e.target.value)}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          >
                            {setting.options.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}

          {/* Help & Support */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-yellow-200/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Help & Support</h2>
            </div>

            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                <div className="font-medium text-gray-800">Contact Support</div>
                <div className="text-sm text-gray-600">Get help with your account or app issues</div>
              </button>
              
              <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                <div className="font-medium text-gray-800">Privacy Policy</div>
                <div className="text-sm text-gray-600">Learn how we protect your data</div>
              </button>
              
              <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                <div className="font-medium text-gray-800">Terms of Service</div>
                <div className="text-sm text-gray-600">Review our terms and conditions</div>
              </button>
            </div>
          </motion.section>

          {/* App Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center text-gray-500 text-sm"
          >
            <p>SafeGuard v1.0.0</p>
            <p>Built with ❤️ for your safety</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
