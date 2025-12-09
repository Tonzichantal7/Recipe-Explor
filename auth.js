// Firebase Configuration & Initialization
const firebaseConfig = {
  apiKey: "AIzaSyASP16xaRqM-gs4Fpiqh4XqXfx16Ik6pgw",
  authDomain: "recipe-content-fff8a.firebaseapp.com",
  projectId: "recipe-content-fff8a",
  storageBucket: "recipe-content-fff8a.firebasestorage.app",
  messagingSenderId: "308378049686",
  appId: "1:308378049686:web:b8a1e6624d1ebeb8d2b6b7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Auth state management
let currentUser = null;

// Prevent back button navigation after logout
window.history.pushState(null, '', window.location.href);
window.onpopstate = function() {
  window.history.pushState(null, '', window.location.href);
};

// Initialize auth state listener
auth.onAuthStateChanged((user) => {
  currentUser = user;
  if (!user) {
    window.location.replace('landing.html');
    return;
  }
  updateAuthUI();
  console.log('User logged in:', user.email);
});

async function handleSignup(event) {
  event.preventDefault();
  
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm').value;
  
  if (password !== confirmPassword) {
    showAuthError('Passwords do not match!');
    return;
  }
  
  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters long!');
    return;
  }
  
  try {
    clearAuthError();
    showAuthLoading(true);
    
    // 1. Create user in Authentication
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // 2. Update Authentication profile
    await user.updateProfile({ displayName: name });
    
    // 3. Initialize Firestore
    const db = firebase.firestore();
    
    // 4. CREATE THE FIRESTORE USER DOCUMENT
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: name,
      photoURL: "", // Empty for now
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ User document created in Firestore');
    
    // Continue with your existing code...
    await auth.signOut();
    
    console.log('Signup successful:', email);
    closeAuthModal();
    showAuthSuccess('Account created successfully! Please login.');
    setTimeout(() => openAuthModal(), 1500);
    
  } catch (error) {
    console.error('Signup error:', error);
    showAuthError(getErrorMessage(error.code));
  } finally {
    showAuthLoading(false);
  }
}

// Update UI based on auth state
function updateAuthUI() {
  const authContainer = document.getElementById('auth-container');
  
  if (currentUser) {
    const photoURL = currentUser.photoURL || 'https://via.placeholder.com/40';
    const displayName = currentUser.displayName || currentUser.email.split('@')[0];
    authContainer.innerHTML = `
      <div class="user-dropdown-container">
        <button class="user-info-btn" onclick="toggleUserDropdown()">
          <img src="${photoURL}" alt="Profile" class="user-avatar">
          <span class="user-name">${displayName}</span>
          <i class="fas fa-chevron-down"></i>
        </button>
        <div id="user-dropdown" class="user-dropdown">
          <div class="dropdown-header">
            <img src="${photoURL}" alt="Profile" class="dropdown-avatar">
            <div>
              <p class="dropdown-name">${displayName}</p>
              <p class="dropdown-email">${currentUser.email}</p>
            </div>
          </div>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" onclick="window.location.href='settings.html'">
            <i class="fas fa-cog"></i> Settings
          </button>
          <button class="dropdown-item logout-item" onclick="handleLogout()">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
    `;
  }
}

function toggleUserDropdown() {
  const dropdown = document.getElementById('user-dropdown');
  dropdown.classList.toggle('show');
}

window.addEventListener('click', function(event) {
  if (!event.target.matches('.user-info-btn') && !event.target.closest('.user-info-btn')) {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown && dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    }
  }
});

window.toggleUserDropdown = toggleUserDropdown;

// Open Auth Modal
function openAuthModal() {
  document.getElementById('auth-modal').style.display = 'block';
  document.getElementById('login-tab').classList.add('active');
  document.getElementById('signup-tab').classList.remove('active');
  clearAuthForms();
  clearAuthError();
}

// Close Auth Modal
function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
  clearAuthForms();
  clearAuthError();
}

// Switch between login and signup tabs
function switchAuthTab(tab) {
  const loginTab = document.getElementById('login-tab');
  const signupTab = document.getElementById('signup-tab');
  
  if (tab === 'login') {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
  } else {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
  }
  
  clearAuthForms();
  clearAuthError();
}

