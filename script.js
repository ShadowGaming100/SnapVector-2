document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://snapvector.pulledtheirlife.support';

    let currentUser = {
        username: null,
        is_guest: false,
        role: 'user',
        is_admin: false
    };

    // Get all DOM elements
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
    const previewContainer = document.getElementById('preview-media-container');
    const clearPreviewButton = document.getElementById('clear-preview-button');
    const multiPreviewContainer = document.getElementById('multi-preview-container');
    const uploadQueue = document.getElementById('upload-queue');
    const queueItems = document.getElementById('queue-items');
    const cancelAllButton = document.getElementById('cancel-all-uploads');
    const fileCountSpan = document.getElementById('file-count');
    const queueStats = document.getElementById('queue-stats');
    const detailsTitle = document.getElementById('details-title');
    const shareLinkInput = document.getElementById('share-link');
    const copyButton = document.getElementById('copy-button');
    const backToUploaderButton = document.getElementById('back-to-uploader-button');
    const deleteButton = document.getElementById('delete-button');
    const expirationInfoBox = document.getElementById('expiration-info');
    const expirationText = document.getElementById('expiration-text').querySelector('span');
    const imageGallery = document.getElementById('image-gallery');
    const noFilesMessage = document.getElementById('no-images-message');
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
    const statusIndicator = document.getElementById('status-indicator');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const statusModal = document.getElementById('status-modal');
    const closeStatusModal = document.getElementById('close-status-modal');
    const apiStatus = document.getElementById('api-status');
    const statusMessage = document.getElementById('status-message');
    const lastCheckTime = document.getElementById('last-check-time');
    const tosModal = document.getElementById('tos-modal');
    const closeTosModal = document.getElementById('close-tos-modal');
    const acceptTosBtn = document.getElementById('accept-tos');
    const tosPopupCheckbox = document.getElementById('tos-popup-checkbox');
    const videoPlayerContainer = document.getElementById('video-player-container');
    const customVideoPlayer = document.getElementById('custom-video-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const progressBar = document.querySelector('.progress-bar');
    const progressFill = document.querySelector('.progress-fill');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const muteBtn = document.getElementById('mute-btn');
    const volumeSlider = document.querySelector('.volume-slider');
    const volumeFill = document.querySelector('.volume-fill');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const imagePreview = document.getElementById('image-preview');
    
    // State variables
    let currentImageId = null;
    let pendingRegistration = null;
    let tosAcceptAllowed = false;
    let tosTimer = null;
    let statusCheckInterval = null;
    let announcementInterval = null;
    
    // Upload queue state - MODIFIED
    let uploadQueueState = [];
    let isUploading = false;
    let hasSubmitted = false; // NEW: Track if user has submitted
    let currentUploadIndex = 0;
    let uploadsCompleted = 0;
    let uploadsFailed = 0;
    
    // Video player state
    let isVideoPlaying = false;
    let isVideoMuted = false;
    let videoVolume = 1;

    // Show message function
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

    // View management
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
        clearPreview();
        resetUploadQueue();
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
        clearPreview();
    }

    // File handling
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    const MAX_IMAGE_SIZE_MB = 10;
    const MAX_VIDEO_SIZE_MB = 50;
    const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'];
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/mkv', 'video/flv', 'video/quicktime'];
    const MAX_FILES = 10;

    function isImage(fileType) {
        return ALLOWED_IMAGE_TYPES.includes(fileType);
    }

    function isVideo(fileType) {
        return ALLOWED_VIDEO_TYPES.includes(fileType) || fileType.startsWith('video/');
    }

    function clearPreview() {
        fileInput.value = '';
        const mediaElement = previewContainer.querySelector('img, video');
        if (mediaElement) {
            mediaElement.remove();
        }
        previewZone.classList.add('hidden');
        dropZone.classList.remove('hidden');
        multiPreviewContainer.innerHTML = '';
        multiPreviewContainer.classList.add('hidden');
        
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        fileCountSpan.textContent = '0';
    }

    function resetUploadQueue() {
        uploadQueueState = [];
        isUploading = false;
        hasSubmitted = false; // Reset submission flag
        currentUploadIndex = 0;
        uploadsCompleted = 0;
        uploadsFailed = 0;
        queueItems.innerHTML = '';
        uploadQueue.classList.add('hidden');
        updateQueueStats();
        fileCountSpan.textContent = '0';
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        document.getElementById('button-text').textContent = 'Upload Files';
    }

    function updateQueueStats() {
        const total = uploadQueueState.length;
        const completed = uploadQueueState.filter(item => item.status === 'completed').length;
        const failed = uploadQueueState.filter(item => item.status === 'failed').length;
        
        queueStats.textContent = `${completed}/${total} files uploaded (${failed} failed)`;
        
        if (total > 0 && total === completed && !isUploading) {
            showMessage(`All files uploaded successfully! ${failed > 0 ? `${failed} failed.` : ''}`, 'success');
            // Reset everything after a delay so user can see the success
            setTimeout(() => {
                resetUploadQueue();
                clearPreview();
            }, 3000);
        }
    }

    function createUploadQueueItem(file, index) {
        const item = document.createElement('div');
        item.className = 'upload-item';
        item.id = `upload-item-${index}`;
        item.innerHTML = `
            <div class="upload-item-info">
                <div class="upload-filename">${file.name}</div>
                <div class="upload-progress-container">
                    <div class="upload-progress-bar" id="progress-${index}"></div>
                </div>
                <div class="upload-status" id="status-${index}">Pending...</div>
            </div>
            <button class="upload-cancel" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        return item;
    }

    function updateUploadProgress(index, percentage, status) {
        const progressBar = document.getElementById(`progress-${index}`);
        const statusEl = document.getElementById(`status-${index}`);
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        if (statusEl) {
            statusEl.textContent = status;
            if (status.includes('Failed')) {
                statusEl.style.color = '#ef4444';
            } else if (status.includes('Completed')) {
                statusEl.style.color = '#10b981';
            }
        }
    }

    // Handle multiple file selection - FIXED: Keep drop zone visible and allow adding more
    function handleMultipleFiles(files) {
        if (files.length === 0) return;
        
        // Don't allow adding more files if already submitted
        if (hasSubmitted) {
            showMessage('Please wait for current uploads to complete or cancel them first.', 'error');
            return;
        }
        
        // Calculate how many more files we can add
        const availableSlots = MAX_FILES - uploadQueueState.length;
        if (availableSlots <= 0) {
            showMessage(`Maximum ${MAX_FILES} files allowed. Remove some files first.`, 'error');
            return;
        }
        
        const filesToAdd = Array.from(files).slice(0, availableSlots);
        
        // Add files to queue
        filesToAdd.forEach((file, relativeIndex) => {
            const isFileTypeImage = isImage(file.type);
            const isFileTypeVideo = isVideo(file.type);
            let maxSize = 0;
            let fileTypeLabel = '';

            if (isFileTypeImage) {
                maxSize = MAX_IMAGE_SIZE_MB * 1024 * 1024;
                fileTypeLabel = 'Image';
            } else if (isFileTypeVideo) {
                maxSize = MAX_VIDEO_SIZE_MB * 1024 * 1024;
                fileTypeLabel = 'Video';
            } else {
                showMessage(`File "${file.name}" has invalid type. Skipped.`, 'error');
                return;
            }

            if (file.size > maxSize) {
                showMessage(`File "${file.name}" exceeds size limit for ${fileTypeLabel}. Skipped.`, 'error');
                return;
            }

            // Add to upload queue
            const index = uploadQueueState.length;
            uploadQueueState.push({
                file,
                index,
                status: 'pending',
                progress: 0
            });

            // Create preview thumbnail
            const previewItem = document.createElement('div');
            previewItem.className = 'multi-preview-item';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                if (isFileTypeImage) {
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="${file.name}">
                        <button class="multi-preview-remove" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                } else if (isFileTypeVideo) {
                    previewItem.innerHTML = `
                        <video src="${e.target.result}" muted></video>
                        <button class="multi-preview-remove" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                }
                
                // Add remove button event
                previewItem.querySelector('.multi-preview-remove').addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeFileFromQueue(index);
                });
            };
            reader.readAsDataURL(file);
            
            multiPreviewContainer.appendChild(previewItem);
        });

        // Update UI - KEEP DROP ZONE VISIBLE
        multiPreviewContainer.classList.remove('hidden');
        dropZone.classList.remove('hidden'); // Keep drop zone visible
        
        // Update button and queue
        fileCountSpan.textContent = uploadQueueState.length;
        submitButton.disabled = uploadQueueState.length === 0;
        submitButton.classList.toggle('opacity-50', uploadQueueState.length === 0);
        submitButton.classList.toggle('cursor-not-allowed', uploadQueueState.length === 0);
        
        if (uploadQueueState.length > 0) {
            uploadQueue.classList.remove('hidden');
            queueItems.innerHTML = '';
            uploadQueueState.forEach((item, index) => {
                queueItems.appendChild(createUploadQueueItem(item.file, index));
            });
            
            // Add cancel button events
            document.querySelectorAll('.upload-cancel').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.currentTarget.dataset.index);
                    removeFileFromQueue(index);
                });
            });
            
            updateQueueStats();
        }
    }

    function removeFileFromQueue(index) {
        // Remove from state
        uploadQueueState = uploadQueueState.filter((item, i) => i !== index);
        
        // Re-index remaining items
        uploadQueueState.forEach((item, i) => {
            item.index = i;
        });
        
        // Update UI
        fileCountSpan.textContent = uploadQueueState.length;
        submitButton.disabled = uploadQueueState.length === 0;
        submitButton.classList.toggle('opacity-50', uploadQueueState.length === 0);
        submitButton.classList.toggle('cursor-not-allowed', uploadQueueState.length === 0);
        
        // Re-render previews
        multiPreviewContainer.innerHTML = '';
        uploadQueueState.forEach((item, i) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'multi-preview-item';
                
                if (isImage(item.file.type)) {
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="${item.file.name}">
                        <button class="multi-preview-remove" data-index="${i}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                } else if (isVideo(item.file.type)) {
                    previewItem.innerHTML = `
                        <video src="${e.target.result}" muted></video>
                        <button class="multi-preview-remove" data-index="${i}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                }
                
                previewItem.querySelector('.multi-preview-remove').addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeFileFromQueue(i);
                });
                
                multiPreviewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(item.file);
        });
        
        // Update queue items
        queueItems.innerHTML = '';
        uploadQueueState.forEach((item, i) => {
            queueItems.appendChild(createUploadQueueItem(item.file, i));
        });
        
        // Re-add cancel events
        document.querySelectorAll('.upload-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                removeFileFromQueue(index);
            });
        });
        
        updateQueueStats();
        
        if (uploadQueueState.length === 0) {
            uploadQueue.classList.add('hidden');
            multiPreviewContainer.classList.add('hidden');
            dropZone.classList.remove('hidden');
        }
    }

    // Process upload queue - MODIFIED to disable adding more files
    async function processUploadQueue() {
        if (isUploading || uploadQueueState.length === 0) return;
        
        // Set submission flag to prevent adding more files
        hasSubmitted = true;
        isUploading = true;
        
        // Disable drop zone and file input
        dropZone.style.opacity = '0.5';
        dropZone.style.cursor = 'not-allowed';
        dropZone.querySelector('input').disabled = true;
        
        submitButton.disabled = true;
        document.getElementById('button-text').textContent = 'Uploading...';
        loadingIndicator.classList.remove('hidden');
        
        // Rate limiting: 5 files per minute
        const UPLOAD_LIMIT = 5;
        const TIME_WINDOW = 60000; // 1 minute
        
        for (let i = 0; i < uploadQueueState.length; i++) {
            if (uploadQueueState[i].status !== 'pending') continue;
            
            currentUploadIndex = i;
            uploadQueueState[i].status = 'uploading';
            
            // Check rate limit
            const recentUploads = uploadQueueState.filter(item => 
                item.status === 'completed' || item.status === 'failed'
            ).length;
            
            if (recentUploads >= UPLOAD_LIMIT) {
                showMessage('Upload limit reached. Please wait 1 minute before uploading more files.', 'info');
                break;
            }
            
            await uploadFile(uploadQueueState[i].file, i);
            
            // Small delay between uploads
            if (i < uploadQueueState.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Re-enable drop zone and file input when done
        isUploading = false;
        dropZone.style.opacity = '1';
        dropZone.style.cursor = 'pointer';
        dropZone.querySelector('input').disabled = false;
        
        submitButton.disabled = false;
        document.getElementById('button-text').textContent = `Upload Files (<span id="file-count">0</span>)`;
        loadingIndicator.classList.add('hidden');
    }

    async function uploadFile(file, index) {
        updateUploadProgress(index, 0, 'Uploading...');
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                uploadQueueState[index].status = 'completed';
                uploadsCompleted++;
                updateUploadProgress(index, 100, 'Completed');
                
                if (uploadsCompleted === 1) {
                    // Show details of first successful upload
                    showDetailsView(data.details_id);
                }
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            uploadQueueState[index].status = 'failed';
            uploadsFailed++;
            updateUploadProgress(index, 0, 'Failed - ' + (error.message || 'Unknown error'));
        }
        
        updateQueueStats();
    }

    // Video player functionality
    function initializeVideoPlayer(videoUrl) {
        if (!customVideoPlayer) return;
        
        customVideoPlayer.src = videoUrl;
        videoPlayerContainer.classList.remove('hidden');
        imagePreview.classList.add('hidden');
        
        // Reset video player
        customVideoPlayer.currentTime = 0;
        isVideoPlaying = false;
        updatePlayPauseButton();
        
        // Set up event listeners
        customVideoPlayer.addEventListener('loadedmetadata', () => {
            durationEl.textContent = formatTime(customVideoPlayer.duration);
        });
        
        customVideoPlayer.addEventListener('timeupdate', () => {
            const currentTime = customVideoPlayer.currentTime;
            const duration = customVideoPlayer.duration;
            const progress = (currentTime / duration) * 100;
            
            currentTimeEl.textContent = formatTime(currentTime);
            progressFill.style.width = `${progress}%`;
        });
        
        customVideoPlayer.addEventListener('ended', () => {
            isVideoPlaying = false;
            updatePlayPauseButton();
        });
        
        // Set initial volume
        customVideoPlayer.volume = videoVolume;
        customVideoPlayer.muted = isVideoMuted;
        updateVolumeUI();
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function updatePlayPauseButton() {
        if (playPauseBtn) {
            playPauseBtn.innerHTML = isVideoPlaying ? 
                '<i class="fas fa-pause"></i>' : 
                '<i class="fas fa-play"></i>';
        }
    }

    function updateVolumeUI() {
        if (muteBtn) {
            muteBtn.innerHTML = isVideoMuted ? 
                '<i class="fas fa-volume-mute"></i>' : 
                '<i class="fas fa-volume-up"></i>';
        }
        if (volumeFill) {
            volumeFill.style.width = `${videoVolume * 100}%`;
        }
    }

    // Image gallery functions
    async function fetchImages() {
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/images`, {
                credentials: 'include'
            }, 8000);

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn('Unauthorized access while fetching images.');
                    throw new Error('Unauthorized');
                }
                throw new Error('Failed to fetch images.');
            }

            const images = await response.json();
            imageGallery.innerHTML = '';

            if (images.length === 0) {
                noFilesMessage.classList.remove('hidden');
                noFilesMessage.textContent = "You haven't uploaded any files yet.";
            } else {
                noFilesMessage.classList.add('hidden');
                images.forEach(image => {
                    const expiryClass = image.is_expiring_soon ? 'border-2 border-red-500 expiring-glow' : 'border-gray-600';
                    const item = document.createElement('div');
                    item.className = `relative group rounded-lg overflow-hidden border ${expiryClass} bg-gray-700 shadow-xl cursor-pointer gallery-image`;
                    item.setAttribute('data-image-id', image.id);

                    const fileExtension = image.filename.split('.').pop().toLowerCase();
                    const isVideoFile = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'quicktime'].includes(fileExtension);

                    let mediaHtml;
                    if (isVideoFile) {
                        mediaHtml = `<video src="${image.url}" class="w-full aspect-video object-cover" loop muted></video>`;
                    } else {
                        mediaHtml = `<img src="${image.url}" alt="Uploaded on ${new Date(image.upload_date).toLocaleDateString()}" class="w-full h-32 object-cover">`;
                    }

                    const overlay = document.createElement('div');
                    overlay.className = 'absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300';
                    const viewButton = document.createElement('span');
                    viewButton.textContent = 'View Details';
                    viewButton.className = 'text-white text-sm font-bold p-2 bg-indigo-600 rounded-lg';
                    overlay.appendChild(viewButton);

                    item.innerHTML = mediaHtml;
                    item.appendChild(overlay);

                    imageGallery.appendChild(item);
                    item.addEventListener('click', () => showDetailsView(image.id));
                });
            }
        } catch (error) {
            console.error('Error fetching images:', error);
            if (error.message.includes('timed out')) {
                showMessage('Could not load images: The server took too long to respond.', 'error');
            } else if (error.message === 'Unauthorized') {
                console.log("Session not fully ready yet, or images restricted.");
            } else {
                showMessage('Could not load your files.', 'error');
            }
        }
    }

    // Announcements function
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
                            <p class="text-sm whitespace-pre-wrap">${latestAnnouncement.message}</p>
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

    // Sessions function
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

    // Show details view
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
                detailsTitle.textContent = `File Details: ${truncateFilename(data.filename, 35)}`;
                shareLinkInput.value = data.url;

                const fileExtension = data.filename.split('.').pop().toLowerCase();
                const isVideoFile = ALLOWED_VIDEO_TYPES.some(type => type.endsWith(fileExtension));

                if (isVideoFile) {
                    // Show video player
                    initializeVideoPlayer(data.url);
                } else {
                    // Show image
                    videoPlayerContainer.classList.add('hidden');
                    imagePreview.classList.remove('hidden');
                    imagePreview.src = data.url;
                }

                if (expiryDate) {
                    const now = new Date();
                    const diffTime = expiryDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    });
                    if (diffDays <= 3) {
                        expirationText.textContent = `PURGE ALERT! This file will be deleted on ${formattedExpiryDate} (${diffDays} days left).`;
                        expirationInfoBox.className = 'bg-red-900/50 border-2 border-red-500 rounded-lg p-3';
                        expirationText.parentElement.classList.remove('text-blue-300');
                        expirationText.parentElement.classList.add('text-red-300');
                        expirationText.parentElement.querySelector('i').className = 'fa-solid fa-triangle-exclamation';
                    } else {
                        expirationText.textContent = `This file will be deleted on ${formattedExpiryDate} (${diffDays} days left).`;
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
                    deleteButton.innerHTML = `<i class="fa-solid fa-trash"></i> <span>Delete File</span>`;
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
            showMessage('Could not load file details.', 'error');
            showDashboardView();
        }
    }

    function truncateFilename(filename, maxLength = 30) {
        if (filename.length <= maxLength) return filename;
        const extensionMatch = filename.match(/\.([0-9a-z]+)$/i);
        const extension = extensionMatch ? extensionMatch[0] : '';
        const baseName = extensionMatch ? filename.slice(0, -extension.length) : filename;
        const maxBaseLength = maxLength - extension.length - 3;
        if (maxBaseLength <= 0) return filename.substring(0, maxLength - 3) + '...';
        const cutoff = Math.floor(maxBaseLength * 0.6);
        return baseName.substring(0, cutoff) + '...' + extension;
    }

    // Authentication functions
    function updateUI(isAuthenticated, userData = null) {
        if (isAuthenticated && userData) {
            currentUser = { ...userData };

            showView('dashboard');
            fetchImages();

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
            updateUI(false);
        }
    }

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

    // TOS Modal functions
    function initializeTosModal() {
        if (tosPopupCheckbox) {
            tosPopupCheckbox.checked = false;
            tosPopupCheckbox.disabled = false;
        }
        
        acceptTosBtn.disabled = true;
        tosAcceptAllowed = false;
        
        if (tosTimer) {
            clearTimeout(tosTimer);
        }
        
        tosTimer = setTimeout(() => {
            tosAcceptAllowed = true;
            if (tosPopupCheckbox && tosPopupCheckbox.checked) {
                acceptTosBtn.disabled = false;
            }
        }, 15000);
    }

    // ========== EVENT LISTENERS ==========

    // TOS Modal events
    tosPopupCheckbox.addEventListener('change', () => {
        if (tosAcceptAllowed && tosPopupCheckbox.checked) {
            acceptTosBtn.disabled = false;
        } else {
            acceptTosBtn.disabled = true;
        }
    });

    acceptTosBtn.addEventListener('click', () => {
        localStorage.setItem('tosAccepted', 'true');
        tosModal.classList.add('hidden');
        
        if (tosTimer) {
            clearTimeout(tosTimer);
            tosTimer = null;
        }
        
        if (pendingRegistration) {
            const { username, password } = pendingRegistration;
            handleAuth('/register', { username, password });
            pendingRegistration = null;
        }
    });

    closeTosModal.addEventListener('click', () => {
        tosModal.classList.add('hidden');
        if (tosTimer) {
            clearTimeout(tosTimer);
            tosTimer = null;
        }
        pendingRegistration = null;
    });

    tosModal.addEventListener('click', (e) => {
        if (e.target === tosModal) {
            tosModal.classList.add('hidden');
            if (tosTimer) {
                clearTimeout(tosTimer);
                tosTimer = null;
            }
            pendingRegistration = null;
        }
    });

    // Auth events
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
            showMessage('Network or server error during guest login.', 'error');
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
        
        if (!username || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        pendingRegistration = { username, password };
        tosModal.classList.remove('hidden');
        initializeTosModal();
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
            showMessage('Network or server error during logout.', 'error');
        }
    });

    // Navigation events
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

    // Password visibility toggle
    toggleLoginPassword.addEventListener('click', () => {
        const icon = toggleLoginPassword.querySelector('i');
        if (loginPasswordInput.type === 'password') {
            loginPasswordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            loginPasswordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    toggleRegisterPassword.addEventListener('click', () => {
        const icon = toggleRegisterPassword.querySelector('i');
        if (registerPasswordInput.type === 'password') {
            registerPasswordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            registerPasswordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // File upload events - FIXED
    fileInput.addEventListener('change', (e) => {
        handleMultipleFiles(e.target.files);
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
            handleMultipleFiles(dt.files);
        }
    });

    // Upload form submit - FIXED
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (uploadQueueState.length === 0) return;
        
        // Don't allow multiple submissions
        if (hasSubmitted) {
            showMessage('Upload already in progress. Please wait.', 'error');
            return;
        }
        
        processUploadQueue();
    });

    cancelAllButton.addEventListener('click', () => {
        if (confirm('Cancel all uploads?')) {
            resetUploadQueue();
            clearPreview();
        }
    });

    // Clear preview button
    if (clearPreviewButton) {
        clearPreviewButton.addEventListener('click', clearPreview);
    }

    // Video player controls with improved fullscreen
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (customVideoPlayer.paused) {
                customVideoPlayer.play();
                isVideoPlaying = true;
            } else {
                customVideoPlayer.pause();
                isVideoPlaying = false;
            }
            updatePlayPauseButton();
        });
    }

    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            isVideoMuted = !isVideoMuted;
            customVideoPlayer.muted = isVideoMuted;
            updateVolumeUI();
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('click', (e) => {
            const rect = volumeSlider.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            videoVolume = Math.max(0, Math.min(1, clickX / width));
            customVideoPlayer.volume = videoVolume;
            updateVolumeUI();
        });
    }

    // Fixed fullscreen implementation
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                videoPlayerContainer.requestFullscreen().catch(err => {
                    console.error('Error attempting to enable fullscreen:', err);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement === videoPlayerContainer) {
            videoPlayerContainer.classList.add('fullscreen-active');
        } else {
            videoPlayerContainer.classList.remove('fullscreen-active');
        }
    });

    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const percent = clickX / width;
            customVideoPlayer.currentTime = percent * customVideoPlayer.duration;
        });
    }

    // Copy button
    copyButton.addEventListener('click', () => {
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
                    fallbackCopy();
                });
        } else {
            fallbackCopy();
        }
    });

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

    // Delete button
    deleteButton.addEventListener('click', async () => {
        if (!currentImageId) return;
        if (!showConfirm(`Are you sure you want to delete this file? This cannot be undone.`)) {
            return;
        }
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/image/${currentImageId}`, {
                method: 'DELETE',
                credentials: 'include'
            }, 8000);
            const data = await response.json();
            if (data.success) {
                showMessage('File deleted successfully.', 'success');
                showDashboardView();
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showMessage('Network or server error during deletion.', 'error');
        }
    });

    // Social sharing
    document.getElementById('twitter-share-button').addEventListener('click', () => {
        const url = encodeURIComponent(shareLinkInput.value);
        const text = encodeURIComponent("Check out this file I uploaded on SnapVector!");
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
    });

    document.getElementById('facebook-share-button').addEventListener('click', () => {
        const url = encodeURIComponent(shareLinkInput.value);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
    });

    document.getElementById('instagram-share-button').addEventListener('click', () => {
        showMessage('Open Instagram and create a new post. The file URL has been copied to your clipboard!', 'info');
        navigator.clipboard.writeText(shareLinkInput.value);
    });

    // Navigation buttons
    backToUploaderButton.addEventListener('click', showDashboardView);
    homeButton.addEventListener('click', showDashboardView);
    backToDashboardButton.addEventListener('click', showDashboardView);
    accountButton.addEventListener('click', showAccountView);

    // Account forms
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

        let confirmMessage = "Are you sure you want to delete your account? This is permanent and all your files will be lost.";
        if (currentUser.is_guest) {
            confirmMessage = "Are you sure you want to delete this guest account? All your files will be lost.";
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

    // Initialize the app
    checkAuthStatus();
});