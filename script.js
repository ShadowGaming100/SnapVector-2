document.addEventListener('DOMContentLoaded', () => {

    // FIXED: Use localhost for local development
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:7872'
        : 'https://snapserve-server.sayrz.com';

    const authView = document.getElementById('auth-view');
    const appView = document.getElementById('app-view');
    const messageBox = document.getElementById('message-box');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const guestLoginButton = document.getElementById('guest-login-button');
    const logoutButton = document.getElementById('logout-button');
    const userGreeting = document.getElementById('user-greeting');

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
            
            // FIXED: Clear gallery first
            imageGallery.innerHTML = '';

            if (!images || images.length === 0) {
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
                    
                    // FIXED: Add error handling for images
                    img.onerror = function() {
                        console.error('Failed to load image:', image.url);
                        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23374151" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%239CA3AF" dy=".3em"%3EError%3C/text%3E%3C/svg%3E';
                    };

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
            // FIXED: Don't show the "no images" message on error
            imageGallery.innerHTML = '';
            const errorMsg = document.createElement('p');
            errorMsg.className = 'text-red-400 col-span-full text-center';
            errorMsg.textContent = 'Failed to load images. Please try refreshing.';
            imageGallery.appendChild(errorMsg);
            
            if (error.message.includes('timed out')) {
                showMessage('Could not load images: The server took too long to respond.', 'error');
            } else {
                showMessage('Could not load your images. Check if the server is running.', 'error');
            }
        }
    }

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
            const response = await fetchWithTimeout(`${API_BASE_URL}/auth_status`, {
                credentials: 'include'
            }, 8000); 

            if (!response.ok) {
                throw new Error('Failed to check auth status.');
            }

            const data = await response.json();
            updateUI(data.authenticated, data);

        } catch (error) {
            console.error('Error checking auth status:', error);
            if (error.message.includes('timed out')) {
                showMessage('Server took too long to respond. Please try again.', 'error');
            } else {
                showMessage('Connection error. Make sure the backend server is running.', 'error');
            }
            updateUI(false);
        }
    }

    async function handleAuth(endpoint, credentials) {
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
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
            } else {
                showMessage('Network or server error during authentication.', 'error');
            }
        }
    }

    guestLoginButton.addEventListener('click', async (e) => {
        e.preventDefault();
        guestLoginButton.disabled = true;
        guestLoginButton.textContent = 'Creating Guest Account...';

        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/guest_login`, {
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
            } else {
                showMessage('Network or server error during guest login.', 'error');
            }
        } finally {
            guestLoginButton.disabled = false;
            guestLoginButton.textContent = 'Login as Guest';
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

        const maxSize = 10 * 1024 * 1024; // 10MB
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

        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/upload`, {
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
            } else {
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

    async function showDetailsView(id) {
        currentImageId = id;
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/image/${id}`, {
                credentials: 'include'
            }, 8000); 

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
            if (error.message.includes('timed out')) {
                showMessage('Could not load image details: The request timed out.', 'error');
            } else {
                showMessage('Could not load image details.', 'error');
            }
            backToUploaderButton.click();
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

        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/image/${currentImageId}`, {
                method: 'DELETE',
                credentials: 'include'
            }, 8000); 

            const data = await response.json();

            if (data.success) {
                showMessage('Image deleted successfully.', 'success');
                backToUploaderButton.click();
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
