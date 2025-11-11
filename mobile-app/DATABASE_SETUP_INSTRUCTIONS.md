# 🚨 SafeGuard Database Setup Instructions

## Overview

Your SafeGuard app now uses a **comprehensive Firebase schema** optimized for:
- ✅ **SOS Emergency Reports** with video uploads
- ✅ **AI Analysis Integration** (Gemini)
- ✅ **Admin Review Workflow**
- ✅ **Notification Audit Trail**
- ✅ **System-wide Alerts**

## 🗄️ Database Structure

The system uses **4 main collections**:

1. **`sos-alerts`** - Main SOS emergency reports
2. **`analysis-logs`** - AI analysis tracking
3. **`alerts`** - System-wide administrator alerts  
4. **`notificationLogs`** - Notification audit trail

## 🛠️ Quick Setup (Choose One Method)

### Method 1: Automatic Setup (Recommended)

1. **Run the initialization script**:
   ```bash
   cd mobile-app
   node scripts/initialize-firestore.js
   ```

2. **Follow the console output** to complete setup

### Method 2: Manual Setup

1. **Follow the detailed guide**: `FIREBASE_DATABASE_SETUP.md`
2. **Create each collection manually** in Firebase Console

## 🔧 Step-by-Step Setup

### Step 1: Enable Firebase Authentication

1. Go to **Firebase Console**: https://console.firebase.google.com
2. Select your project: **`crowd-monitoring-e1f70`**
3. Navigate to **Authentication** → **Sign-in method**
4. **Enable "Anonymous" authentication**
5. Click **Save**

### Step 2: Create Database Collections

**Option A: Use the Script (Easier)**
```bash
cd mobile-app/scripts
node initialize-firestore.js
```

**Option B: Manual Creation**
1. Go to **Firestore Database**
2. Create 4 collections with sample documents:
   - `sos-alerts`
   - `analysis-logs`
   - `alerts`
   - `notificationLogs`

### Step 3: Configure Security Rules

1. Go to **Firestore Database** → **Rules**
2. Copy contents from `mobile-app/firestore.rules`
3. **Paste and Publish**

### Step 4: Create Database Indexes

Create these **composite indexes** in Firebase Console:

1. **Collection**: `sos-alerts`
   - Fields: `isEmergency` (Ascending), `createdAt` (Descending)

2. **Collection**: `sos-alerts`
   - Fields: `userId` (Ascending), `createdAt` (Descending)

3. **Collection**: `sos-alerts`
   - Fields: `primaryService` (Ascending), `createdAt` (Descending)

### Step 5: Test Your Setup

1. **Refresh your app**: http://localhost:5173
2. **Login** with any details
3. **Create an SOS alert**
4. **Check Firebase Console** - should see new document in `sos-alerts`

## 📱 Mobile App Integration

Your mobile app now sends **minimal required data**:

```javascript
{
  userId: "user_12345",
  message: "Emergency description",
  videoUrl: "Firebase Storage URL",
  location: {
    latitude: 28.7041,
    longitude: 77.1025,
    address: "New Delhi, India"
  }
}
```

**All other fields** (analysis, admin review, etc.) are added automatically by the system.

## 🔍 Data Flow

```
Mobile App → Creates SOS Alert (minimal data)
     ↓
Firestore → Stores with 'pending' status
     ↓
AI Service → Analyzes video, updates with geminiAnalysis
     ↓
Admin Panel → Reviews and approves/rejects
     ↓
Notification Service → Sends alerts to authorities
```

## ✅ Verification Checklist

After setup, verify:

- [ ] **Authentication enabled** - Anonymous sign-in works
- [ ] **4 collections created** - All collections exist with sample data
- [ ] **Security rules applied** - Rules deployed successfully
- [ ] **Indexes created** - All composite indexes built
- [ ] **Mobile app connects** - No Firebase errors in console
- [ ] **SOS alerts work** - Can create alerts from mobile app
- [ ] **Data structure correct** - Documents match schema in Firebase Console

## 🚫 Troubleshooting

### Error: "Permission Denied"
**Solution**: 
1. Enable Anonymous authentication
2. Deploy security rules from `firestore.rules`
3. Refresh your app

### Error: "Collection doesn't exist"
**Solution**:
1. Run `node scripts/initialize-firestore.js`
2. Or manually create collections in Firebase Console

### Error: "Index required"
**Solution**:
1. Create the composite indexes listed above
2. Wait for indexes to build (may take 5-10 minutes)

### App still shows "Local Mode"
**Solution**:
1. Complete all setup steps above
2. Refresh your browser
3. Check browser console for specific errors

## 🎯 Next Steps

Once your database is set up:

1. **Test SOS Alert Creation** - Mobile app → Firebase
2. **Set up Admin Panel** - To view and manage alerts
3. **Integrate AI Analysis** - Connect Gemini API for video analysis
4. **Add Notification Service** - Send alerts to authorities
5. **Deploy to Production** - Move from local to live environment

## 📊 Schema Benefits

This new schema provides:

- ✅ **Efficient Queries** - Optimized indexes for common operations
- ✅ **AI Integration** - Ready for Gemini video analysis
- ✅ **Admin Workflow** - Complete review and approval process
- ✅ **Audit Trail** - Full notification and analysis history
- ✅ **Scalability** - Handles large volumes of SOS alerts
- ✅ **Real-time Updates** - Live sync across all components

Your SafeGuard system is now ready for production-level SOS alert processing! 🚀
