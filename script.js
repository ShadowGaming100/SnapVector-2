document.addEventListener('DOMContentLoaded', () => {

    // --- NEW: Define your backend server's URL ---
    // Update this to your actual, public backend URL.
    // "http://127.0.0.1:5000" is the default for local testing.
    const API_BASE_URL = 'http://127.0.0.1:5000';

    // --- View Containers ---
    const authView = document.getElementById('auth-view');
    const appView = document.getElementById('app-view');
    const messageBox = document.getElementById('message-box');
    // (all other element selections remain the same)
    // ...
    // --- Auth Elements ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutButton = document.getElementById('logout-button');
    const userGreeting = document.getElementById('user-greeting');

    // --- App Elements ---
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-upload');
    const submitButton = document.getElementById('submit-button');
    const loadingIndicator = document.getElementById('loading-indicator');

    // --- Upload Preview Elements ---
    const dropZone = document.getElementById('drop-zone');
    const previewZone = document.getElementById('preview-zone');
    const filePreview = document.getElementById('file-preview');
    const clearPreviewButton = document.getElementById('clear-preview-button');

    // --- NEW: Expiration Element ---
    const expirationSelect = document.getElementById('expiration-select');

    // --- Details View Elements (was Success View) ---
    const detailsView = document.getElementById('details-view');
    const detailsTitle = document.getElementById('details-title');
    const imagePreview = document.getElementById('image-preview');
    const shareLinkInput = document.getElementById('share-link');
    const copyButton = document.getElementById('copy-button');
    const backToUploaderButton = document.getElementById('back-to-uploader-button');

    // --- Dashboard Elements ---
    const dashboardView = document.getElementById('dashboard-view');
    const imageGallery = document.getElementById('image-gallery');
    const noImagesMessage = document.getElementById('no-images-message');

    // --- NEW: Polling Timer ---
    let dashboardPollTimer = null; // To hold the interval ID

    // =================================================================
    // --- UTILITY FUNCTIONS ---
    // =================================================================

    // (showMessage, showLoading, showView functions are unchanged)
    function showMessage(text, type = 'error') {
        messageBox.textContent = text;
        messageBox.classList.remove('hidden', 'bg-red-200', 'text-red-800', 'bg-green-200', 'text-green-800');
        if (type === 'error') {
            messageBox.classList.add('bg-red-200', 'text-red-800');
        } else {
            messageBox.classList.add('bg-green-200', 'text-green-800');
        }
        setTimeout(() => messageBox.classList.add('hidden'), 5000);
    }

    function showLoading(isLoading) {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
            loadingIndicator.classList.remove('hidden');
        } else {
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
            loadingIndicator.classList.add('hidden');
        }
    }

    function showView(viewName) {
        authView.classList.add('hidden');
        appView.classList.add('hidden');
        messageBox.classList.add('hidden');

        if (viewName === 'auth') {
            authView.classList.remove('hidden');
        } else {
            appView.classList.remove('hidden');
        }
    }

    /**
     * Shows the image details view (for new uploads or existing images).
     * @param {string} url - The full URL of the image to display.
     * @param {string} title - The title for the view (e.g., "Upload Successful!").
     */
    function showDetailsView(url, title = "Image Details") {
        uploadForm.classList.add('hidden');
        dashboardView.classList.add('hidden');
        detailsView.classList.remove('hidden');

        detailsTitle.textContent = title;
        if (title === "Upload Successful!") {
            detailsTitle.classList.add('text-green-400');
            detailsTitle.classList.remove('text-gray-300');
        } else {
            detailsTitle.classList.add('text-gray-300');
            detailsTitle.classList.remove('text-green-400');
        }

        imagePreview.src = url;
        shareLinkInput.value = url;
    }

    // (resetToMainView function is unchanged)
    function resetToMainView() {
        uploadForm.classList.remove('hidden');
        dashboardView.classList.remove('hidden');
        detailsView.classList.add('hidden');
        fileInput.value = '';
        filePreview.src = '';
        previewZone.classList.add('hidden');
        dropZone.classList.remove('hidden');
        expirationSelect.value = 'never';
    }


    /**
     * Fetches and displays all images for the logged-in user.
     */
    async function fetchDashboardImages() {
        try {
            // --- MODIFIED: Use full URL and add credentials ---
            const response = await fetch(`${API_BASE_URL}/api/my-images`, {
                credentials: 'include' // Send session cookie
            });

            if (!response.ok) {
                if (dashboardPollTimer) {
                    clearInterval(dashboardPollTimer);
                    dashboardPollTimer = null;
                }
                showView('auth');
                return;
            }

            const data = await response.json();
            renderImageGallery(data.images);
        } catch (error) {
            console.error('Error fetching images:', error);
            showMessage("Could not load your images.", 'error');
        }
    }

    /**
     * Renders the image gallery from the fetched data.
     * @param {Array<object>} images - List of image objects from the API.
     */
    function renderImageGallery(images) {
        imageGallery.innerHTML = '';
        if (images.length === 0) {
            imageGallery.appendChild(noImagesMessage);
            noImagesMessage.classList.remove('hidden');
            return;
        }
        noImagesMessage.classList.add('hidden');

        images.forEach(image => {
            const container = document.createElement('div');
            container.className = 'relative group border-2 border-gray-700 rounded-lg overflow-hidden shadow-lg';

            const imgElement = document.createElement('img');
            imgElement.src = image.url; // This is now the full URL from the backend
            imgElement.alt = image.original_name;
            imgElement.className = 'w-full h-24 object-cover cursor-pointer gallery-image';
            imgElement.title = `Click to view details for ${image.original_name}`;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '×';
            deleteButton.className = 'absolute top-0 right-1 text-white bg-red-600/70 hover:bg-red-700 rounded-full h-6 w-6 flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition-opacity';
            deleteButton.title = 'Delete Image';

            imgElement.addEventListener('click', () => {
                // --- MODIFIED: The URL is already absolute ---
                const fullUrl = image.url;
                showDetailsView(fullUrl, "Image Details");
            });

            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDeleteImage(image.id, container);
            });

            container.appendChild(imgElement);
            container.appendChild(deleteButton);
            imageGallery.appendChild(container);
        });
    }

    // =================================================================
    // --- API HANDLERS ---
    // =================================================================

    /**
     * Handles the login form submission.
     */
    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            // --- MODIFIED: Use full URL and add credentials ---
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // Send session cookie
            });
            const data = await response.json();

            if (data.success) {
                initializeApp(data.user.username);
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            showMessage("Server connection error.", 'error');
        }
    }

    /**
     * Handles the register form submission.
     */
    async function handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        try {
            // --- MODIFIED: Use full URL and add credentials ---
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // Send session cookie
            });
            const data = await response.json();

            if (data.success) {
                initializeApp(data.user.username);
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            showMessage("Server connection error.", 'error');
        }
    }

    /**
     * Handles the logout button click.
     */
    async function handleLogout() {
        if (dashboardPollTimer) {
            clearInterval(dashboardPollTimer);
            dashboardPollTimer = null;
        }

        // --- MODIFIED: Use full URL and add credentials ---
        await fetch(`${API_BASE_URL}/api/logout`, {
            method: 'POST',
            credentials: 'include' // Send session cookie
        });

        showView('auth');
        userGreeting.textContent = '';
        loginForm.reset();
        registerForm.reset();
    }

    /**
     * Handles the main upload form submission.
     */
    async function handleUpload(e) {
        e.preventDefault();
        const file = fileInput.files[0];
        if (!file) {
            showMessage("Please select a file to upload.", 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('expiration', expirationSelect.value);

        showLoading(true);
        messageBox.classList.add('hidden');
        let data; // Define data here to access in finally block

        try {
            // --- MODIFIED: Use full URL and add credentials ---
            const response = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData,
                credentials: 'include' // Send session cookie
            });

            data = await response.json();

            if (data.success) {
                showMessage("Image hosted successfully!", 'success');

                // --- MODIFIED: The URL is already absolute ---
                const fullUrl = data.url;
                showDetailsView(fullUrl, "Upload Successful!");
                fetchDashboardImages();
            } else {
                showMessage(`Upload failed: ${data.error}`, 'error');
            }

        } catch (error) {
            showMessage("An error occurred while connecting to the server.", 'error');
            console.error('Fetch error:', error);
        } finally {
            showLoading(false);
            if (data && data.success) {
                // --- MODIFIED: The URL is already absolute ---
                const fullUrl = data.url;
                resetToMainView();
                showDetailsView(fullUrl, "Upload Successful!");
            } else {
                resetToMainView(); // Reset form even on failure
            }
        }
    }

    /**
     * Handles the deletion of an image.
     */
    async function handleDeleteImage(imageId, elementToRemove) {
        if (!confirm("Are you sure you want to delete this image?")) {
            return;
        }

        try {
            // --- MODIFIED: Use full URL and add credentials ---
            const response = await fetch(`${API_BASE_URL}/api/delete-image/${imageId}`, {
                method: 'DELETE',
                credentials: 'include' // Send session cookie
            });
            const data = await response.json();

            if (data.success) {
                showMessage("Image deleted.", 'success');
                elementToRemove.remove();
                if (imageGallery.children.length === 0 ||
                    (imageGallery.children.length === 1 && imageGallery.firstElementChild.id === noImagesMessage.id)) {
                    imageGallery.appendChild(noImagesMessage);
                    noImagesMessage.classList.remove('hidden');
                }
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            showMessage("Server error during deletion.", 'error');
        }
    }

    // =================================================================
    // --- INITIALIZATION ---
    // =================================================================

    function initializeApp(username) {
        showView('app');
        userGreeting.textContent = `Hi, ${username}!`;
        resetToMainView();
        fetchDashboardImages();

        if (dashboardPollTimer) {
            clearInterval(dashboardPollTimer);
        }
        // Poll every 5 minutes (300000 milliseconds)
        dashboardPollTimer = setInterval(fetchDashboardImages, 300000);
    }

    async function checkUserSession() {
        try {
            // --- MODIFIED: Use full URL and add credentials ---
            const response = await fetch(`${API_BASE_URL}/api/session`, {
                credentials: 'include' // Send session cookie
            });
            const data = await response.json();
            if (data.success) {
                initializeApp(data.user.username);
            } else {
                showView('auth');
            }
        } catch (error) {
            showView('auth');
        }
    }

    // --- Attach Event Listeners ---
    // (No changes to this section)
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutButton.addEventListener('click', handleLogout);
    uploadForm.addEventListener('submit', handleUpload);
    backToUploaderButton.addEventListener('click', resetToMainView);

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                filePreview.src = e.target.result;
                dropZone.classList.add('hidden');
                previewZone.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    clearPreviewButton.addEventListener('click', () => {
        fileInput.value = '';
        filePreview.src = '';
        previewZone.classList.add('hidden');
        dropZone.classList.remove('hidden');
    });

    copyButton.addEventListener('click', () => {
        shareLinkInput.select();
        try {
            document.execCommand('copy');
            copyButton.textContent = 'Copied!';
            setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);
        } catch (err) {
            showMessage("Could not copy link automatically.", 'error');
        }
    });

    checkUserSession();
});