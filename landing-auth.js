// Firebase Configuration & Initialization
const firebaseConfig = {
  apiKey: "AIzaSyASP16xaRqM-gs4Fpiqh4XqXfx16Ik6pgw",
  authDomain: "recipe-content-fff8a.firebaseapp.com",
  projectId: "recipe-content-fff8a",
  storageBucket: "recipe-content-fff8a.firebasestorage.app",
  messagingSenderId: "308378049686",
  appId: "1:308378049686:web:b8a1e6624d1ebeb8d2b6b7"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

let isSigningUp = false;

window.history.pushState(null, '', window.location.href);
window.onpopstate = function() {
  window.history.pushState(null, '', window.location.href);
};

auth.onAuthStateChanged((user) => {
  if (user && !isSigningUp) {
    window.location.replace('index.html');
  }
});

function openAuthModal() {
  document.getElementById('auth-modal').style.display = 'block';
  document.getElementById('login-tab').classList.add('active');
  document.getElementById('signup-tab').classList.remove('active');
  clearAuthForms();
  clearAuthError();
}

function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
  clearAuthForms();
  clearAuthError();
}

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

async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  
  if (!email || !password) {
    showAuthError('❌ Please enter both email and password');
    return;
  }
  
  try {
    clearAuthError();
    showAuthLoading(true);
    
    await auth.signInWithEmailAndPassword(email, password);
    showAuthSuccess('✅ Login successful!');
    setTimeout(() => window.location.replace('index.html'), 1000);
    
  } catch (error) {
    console.error('Login error:', error.code, error.message);
    
    switch(error.code) {
      case 'auth/user-not-found':
        showAuthError('❌ No account found with this email. Please create an account first.');
        break;
      case 'auth/wrong-password':
        showAuthError('❌ Incorrect password. Please try again.');
        break;
      case 'auth/invalid-email':
        showAuthError('❌ Invalid email format. Please enter a valid email.');
        break;
      case 'auth/user-disabled':
        showAuthError('❌ This account has been disabled.');
        break;
      case 'auth/too-many-requests':
        showAuthError('❌ Too many failed attempts. Please try again later.');
        break;
      case 'auth/invalid-login-credentials':
        showAuthError('❌ Invalid email or password. Please check your credentials and try again.');
        break;
      default:
        showAuthError('❌ Login failed. Please check your email and password.');
    }
  } finally {
    showAuthLoading(false);
  }
}

async function handleSignup(event) {
  event.preventDefault();
  
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm').value;
  
  if (!name) {
    showAuthError('❌ Please enter your name');
    return;
  }
  
  if (!email) {
    showAuthError('❌ Please enter your email');
    return;
  }
  
  if (password !== confirmPassword) {
    showAuthError('❌ Passwords do not match');
    return;
  }
  
  if (password.length < 6) {
    showAuthError('❌ Password must be at least 6 characters');
    return;
  }
  
  try {
    clearAuthError();
    showAuthLoading(true);
    isSigningUp = true;
    
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    await userCredential.user.updateProfile({ displayName: name });
    await auth.signOut();
    
    isSigningUp = false;
    showAuthSuccess('✅ Signed up successfully! Please login to get started.');
    setTimeout(() => switchAuthTab('login'), 1500);
    
  } catch (error) {
    console.error('Signup error:', error.code, error.message);
    
    switch(error.code) {
      case 'auth/email-already-in-use':
        showAuthError('❌ This email is already registered. Please login instead.');
        break;
      case 'auth/invalid-email':
        showAuthError('❌ Invalid email format');
        break;
      case 'auth/weak-password':
        showAuthError('❌ Password is too weak. Use at least 6 characters.');
        break;
      case 'auth/operation-not-allowed':
        showAuthError('❌ Email/password accounts are not enabled');
        break;
      default:
        showAuthError('❌ Signup failed: ' + error.message);
    }
  } finally {
    showAuthLoading(false);
  }
}

function clearAuthForms() {
  document.getElementById('login-form').reset();
  document.getElementById('signup-form').reset();
}

function showAuthError(message) {
  const errorDiv = document.getElementById('auth-error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

function clearAuthError() {
  const errorDiv = document.getElementById('auth-error');
  errorDiv.textContent = '';
  errorDiv.style.display = 'none';
}

function showAuthLoading(show) {
  const submitBtns = document.querySelectorAll('.auth-submit-btn');
  submitBtns.forEach(btn => {
    btn.disabled = show;
    btn.textContent = show ? 'Loading...' : (btn.form.id === 'login-form' ? 'Login' : 'Sign Up');
  });
}

function showAuthSuccess(message) {
  const notification = document.createElement('div');
  notification.className = 'auth-success-notification';
  notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 120000);
}

window.addEventListener('click', (event) => {
  const authModal = document.getElementById('auth-modal');
  if (event.target === authModal) {
    closeAuthModal();
  }
});
