# Firebase Setup Guide for Bestpresso

This guide will help you set up Google Firebase for cloud synchronization of your coffee logs.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "bestpresso-logs")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Email/Password" provider
5. Enable it and configure:
   - Project support email: Your email
   - Authorized domains: Add your domain (or localhost for testing)
6. Click "Save"

## Step 3: Enable Firestore Database

1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select a location close to you
5. Click "Done"

## Step 4: Get Your Firebase Config

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (</>)
4. Register your app with a nickname (e.g., "bestpresso-web")
5. Copy the firebaseConfig object

## Step 5: Update Configuration

1. Open `firebase-config.js`
2. Replace the placeholder config with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```
3. Set your admin email in `firebase-config.js`:
```javascript
const ADMIN_EMAIL = "your-admin-email@gmail.com";
```

## Step 6: Set Up Access Control (Firestore-based)

- The app now uses a Firestore collection called `authorized_users` to control who can log in.
- Only emails in this collection can log in and sync logs.
- The admin panel (visible only to the admin email) lets you add or remove authorized users directly from the app UI.

## Step 7: Secure Firestore Rules

1. Go to Firestore Database → Rules
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/logs/{logId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Only the admin can manage authorized_users
    match /authorized_users/{email} {
      allow read, write: if request.auth != null && request.auth.token.email == 'your-admin-email@gmail.com';
    }
  }
}
```
3. Replace `'your-admin-email@gmail.com'` with your actual admin email.
4. Click "Publish"

## Step 8: Test the Setup

1. Open your website
2. Enter your admin email and password
3. Click "Register" to create your admin account
4. Use the admin panel to add authorized users
5. Log out and log in as an authorized user to test access
6. Check that the sync status shows "🟢 Syncing to cloud"

## Cost Control

Firebase has a generous free tier:
- **Authentication**: 10,000 sign-ins/month
- **Firestore**: 1GB storage, 50,000 reads/day, 20,000 writes/day

For a personal coffee logger, you'll likely stay well within these limits.

## Troubleshooting

### "Access denied" error
- Make sure the email is added to the `authorized_users` collection (use the admin panel)
- Check that the email matches exactly (case-sensitive)

### Sync failures
- Check browser console for error messages
- Verify Firebase config is correct
- Ensure Firestore rules are published

### Local-only mode
- The app works perfectly without Firebase
- All data is stored locally in your browser
- You can use it offline indefinitely

## Security Notes

- Only authorized emails can log in
- Each user can only access their own data
- Only the admin can manage the list of authorized users
- Firebase handles all security and authentication
- Your data is encrypted in transit and at rest

## Adding New Users

To give access to someone new:
1. Log in as the admin
2. Use the admin panel to add their email
3. They can then register with their email and password

That's it! Your coffee logger now supports both local-only and cloud-synced modes, with easy access management. ☕ 