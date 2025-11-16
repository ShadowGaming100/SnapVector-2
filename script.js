document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = '';

    const authView = document.getElementById('auth-view');
    const appView = document.getElementById('app-view');
    const messageBox = document.getElementById('message-box');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const guestLoginButton = document.getElementById('guest-login-button');
    const logoutButton = document.getElementById('logout-button');
    const userGreeting = document.getElementById('user-greeting');

    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-upload');
    const submitButton = document.getElementById('submit-button');
    const loadingIndicator = document.getElementById('loading-indicator');

    const dropZone = document.getElementById('drop-zone');
    const previewZone = document.getElementById('preview-zone');
    const filePreview = document.getElementById('file-preview');
    const clearPreviewButton = document.getElementById('clear-preview-button');

    const detailsView = document.getElementById('details-view');
    const detailsTitle = document.getElementById('details-title');
    const imagePreview = document.getElementById('image-preview');
    const shareLinkInput = document.getElementById('share-link');
    const copyButton = document.getElementById('copy-button');
    const backToUploaderButton = document.getElementById('back-to-uploader-button');
    const deleteButton = document.getElementById('delete-button');

    const expirationInfoBox = document.getElementById('expiration-info');
    const expirationText = document.getElementById('expiration-text').querySelector('span');

    let currentImageId = null;

    const dashboardView = document.getElementById('dashboard-view');
    const imageGallery = document.getElementById('image-gallery');
    const noImagesMessage = document.getElementById('no-images-message');

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

    async function fetchImages() {
        try {
            const response = await fetch(`${API_BASE_URL}/images`, {
                credentials: 'include'
            });

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
                imageGallery.appendChild(noImagesMessage);
            } else {
                noImagesMessage.classList.add('hidden');
                images.forEach(image => {
                    const expiryClass = image.is_expiring_soon ? 'border-2 border-red-500' : 'border-gray-600';

                    const item = document.createElement('div');
                    item.className = `relative group rounded-lg overflow-hidden border ${expiryClass} bg-gray-700 shadow-xl cursor-pointer gallery-image`;
                    item.setAttribute('data-image-id', image.id);

                    const img = document.createElement('img');
                    img.src = image.url;
                    img.alt = `Uploaded on ${new Date(image.upload_date).toLocaleDateString()}`;
                    img.className = 'w-full h-32 object-cover transition duration-300';

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
            showMessage('Could not load your images.', 'error');
        }
    }

    /**
     * Updates the UI based on authentication status.
     * @param {boolean} isAuthenticated - Whether the user is logged in.
     * @param {object|null} userData - User data (username, is_guest) or null.
     */
    function updateUI(isAuthenticated, userData = null) {
        if (isAuthenticated) {
            authView.classList.add('hidden');
            appView.classList.remove('hidden');
            const greeting = userData.is_guest
                ? `Guest User: ${userData.username}`
                : `Welcome, ${userData.username}`;

            userGreeting.textContent = greeting;
            fetchImages();
        } else {
            authView.classList.remove('hidden');
            appView.classList.add('hidden');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            userGreeting.textContent = '';
        }
    }

    async function checkAuthStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth_status`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to check auth status.');
            }

            const data = await response.json();
            updateUI(data.authenticated, data);

        } catch (error) {
            console.error('Error checking auth status:', error);
            showMessage('Connection error. Could not check login status.', 'error');
            updateUI(false);
        }
    }

    /**
     * Handles authentication (Login or Register).
     * @param {string} endpoint - '/login' or '/register'.
     * @param {object} credentials - { username, password }.
     */
    async function handleAuth(endpoint, credentials) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                showMessage(data.message, 'success');
                updateUI(true, data);
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            console.error('Auth error:', error);
            showMessage('Network or server error during authentication.', 'error');
        }
    }

    guestLoginButton.addEventListener('click', async (e) => {
        e.preventDefault();
        guestLoginButton.disabled = true;
        guestLoginButton.textContent = 'Creating Guest Account...';

        try {
            const response = await fetch(`${API_BASE_URL}/guest_login`, {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                showMessage(`Welcome! Your guest account (${data.username}) has been created. Your uploads will be saved under this unique ID!`, 'success');
                updateUI(true, data);
            } else {
                showMessage(data.error || 'Failed to create guest account.', 'error');
            }
        } catch (error) {
            console.error('Guest login error:', error);
            showMessage('Network or server error during guest login.', 'error');
        } finally {
            guestLoginButton.disabled = false;
            guestLoginButton.textContent = 'Login as Guest (Saves your images)';
        }
    });


    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        handleAuth('/login', { username, password });
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        handleAuth('/register', { username, password });
    });

    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                showMessage(data.message, 'info');
                updateUI(false);
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            showMessage('Network or server error during logout.', 'error');
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

    /**
     * Validates and previews the selected file.
     * @param {File} file - The file to process.
     */
    function handleFileSelection(file) {
        if (!file) return;

        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            showMessage(`File size exceeds the 10MB limit. Your file is ${Math.round(file.size / 1024 / 1024 * 10) / 10}MB.`, 'error');
            fileInput.value = '';
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
            return;
        }

        const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showMessage('Invalid file type. Only PNG, JPG, GIF, and WEBP are allowed.', 'error');
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

        try {
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                showMessage('Image uploaded successfully!', 'success');
                clearPreviewButton.click();
                showDetailsView(data.details_id);
            } else {
                showMessage(data.error, 'error');
            }

        } catch (error) {
            console.error('Upload error:', error);
            showMessage('Network or server error during upload.', 'error');
        } finally {
            document.getElementById('button-text').textContent = 'Upload Image';
            loadingIndicator.classList.add('hidden');
            submitButton.disabled = false;
        }
    });

    /**
     * Truncates a filename if it's too long, cutting it off at a random-ish point.
     * @param {string} filename - The original filename.
     * @param {number} maxLength - The maximum desired length.
     * @returns {string} The truncated filename.
     */
    function truncateFilename(filename, maxLength = 30) {
        if (filename.length <= maxLength) {
            return filename;
        }

        const extensionMatch = filename.match(/\.([0-9a-z]+)$/i);
        const extension = extensionMatch ? extensionMatch[0] : '';
        const baseName = extensionMatch ? filename.slice(0, -extension.length) : filename;

        const maxBaseLength = maxLength - extension.length - 3;

        if (maxBaseLength <= 0) {
            return filename.substring(0, maxLength - 3) + '...';
        }

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
            const response = await fetch(`${API_BASE_URL}/image/${id}`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                document.getElementById('uploader-view').classList.add('hidden');
                dashboardView.classList.add('hidden');
                detailsView.classList.remove('hidden');

                const uploadDate = new Date(data.upload_date).toLocaleDateString();
                const expiryDate = data.expires_at ? new Date(data.expires_at) : null;

                detailsTitle.textContent = `Image Details: ${truncateFilename(data.filename, 35)}`;

                imagePreview.src = data.url;
                shareLinkInput.value = data.url;

                if (expiryDate) {
                    const now = new Date();
                    const diffTime = expiryDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    if (diffDays <= 3) {
                        expirationText.textContent = `PURGE ALERT! This image will be deleted on ${formattedExpiryDate} (${diffDays} days left).`;
                        expirationInfoBox.classList.remove('hidden');
                    } else {
                        expirationText.textContent = `This image will be deleted on ${formattedExpiryDate} (${diffDays} days left).`;
                        expirationInfoBox.className = 'bg-blue-900/50 border-2 border-blue-500 rounded-lg p-3';
                        expirationText.parentElement.classList.remove('text-red-300');
                        expirationText.parentElement.classList.add('text-blue-300');
                        expirationText.parentElement.querySelector('i').className = 'fa-solid fa-circle-info';

                        expirationInfoBox.classList.remove('hidden');
                    }
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
                backToUploaderButton.click();
            }

        } catch (error) {
            console.error('Details fetch error:', error);
            showMessage('Could not load image details.', 'error');
            backToUploaderButton.click();
        }
    }

    deleteButton.addEventListener('click', async () => {
        if (!currentImageId) return;

        if (!confirm('Are you sure you want to permanently delete this image?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/image/${currentImageId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                showMessage('Image deleted successfully.', 'success');
                backToUploaderButton.click();
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showMessage('Network or server error during deletion.', 'error');
        }
    });

    backToUploaderButton.addEventListener('click', () => {
        currentImageId = null;
        detailsView.classList.add('hidden');
        document.getElementById('uploader-view').classList.remove('hidden');
        dashboardView.classList.remove('hidden');
        expirationInfoBox.classList.add('hidden');
        expirationInfoBox.className = 'bg-red-900/50 border-2 border-red-500 rounded-lg p-3';
        expirationText.parentElement.classList.remove('text-blue-300');
        expirationText.parentElement.classList.add('text-red-300');
        expirationText.parentElement.querySelector('i').className = 'fa-solid fa-triangle-exclamation';

        fetchImages();
    });

    checkAuthStatus();
});

function confirm(message) {
    console.warn(`Confirmation dialog triggered: ${message}. Automatically proceeding.`);
    return true;
}
