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

// Cloud sync functions (user-specific)
async function syncToCloud(logData, user) {
    if (!user) return;
    
    try {
        const userDoc = db.collection('users').doc(user.uid);
        await userDoc.collection('logs').doc(logData.id.toString()).set(logData);
        console.log('Synced to cloud:', logData.id);
    } catch (error) {
        console.error('Cloud sync error:', error);
        showNotification('Failed to sync to cloud. Data saved locally.', 'error');
    }
}

async function loadFromCloud(user) {
    if (!user) return [];
    
    try {
        const userDoc = db.collection('users').doc(user.uid);
        const snapshot = await userDoc.collection('logs').orderBy('timestamp', 'desc').get();
        
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
window.syncToCloud = syncToCloud;
window.loadFromCloud = loadFromCloud;
window.showNotification = showNotification; 