// Handle Login
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    clearAuthError();
    showAuthLoading(true);
    
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    
    console.log('Login successful:', userCredential.user.email);
    closeAuthModal();
    showAuthSuccess('Logged in successfully!');
  } catch (error) {
    console.error('Login error:', error);
    showAuthError(getErrorMessage(error.code));
  } finally {
    showAuthLoading(false);
  }
}

// Handle Signup
async function handleSignup(event) {
  event.preventDefault();
  
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm').value;
  
  if (password !== confirmPassword) {
    showAuthError('Passwords do not match!');
    return;
  }
  
  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters long!');
    return;
  }
  
  try {
    clearAuthError();
    showAuthLoading(true);
    
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    await userCredential.user.updateProfile({ displayName: name });
    await auth.signOut();
    
    console.log('Signup successful:', email);
    closeAuthModal();
    showAuthSuccess('Account created successfully! Please login.');
    setTimeout(() => openAuthModal(), 1500);
  } catch (error) {
    console.error('Signup error:', error);
    showAuthError(getErrorMessage(error.code));
  } finally {
    showAuthLoading(false);
  }
}

// Handle Logout
async function handleLogout() {
  try {
    await auth.signOut();
    sessionStorage.clear();
    localStorage.removeItem('userSession');
    console.log('User logged out');
    window.location.replace('landing.html');
  } catch (error) {
    console.error('Logout error:', error);
    showAuthError('Failed to logout');
  }
}

// Toggle User Menu
function toggleUserMenu() {
  const userMenuModal = document.getElementById('user-menu-modal');
  if (userMenuModal.style.display === 'block') {
    userMenuModal.style.display = 'none';
  } else {
    userMenuModal.style.display = 'block';
    document.getElementById('user-email').textContent = currentUser?.email || '';
    document.getElementById('user-name').textContent = currentUser?.displayName || 'User';
  }
}

// Close User Menu
function closeUserMenu() {
  document.getElementById('user-menu-modal').style.display = 'none';
}

// Clear Auth Forms
function clearAuthForms() {
  document.getElementById('login-form').reset();
  document.getElementById('signup-form').reset();
}

// Show Auth Error
function showAuthError(message) {
  const errorDiv = document.getElementById('auth-error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// Clear Auth Error
function clearAuthError() {
  const errorDiv = document.getElementById('auth-error');
  errorDiv.textContent = '';
  errorDiv.style.display = 'none';
}

// Show Auth Success (temporary notification)
function showAuthSuccess(message) {
  const notification = document.createElement('div');
  notification.className = 'auth-success-notification';
  notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Show Auth Loading
function showAuthLoading(show) {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const submitBtns = document.querySelectorAll('.auth-submit-btn');
  
  submitBtns.forEach(btn => {
    btn.disabled = show;
    btn.textContent = show ? 'Loading...' : (btn.form.id === 'login-form' ? 'Login' : 'Sign Up');
  });
}

// Get Error Message from Firebase Error Code
function getErrorMessage(errorCode) {
  const errorMessages = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'This user account has been disabled',
    'auth/user-not-found': 'User not found. Please create an account',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'Email is already in use',
    'auth/weak-password': 'Password is too weak (minimum 6 characters)',
    'auth/operation-not-allowed': 'Operation not allowed',
    'auth/too-many-requests': 'Too many failed login attempts. Please try again later'
  };
  
  return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

// Close modals when clicking outside
window.addEventListener('click', (event) => {
  const authModal = document.getElementById('auth-modal');
  const userMenuModal = document.getElementById('user-menu-modal');
  
  if (event.target === authModal) {
    closeAuthModal();
  }
  
  if (event.target === userMenuModal) {
    closeUserMenu();
  }
});

// Setup logout button
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
});

// Export functions for use in other scripts
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleLogout = handleLogout;
window.toggleUserMenu = toggleUserMenu;
window.closeUserMenu = closeUserMenu;
window.showAuthError = showAuthError;
window.getCurrentUser = () => currentUser;
