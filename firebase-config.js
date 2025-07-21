// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQxAJgFrL4tUtk2tNbK0bAmQm5nlD81AM",
    authDomain: "coffeelogger-e5c64.firebaseapp.com",
    databaseURL: "https://coffeelogger-e5c64-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "coffeelogger-e5c64",
    storageBucket: "coffeelogger-e5c64.firebasestorage.app",
    messagingSenderId: "274499411082",
    appId: "1:274499411082:web:72e990e8574cfa9739e173"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Authentication state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User logged in:', user.email);
        window.coffeeLogger.setUser(user);
        updateAuthUI(true, user.email);
    } else {
        console.log('User signed out');
        window.coffeeLogger.setUser(null);
        updateAuthUI(false);
    }
});

// Update authentication UI
function updateAuthUI(isLoggedIn, email = '') {
    const authSection = document.getElementById('authSection');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');
    const syncStatus = document.getElementById('syncStatus');

    if (isLoggedIn) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        userInfo.textContent = `Logged in as: ${email}`;
        userInfo.style.display = 'block';
        syncStatus.textContent = '🟢 Syncing to cloud';
        syncStatus.style.display = 'block';
    } else {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        userInfo.style.display = 'none';
        syncStatus.textContent = '🔴 Local only';
        syncStatus.style.display = 'block';
    }
}

// Login function
function login() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    });
}

// Logout function
function logout() {
    auth.signOut().catch((error) => {
        console.error('Logout error:', error);
        showNotification('Logout failed. Please try again.', 'error');
    });
}

// Global notification function
function showNotification(message, type = 'info') {
    if (window.coffeeLogger && window.coffeeLogger.showNotification) {
        window.coffeeLogger.showNotification(message, type);
    } else {
        // Fallback notification
        alert(message);
    }
}

// Firestore Household Functions

/**
 * Create a new household with a name and generate an invite code.
 * Adds the current user as the first member.
 * Returns the invite code and householdId.
 */
async function createHousehold(user, householdName) {
    if (!user) throw new Error('Not logged in');
    // Generate a unique invite code (random string)
    const inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase();
    const householdRef = db.collection('households').doc();
    const householdId = householdRef.id;
    await householdRef.set({
        name: householdName,
        inviteCode,
        members: [user.uid]
    });
    // Set user's householdId
    await db.collection('users').doc(user.uid).set({ householdId }, { merge: true });
    return { inviteCode, householdId };
}

/**
 * Join a household by invite code. Adds the user to the household's members and sets their householdId.
 */
async function joinHouseholdByInvite(user, inviteCode) {
    if (!user) throw new Error('Not logged in');
    const householdSnap = await db.collection('households').where('inviteCode', '==', inviteCode.toUpperCase()).get();
    if (householdSnap.empty) throw new Error('Invalid invite code');
    const householdDoc = householdSnap.docs[0];
    const householdId = householdDoc.id;
    // Add user to members array if not already present
    await householdDoc.ref.update({
        members: firebase.firestore.FieldValue.arrayUnion(user.uid)
    });
    // Set user's householdId
    await db.collection('users').doc(user.uid).set({ householdId }, { merge: true });
    return { householdId, name: householdDoc.data().name };
}

/**
 * Leave the current household. Removes user from household's members and clears their householdId.
 */
async function leaveHousehold(user) {
    if (!user) throw new Error('Not logged in');
    // Get user's current householdId
    const userDoc = await db.collection('users').doc(user.uid).get();
    const householdId = userDoc.exists ? userDoc.data().householdId : null;
    if (!householdId) throw new Error('Not in a household');
    // Remove user from household members
    await db.collection('households').doc(householdId).update({
        members: firebase.firestore.FieldValue.arrayRemove(user.uid)
    });
    // Remove householdId from user
    await db.collection('users').doc(user.uid).set({ householdId: firebase.firestore.FieldValue.delete() }, { merge: true });
}

/**
 * Get the user's householdId (returns null if not set)
 */
async function getUserHouseholdId(user) {
    if (!user) return null;
    const userDoc = await db.collection('users').doc(user.uid).get();
    return userDoc.exists ? userDoc.data().householdId || null : null;
}

/**
 * Get household info by householdId
 */
async function getHouseholdInfo(householdId) {
    if (!householdId) return null;
    const doc = await db.collection('households').doc(householdId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

/**
 * Get household info by invite code
 */
async function getHouseholdByInvite(inviteCode) {
    const snap = await db.collection('households').where('inviteCode', '==', inviteCode).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
}

// Update cloud sync functions to use household logs
async function syncToCloud(logData, user) {
    if (!user) return;
    const householdId = await getUserHouseholdId(user);
    if (!householdId) throw new Error('Not in a household');
    try {
        const logsRef = db.collection('households').doc(householdId).collection('logs');
        await logsRef.doc(logData.id.toString()).set(logData);
        console.log('Synced to cloud:', logData.id);
    } catch (error) {
        console.error('Cloud sync error:', error);
        showNotification('Failed to sync to cloud. Data saved locally.', 'error');
    }
}

async function loadFromCloud(user) {
    if (!user) return [];
    const householdId = await getUserHouseholdId(user);
    if (!householdId) return [];
    try {
        const logsRef = db.collection('households').doc(householdId).collection('logs');
        const snapshot = await logsRef.orderBy('timestamp', 'desc').get();
        const cloudLogs = [];
        snapshot.forEach(doc => {
            cloudLogs.push(doc.data());
        });
        console.log('Loaded from cloud:', cloudLogs.length, 'logs');
        return cloudLogs;
    } catch (error) {
        console.error('Cloud load error:', error);
        showNotification('Failed to load from cloud. Using local data.', 'error');
        return [];
    }
}

// Make functions globally available
window.createHousehold = createHousehold;
window.joinHouseholdByInvite = joinHouseholdByInvite;
window.leaveHousehold = leaveHousehold;
window.getUserHouseholdId = getUserHouseholdId;
window.getHouseholdInfo = getHouseholdInfo;
window.getHouseholdByInvite = getHouseholdByInvite;
window.syncToCloud = syncToCloud;
window.loadFromCloud = loadFromCloud;
window.showNotification = showNotification; 