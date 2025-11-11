# Firebase Configuration Setup

## Issues
You're experiencing Firebase configuration issues:
1. `CONFIGURATION_NOT_FOUND` - Firebase Authentication is not enabled
2. `Missing or insufficient permissions` - Firestore security rules need configuration
3. `storage/unauthorized` - Firebase Storage rules need configuration for video uploads

## Solution

### Step 1: Enable Firebase Authentication

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `crowd-monitoring-e1f70`
3. **Navigate to Authentication**
4. **Click "Get started"** if you haven't set up Authentication yet
5. **Go to "Sign-in method" tab**
6. **Enable "Anonymous" authentication**:
   - Click on "Anonymous"
   - Toggle "Enable"
   - Click "Save"

### Step 2: Configure Firestore Security Rules

1. **Navigate to Firestore Database** → **Rules**
2. **Replace the existing rules** with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anonymous users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to create and read SOS alerts
    match /sos-alerts/{alertId} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null && 
                    request.auth.uid == resource.data.userId;
    }
    
    // Allow authenticated users to create notification logs
    match /notification-logs/{logId} {
      allow read, write: if request.auth != null && 
                          request.auth.uid == resource.data.userId;
    }
    
    // Allow authenticated users to read danger alerts
    match /danger-alerts/{alertId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

5. **Click "Publish"** to apply the rules

### Step 3: Configure Firebase Storage Rules

1. **Navigate to Storage** in Firebase Console
2. **Go to "Rules" tab**
3. **Replace the existing rules** with the content from `mobile-app/storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload SOS videos
    match /sos-videos/{userId}/{videoId} {
      allow read, write: if request.auth != null &&
                        request.auth.uid == userId;
    }

    // Allow authenticated users to upload to their user folder
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null &&
                        request.auth.uid == userId;
    }

    // Allow authenticated users to read public resources
    match /public/{allPaths=**} {
      allow read: if request.auth != null;
    }

    // Emergency responders can read all SOS videos
    match /sos-videos/{allPaths=**} {
      allow read: if request.auth != null;
    }
  }
}
```

4. **Click "Publish"** to apply the Storage rules

## What these rules do:

### Firestore Rules:
- Allow anonymous authenticated users to read/write their own user data
- Allow authenticated users to create and manage SOS alerts
- Allow authenticated users to create notification logs
- Allow authenticated users to read danger alerts

### Storage Rules:
- Allow authenticated users to upload SOS videos to their own folder
- Allow emergency responders to read all SOS videos
- Organize videos by user ID for security and organization

## Automatic Fallback Mode
If Firebase is not properly configured, the app automatically switches to **Local Storage Mode**:

### What happens in Local Mode:
- ✅ **App remains fully functional** - All features work normally
- 💾 **Data stored locally** - User data and SOS alerts saved in browser storage
- ⚠️ **No real-time sync** - Data doesn't sync across devices
- 🔄 **Easy migration** - Data automatically syncs to Firebase once configured

### Local Mode Indicators:
- Login message shows "Running in local mode"
- Console shows Firebase configuration warnings
- Dashboard shows local storage status

## After Setup
1. **Enable Firebase Authentication** (Step 1) to fix `CONFIGURATION_NOT_FOUND` error
2. **Configure Firestore Rules** (Step 2) to fix Firestore permission errors
3. **Configure Storage Rules** (Step 3) to fix video upload `storage/unauthorized` errors
4. **Refresh your app** - Should automatically switch to Firebase mode
5. **Re-login** to migrate data from local storage to Firebase
6. **Test SOS video upload** - Should now work without permission errors

## Troubleshooting
- If you still see errors after setup, check the browser console for specific error messages
- Make sure Anonymous authentication is **enabled** in Firebase Console
- Verify the API key and project ID match your Firebase project
