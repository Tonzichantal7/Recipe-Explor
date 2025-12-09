// profile.js - Profile Settings with Firebase Storage

// Initialize Firebase services
let currentUser = null;
let selectedImageFile = null;
let storageRef = null;
let db = null;
let userData = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Profile page loading...');
        
        // Check if user is authenticated
        firebase.auth().onAuthStateChanged(async (user) => {
            if (!user) {
                console.log('No user, redirecting to landing page');
                window.location.replace('landing.html');
                return;
            }
            
            currentUser = user;
            console.log('User authenticated:', currentUser.email);
            
            // Initialize Firebase services
            storageRef = firebase.storage().ref();
            db = firebase.firestore();
            
            // Load user data
            await loadUserData();
            
            // Setup event listeners
            setupEventListeners();
            
            // Update UI
            updateUI();
        });
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Error loading profile', 'error');
    }
});

// Load user data from Firestore
async function loadUserData() {
    try {
        console.log('Loading user data for:', currentUser.uid);
        
        // Get user document from Firestore
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            userData = userDoc.data();
            console.log('User data loaded from Firestore:', userData);
        } else {
            // Create new user document if it doesn't exist
            console.log('Creating new user document');
            userData = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || '',
                photoURL: currentUser.photoURL || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('users').doc(currentUser.uid).set(userData);
            console.log('New user document created');
        }
        
        // Load profile image
        await loadProfileImage();
        
    } catch (error) {
        console.error('Error loading user data:', error);
        throw error;
    }
}

// Load profile image from Storage
async function loadProfileImage() {
    try {
        const imgPreview = document.getElementById('profile-image-preview');
        
        // Check if user has a photoURL
        if (userData.photoURL && userData.photoURL.trim() !== '') {
            console.log('Loading profile image from URL:', userData.photoURL);
            
            // Try to load the image
            const img = new Image();
            img.onload = function() {
                imgPreview.src = userData.photoURL;
                console.log('Profile image loaded successfully');
            };
            img.onerror = function() {
                console.log('Error loading image from URL, using default');
                imgPreview.src = generateDefaultAvatar(userData.displayName || userData.email);
            };
            img.src = userData.photoURL;
            
        } else {
            // Use default avatar
            console.log('No profile image found, using default');
            const name = userData.displayName || userData.email || 'User';
            imgPreview.src = generateDefaultAvatar(name);
        }
        
    } catch (error) {
        console.error('Error loading profile image:', error);
        const imgPreview = document.getElementById('profile-image-preview');
        imgPreview.src = generateDefaultAvatar(userData?.displayName || userData?.email || 'User');
    }
}

