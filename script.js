document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = 'http://127.0.0.1:5000';

    const authView = document.getElementById('auth-view');
    const appView = document.getElementById('app-view');
    const messageBox = document.getElementById('message-box');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
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

    const expirationSelect = document.getElementById('expiration-select');

    const detailsView = document.getElementById('details-view');
    const detailsTitle = document.getElementById('details-title');
    const imagePreview = document.getElementById('image-preview');
    const shareLinkInput = document.getElementById('share-link');
    const copyButton = document.getElementById('copy-button');
    const backToUploaderButton = document.getElementById('back-to-uploader-button');

    const dashboardView = document.getElementById('dashboard-view');
    const imageGallery = document.getElementById('image-gallery');
    const noImagesMessage = document.getElementById('no-images-message');

    let dashboardPollTimer = null;

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
     * Handles file selection and updates the preview area.
     * @param {File} file - The file object to process.
     */
    function handleFileSelection(file) {
        if (!file || !file.type.startsWith('image/')) {
            showMessage("Please select a valid image file.", 'error');
            fileInput.value = '';
            return;
        }
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        const reader = new FileReader();
        reader.onload = (e) => {
            filePreview.src = e.target.result;
            dropZone.classList.add('hidden');
            previewZone.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    async function fetchDashboardImages() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/my-images`, {
                credentials: 'include'
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
            imgElement.src = image.url;
            imgElement.alt = image.original_name;
            imgElement.className = 'w-full h-24 object-cover cursor-pointer gallery-image';
            imgElement.title = `Click to view details for ${image.original_name}`;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '×';
            deleteButton.className = 'absolute top-0 right-1 text-white bg-red-600/70 hover:bg-red-700 rounded-full h-6 w-6 flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition-opacity';
            deleteButton.title = 'Delete Image';

            imgElement.addEventListener('click', () => {
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


    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
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

    async function handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
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

    async function handleLogout() {
        if (dashboardPollTimer) {
            clearInterval(dashboardPollTimer);
            dashboardPollTimer = null;
        }

        await fetch(`${API_BASE_URL}/api/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        showView('auth');
        userGreeting.textContent = '';
        loginForm.reset();
        registerForm.reset();
    }

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
        let data;

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            data = await response.json();

            if (data.success) {
                showMessage("Image hosted successfully!", 'success');
                const fullUrl = data.url;
                showDetailsView(fullUrl, "Upload Successful!");
                fetchDashboardImages();
            } else {
                showMessage(`Upload failed: ${data.error}`, 'error');
            }

        } catch (error) {
            showMessage("An error occurred while connecting to the server.", 'error');
            console.error('Fetch error:', error);
            data = { success: false };
        } finally {
            showLoading(false);
            if (data && data.success) {
                fileInput.value = '';
                filePreview.src = '';
                previewZone.classList.add('hidden');
                dropZone.classList.remove('hidden');
                expirationSelect.value = 'never';
            } else {
                resetToMainView();
            }
        }
    }

    async function handleDeleteImage(imageId, elementToRemove) {
        if (!confirm("Are you sure you want to delete this image?")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/delete-image/${imageId}`, {
                method: 'DELETE',
                credentials: 'include'
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

    function initializeApp(username) {
        showView('app');
        userGreeting.textContent = `Hi, ${username}!`;
        resetToMainView();
        fetchDashboardImages();

        if (dashboardPollTimer) {
            clearInterval(dashboardPollTimer);
        }
        dashboardPollTimer = setInterval(fetchDashboardImages, 300000);
    }

    async function checkUserSession() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/session`, {
                credentials: 'include'
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

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutButton.addEventListener('click', handleLogout);
    uploadForm.addEventListener('submit', handleUpload);
    backToUploaderButton.addEventListener('click', resetToMainView);

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