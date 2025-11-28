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
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handlePanicPress = () => {
    if (isProcessing) return; // Only prevent during processing, allow multiple alerts
    setShowConfirmation(true);
  };

  // Handle stream lifecycle during recording phase
  useEffect(() => {
    if (isRecording) {
      const getMedia = async () => {
        try {
          console.log('[PanicButton] Recording phase started - requesting camera/microphone access...');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: true
          });

          console.log('[PanicButton] ✅ Stream obtained successfully');
          const videoTracks = stream.getVideoTracks();
          const audioTracks = stream.getAudioTracks();
          console.log('[PanicButton] Stream has', videoTracks.length, 'video tracks and', audioTracks.length, 'audio tracks');

          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            console.log('[PanicButton] Stream assigned to video preview');
          }
        } catch (err) {
          console.error("[PanicButton] ❌ Camera/Mic permission denied:", err);
          toast({
            title: "Permission Denied",
            description: "Camera and microphone access is required. Please enable permissions in your browser settings.",
            variant: "destructive",
            duration: 8000
          });
          setIsRecording(false);
        }
      };
      getMedia();
    } else {
      // Cleanup stream only when NOT recording
      if (streamRef.current) {
        console.log('[PanicButton] Recording phase ended - cleaning up stream');
        streamRef.current.getTracks().forEach(track => {
          console.log('[PanicButton] Stopping track:', track.kind, 'state:', track.readyState);
          track.stop();
        });
        streamRef.current = null;
      }
    }
  }, [isRecording]);

  const confirmPanic = async () => {
    try {
      // Close confirmation dialog and start recording phase
      setShowConfirmation(false);
      setIsRecording(true);

      // Wait a bit for media stream to be requested and acquired
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the current stream
      const currentStream = streamRef.current;
      if (!currentStream) {
        throw new Error('No active stream available - camera/microphone access may have been denied');
      }

      // Validate stream is still active
      if (!currentStream.active) {
        throw new Error('Stream is no longer active');
      }

      const videoTracks = currentStream.getVideoTracks();
      const audioTracks = currentStream.getAudioTracks();

      if (videoTracks.length === 0 || audioTracks.length === 0) {
        throw new Error('Stream is missing video or audio tracks');
      }

      console.log('[PanicButton] ✅ Stream validation passed, starting panic activation');
      console.log('[PanicButton] Stream tracks - video:', videoTracks.length, 'audio:', audioTracks.length);

      // Call activatePanic with stream - stream will stay alive during entire recording
      await activatePanic(message, currentStream);

      console.log('[PanicButton] ✅ Panic activation complete');
      setMessage(''); // Reset message for next use
    } catch (error) {
      console.error('[PanicButton] ❌ Error during panic activation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send SOS alert. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      // End recording phase - this triggers stream cleanup
      setIsRecording(false);
    }
  };

  const cancelPanic = () => {
    setShowConfirmation(false);
    setMessage('');
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
              A <strong>5-second video will be recorded automatically</strong> after you close this dialog. Please describe the emergency situation below (optional).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional: Describe the emergency..."
            className="w-full p-3 rounded-lg bg-white border border-yellow-200 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
            rows="3"
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>⏱️ Recording:</strong> When you confirm, the dialog will close and your camera will automatically record a 5-second video of the emergency situation. Make sure your camera and microphone permissions are enabled.
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <strong>Demo Mode:</strong> This SOS alert is simulated. In production, emergency services would be contacted immediately.
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPanic} className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 hover:text-gray-800">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPanic} className="bg-red-500 hover:bg-red-600 text-white">
              Confirm & Start Recording
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PanicButton;
