document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = 'https://snapvector-server.codelabworks.is-cool.dev';

    let currentUser = {
        username: null,
        is_guest: false,
        role: 'user',
        is_admin: false
    };

    const authView = document.getElementById('auth-view');
    const appView = document.getElementById('app-view');
    const messageBox = document.getElementById('message-box');

    const uploaderView = document.getElementById('uploader-view');
    const detailsView = document.getElementById('details-view');
    const dashboardView = document.getElementById('dashboard-view');
    const accountView = document.getElementById('account-view');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const guestLoginButton = document.getElementById('guest-login-button');

    const homeButton = document.getElementById('home-button');
    const accountButton = document.getElementById('account-button');
    const logoutButton = document.getElementById('logout-button');
    const userGreeting = document.getElementById('user-greeting');
    const adminButton = document.getElementById('admin-button');
    const announcementBanner = document.getElementById('announcement-banner');
    let announcementInterval = null;

    const toggleLoginPassword = document.getElementById('toggle-login-password');
    const loginPasswordInput = document.getElementById('login-password');
    const toggleRegisterPassword = document.getElementById('toggle-register-password');
    const registerPasswordInput = document.getElementById('register-password');

    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-upload');
    const submitButton = document.getElementById('submit-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const dropZone = document.getElementById('drop-zone');
    const previewZone = document.getElementById('preview-zone');
    const filePreview = document.getElementById('file-preview');
    const clearPreviewButton = document.getElementById('clear-preview-button');

    const detailsTitle = document.getElementById('details-title');
    const imagePreview = document.getElementById('image-preview');
    const shareLinkInput = document.getElementById('share-link');
    const copyButton = document.getElementById('copy-button');
    const backToUploaderButton = document.getElementById('back-to-uploader-button');
    const deleteButton = document.getElementById('delete-button');
    const expirationInfoBox = document.getElementById('expiration-info');
    const expirationText = document.getElementById('expiration-text').querySelector('span');
    let currentImageId = null;

    const imageGallery = document.getElementById('image-gallery');
    const noImagesMessage = document.getElementById('no-images-message');

    const backToDashboardButton = document.getElementById('back-to-dashboard-button');
    const accountFormsFull = document.getElementById('account-forms-full');
    const accountFormsGuest = document.getElementById('account-forms-guest');

    const changeUsernameForm = document.getElementById('change-username-form');
    const newUsernameInput = document.getElementById('new-username');

    const changePasswordForm = document.getElementById('change-password-form');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    const sessionsList = document.getElementById('sessions-list');
    const sessionsLoading = document.getElementById('sessions-loading');

    const deleteAccountForm = document.getElementById('delete-account-form');
    const deletePasswordField = document.getElementById('delete-password-field');
    const deleteConfirmPasswordInput = document.getElementById('delete-confirm-password');

    /**
     * Shows a message box with styling based on type.
     * @param {string} message - The message to display.
     * @param {string} type - 'success', 'error', or 'info'.
     */
    function showMessage(message, type = 'info') {
        const baseClasses = 'p-4 text-sm rounded-lg transition-opacity duration-300';
        let typeClasses = '';

        switch (type) {
            case 'success':
                typeClasses = 'bg-green-900/50 text-green-300 border border-green-500';
                break;
            case 'error':
                typeClasses = 'bg-red-900/50 text-red-300 border border-red-500';
                break;
            case 'info':
            default:
                typeClasses = 'bg-blue-900/50 text-blue-300 border border-blue-500';
                break;
        }

        messageBox.className = `${baseClasses} ${typeClasses}`;
        messageBox.innerHTML = message;
        messageBox.classList.remove('hidden');

        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 5000);
    }

    function showConfirm(message) {
        try {
            return window.confirm(message);
        } catch (e) {
            console.warn("window.confirm is blocked. Auto-confirming delete.", e);
            showMessage("Confirmation dialogs are blocked. Action cancelled.", "error");
            return false;
        }
    }


    /**
     * Fetches a resource with a specified timeout.
     * @param {string} url - The URL to fetch.
     * @param {object} options - Fetch options (method, headers, body, etc.).
     * @param {number} timeout - Timeout in milliseconds.
     * @returns {Promise<Response>} A promise that resolves with the fetch Response.
     */
    async function fetchWithTimeout(url, options = {}, timeout = 8000) {
        const controller = new AbortController();
        const signal = controller.signal;
        options.signal = signal;

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                controller.abort();
                reject(new Error('Request timed out'));
            }, timeout);
        });

        const fetchPromise = fetch(url, options);

        return Promise.race([fetchPromise, timeoutPromise]);
    }

    function showView(viewToShow) {
        [authView, appView, uploaderView, detailsView, dashboardView, accountView].forEach(view => {
            view.classList.add('hidden');
        });

        if (viewToShow === 'auth') {
            authView.classList.remove('hidden');
        } else {
            appView.classList.remove('hidden');
            if (viewToShow === 'dashboard') {
                uploaderView.classList.remove('hidden');
                dashboardView.classList.remove('hidden');
            } else if (viewToShow === 'details') {
                detailsView.classList.remove('hidden');
            } else if (viewToShow === 'account') {
                accountView.classList.remove('hidden');
            }
        }
    }

    function showDashboardView() {
        showView('dashboard');
        fetchImages();
    }

    function showAccountView() {
        showView('account');

        changeUsernameForm.reset();
        changePasswordForm.reset();
        deleteAccountForm.reset();

        if (currentUser.is_guest) {
            accountFormsFull.classList.add('hidden');
            accountFormsGuest.classList.remove('hidden');
            deletePasswordField.classList.add('hidden');
        } else {
            accountFormsFull.classList.remove('hidden');
            accountFormsGuest.classList.add('hidden');
            deletePasswordField.classList.remove('hidden');
            newUsernameInput.placeholder = currentUser.username;
            fetchSessions();
        }
    }


    async function fetchImages() {
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/images`, {
                credentials: 'include'
            }, 8000);

            if (!response.ok) {
                if (response.status === 401) {
                    updateUI(false);
                    return;
                }
                throw new Error('Failed to fetch images.');
            }

            const images = await response.json();
            imageGallery.innerHTML = '';

            if (images.length === 0) {
                noImagesMessage.classList.remove('hidden');
            } else {
                noImagesMessage.classList.add('hidden');
                images.forEach(image => {
                    const expiryClass = image.is_expiring_soon ? 'border-2 border-red-500 expiring-glow' : 'border-gray-600';
                    const item = document.createElement('div');
                    item.className = `relative group rounded-lg overflow-hidden border ${expiryClass} bg-gray-700 shadow-xl cursor-pointer gallery-image`;
                    item.setAttribute('data-image-id', image.id);
                    const img = document.createElement('img');
                    img.src = image.url;
                    img.alt = `Uploaded on ${new Date(image.upload_date).toLocaleDateString()}`;
                    img.className = 'w-full h-32 object-cover';
                    const overlay = document.createElement('div');
                    overlay.className = 'absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300';
                    const viewButton = document.createElement('span');
                    viewButton.textContent = 'View Details';
                    viewButton.className = 'text-white text-sm font-bold p-2 bg-indigo-600 rounded-lg';
                    overlay.appendChild(viewButton);
                    item.appendChild(img);
                    item.appendChild(overlay);
                    imageGallery.appendChild(item);
                    item.addEventListener('click', () => showDetailsView(image.id));
                });
            }
        } catch (error) {
            console.error('Error fetching images:', error);
            if (error.message.includes('timed out')) {
                showMessage('Could not load images: The server took too long to respond.', 'error');
            } else {
                showMessage('Could not load your images.', 'error');
            }
        }
    }

    async function fetchAnnouncements() {
        if (!announcementBanner) return;
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/announcements`, {
                credentials: 'include'
            }, 5000);
            if (!response.ok) throw new Error('Failed to fetch announcements');
            const data = await response.json();
            if (data && data.length > 0) {
                const latestAnnouncement = data[0];
                const messageDate = new Date(latestAnnouncement.created_at).toLocaleString();
                announcementBanner.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <i class="fa-solid fa-bullhorn fa-fade text-xl"></i>
                        <div>
                            <p class="font-bold">Announcement</p>
                            <p class="text-sm">${latestAnnouncement.message}</p>
                            <p class="text-xs text-indigo-400 mt-1">${messageDate}</p>
                        </div>
                    </div>`;
                announcementBanner.classList.remove('hidden');
            } else {
                announcementBanner.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
            announcementBanner.classList.add('hidden');
        }
    }


    /**
     * Updates the UI based on authentication status.
     * @param {boolean} isAuthenticated - Whether the user is logged in.
     * @param {object|null} userData - User data (username, is_guest) or null.
     */
    function updateUI(isAuthenticated, userData = null) {
        if (isAuthenticated && userData) {
            currentUser = { ...userData };

            showView('dashboard');
            
            // --- FIX: Load images immediately upon restoring session ---
            fetchImages(); 
            // -----------------------------------------------------------

            let roleBadge = '';
            if (currentUser.role === 'owner') roleBadge = '👑 Owner';
            else if (currentUser.role === 'admin') roleBadge = '🛡️ Admin';
            else if (currentUser.role === 'moderator') roleBadge = '⚔️ Mod';
            else if (currentUser.is_guest) roleBadge = '👤 Guest';
            else roleBadge = 'User';

            const greeting = `Welcome, ${userData.username} <span class="text-xs bg-gray-700 px-2 py-0.5 rounded ml-2">${roleBadge}</span>`;
            if (userGreeting) userGreeting.innerHTML = greeting;

            if (adminButton) {
                const isAdmin = userData.role === 'owner' || userData.role === 'admin' || userData.role === 'moderator' || userData.is_admin;
                adminButton.classList.toggle('hidden', !isAdmin);
                if (isAdmin) adminButton.href = 'admin.html';
            }

            if (announcementInterval) clearInterval(announcementInterval);
            fetchAnnouncements();
            announcementInterval = setInterval(fetchAnnouncements, 60000);

        } else {
            currentUser = { username: null, is_guest: false, is_admin: false, role: 'user' };
            showView('auth');

            if (announcementInterval) clearInterval(announcementInterval);
            if (adminButton) adminButton.classList.add('hidden');
            if (announcementBanner) announcementBanner.classList.add('hidden');
        }
    }

    async function checkAuthStatus() {
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/auth_status`, {
                credentials: 'include'
            }, 8000);
            if (!response.ok) throw new Error('Failed to check auth status.');
            const data = await response.json();
            updateUI(data.authenticated, data);
        } catch (error) {
            console.error('Error checking auth status:', error);
            if (error.message.includes('timed out')) {
                showMessage('Server took too long to respond. Please try again.', 'error');
            } else {
                showMessage('Connection error. Could not check login status.', 'error');
            }
            updateUI(false);
        }
    }

    /**
     * Handles authentication (Login or Register).
     * @param {string} endpoint - '/login' or '/register'.
     * @param {object} credentials - { username, password }.
     */
    async function handleAuth(endpoint, credentials) {
        let response;
        try {
            response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
                credentials: 'include'
            }, 8000);

            const data = await response.json();

            if (data.success) {
                showMessage(data.message, 'success');
                updateUI(true, data);
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            console.error('Auth error:', error);
            if (error.message.includes('timed out')) {
                showMessage('Authentication request timed out. Please try again.', 'error');
            } else if (response && response.status === 429) {
                showMessage('Too many login attempts. Please try again later.', 'error');
            }
            else {
                showMessage('Network or server error during authentication.', 'error');
            }
        }
    }

    guestLoginButton.addEventListener('click', async (e) => {
        e.preventDefault();
        guestLoginButton.disabled = true;
        guestLoginButton.textContent = 'Creating Guest Account...';
        let response;
        try {
            response = await fetchWithTimeout(`${API_BASE_URL}/guest_login`, {
                method: 'POST',
                credentials: 'include'
            }, 8000);

            const data = await response.json();
            if (data.success) {
                showMessage(`Welcome! Your guest account (${data.username}) has been created.`, 'success');
                updateUI(true, data);
            } else {
                showMessage(data.error || 'Failed to create guest account.', 'error');
            }
        } catch (error) {
            console.error('Guest login error:', error);
            if (error.message.includes('timed out')) {
                showMessage('Guest login request timed out. Please try again.', 'error');
            } else if (response && response.status === 429) {
                showMessage('Too many guest accounts created. Please try again later.', 'error');
            }
            else {
                showMessage('Network or server error during guest login.', 'error');
            }
        } finally {
            guestLoginButton.disabled = false;
            guestLoginButton.textContent = 'Login as Guest (Saves your images)';
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = loginPasswordInput.value;
        handleAuth('/login', { username, password });
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = registerPasswordInput.value;
        handleAuth('/register', { username, password });
    });

    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/logout`, {
                method: 'POST',
                credentials: 'include'
            }, 8000);
            const data = await response.json();
            if (data.success) {
                showMessage(data.message, 'info');
                updateUI(false);
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            if (error.message.includes('timed out')) {
                showMessage('Logout request timed out. Please try again.', 'error');
            } else {
                showMessage('Network or server error during logout.', 'error');
            }
        }
    });

    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    function togglePasswordVisibility(input, toggleButton) {
        const icon = toggleButton.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    toggleLoginPassword.addEventListener('click', () => {
        togglePasswordVisibility(loginPasswordInput, toggleLoginPassword);
    });

    toggleRegisterPassword.addEventListener('click', () => {
        togglePasswordVisibility(registerPasswordInput, toggleRegisterPassword);
    });

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function handleFileSelection(file) {
        if (!file) return;
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            const formattedSize = formatFileSize(file.size);
            showMessage(`File size exceeds the 10MB limit. Your file is ${formattedSize}.`, 'error');
            fileInput.value = '';
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
            return;
        }
        const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showMessage('Invalid file type. Only PNG, JPG, JPEG, GIF, and WEBP are allowed.', 'error');
            fileInput.value = '';
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            filePreview.src = e.target.result;
            dropZone.classList.add('hidden');
            previewZone.classList.remove('hidden');
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
        };
        reader.readAsDataURL(file);
    }

    fileInput.addEventListener('change', (e) => {
        handleFileSelection(e.target.files[0]);
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
    dropZone.addEventListener('dragenter', () => {
        dropZone.classList.add('border-indigo-500', 'bg-gray-700');
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('border-indigo-500', 'bg-gray-700');
        });
    });
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt.files.length > 0) {
            handleFileSelection(dt.files[0]);
        } else {
            showMessage("No file dropped.", 'error');
        }
    });

    clearPreviewButton.addEventListener('click', () => {
        fileInput.value = '';
        filePreview.src = '';
        previewZone.classList.add('hidden');
        dropZone.classList.remove('hidden');
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    });


    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        if (!file) {
            showMessage('Please select a file to upload.', 'error');
            return;
        }
        submitButton.disabled = true;
        document.getElementById('button-text').textContent = 'Uploading...';
        loadingIndicator.classList.remove('hidden');
        const formData = new FormData();
        formData.append('file', file);
        let response;
        try {
            response = await fetchWithTimeout(`${API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            }, 120000);
            const data = await response.json();
            if (data.success) {
                showMessage('Image uploaded successfully!', 'success');
                clearPreviewButton.click();
                showDetailsView(data.details_id);
            } else {
                showMessage(data.error || 'An unknown error occurred.', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            if (error.message.includes('timed out')) {
                showMessage('Upload request timed out. This can happen with large files or slow connections.', 'error');
            } else if (response && response.status === 429) {
                showMessage('You are uploading too fast. Please try again in a minute.', 'error');
            }
            else {
                showMessage('Network or server error during upload.', 'error');
            }
        } finally {
            document.getElementById('button-text').textContent = 'Upload Image';
            loadingIndicator.classList.add('hidden');
            if (fileInput.files[0]) {
                submitButton.disabled = false;
            }
        }
    });

    function truncateFilename(filename, maxLength = 30) {
        if (filename.length <= maxLength) return filename;
        const extensionMatch = filename.match(/\.([0-9a-z]+)$/i);
        const extension = extensionMatch ? extensionMatch[0] : '';
        const baseName = extensionMatch ? filename.slice(0, -extension.length) : filename;
        const maxBaseLength = maxLength - extension.length - 3;
        if (maxBaseLength <= 0) return filename.substring(0, maxLength - 3) + '...';
        const cutoff = Math.floor(Math.random() * (maxBaseLength * 0.4)) + Math.floor(maxBaseLength * 0.4);
        return baseName.substring(0, cutoff) + '...' + extension;
    }

    /**
     * Displays the details view for a specific image.
     * @param {number} id - The ID of the image.
     */
    async function showDetailsView(id) {
        currentImageId = id;
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/image/${id}`, {
                credentials: 'include'
            }, 8000);
            const data = await response.json();
            if (data.success) {
                showView('details');
                const expiryDate = data.expires_at ? new Date(data.expires_at) : null;
                detailsTitle.textContent = `Image Details: ${truncateFilename(data.filename, 35)}`;
                imagePreview.src = data.url;
                shareLinkInput.value = data.url;

                if (expiryDate) {
                    const now = new Date();
                    const diffTime = expiryDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    });
                    if (diffDays <= 3) {
                        expirationText.textContent = `PURGE ALERT! This image will be deleted on ${formattedExpiryDate} (${diffDays} days left).`;
                        expirationInfoBox.className = 'bg-red-900/50 border-2 border-red-500 rounded-lg p-3';
                        expirationText.parentElement.classList.remove('text-blue-300');
                        expirationText.parentElement.classList.add('text-red-300');
                        expirationText.parentElement.querySelector('i').className = 'fa-solid fa-triangle-exclamation';
                    } else {
                        expirationText.textContent = `This image will be deleted on ${formattedExpiryDate} (${diffDays} days left).`;
                        expirationInfoBox.className = 'bg-blue-900/50 border-2 border-blue-500 rounded-lg p-3';
                        expirationText.parentElement.classList.remove('text-red-300');
                        expirationText.parentElement.classList.add('text-blue-300');
                        expirationText.parentElement.querySelector('i').className = 'fa-solid fa-circle-info';
                    }
                    expirationInfoBox.classList.remove('hidden');
                } else {
                    expirationInfoBox.classList.add('hidden');
                }

                if (data.is_owner) {
                    deleteButton.classList.remove('hidden');
                    deleteButton.classList.add('flex', 'items-center', 'justify-center', 'space-x-2');
                    deleteButton.innerHTML = `<i class="fa-solid fa-trash"></i> <span>Delete Image</span>`;
                } else {
                    deleteButton.classList.add('hidden');
                    deleteButton.classList.remove('flex', 'items-center', 'justify-center', 'space-x-2');
                }
            } else {
                showMessage(data.error, 'error');
                showDashboardView();
            }
        } catch (error) {
            console.error('Details fetch error:', error);
            if (error.message.includes('timed out') || error.message.includes('Failed to fetch')) {
                showMessage('You must be logged in to view image details.', 'error');
            } else {
                showMessage('Could not load image details.', 'error');
            }
            showDashboardView();
        }
    }


    copyButton.addEventListener('click', handleCopy);

    function handleCopy() {
        const textToCopy = shareLinkInput.value;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    const originalText = copyButton.innerHTML;
                    copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                    copyButton.classList.add('bg-green-600', 'hover:bg-green-700');
                    copyButton.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
                    setTimeout(() => {
                        copyButton.innerHTML = originalText;
                        copyButton.classList.remove('bg-green-600', 'hover:bg-green-700');
                        copyButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Copy failed using navigator.clipboard.writeText:', err);
                    fallbackCopy();
                });
        } else {
            fallbackCopy();
        }
    }

    function fallbackCopy() {
        shareLinkInput.select();
        shareLinkInput.setSelectionRange(0, 99999);
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                copyButton.classList.add('bg-green-600', 'hover:bg-green-700');
                copyButton.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
                setTimeout(() => {
                    copyButton.innerHTML = originalText;
                    copyButton.classList.remove('bg-green-600', 'hover:bg-green-700');
                    copyButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
                }, 2000);
            } else {
                showMessage('Could not copy the link. Please copy it manually.', 'error');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            showMessage('Could not copy the link. Please copy it manually.', 'error');
        }
    }

    deleteButton.addEventListener('click', async () => {
        if (!currentImageId) return;
        if (!showConfirm(`Are you sure you want to delete this image? This cannot be undone.`)) {
            return;
        }
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/image/${currentImageId}`, {
                method: 'DELETE',
                credentials: 'include'
            }, 8000);
            const data = await response.json();
            if (data.success) {
                showMessage('Image deleted successfully.', 'success');
                showDashboardView();
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            if (error.message.includes('timed out')) {
                showMessage('Delete request timed out. Please try again.', 'error');
            } else {
                showMessage('Network or server error during deletion.', 'error');
            }
        }
    });

    backToUploaderButton.addEventListener('click', showDashboardView);
    homeButton.addEventListener('click', showDashboardView);
    backToDashboardButton.addEventListener('click', showDashboardView);

    accountButton.addEventListener('click', showAccountView);


    changeUsernameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUsername = newUsernameInput.value;
        if (!newUsername || newUsername.trim() === "") {
            showMessage("New username cannot be empty.", "error");
            return;
        }

        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/account/change-username`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_username: newUsername }),
                credentials: 'include'
            }, 8000);
            const data = await response.json();
            if (data.success) {
                showMessage(data.message, 'success');
                currentUser.username = data.new_username;
                updateUI(true, { ...currentUser, username: data.new_username });
                newUsernameInput.value = '';
                newUsernameInput.placeholder = data.new_username;
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            showMessage("A network error occurred.", "error");
        }
    });

    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (newPassword !== confirmPassword) {
            showMessage("New passwords do not match.", "error");
            return;
        }

        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/account/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                }),
                credentials: 'include'
            }, 8000);
            const data = await response.json();
            if (data.success) {
                showMessage(data.message, 'success');
                changePasswordForm.reset();
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            showMessage("A network error occurred.", "error");
        }
    });

    deleteAccountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = deleteConfirmPasswordInput.value;

        let confirmMessage = "Are you sure you want to delete your account? This is permanent and all your images will be lost.";
        if (currentUser.is_guest) {
            confirmMessage = "Are you sure you want to delete this guest account? All your images will be lost.";
        } else if (!password) {
            showMessage("Please enter your password to confirm deletion.", "error");
            return;
        }

        if (!showConfirm(confirmMessage)) {
            return;
        }

        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/account/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password }),
                credentials: 'include'
            }, 8000);
            const data = await response.json();
            if (data.success) {
                showMessage(data.message, 'success');
                updateUI(false);
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            showMessage("A network error occurred.", "error");
        }
    });

    async function fetchSessions() {
        sessionsLoading.classList.remove('hidden');
        sessionsList.innerHTML = '';
        sessionsList.appendChild(sessionsLoading);

        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/account/sessions`, {
                credentials: 'include'
            }, 8000);
            const data = await response.json();

            sessionsList.innerHTML = '';

            if (data && data.length > 0) {
                data.forEach(session => {
                    const { os, browser, icon } = parseUserAgent(session.user_agent);
                    const loginTime = new Date(session.login_at).toLocaleString();
                    const isCurrent = (session.hashed_ip === currentUser.last_seen_ip_hash);

                    const li = document.createElement('li');
                    li.className = "flex items-center justify-between p-3 bg-gray-800 rounded-lg";
                    li.innerHTML = `
                        <div class="flex items-center space-x-3">
                            <i class="fa-solid ${icon} text-2xl text-gray-400 w-6 text-center"></i>
                            <div>
                                <p class="font-medium text-white">${os} (${browser})</p>
                                <p class="text-sm text-gray-400">${loginTime}</p>
                            </div>
                        </div>
                        <div class="text-right">
                             <p class="text-sm font-mono text-gray-500" title="${session.hashed_ip}">${session.hashed_ip.substring(0, 10)}...</p>
                             ${isCurrent ? '<span class="text-xs font-bold text-green-400">Current Session</span>' : ''}
                        </div>
                    `;
                    sessionsList.appendChild(li);
                });
            } else {
                sessionsList.innerHTML = `<li class="text-gray-400">No session history found.</li>`;
            }

        } catch (error) {
            sessionsList.innerHTML = `<li class="text-red-400">Could not load session history.</li>`;
        }
    }

    function parseUserAgent(ua) {
        let os = "Unknown OS";
        let browser = "Unknown Browser";
        let icon = "fa-desktop";

        if (!ua) return { os, browser, icon };

        if (ua.includes("Windows")) { os = "Windows"; icon = "fa-brands fa-windows"; }
        else if (ua.includes("Macintosh") || ua.includes("Mac OS")) { os = "Mac OS"; icon = "fa-brands fa-apple"; }
        else if (ua.includes("Linux")) { os = "Linux"; icon = "fa-brands fa-linux"; }
        else if (ua.includes("Android")) { os = "Android"; icon = "fa-brands fa-android"; }
        else if (ua.includes("iPhone") || ua.includes("iPad")) { os = "iOS"; icon = "fa-brands fa-apple"; }

        if (ua.includes("Edg/")) { browser = "Edge"; }
        else if (ua.includes("Chrome")) { browser = "Chrome"; }
        else if (ua.includes("Firefox")) { browser = "Firefox"; }
        else if (ua.includes("Safari")) { browser = "Safari"; }

        return { os, browser, icon };
    }

    checkAuthStatus();

});

