// Profile page functionality
let currentUser = null;
let selectedImageFile = null;

// Check authentication
firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
    window.location.replace('landing.html');
    return;
  }
  currentUser = user;
  loadProfileData();
});

// Load user profile data
function loadProfileData() {
  if (currentUser) {
    const nameInput = document.getElementById('profile-name');
    nameInput.value = currentUser.displayName || 'No name set';
    nameInput.disabled = true;
    
    const emailInput = document.getElementById('profile-email');
    emailInput.value = currentUser.email || 'No email';
    
    const photoURL = currentUser.photoURL || 'https://via.placeholder.com/200';
    document.getElementById('profile-image-preview').src = photoURL;
    
    console.log('Profile loaded:', currentUser.displayName, currentUser.email);
  }
}

// Edit name functionality
document.addEventListener('DOMContentLoaded', function() {
  const editBtn = document.getElementById('edit-name-btn');
  if (editBtn) {
    editBtn.addEventListener('click', function() {
      const nameInput = document.getElementById('profile-name');
      
      if (nameInput.disabled) {
        nameInput.disabled = false;
        nameInput.focus();
        nameInput.select();
        editBtn.innerHTML = '<i class="fas fa-check"></i>';
        editBtn.style.background = '#2ecc71';
      } else {
        nameInput.disabled = true;
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.style.background = '#e67e22';
      }
    });
  }
});

// Handle image selection from local machine
document.addEventListener('DOMContentLoaded', function() {
  const photoInput = document.getElementById('profile-photo-input');
  if (photoInput) {
    photoInput.addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          showNotification('Please select an image file', 'error');
          return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
          showNotification('Image size must be less than 5MB', 'error');
          return;
        }
        
        selectedImageFile = file;
        
        const reader = new FileReader();
        reader.onload = function(e) {
          document.getElementById('profile-image-preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        showNotification('Image selected. Click "Save Changes" to update.', 'success');
      }
    });
  }
});

// Handle profile update
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('profile-update-form');
  if (form) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      const name = document.getElementById('profile-name').value.trim();
      
      if (!name) {
        showNotification('Name cannot be empty', 'error');
        return;
      }
      
      try {
        let photoURL = currentUser.photoURL;
        
        if (selectedImageFile) {
          photoURL = await convertImageToBase64(selectedImageFile);
        }
        
        await currentUser.updateProfile({
          displayName: name,
          photoURL: photoURL
        });
        
        await currentUser.reload();
        currentUser = firebase.auth().currentUser;
        
        showNotification('Profile updated successfully!', 'success');
        selectedImageFile = null;
        document.getElementById('profile-photo-input').value = '';
        
        const nameInput = document.getElementById('profile-name');
        nameInput.disabled = true;
        const editBtn = document.getElementById('edit-name-btn');
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.style.background = '#e67e22';
        
      } catch (error) {
        console.error('Profile update error:', error);
        showNotification('Failed to update profile: ' + error.message, 'error');
      }
    });
  }
});

// Convert image file to base64
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Handle account deletion
document.addEventListener('DOMContentLoaded', function() {
  const deleteBtn = document.getElementById('delete-account-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async function() {
      const confirmation = confirm('⚠️ WARNING: Are you sure you want to delete your account?\n\nThis action CANNOT be undone!\n\nClick OK to continue.');
      
      if (!confirmation) {
        showNotification('Account deletion cancelled', 'error');
        return;
      }
      
      const doubleConfirm = prompt('Type "DELETE" in capital letters to confirm account deletion:');
      
      if (doubleConfirm !== 'DELETE') {
        showNotification('Account deletion cancelled. You must type DELETE exactly.', 'error');
        return;
      }
      
      try {
        const user = firebase.auth().currentUser;
        if (!user) {
          showNotification('No user logged in', 'error');
          return;
        }
        
        await user.delete();
        sessionStorage.clear();
        localStorage.clear();
        
        showNotification('Account deleted successfully. Redirecting...', 'success');
        setTimeout(() => {
          window.location.replace('landing.html');
        }, 2000);
        
      } catch (error) {
        console.error('Delete error:', error);
        if (error.code === 'auth/requires-recent-login') {
          showNotification('For security, please logout and login again before deleting your account', 'error');
        } else {
          showNotification('Failed to delete account: ' + error.message, 'error');
        }
      }
    });
  }
});

// Show notification
function showNotification(message, type) {
  const notification = document.getElementById('notification');
  if (notification) {
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

// Logout function
async function handleLogout() {
  try {
    await firebase.auth().signOut();
    sessionStorage.clear();
    localStorage.clear();
    window.location.replace('landing.html');
  } catch (error) {
    showNotification('Failed to logout', 'error');
  }
}

window.handleLogout = handleLogout;
