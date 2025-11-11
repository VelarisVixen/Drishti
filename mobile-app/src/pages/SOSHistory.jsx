import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Trash2, 
  Download,
  Filter,
  Calendar,
  Eye,
  CheckCircle,
  PlayCircle,
  ExternalLink
} from 'lucide-react';
import { usePanic } from '@/contexts/PanicContext';
import { toast } from '@/components/ui/use-toast';

const SOSHistory = () => {
  const { panicHistory, clearHistory } = usePanic();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const handleExportHistory = () => {
    if (panicHistory.length === 0) {
      toast({
        title: "No Data to Export",
        description: "You don't have any SOS history to export.",
        duration: 3000
      });
      return;
    }

    // Create export data
    const exportData = {
      exportDate: new Date().toISOString(),
      totalAlerts: panicHistory.length,
      alerts: panicHistory.map(alert => ({
        id: alert.id,
        timestamp: alert.timestamp,
        location: alert.location,
        status: alert.status,
        type: alert.type,
        message: alert.message
      }))
    };

    // Create downloadable file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sos-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Your SOS history has been downloaded.",
      duration: 3000
    });
  };

  const handleClearHistory = () => {
    if (panicHistory.length === 0) {
      toast({
        title: "No History to Clear",
        description: "Your SOS history is already empty.",
        duration: 3000
      });
      return;
    }

    if (window.confirm('Are you sure you want to clear all SOS history? This action cannot be undone.')) {
      clearHistory();
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'resolved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredAndSortedHistory = panicHistory
    .filter(alert => {
      if (filter === 'all') return true;
      return alert.status === filter;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
      if (sortBy === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-amber-50 pb-24">
      <Helmet>
        <title>SOS History - SafeGuard</title>
      </Helmet>

      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-green-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-200/15 rounded-full blur-3xl"></div>
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
              <h1 className="text-2xl font-bold text-gray-800">SOS History</h1>
              <p className="text-sm text-gray-600">Your emergency alert records</p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportHistory}
                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors"
                title="Export History"
              >
                <Download className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearHistory}
                className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-colors"
                title="Clear History"
              >
                <Trash2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.header>

        <div className="px-6 py-6 space-y-6">
          {/* Demo Mode Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-200 rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-yellow-700" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800">Demo Mode Active</h3>
                <p className="text-sm text-yellow-700">
                  SOS history is stored locally. In production, data would be synced with your account.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-yellow-200/50"
          >
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{panicHistory.length}</div>
                <div className="text-sm text-gray-600">Total SOS Alerts</div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {panicHistory.filter(h => h.status === 'resolved').length}
                </div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {panicHistory.filter(h => h.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </motion.div>

          {/* Filters and Sort */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </motion.div>

          {/* History List */}
          <div className="space-y-4">
            {filteredAndSortedHistory.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No SOS History</h3>
                <p className="text-gray-600">
                  {panicHistory.length === 0 
                    ? "You haven't activated any SOS alerts yet." 
                    : "No alerts match your current filter."}
                </p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {filteredAndSortedHistory.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">Emergency Alert #{alert.id.slice(-4)}</h3>
                          <p className="text-sm text-gray-600">{formatTimeAgo(alert.timestamp)}</p>
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(alert.status)}`}>
                        {alert.status.toUpperCase()}
                      </span>
                    </div>
                    
                    {alert.message && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-700">{alert.message}</p>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {alert.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {alert.location.latitude?.toFixed(4)}, {alert.location.longitude?.toFixed(4)}
                            {alert.location.accuracy && ` (±${Math.round(alert.location.accuracy)}m)`}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                      
                      {alert.videoUrl && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <PlayCircle className="w-4 h-4" />
                          <span>Emergency video recorded ({alert.videoDuration}s)</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOSHistory;
