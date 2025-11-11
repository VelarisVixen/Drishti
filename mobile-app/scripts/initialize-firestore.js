/**
 * Firebase Firestore Initialization Script
 * 
 * This script creates the required collections and sample documents
 * for the SafeGuard SOS alert system.
 * 
 * Run this script once to set up your Firestore database structure.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6XtUDmKv0aul-zUL3TRH1i2UxWtgCLU0",
  authDomain: "crowd-monitoring-e1f70.firebaseapp.com",
  projectId: "crowd-monitoring-e1f70",
  storageBucket: "crowd-monitoring-e1f70.firebasestorage.app",
  messagingSenderId: "1069463850395",
  appId: "1:1069463850395:web:f24d177297c60e0c50a53e",
  measurementId: "G-68VH97XQ6V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeCollections() {
  console.log('🚀 Initializing Firestore collections...');

  try {
    // 1. Create sos-alerts collection with sample document
    console.log('📱 Creating sos-alerts collection...');
    await addDoc(collection(db, 'sos-alerts'), {
      userId: "sample_user_123",
      message: "Sample emergency - car accident on highway",
      videoUrl: "https://firebasestorage.googleapis.com/sample-video.mp4",
      location: {
        latitude: 28.7041,
        longitude: 77.1025,
        address: "New Delhi, India"
      },
      createdAt: serverTimestamp(),
      status: "pending",
      geminiAnalysis: null,
      isEmergency: null,
      primaryService: null,
      analysisConfidence: null,
      lastUpdated: serverTimestamp(),
      adminReview: null
    });

    // 2. Create analysis-logs collection with sample document
    console.log('🤖 Creating analysis-logs collection...');
    await addDoc(collection(db, 'analysis-logs'), {
      reportId: "sample_sos_alert_id",
      videoUrl: "https://firebasestorage.googleapis.com/sample-video.mp4",
      analysis: {
        is_emergency: true,
        reason: "Traffic accident detected with injured person",
        primary_service: "Ambulance",
        confidence: "High"
      },
      analyzedAt: serverTimestamp(),
      status: "completed"
    });

    // 3. Create alerts collection with sample document
    console.log('🚨 Creating alerts collection...');
    await addDoc(collection(db, 'alerts'), {
      id: "alert_sample_123",
      title: "Sample Weather Alert",
      message: "Heavy rainfall expected in the area. Please stay indoors.",
      severity: "medium",
      location: "Delhi NCR",
      radius: 5000,
      duration: 120,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      isActive: true
    });

    // 4. Create notificationLogs collection with sample document
    console.log('📧 Creating notificationLogs collection...');
    await addDoc(collection(db, 'notificationLogs'), {
      reportId: "sample_sos_alert_id",
      type: "enhanced_emergency_dispatch_sms",
      emergencyServices: [
        {
          recipient: "Delhi Emergency Services",
          phone: "+91-100",
          message: "🚨 EMERGENCY DISPATCH ALERT: Traffic accident reported",
          success: true
        }
      ],
      publicRecipients: [
        {
          name: "Nearby User A",
          phone: "+91-9876543210",
          distance: "0.2km"
        }
      ],
      sentAt: serverTimestamp(),
      status: "sent"
    });

    console.log('✅ All collections created successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Go to Firebase Console → Firestore Database');
    console.log('2. Verify all 4 collections were created:');
    console.log('   - sos-alerts');
    console.log('   - analysis-logs');
    console.log('   - alerts');
    console.log('   - notificationLogs');
    console.log('3. Set up the security rules from firestore.rules');
    console.log('4. Create the required indexes as documented');
    console.log('');
    console.log('🎯 Your database is ready for the SafeGuard SOS system!');

  } catch (error) {
    console.error('❌ Error initializing collections:', error);
    console.log('');
    console.log('🛠️ Troubleshooting:');
    console.log('1. Make sure Firebase Authentication is enabled');
    console.log('2. Enable Anonymous authentication');
    console.log('3. Check your Firebase configuration');
    console.log('4. Ensure you have proper permissions');
  }
}

// Run the initialization
initializeCollections().then(() => {
  console.log('🏁 Initialization complete!');
}).catch((error) => {
  console.error('💥 Initialization failed:', error);
});
