// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyASP16xaRqM-gs4Fpiqh4XqXfx16Ik6pgw",
  authDomain: "recipe-content-fff8a.firebaseapp.com",
  projectId: "recipe-content-fff8a",
  storageBucket: "recipe-content-fff8a.firebasestorage.app",
  messagingSenderId: "308378049686",
  appId: "1:308378049686:web:b8a1e6624d1ebeb8d2b6b7"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Load user info
auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.replace('landing.html');
    return;
  }
  document.getElementById('user-name').value = user.displayName || '';
  document.getElementById('user-email').value = user.email || '';
});

// Change password
document.getElementById('password-change-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (newPassword !== confirmPassword) {
    alert('❌ New passwords do not match!');
    return;
  }

  if (newPassword.length < 6) {
    alert('❌ New password must be at least 6 characters');
    return;
  }

  if (currentPassword === newPassword) {
    alert('❌ New password must be different from current password');
    return;
  }

  const user = auth.currentUser;
  const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);

  try {
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPassword);
    alert('✅ Password changed successfully!');
    document.getElementById('password-change-form').reset();
  } catch (error) {
    if (error.code === 'auth/wrong-password') {
      alert('❌ Current password is incorrect');
    } else {
      alert('❌ Error: ' + error.message);
    }
  }
});

// Delete account
document.getElementById('delete-account-btn').addEventListener('click', async () => {
  if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    return;
  }

  const user = auth.currentUser;
  if (!user) return;

  const uid = user.uid;

  try {
    await db.collection('users').doc(uid).delete();
  } catch (err) {
    console.log('Firestore delete:', err.message);
  }

  try {
    await user.delete();
    sessionStorage.clear();
    localStorage.clear();
    window.location.replace('landing.html');
  } catch (error) {
    if (error.code === 'auth/requires-recent-login') {
      await auth.signOut();
      sessionStorage.clear();
      localStorage.clear();
      window.location.replace('landing.html');
    } else {
      window.location.replace('landing.html');
    }
  }
});

// Logout
async function handleLogout() {
  try {
    await auth.signOut();
    sessionStorage.clear();
    localStorage.clear();
    window.location.replace('landing.html');
  } catch (error) {
    window.location.replace('landing.html');
  }
}

window.handleLogout = handleLogout;
