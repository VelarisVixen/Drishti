import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { usePanic } from '@/contexts/PanicContext';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

const PanicButton = () => {
  const { isActivated, activatePanic, isProcessing, setIsProcessing, resetButtonState } = usePanic();

  // Debug state changes
  React.useEffect(() => {
    console.log('🔴 PanicButton state changed:', { isActivated, isProcessing });
  }, [isActivated, isProcessing]);

  // Backup reset mechanism - if button is stuck in activated state for too long
  React.useEffect(() => {
    if (isActivated && !isProcessing) {
      const backupTimeout = setTimeout(() => {
        console.log('🔧 Backup reset triggered - button was stuck');
        resetButtonState();
      }, 5000); // Reset after 5 seconds as a backup

      return () => clearTimeout(backupTimeout);
    }
  }, [isActivated, isProcessing, resetButtonState]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [message, setMessage] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handlePanicPress = () => {
    if (isProcessing) return; // Only prevent during processing, allow multiple alerts
    setShowConfirmation(true);
  };

  useEffect(() => {
    if (showConfirmation) {
      setIsProcessing(true);
      const getMedia = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera/Mic permission denied:", err);
          toast({
            title: "Permission Denied",
            description: "Camera and microphone access is required. Please enable permissions in your browser settings.",
            variant: "destructive",
            duration: 8000
          });
          setShowConfirmation(false);
        } finally {
          setIsProcessing(false);
        }
      };
      getMedia();
    } else {
      // Cleanup stream when dialog is closed
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [showConfirmation, setIsProcessing]);

  const confirmPanic = async () => {
    await activatePanic(message, streamRef.current);
    setMessage(''); // Reset message for next use
    setShowConfirmation(false); // This will trigger cleanup in useEffect
  };

  const cancelPanic = () => {
    setShowConfirmation(false); // This will trigger cleanup in useEffect
  };

  return (
    <>
      <motion.div 
        className="fixed bottom-24 right-6 z-50"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <AnimatePresence mode="wait">
          {isActivated ? (
            <motion.button
              key="activated"
              onClick={handlePanicPress}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-green-400 hover:scale-105 transition-transform cursor-pointer"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.9)', backdropFilter: 'blur(10px)' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Check size={24} className="text-white" />
            </motion.button>
          ) : (
            <motion.button
              key="panic"
              onClick={handlePanicPress}
              disabled={isProcessing}
              className={`w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-xl border-2 border-red-400 transition-all duration-300 ${
                isProcessing ? 'cursor-not-allowed opacity-70' : 'hover:scale-105 hover:shadow-2xl'
              } ${isActivated ? '' : 'panic-pulse'}`}
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.95)', backdropFilter: 'blur(10px)' }}
              whileHover={{ scale: isProcessing ? 1 : 1.1 }}
              whileTap={{ scale: isProcessing ? 1 : 0.95 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {isProcessing ? <Loader2 size={24} className="text-white animate-spin" /> : <AlertTriangle size={24} className="text-white" />}
            </motion.button>
          )}
        </AnimatePresence>
        
        <motion.div
          className="absolute -left-20 top-1/2 transform -translate-y-1/2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-yellow-200 shadow-lg">
            <span className="text-xs text-gray-800 font-medium">
              {isActivated ? 'Sent! Ready for next' : isProcessing ? 'Starting...' : 'SOS'}
            </span>
          </div>
        </motion.div>
      </motion.div>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-lg text-gray-800 border-yellow-200 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="text-red-500" />
              <span className="text-gray-800">Confirm SOS Alert</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              You are about to send an emergency alert. A live video recording has started. Please describe the situation below.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
             <video ref={videoRef} className="w-full rounded-lg bg-gray-100 border border-gray-200" muted autoPlay playsInline />
             <div className="flex items-center text-red-500 text-sm mt-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                 <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                 Recording emergency video...
             </div>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional: Describe the emergency..."
            className="w-full p-3 rounded-lg bg-white border border-yellow-200 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
            rows="3"
          />

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <strong>Demo Mode:</strong> This SOS alert is simulated. In production, emergency services would be contacted immediately.
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPanic} className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 hover:text-gray-800">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPanic} className="bg-red-500 hover:bg-red-600 text-white" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send Emergency Alert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PanicButton;