// Update form fields with user data
function updateUI() {
    try {
        // Update name field
        const nameInput = document.getElementById('profile-name');
        if (nameInput) {
            nameInput.value = userData.displayName || '';
        }
        
        // Update email field
        const emailInput = document.getElementById('profile-email');
        if (emailInput) {
            emailInput.value = userData.email || '';
        }
        
        console.log('UI updated with user data');
        
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

// Generate default avatar
function generateDefaultAvatar(name) {
    if (!name || name.trim() === '') name = 'User';
    const encodedName = encodeURIComponent(name.trim());
    const colors = ['3498db', '2ecc71', 'e74c3c', 'f39c12', '9b59b6', '1abc9c'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${encodedName}&size=150&background=${randomColor}&color=fff&bold=true`;
}

// Setup all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Edit name button
    const editNameBtn = document.getElementById('edit-name-btn');
    if (editNameBtn) {
        editNameBtn.addEventListener('click', toggleNameEdit);
    }
    
    // Image upload
    const imageUpload = document.getElementById('profile-photo-input');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    // Profile form submission
    const profileForm = document.getElementById('profile-update-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Delete account button
    const deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', showDeleteConfirmation);
    }
    
    // Add image controls
    addImageControls();
    
    console.log('Event listeners setup complete');
}

// Add image control buttons
function addImageControls() {
    const imageControls = document.querySelector('.image-upload-controls');
    if (!imageControls) return;
    
    // Remove existing buttons
    const existingBtn = document.getElementById('delete-image-btn');
    if (existingBtn) existingBtn.remove();
    
    // Add delete button if user has a custom image
    if (userData.photoURL && 
        !userData.photoURL.includes('ui-avatars.com') && 
        !userData.photoURL.includes('placeholder')) {
        
        const deleteBtn = document.createElement('button');
        deleteBtn.id = 'delete-image-btn';
        deleteBtn.className = 'delete-image-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Remove Photo';
        deleteBtn.addEventListener('click', deleteProfileImage);
        
        imageControls.appendChild(deleteBtn);
    }
}

// Handle image upload
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('Image selected:', file.name, file.size, file.type);
    
    // Validate file type
    if (!file.type.match('image.*')) {
        showNotification('Please select an image file (JPG, PNG, GIF)', 'error');
        return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image must be less than 5MB', 'error');
        return;
    }
    
    selectedImageFile = file;
    
    // Preview image
    const reader = new FileReader();
    reader.onload = function(e) {
        const imgPreview = document.getElementById('profile-image-preview');
        imgPreview.src = e.target.result;
        imgPreview.classList.add('image-preview-new');
        
        // Show save prompt
        showNotification('Image selected. Click "Save Changes" to upload.', 'success');
    };
    reader.readAsDataURL(file);
    
    console.log('Image preview ready');
}

// Upload image to Firebase Storage
async function uploadImageToStorage(file) {
    try {
        console.log('Starting image upload...');
        
        const userId = currentUser.uid;
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `profile_${userId}_${timestamp}.${fileExtension}`;
        
        console.log('Uploading file:', fileName);
        
        // Create storage reference
        const imageRef = storageRef.child(`profile_images/${fileName}`);
        
        // Upload file
        const uploadTask = imageRef.put(file);
        
        // Show upload progress
        showNotification('Uploading image... 0%', 'info');
        
        // Monitor upload progress
        uploadTask.on('state_changed',
            (snapshot) => {
                // Progress tracking
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload progress:', progress.toFixed(0) + '%');
                showNotification(`Uploading image... ${progress.toFixed(0)}%`, 'info');
            },
            (error) => {
                console.error('Upload error:', error);
                throw error;
            },
            async () => {
                // Upload complete, get download URL
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                console.log('Image uploaded successfully:', downloadURL);
                return downloadURL;
            }
        );
        
        // Wait for upload to complete
        await uploadTask;
        const downloadURL = await imageRef.getDownloadURL();
        
        console.log('Image URL obtained:', downloadURL);
        return downloadURL;
        
    } catch (error) {
        console.error('Image upload error:', error);
        throw error;
    }
}

// Delete old image from storage if exists
async function deleteOldImage(oldImageUrl) {
    try {
        if (!oldImageUrl || 
            oldImageUrl.includes('ui-avatars.com') || 
            oldImageUrl.includes('placeholder')) {
            return; // Skip default images
        }
        
        console.log('Deleting old image:', oldImageUrl);
        
        // Extract path from URL
        const oldImageRef = firebase.storage().refFromURL(oldImageUrl);
        await oldImageRef.delete();
        
        console.log('Old image deleted successfully');
        
    } catch (error) {
        console.log('Could not delete old image (might not exist):', error.message);
        // Continue anyway - this is not critical
    }
}

// Handle profile update
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    try {
        console.log('Starting profile update...');
        showNotification('Saving changes...', 'info');
        
        const nameInput = document.getElementById('profile-name');
        const name = nameInput.value.trim();
        
        if (!name) {
            showNotification('Name cannot be empty', 'error');
            return;
        }
        
        let newPhotoURL = userData.photoURL;
        
        // Handle image upload if a new image was selected
        if (selectedImageFile) {
            console.log('New image detected, uploading...');
            
            // Delete old image if exists
            if (userData.photoURL) {
                await deleteOldImage(userData.photoURL);
            }
            
            // Upload new image
            newPhotoURL = await uploadImageToStorage(selectedImageFile);
            console.log('New image uploaded to:', newPhotoURL);
        }
        
        // Update user profile in Firebase Auth
        await currentUser.updateProfile({
            displayName: name,
            photoURL: newPhotoURL
        });
        
        // Update Firestore document
        const updateData = {
            displayName: name,
            photoURL: newPhotoURL,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(currentUser.uid).update(updateData);
        
        // Update local data
        userData.displayName = name;
        userData.photoURL = newPhotoURL;
        
        // Update auth.js UI if on same page
        if (typeof updateAuthUI === 'function') {
            updateAuthUI();
        }
        
        // Reset selected file
        selectedImageFile = null;
        
        // Update image controls
        addImageControls();
        
        showNotification('Profile updated successfully!', 'success');
        console.log('Profile update complete');
        
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification('Error updating profile: ' + error.message, 'error');
    }
}

// Delete profile image
async function deleteProfileImage() {
    if (!confirm('Are you sure you want to remove your profile picture?')) {
        return;
    }
    
    try {
        showNotification('Removing profile picture...', 'info');
        
        // Delete from storage if it's a Firebase Storage image
        if (userData.photoURL && 
            !userData.photoURL.includes('ui-avatars.com') && 
            !userData.photoURL.includes('placeholder')) {
            await deleteOldImage(userData.photoURL);
        }
        
        // Generate default avatar
        const name = userData.displayName || userData.email || 'User';
        const defaultAvatar = generateDefaultAvatar(name);
        
        // Update Firebase Auth
        await currentUser.updateProfile({
            photoURL: defaultAvatar
        });
        
        // Update Firestore
        await db.collection('users').doc(currentUser.uid).update({
            photoURL: defaultAvatar,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update local data
        userData.photoURL = defaultAvatar;
        
        // Update UI
        const imgPreview = document.getElementById('profile-image-preview');
        imgPreview.src = defaultAvatar;
        
        // Update image controls
        addImageControls();
        
        // Update auth.js UI if on same page
        if (typeof updateAuthUI === 'function') {
            updateAuthUI();
        }
        
        showNotification('Profile picture removed', 'success');
        console.log('Profile image deleted');
        
    } catch (error) {
        console.error('Error deleting profile image:', error);
        showNotification('Error removing picture: ' + error.message, 'error');
    }
}

// Toggle name editing
function toggleNameEdit() {
    const nameInput = document.getElementById('profile-name');
    const editBtn = document.getElementById('edit-name-btn');
    
    if (nameInput.disabled) {
        // Enable editing
        nameInput.disabled = false;
        nameInput.focus();
        nameInput.select();
        editBtn.innerHTML = '<i class="fas fa-check"></i>';
        editBtn.style.backgroundColor = '#27ae60';
        editBtn.title = 'Save name';
    } else {
        // Disable editing
        nameInput.disabled = true;
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.style.backgroundColor = '#e67e22';
        editBtn.title = 'Edit name';
        
        // Auto-save if changed
        const newName = nameInput.value.trim();
        if (newName && newName !== userData.displayName) {
            // Trigger form submission
            const profileForm = document.getElementById('profile-update-form');
            if (profileForm) {
                const submitEvent = new Event('submit');
                profileForm.dispatchEvent(submitEvent);
            }
        }
    }
}

// Show delete confirmation
async function showDeleteConfirmation() {
    try {
        const confirmMessage = `
⚠️ DELETE ACCOUNT ⚠️

This action cannot be undone!
All your data will be permanently deleted.

To confirm, type your email:
${userData.email}`;
        
        const typedEmail = prompt(confirmMessage, '');
        
        if (typedEmail === null) {
            showNotification('Account deletion cancelled', 'info');
            return;
        }
        
        if (typedEmail.trim() !== userData.email) {
            showNotification('Email does not match', 'error');
            return;
        }
        
        if (confirm('FINAL CONFIRMATION: Delete your account permanently?')) {
            await deleteAccount();
        }
        
    } catch (error) {
        console.error('Delete confirmation error:', error);
        showNotification('Error processing request', 'error');
    }
}

// Delete account
async function deleteAccount() {
    try {
        showNotification('Deleting account and all data...', 'info');
        
        // 1. Delete profile image from storage
        if (userData.photoURL && 
            !userData.photoURL.includes('ui-avatars.com') && 
            !userData.photoURL.includes('placeholder')) {
            await deleteOldImage(userData.photoURL);
        }
        
        // 2. Delete user document from Firestore
        await db.collection('users').doc(currentUser.uid).delete();
        
        // 3. Delete any user recipes
        try {
            const recipesSnapshot = await db.collection('recipes')
                .where('userId', '==', currentUser.uid)
                .get();
            
            if (!recipesSnapshot.empty) {
                const batch = db.batch();
                recipesSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            }
        } catch (recipesError) {
            console.log('No recipes to delete:', recipesError.message);
        }
        
        // 4. Delete auth account
        await currentUser.delete();
        
        showNotification('Account deleted successfully', 'success');
        
        // Redirect to landing page
        setTimeout(() => {
            window.location.replace('landing.html');
        }, 2000);
        
    } catch (error) {
        console.error('Account deletion error:', error);
        
        if (error.code === 'auth/requires-recent-login') {
            showNotification('Please log out and log back in to delete account', 'error');
        } else {
            showNotification('Delete failed: ' + error.message, 'error');
        }
    }
}

function checkFirebaseSetup() {
    console.log('=== Firebase Setup Check ===');
    
    // Check if Firebase is initialized
    if (!firebase || !firebase.apps.length) {
        console.error('❌ Firebase not initialized');
        return false;
    }
    console.log('✅ Firebase initialized');
    
    // Check current user
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error('❌ No user logged in');
        return false;
    }
    console.log('✅ User logged in:', user.email);
    
    // Check storage
    if (!firebase.storage) {
        console.error('❌ Firebase Storage not loaded');
        return false;
    }
    console.log('✅ Firebase Storage loaded');
    
    // Check storage reference
    const storage = firebase.storage();
    const storageRef = storage.ref();
    if (!storageRef) {
        console.error('❌ Storage reference not created');
        return false;
    }
    console.log('✅ Storage reference created');
    
    // Check Firestore
    if (!firebase.firestore) {
        console.error('❌ Firebase Firestore not loaded');
        return false;
    }
    console.log('✅ Firebase Firestore loaded');
    
    return true;
}

// Run check on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('Running Firebase setup check...');
        checkFirebaseSetup();
    }, 1000);
});
async function createUserDocument() {
    try {
        const userData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || generateDefaultAvatar(currentUser.displayName || currentUser.email || 'User'),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(currentUser.uid).set(userData);
        console.log('User document created in Firestore');
        
        currentUser.userData = userData;
        
    } catch (error) {
        console.error('Error creating user document:', error);
        throw error;
    }
}

// Show notification
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.log('Notification element not found');
        return;
    }
    
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Logout function
window.handleLogout = async function() {
    try {
        await firebase.auth().signOut();
        window.location.replace('landing.html');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
};

// Add CSS styles
const addStyles = `
    /* Image controls */
    .delete-image-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        color: white;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 600;
        margin-top: 10px;
        font-size: 14px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .delete-image-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
        background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
    }
    
    .delete-image-btn i {
        font-size: 14px;
    }
    
    /* Image preview animations */
    .image-preview-new {
        animation: pulse-green 0.5s ease-in-out;
        border: 3px solid #27ae60 !important;
    }
    
    @keyframes pulse-green {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.7); }
        70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(39, 174, 96, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(39, 174, 96, 0); }
    }
    
    /* Form styles */
    #profile-name:disabled {
        background-color: #f8f9fa;
        color: #495057;
        cursor: not-allowed;
        border-color: #dee2e6;
    }
    
    #profile-name:not(:disabled) {
        background-color: #fff;
        color: #212529;
        border-color: #27ae60;
        box-shadow: 0 0 0 0.2rem rgba(39, 174, 96, 0.25);
    }
    
    /* Loading states */
    .uploading {
        position: relative;
        opacity: 0.7;
    }
    
    .uploading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Image upload button */
    .upload-photo-btn {
        position: relative;
        overflow: hidden;
    }
    
    .upload-photo-btn input[type="file"] {
        position: absolute;
        top: 0;
        right: 0;
        min-width: 100%;
        min-height: 100%;
        font-size: 100px;
        text-align: right;
        filter: alpha(opacity=0);
        opacity: 0;
        outline: none;
        background: white;
        cursor: inherit;
        display: block;
    }
    
    /* Progress indicator */
    .upload-progress {
        width: 100%;
        height: 4px;
        background: #e0e0e0;
        border-radius: 2px;
        margin-top: 10px;
        overflow: hidden;
    }
    
    .upload-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #3498db, #2ecc71);
        width: 0%;
        transition: width 0.3s ease;
    }
`;

// Inject styles
if (document.head) {
    const styleEl = document.createElement('style');
    styleEl.textContent = addStyles;
    document.head.appendChild(styleEl);
}

// Debug helpers
console.log('Profile.js loaded successfully');