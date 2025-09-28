class NexoraXChat {
    constructor() {
        // Migrate old NovaX localStorage keys to NexoraX keys (one-time migration)
        this.migrateLocalStorageKeys();
        
        this.currentChatId = null;
        this.chats = JSON.parse(localStorage.getItem('nexorax_chats') || '{}');
        // API calls now go through server-side proxy - no client-side key needed
        this.isDarkMode = localStorage.getItem('nexorax_dark_mode') === 'true';
        this.currentRating = 0;
        // Model selection: nexorax1 (Gemini) or nexorax2 (Search)
        this.selectedModel = localStorage.getItem('nexorax_selected_model') || 'nexorax1';
        localStorage.setItem('nexorax_selected_model', this.selectedModel);
        this.selectedFiles = new Map(); // Store selected files with their data
        
        // Speech recognition setup
        this.speechRecognition = null;
        this.isRecording = false;
        this.currentActiveInput = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSpeechRecognition();
        this.loadTheme();
        this.loadModelSelection();
        this.initializeDesktopSidebar();
        this.renderChatList();
    }
    
    migrateLocalStorageKeys() {
        // One-time migration from NovaX to NexoraX localStorage keys
        const migrations = [
            ['novax_chats', 'nexorax_chats'],
            ['novax_dark_mode', 'nexorax_dark_mode'],
            ['novax_selected_model', 'nexorax_selected_model'],
            ['novax_feedbacks', 'nexorax_feedbacks']
        ];
        
        migrations.forEach(([oldKey, newKey]) => {
            const oldValue = localStorage.getItem(oldKey);
            if (oldValue !== null && localStorage.getItem(newKey) === null) {
                localStorage.setItem(newKey, oldValue);
                localStorage.removeItem(oldKey);
            }
        });
    }
    
    initializeElements() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.homeScreen = document.getElementById('homeScreen');
        this.chatScreen = document.getElementById('chatScreen');
        this.homeInput = document.getElementById('homeInput');
        this.chatInput = document.getElementById('chatInput');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.chatList = document.getElementById('chatList');
        this.themeToggle = document.getElementById('themeToggle');
        this.settingsModal = document.getElementById('settingsModal');
        this.aboutModal = document.getElementById('aboutModal');
        this.clearAllModal = document.getElementById('clearAllModal');
        this.feedbackModal = document.getElementById('feedbackModal');
        // Search removed
        
        // Scroll buttons removed
        
        // Model selector elements
        this.homeModelSelector = document.getElementById('homeModelSelector');
        this.chatModelSelector = document.getElementById('chatModelSelector');
    }
    
    setupEventListeners() {
        // Sidebar toggle mobile
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        // Sidebar toggle desktop
        const desktopToggle = document.getElementById('desktopSidebarToggle');
        if (desktopToggle) {
            desktopToggle.addEventListener('click', () => this.toggleDesktopSidebar());
        }
        
        // Close sidebar button (works for both mobile and desktop)
        const closeSidebar = document.getElementById('closeSidebar');
        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => this.closeSidebar());
        }
        
        // Home input with better mobile support
        if (this.homeInput) {
            // Handle Enter key
            this.homeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && this.homeInput.value.trim()) {
                    e.preventDefault();
                    this.startNewChat(this.homeInput.value.trim());
                }
            });
            
            // Improve mobile keyboard behavior
            this.homeInput.addEventListener('focus', () => {
                // Small delay to ensure keyboard is shown
                setTimeout(() => {
                    this.homeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        }
        
        const homeSendBtn = document.getElementById('homeSendBtn');
        if (homeSendBtn) {
            // Add both click and touch events for better mobile support
            const handleHomeSend = () => {
                if (this.homeInput && this.homeInput.value.trim()) {
                    this.startNewChat(this.homeInput.value.trim());
                }
            };
            
            homeSendBtn.addEventListener('click', handleHomeSend);
            homeSendBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleHomeSend();
            });
        }
        
        // Chat input with better mobile support
        if (this.chatInput) {
            // Handle Enter key
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && this.chatInput.value.trim()) {
                    e.preventDefault();
                    this.sendMessage(this.chatInput.value.trim());
                }
            });
            
            // Improve mobile keyboard behavior
            this.chatInput.addEventListener('focus', () => {
                // Small delay to ensure keyboard is shown
                setTimeout(() => {
                    this.chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
            
            // Handle mobile keyboard hide/show
            this.chatInput.addEventListener('blur', () => {
                // Restore scroll position when keyboard hides
                setTimeout(() => {
                    if (this.messagesContainer) {
                        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
                    }
                }, 100);
            });
        }
        
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            // Add both click and touch events for better mobile support
            const handleSend = () => {
                if (this.chatInput && (this.chatInput.value.trim() || this.selectedFiles.size > 0)) {
                    this.sendMessage(this.chatInput.value.trim());
                }
            };
            
            sendBtn.addEventListener('click', handleSend);
            sendBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleSend();
            });
        }
        
        // New chat button
        document.getElementById('newChatBtn').addEventListener('click', () => {
            this.showHomeScreen();
            this.closeSidebar();
        });
        
        // Theme toggle
        this.themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleTheme();
        });
        
        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('cancelSettings').addEventListener('click', () => this.hideSettings());
        
        // About
        document.getElementById('aboutBtn').addEventListener('click', () => this.showAbout());
        document.getElementById('closeAbout').addEventListener('click', () => this.hideAbout());
        document.getElementById('goToSettingsBtn').addEventListener('click', () => {
            this.hideAbout();
            setTimeout(() => this.showSettings(), 300);
        });
        
        // Clear All
        document.getElementById('clearAllBtn').addEventListener('click', () => this.showClearAllConfirmation());
        document.getElementById('cancelClearAll').addEventListener('click', () => this.hideClearAllConfirmation());
        document.getElementById('confirmClearAll').addEventListener('click', () => this.clearAllChats());
        
        // Feedback
        const feedbackBtn = document.getElementById('feedbackBtn');
        if (feedbackBtn) {
            feedbackBtn.addEventListener('click', () => this.showFeedback());
        }
        const cancelFeedback = document.getElementById('cancelFeedback');
        if (cancelFeedback) {
            cancelFeedback.addEventListener('click', () => this.hideFeedback());
        }
        const submitFeedback = document.getElementById('submitFeedback');
        if (submitFeedback) {
            submitFeedback.addEventListener('click', () => this.submitFeedback());
        }
        
        // Star rating
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => this.setRating(parseInt(e.target.dataset.rating)));
            star.addEventListener('mouseenter', (e) => this.highlightStars(parseInt(e.target.dataset.rating)));
        });
        
        const starRating = document.getElementById('starRating');
        if (starRating) {
            starRating.addEventListener('mouseleave', () => this.resetStarHighlight());
        }
        
        // Model selection
        document.querySelectorAll('input[name="aiModel"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.changeModel(e.target.value));
        });
        
        // Model toggle (collapsible)
        const modelToggle = document.getElementById('modelToggle');
        if (modelToggle) {
            modelToggle.addEventListener('click', () => this.toggleModelOptions());
        }
        
        // Search removed
        
        // Scroll buttons removed
        
        // File upload event listeners
        this.setupFileUploadListeners();
        
        // Voice recording event listeners
        this.setupVoiceRecordingListeners();
        
        // Quick suggestions
        document.querySelectorAll('.quick-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', (e) => {
                const text = e.currentTarget.querySelector('span').textContent;
                if (text === 'Hỏi về kiến thức') {
                    this.homeInput.value = 'Bạn có thể giải thích cho tôi về ';
                } else if (text === 'Hỗ trợ lập trình') {
                    this.homeInput.value = 'Giúp tôi viết code ';
                }
                this.homeInput.focus();
                // Move cursor to end
                const len = this.homeInput.value.length;
                this.homeInput.setSelectionRange(len, len);
            });
        });
        
        // Quick model selector buttons
        const homeQuickModelBtn = document.getElementById('homeQuickModelBtn');
        if (homeQuickModelBtn) {
            homeQuickModelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleQuickModelDropdown('home');
            });
        }
        
        // Model selector event listeners
        if (this.homeModelSelector) {
            this.homeModelSelector.addEventListener('change', (e) => {
                this.changeModel(e.target.value);
            });
        }
        
        if (this.chatModelSelector) {
            this.chatModelSelector.addEventListener('change', (e) => {
                this.changeModel(e.target.value);
            });
        }
        
        // Quick model options
        document.querySelectorAll('.quick-model-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const model = e.currentTarget.getAttribute('data-model');
                this.selectQuickModel(model);
            });
        });
        
        // Close sidebar and dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            // Close quick model dropdowns
            const homeDropdown = document.getElementById('homeQuickModelDropdown');
            const chatDropdown = document.getElementById('chatQuickModelDropdown');
            const homeBtn = document.getElementById('homeQuickModelBtn');
            const chatBtn = document.getElementById('quickModelBtn');
            
            if (homeDropdown && !homeDropdown.contains(e.target) && 
                homeBtn && !homeBtn.contains(e.target)) {
                homeDropdown.classList.add('hidden');
            }
            
            if (chatDropdown && !chatDropdown.contains(e.target) && 
                chatBtn && !chatBtn.contains(e.target)) {
                chatDropdown.classList.add('hidden');
            }
            
            // Close sidebar on mobile
            if (window.innerWidth < 1024 && 
                this.sidebar && !this.sidebar.contains(e.target) && 
                this.sidebarToggle && !this.sidebarToggle.contains(e.target) &&
                (!this.settingsModal || !this.settingsModal.contains(e.target)) &&
                (!this.aboutModal || !this.aboutModal.contains(e.target)) &&
                (!this.clearAllModal || !this.clearAllModal.contains(e.target)) &&
                (!this.feedbackModal || !this.feedbackModal.contains(e.target)) &&
                (!this.filePreviewModal || !this.filePreviewModal.contains(e.target))) {
                this.closeSidebar();
            }
        });
    }
    
    setupFileUploadListeners() {
        // Home page attachment button (combined image and file)
        const homeFileBtn = document.getElementById('homeFileBtn');
        if (homeFileBtn) {
            homeFileBtn.addEventListener('click', () => {
                this.homeFileInput.click();
            });
        }
        
        // Chat page attachment button (combined image and file)
        const chatFileBtn = document.getElementById('chatFileBtn');
        if (chatFileBtn) {
            chatFileBtn.addEventListener('click', () => {
                this.chatFileInput.click();
            });
        }
        
        // File input change handlers
        if (this.homeFileInput) {
            this.homeFileInput.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files);
            });
        }
        
        if (this.chatFileInput) {
            this.chatFileInput.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files);
            });
        }
        
        // File preview modal events
        const closeFilePreview = document.getElementById('closeFilePreview');
        if (closeFilePreview) {
            closeFilePreview.addEventListener('click', () => {
                this.hideFilePreview();
            });
        }
        
        const clearFiles = document.getElementById('clearFiles');
        if (clearFiles) {
            clearFiles.addEventListener('click', () => {
                this.clearSelectedFiles();
            });
        }
        
        const confirmFiles = document.getElementById('confirmFiles');
        if (confirmFiles) {
            confirmFiles.addEventListener('click', () => {
                this.hideFilePreview();
            });
        }
        
        // Image modal events
        const closeImageModal = document.getElementById('closeImageModal');
        if (closeImageModal) {
            closeImageModal.addEventListener('click', () => {
                this.closeImageModal();
            });
        }
        
        const imageModal = document.getElementById('imageModal');
        if (imageModal) {
            imageModal.addEventListener('click', (e) => {
                if (e.target.id === 'imageModal') {
                    this.closeImageModal();
                }
            });
        }
    }
    
    openImageModal(imageSrc, imageTitle) {
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const modalTitle = document.getElementById('modalImageTitle');
        
        modalImage.src = imageSrc;
        modalImage.alt = imageTitle;
        modalTitle.textContent = imageTitle;
        
        modal.classList.remove('hidden');
    }
    
    closeImageModal() {
        const modal = document.getElementById('imageModal');
        modal.classList.add('hidden');
        
        // Clear image source to free memory
        const modalImage = document.getElementById('modalImage');
        modalImage.src = '';
    }
    
    async handleFileSelection(files) {
        if (!files || files.length === 0) return;
        
        const maxSize = 10 * 1024 * 1024; // 10MB per file
        const maxFiles = 5;
        
        if (this.selectedFiles.size + files.length > maxFiles) {
            this.showNotification('Chỉ có thể chọn tối đa 5 files', 'error');
            return;
        }
        
        for (let file of files) {
            if (file.size > maxSize) {
                this.showNotification(`File "${file.name}" quá lớn (tối đa 10MB)`, 'error');
                continue;
            }
            
            const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Create file data object
            const fileData = {
                id: fileId,
                name: file.name,
                size: file.size,
                type: file.type,
                file: file,
                preview: null,
                base64: null
            };
            
            // Generate preview for images
            if (file.type.startsWith('image/')) {
                try {
                    fileData.preview = await this.createImagePreview(file);
                    fileData.base64 = await this.fileToBase64(file);
                } catch (error) {
                    console.error('Error creating image preview:', error);
                }
            } else {
                // For non-images, convert to base64 for AI processing
                try {
                    fileData.base64 = await this.fileToBase64(file);
                } catch (error) {
                    console.error('Error converting file to base64:', error);
                }
            }
            
            this.selectedFiles.set(fileId, fileData);
        }
        
        // Show file preview modal if files were added
        if (this.selectedFiles.size > 0) {
            this.showFilePreview();
        }
        
        // Reset file inputs
        this.homeFileInput.value = '';
        this.chatFileInput.value = '';
    }
    
    createImagePreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result.split(',')[1]; // Remove data:*/*;base64, prefix
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    showFilePreview() {
        this.updateFilePreviewList();
        this.filePreviewModal.classList.remove('hidden');
    }
    
    hideFilePreview() {
        // File preview functionality removed - no action needed
        return;
    }
    
    updateFilePreviewList() {
        const fileArray = Array.from(this.selectedFiles.values());
        
        this.filePreviewList.innerHTML = fileArray.map(fileData => {
            const sizeText = this.formatFileSize(fileData.size);
            const isImage = fileData.type.startsWith('image/');
            
            return `
                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div class="flex-shrink-0">
                        ${isImage && fileData.preview ? 
                            `<img src="${fileData.preview}" alt="Preview" class="w-12 h-12 object-cover rounded">` : 
                            `<div class="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>`
                        }
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">${fileData.name}</p>
                        <p class="text-xs text-gray-500">${sizeText}</p>
                    </div>
                    <button onclick="app.removeFile('${fileData.id}')" class="p-1 hover:bg-red-100 rounded text-red-500">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
    }
    
    removeFile(fileId) {
        this.selectedFiles.delete(fileId);
        this.updateFilePreviewList();
        
        if (this.selectedFiles.size === 0) {
            this.hideFilePreview();
        }
    }
    
    clearSelectedFiles() {
        // File upload functionality removed - no action needed
        return;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    updateSidebarIcons(isClosed) {
        // Mobile icons
        const mobileRightIcon = document.getElementById('mobilePanelRightIcon');
        const mobileLeftIcon = document.getElementById('mobilePanelLeftIcon');
        
        // Desktop icons
        const desktopRightIcon = document.getElementById('desktopPanelRightIcon');
        const desktopLeftIcon = document.getElementById('desktopPanelLeftIcon');
        
        if (isClosed) {
            // Show panel-left icon (sidebar closed, click to open)
            if (mobileRightIcon && mobileLeftIcon) {
                mobileLeftIcon.classList.remove('hidden');
                mobileRightIcon.classList.add('hidden');
            }
            if (desktopRightIcon && desktopLeftIcon) {
                desktopLeftIcon.classList.remove('hidden');
                desktopRightIcon.classList.add('hidden');
            }
        } else {
            // Show panel-right icon (sidebar open, click to close)
            if (mobileRightIcon && mobileLeftIcon) {
                mobileRightIcon.classList.remove('hidden');
                mobileLeftIcon.classList.add('hidden');
            }
            if (desktopRightIcon && desktopLeftIcon) {
                desktopRightIcon.classList.remove('hidden');
                desktopLeftIcon.classList.add('hidden');
            }
        }
    }
    
    toggleSidebar() {
        const isHidden = this.sidebar.classList.contains('-translate-x-full');
        
        if (isHidden) {
            // Opening animation - smoother transition
            this.sidebarToggle.classList.add('opening');
            this.sidebar.classList.remove('-translate-x-full');
            
            // Update icons immediately
            this.updateSidebarIcons(false); // sidebar is now open
            
            // Hide toggle button smoothly
            setTimeout(() => {
                this.sidebarToggle.style.opacity = '0';
                this.sidebarToggle.style.pointerEvents = 'none';
                this.sidebarToggle.classList.remove('opening');
            }, 100);
        } else {
            // Closing animation - much smoother
            this.sidebarToggle.classList.add('closing');
            this.sidebar.classList.add('-translate-x-full');
            
            // Update icons immediately
            this.updateSidebarIcons(true); // sidebar is now closed
            
            // Show toggle button smoothly after sidebar animation
            setTimeout(() => {
                this.sidebarToggle.style.opacity = '1';
                this.sidebarToggle.style.pointerEvents = 'auto';
                this.sidebarToggle.classList.remove('closing');
            }, 300); // Match sidebar transition time
        }
    }
    
    closeSidebar() {
        // Smooth closing animation
        this.sidebar.classList.add('-translate-x-full');
        
        // Update icons immediately
        this.updateSidebarIcons(true); // sidebar is now closed
        
        // Show toggle buttons smoothly after sidebar animation
        setTimeout(() => {
            this.sidebarToggle.style.opacity = '1';
            this.sidebarToggle.style.pointerEvents = 'auto';
            
            const desktopToggle = document.getElementById('desktopSidebarToggle');
            if (desktopToggle) {
                desktopToggle.style.opacity = '1';
                desktopToggle.style.pointerEvents = 'auto';
            }
        }, 300); // Match sidebar transition time
    }
    
    toggleDesktopSidebar() {
        const isHidden = this.sidebar.classList.contains('-translate-x-full');
        const desktopToggle = document.getElementById('desktopSidebarToggle');
        
        if (isHidden) {
            // Opening animation - smoother transition
            desktopToggle.classList.add('opening');
            this.sidebar.classList.remove('-translate-x-full');
            
            // Update icons immediately
            this.updateSidebarIcons(false); // sidebar is now open
            
            // Hide toggle button smoothly
            setTimeout(() => {
                desktopToggle.style.opacity = '0';
                desktopToggle.style.pointerEvents = 'none';
                desktopToggle.classList.remove('opening');
            }, 100);
        } else {
            // Closing animation - much smoother
            desktopToggle.classList.add('closing');
            this.sidebar.classList.add('-translate-x-full');
            
            // Update icons immediately
            this.updateSidebarIcons(true); // sidebar is now closed
            
            // Show toggle button smoothly after sidebar animation
            setTimeout(() => {
                desktopToggle.style.opacity = '1';
                desktopToggle.style.pointerEvents = 'auto';
                desktopToggle.classList.remove('closing');
            }, 300); // Match sidebar transition time
        }
    }
    
    initializeDesktopSidebar() {
        const desktopToggle = document.getElementById('desktopSidebarToggle');
        this.sidebar.classList.add('-translate-x-full');
        
        if (desktopToggle) {
            desktopToggle.style.opacity = '1';
            desktopToggle.style.pointerEvents = 'auto';
        }
        this.updateSidebarIcons(true); // sidebar is initially closed - shows panel-left icon
    }
    
    showHomeScreen() {
        this.homeScreen.classList.remove('hidden');
        this.chatScreen.classList.add('hidden');
        this.currentChatId = null;
        this.homeInput.value = '';
        this.homeInput.focus();
    }
    
    showChatScreen() {
        this.homeScreen.classList.add('hidden');
        this.chatScreen.classList.remove('hidden');
        this.chatInput.focus();
    }
    
    startNewChat(message) {
        this.currentChatId = null;
        this.messagesContainer.innerHTML = '';
        
        const chatId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
        this.currentChatId = chatId;
        
        const title = message ? message.substring(0, 30) + (message.length > 30 ? '...' : '') : 'New Chat';
        
        this.chats[chatId] = {
            id: chatId,
            title: title,
            messages: [],
            createdAt: new Date().toISOString(),
            isPinned: false
        };
        
        this.saveChats();
        this.showChatScreen();
        this.sendMessage(message);
        this.renderChatList();
    }
    
    async sendMessage(message) {
        if (!this.currentChatId || !message?.trim()) return;
        
        const chat = this.chats[this.currentChatId];
        if (!chat) return;
        
        const trimmedMessage = message?.trim() || '';
        const attachedFiles = null; // File upload functionality removed
        
        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: trimmedMessage,
            files: attachedFiles,
            timestamp: new Date().toISOString()
        };
        
        chat.messages.push(userMessage);
        this.renderMessage(userMessage);
        this.scrollToBottom();
        this.chatInput.value = '';
        
        // Clear selected files after sending
        this.clearSelectedFiles();
        
        const aiMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isTyping: true
        };
        
        chat.messages.push(aiMessage);
        this.renderMessage(aiMessage);
        this.scrollToBottom();
        
        try {
            await this.getAIResponse(trimmedMessage, aiMessage, attachedFiles);
        } catch (error) {
            console.error('Error getting AI response:', error);
            aiMessage.content = "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.";
            aiMessage.isTyping = false;
            this.updateMessage(aiMessage);
        } finally {
            this.saveChats();
        }
    }
    
    async getAIResponse(message, aiMessage, files = null) {
        try {
            // Check selected model to determine which endpoint to use
            if (this.selectedModel === 'nexorax2') {
                // Use search-enhanced AI model (DuckDuckGo + Gemini)
                return await this.getSearchEnhancedResponse(message, aiMessage);
            } else {
                // Use standard Gemini API for nexorax1
                return await this.getGeminiResponse(message, aiMessage, files);
            }
        } catch (error) {
            console.error('AI Response Error:', error);
            this.handleAIError(aiMessage);
        }
    }

    // Detect if message is asking about current time/date (narrow detection)
    isTimeRelatedQuery(message) {
        // Normalize message to handle diacritics and case
        const normalized = message.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        
        // Vietnamese patterns for current time/date queries
        const vietnamesePatterns = [
            /b(a|ay)\s*gio\s*(la\s*)?(may|gi|nao)/i,  // bây giờ là mấy giờ, bay gio may gio
            /may\s*gio(\s*roi)?/i,                    // mấy giờ rồi, may gio roi  
            /gio\s*(hien\s*tai|bay\s*gio)/i,         // giờ hiện tại, gio bay gio
            /hom\s*nay\s*(la\s*)?(ngay\s*)?(may|gi)/i, // hôm nay là ngày mấy, hom nay ngay may
            /thu\s*may(\s*hom\s*nay)?/i,             // thứ mấy hôm nay, thu may
            /ngay\s*(hom\s*nay|hien\s*tai)/i,        // ngày hôm nay, ngay hien tai
            /thoi\s*gian\s*(hien\s*tai|bay\s*gio)/i  // thời gian hiện tại, thoi gian bay gio
        ];
        
        // English patterns for current time/date queries  
        const englishPatterns = [
            /what('|')?s\s+the\s+time/i,              // what's the time, what is the time
            /what\s+time\s+is\s+it/i,                 // what time is it
            /time\s+(now|right\s*now)/i,              // time now, time right now
            /current\s+(time|date)/i,                 // current time, current date
            /what('|')?s\s+today('|')?s\s+(date|day)/i, // what's today's date
            /what\s+day\s+is\s+(it|today)/i,          // what day is it today
            /what('|')?s\s+the\s+date/i               // what's the date
        ];
        
        const allPatterns = [...vietnamesePatterns, ...englishPatterns];
        return allPatterns.some(pattern => pattern.test(normalized));
    }

    // Detect if message is a search query
    isSearchQuery(message) {
        // Normalize message to handle diacritics and case
        const normalized = message.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
        
        // Vietnamese search patterns
        const vietnamesePatterns = [
            /^tim\s*kiem\s*/i,           // tìm kiếm
            /^tim\s+/i,                  // tìm
            /^search\s*/i,               // search
            /^tra\s*cuu\s*/i,           // tra cứu
            /^tim\s*hieu\s*/i,          // tìm hiểu
            /^kiem\s*tra\s*/i,          // kiểm tra (when used as search)
            /^google\s*/i,              // google
            /^bing\s*/i,                // bing
        ];
        
        // English search patterns
        const englishPatterns = [
            /^search\s+for\s*/i,        // search for
            /^look\s+up\s*/i,          // look up
            /^find\s+(out\s+)?about\s*/i, // find about / find out about
            /^google\s*/i,             // google
            /^bing\s*/i,               // bing
        ];
        
        const allPatterns = [...vietnamesePatterns, ...englishPatterns];
        return allPatterns.some(pattern => pattern.test(normalized));
    }

    // Extract search query by removing search keywords
    extractSearchQuery(message) {
        const normalized = message.trim();
        
        // Search keywords to remove (Vietnamese and English)
        const searchKeywords = [
            /^tim\s*kiem\s*/i,
            /^tim\s+/i,
            /^search\s*(for\s*)?/i,
            /^tra\s*cuu\s*/i,
            /^tim\s*hieu\s*/i,
            /^kiem\s*tra\s*/i,
            /^look\s+up\s*/i,
            /^find\s+(out\s+)?about\s*/i,
            /^google\s*/i,
            /^bing\s*/i,
        ];
        
        // Remove search keywords from the beginning of the message
        let query = normalized;
        for (const keyword of searchKeywords) {
            query = query.replace(keyword, '').trim();
        }
        
        // If query is empty after removing keywords, use original message
        return query || normalized;
    }

    async getSearchEnhancedResponse(message, aiMessage) {
        try {
            const url = '/api/search-with-ai';
            
            const requestBody = {
                query: message
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: AbortSignal.timeout(120000) // 2 minute timeout for search
            });
            
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            
            const data = await response.json();
            
            // Debug logging to understand response structure
            console.log('Search response received:', data);
            
            // Extract AI response from the search-enhanced result
            let aiResponse = '';
            
            // Handle different possible response structures
            try {
                if (data.ai_response) {
                    // Check if it's a direct Gemini API response
                    if (data.ai_response.candidates && Array.isArray(data.ai_response.candidates) && data.ai_response.candidates.length > 0) {
                        const candidate = data.ai_response.candidates[0];
                        if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
                            aiResponse = candidate.content.parts[0].text;
                        }
                    }
                    // Handle error responses from Gemini API
                    else if (data.ai_response.error) {
                        console.error('Gemini API error in search response:', data.ai_response.error);
                        throw new Error(`Gemini API error: ${data.ai_response.error.message || 'Unknown error'}`);
                    }
                    // Try alternative structure formats
                    else if (typeof data.ai_response === 'string') {
                        aiResponse = data.ai_response;
                    }
                }
            } catch (structureError) {
                console.error('Error parsing AI response structure:', structureError);
                console.log('AI Response data:', data.ai_response);
            }
            
            if (!aiResponse || aiResponse.trim() === '') {
                console.error('No valid AI response found. Full response:', data);
                throw new Error('No AI response received from search-enhanced model');
            }
            
            // Add search context information to the response
            const searchInfo = data.search_results_count > 0 ? 
                `\n\n*🔍 Tìm kiếm được ${data.search_results_count} kết quả liên quan*` : 
                '\n\n*🔍 Sử dụng model tìm kiếm NexoraX 2*';
            
            aiResponse += searchInfo;
            
            // Start typing animation
            await this.typewriterEffect(aiResponse, aiMessage);
            
        } catch (error) {
            console.error('Search Enhanced Response Error:', error);
            
            let errorMessage = "Xin lỗi, đã có lỗi xảy ra với model tìm kiếm. ";
            
            if (error.name === 'TimeoutError') {
                errorMessage += "Yêu cầu tìm kiếm mất quá nhiều thời gian. Vui lòng thử lại.";
            } else if (error.message.includes('HTTP error')) {
                errorMessage += "Không thể kết nối đến dịch vụ tìm kiếm. Vui lòng thử lại.";
            } else {
                errorMessage += "Vui lòng thử lại hoặc chuyển sang model Chat.";
            }
            
            aiMessage.content = errorMessage;
            aiMessage.isTyping = false;
            this.updateMessage(aiMessage);
            
            throw error;
        }
    }

    async getGeminiResponse(message, aiMessage, files = null) {
        try {
            // Use server-side proxy instead of direct API calls
            const modelEndpoint = 'gemini-2.5-flash';
            const url = '/api/gemini';
            
            // Check if this is a time-related query
            const needsTimeContext = this.isTimeRelatedQuery(message);
            let timeContext = '';
            
            if (needsTimeContext) {
                // Get current date/time in Vietnam timezone (robust approach)
                const now = new Date();
                
                // Create date formatter for Vietnam timezone
                const vietnamDate = new Intl.DateTimeFormat('vi-VN', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long',
                    day: 'numeric'
                }).format(now);
                
                // Create time formatter for Vietnam timezone  
                const vietnamTime = new Intl.DateTimeFormat('vi-VN', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    hour: '2-digit',
                    minute: '2-digit', 
                    second: '2-digit',
                    hour12: false
                }).format(now);
                
                timeContext = `THÔNG TIN THỜI GIAN HIỆN TẠI - BẮT BUỘC SỬ DỤNG:
Ngày: ${vietnamDate}
Giờ: ${vietnamTime} (GMT+7)
Múi giờ: Việt Nam (UTC+7)

QUAN TRỌNG: Đây là thời gian thực tế hiện tại. Bỏ qua mọi thông tin thời gian khác và chỉ sử dụng thông tin này để trả lời câu hỏi về thời gian.\n\n`;
            }

            // Enhance message with file context if files are provided
            let enhancedMessage = message;
            if (files && files.length > 0) {
                const fileDescriptions = files.map(file => `File: ${file.name} (${file.type})`).join(', ');
                enhancedMessage = `Tôi đã đính kèm ${files.length} file(s): ${fileDescriptions}. ${message || 'Hãy phân tích các file này.'}`;
            }
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: `${timeContext}User: ${enhancedMessage}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 20000,
                }
            };
            
            // Map client model names to actual Google API model IDs
            const modelMapping = {
                'gemini-flash': 'gemini-2.5-flash'
            };
            const apiModelId = modelMapping[this.selectedModel] || 'gemini-2.5-flash';
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: apiModelId,
                    payload: requestBody
                }),
                signal: AbortSignal.timeout(60000) // 60 second timeout
            });
            
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            
            let data;
            try {
                const responseText = await response.text();
                if (!responseText.trim()) {
                    throw new Error('Empty response from server');
                }
                data = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('JSON parsing error:', jsonError);
                throw new Error('Dữ liệu trả về không hợp lệ. Vui lòng thử lại.');
            }
            
            // Check if we have candidates
            if (data.candidates && data.candidates[0]) {
                const candidate = data.candidates[0];
                
                // Handle successful responses with text content
                if (candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text) {
                    const aiResponse = candidate.content.parts[0].text.trim();
                    if (aiResponse) {
                        aiMessage.content = aiResponse;
                        aiMessage.isTyping = false;
                        aiMessage.isFinalized = false;
                        this.updateMessage(aiMessage);
                        return;
                    }
                }
                
                // Handle MAX_TOKENS and other finish reasons
                if (candidate.finishReason) {
                    let errorMessage = '';
                    switch (candidate.finishReason) {
                        case 'MAX_TOKENS':
                            errorMessage = '⚠️ Câu trả lời đã đạt giới hạn tối đa (8192 tokens). Nếu cần phản hồi dài hơn, vui lòng chia nhỏ câu hỏi.';
                            break;
                        case 'SAFETY':
                            errorMessage = '⚠️ Nội dung không phù hợp với chính sách an toàn. Vui lòng thử lại với câu hỏi khác.';
                            break;
                        case 'RECITATION':
                            errorMessage = '⚠️ Nội dung có thể vi phạm bản quyền. Vui lòng thử lại với câu hỏi khác.';
                            break;
                        default:
                            errorMessage = `⚠️ API dừng với lý do: ${candidate.finishReason}. Vui lòng thử lại.`;
                    }
                    
                    aiMessage.content = errorMessage;
                    aiMessage.isTyping = false;
                    aiMessage.isFinalized = false;
                    this.updateMessage(aiMessage);
                    return;
                }
            }
            
            throw new Error('Không nhận được phản hồi hợp lệ từ AI');
            
        } catch (error) {
            console.error('Gemini API Error:', error);
            
            // Provide specific error messages based on error type
            let errorMessage = '';
            if (error.message.includes('HTTP error! status: 400')) {
                errorMessage = '❌ Yêu cầu không hợp lệ. Vui lòng thử lại với câu hỏi khác.';
            } else if (error.message.includes('HTTP error! status: 401')) {
                errorMessage = '🔑 API key không hợp lệ. Vui lòng kiểm tra cấu hình.';
            } else if (error.message.includes('HTTP error! status: 403')) {
                errorMessage = '🚫 Không có quyền truy cập API. Vui lòng kiểm tra API key.';
            } else if (error.message.includes('HTTP error! status: 429')) {
                errorMessage = '⏰ API đã đạt giới hạn sử dụng. Vui lòng thử lại sau vài phút.';
            } else if (error.message.includes('HTTP error! status: 500')) {
                errorMessage = '🔧 Lỗi server. Vui lòng thử lại sau.';
            } else if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
                errorMessage = '🌐 Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
            } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
                errorMessage = '⏱️ Yêu cầu quá lâu. Vui lòng thử lại với câu hỏi ngắn hơn.';
            } else {
                errorMessage = `❌ Đã xảy ra lỗi: ${error.message}. Vui lòng thử lại.`;
            }
            
            aiMessage.content = errorMessage;
            aiMessage.isTyping = false;
            aiMessage.isFinalized = false;
            this.updateMessage(aiMessage);
        }
    }

    async getTavilySearchResponse(query, aiMessage) {
        try {
            const url = '/api/search';
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    search_depth: 'basic',
                    include_answer: true,
                    max_results: 5
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            
            // Format search results for display
            let formattedResults = `🔍 **Kết quả tìm kiếm cho: "${query}"**\n\n`;
            
            if (data.answer) {
                formattedResults += `**📝 Tóm tắt:**\n${data.answer}\n\n`;
            }
            
            if (data.results && data.results.length > 0) {
                formattedResults += `**🌐 Nguồn tham khảo:**\n\n`;
                data.results.forEach((result, index) => {
                    formattedResults += `**${index + 1}. [${result.title}](${result.url})**\n`;
                    if (result.content) {
                        // Truncate content to 200 characters
                        const content = result.content.length > 200 
                            ? result.content.substring(0, 200) + '...' 
                            : result.content;
                        formattedResults += `${content}\n\n`;
                    }
                });
            } else {
                formattedResults += `Không tìm thấy kết quả nào cho câu hỏi này.`;
            }

            aiMessage.content = formattedResults;
            aiMessage.isTyping = false;
            aiMessage.isFinalized = false;
            this.updateMessage(aiMessage);
            
        } catch (error) {
            console.error('Tavily Search Error:', error);
            
            // Provide specific error messages based on error type
            let errorMessage = '';
            if (error.message.includes('HTTP error! status: 400')) {
                errorMessage = '❌ Yêu cầu tìm kiếm không hợp lệ. Vui lòng thử lại với từ khóa khác.';
            } else if (error.message.includes('HTTP error! status: 401')) {
                errorMessage = '🔑 Tavily API key không hợp lệ. Vui lòng kiểm tra cấu hình.';
            } else if (error.message.includes('HTTP error! status: 403')) {
                errorMessage = '🚫 Không có quyền truy cập Tavily API. Vui lòng kiểm tra API key.';
            } else if (error.message.includes('HTTP error! status: 429')) {
                errorMessage = '⏰ API tìm kiếm đã đạt giới hạn. Vui lòng thử lại sau vài phút.';
            } else if (error.message.includes('HTTP error! status: 500')) {
                errorMessage = '🔧 Lỗi server tìm kiếm. Vui lòng thử lại sau.';
            } else if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
                errorMessage = '🌐 Không thể kết nối đến server tìm kiếm. Vui lòng kiểm tra kết nối mạng.';
            } else {
                errorMessage = `❌ Đã xảy ra lỗi tìm kiếm: ${error.message}. Vui lòng thử lại.`;
            }
            
            aiMessage.content = errorMessage;
            aiMessage.isTyping = false;
            aiMessage.isFinalized = false;
            this.updateMessage(aiMessage);
        }
    }
    
    
    scrollToBottom() {
        if (this.messagesContainer) {
            setTimeout(() => {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }, 100);
        }
    }
    
    renderMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-bubble ' + (message.role === 'user' ? 'user-message' : 'ai-message');
        messageDiv.setAttribute('data-message-id', message.id);
        
        // Generate files display HTML
        const filesHtml = message.files && message.files.length > 0 ? this.renderFilesInMessage(message.files) : '';
        
        if (message.role === 'user') {
            // User message - ChatGPT style with avatar on right
            messageDiv.innerHTML = '<div class="message-wrapper">' +
                '<div class="message-content">' +
                filesHtml +
                this.formatMessage(message.content) +
                '</div>' +
                '<div class="avatar user-avatar">You</div>' +
                '</div>';
        } else {
            // AI message - ChatGPT style with avatar on left, no bubble
            const aiAvatarContent = '<img src="assets/images/nexorax-logo.svg" alt="AI" class="w-8 h-8 object-contain">';
            
            messageDiv.innerHTML = '<div class="message-wrapper">' +
                '<div class="avatar ai-avatar">' + aiAvatarContent + '</div>' +
                '<div class="message-content">' +
                filesHtml +
                (message.isTyping ? '<div class="ai-loading"><span class="ai-loading-text">Đang suy nghĩ</span><div class="ai-loading-dots"><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div></div></div>' : this.formatMessage(message.content)) +
                '</div>' +
                '</div>';
        }
        
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    renderFilesInMessage(files) {
        if (!files || files.length === 0) return '';
        
        return '<div class="message-files mb-2">' +
            files.map(file => {
                const isImage = file.type.startsWith('image/');
                const sizeText = this.formatFileSize(file.size);
                
                if (isImage && file.preview) {
                    return `
                        <div class="inline-block mr-2 mb-2">
                            <div class="relative group">
                                <img src="${file.preview}" alt="${file.name}" class="max-w-60 max-h-40 rounded-lg shadow-md cursor-pointer" onclick="app.openImageModal('${file.preview}', '${file.name}')">
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200"></div>
                                <div class="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    ${file.name} (${sizeText})
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="inline-flex items-center space-x-2 bg-gray-100 rounded-lg p-2 mr-2 mb-2 max-w-xs">
                            <div class="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900 truncate">${file.name}</p>
                                <p class="text-xs text-gray-500">${sizeText}</p>
                            </div>
                        </div>
                    `;
                }
            }).join('') +
            '</div>';
    }
    
    updateMessage(message) {
        const messageElement = this.messagesContainer.querySelector('[data-message-id="' + message.id + '"]');
        if (messageElement) {
            const contentElement = messageElement.querySelector('.message-content');
            if (message.isTyping) {
                contentElement.innerHTML = '<div class="ai-loading"><span class="ai-loading-text">Đang suy nghĩ</span><div class="ai-loading-dots"><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div></div></div>';
            } else {
                // If this is an AI message and has content, use typing animation
                if (message.role === 'ai' && message.content && !message.isFinalized) {
                    this.typewriterEffect(contentElement, message.content, () => {
                        message.isFinalized = true;
                    });
                } else {
                    contentElement.innerHTML = this.formatMessage(message.content);
                }
            }
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }
    
    async typewriterEffect(element, text, onComplete = null) {
        // Check if user prefers reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            element.innerHTML = this.formatMessage(text);
            if (onComplete) onComplete();
            return;
        }
        
        // Cancel any existing typewriter effect
        if (element.dataset.typewriterActive) {
            element.dataset.cancelled = 'true';
            return;
        }
        
        let currentText = '';
        element.dataset.typewriterActive = 'true';
        element.dataset.cancelled = 'false';
        
        // Add AI typing shimmer effect
        element.classList.add('ai-typing');
        element.innerHTML = '';
        
        // Create and add cursor element
        const cursor = document.createElement('span');
        cursor.classList.add('typing-cursor');
        
        // Type character by character with improved timing
        for (let i = 0; i < text.length; i++) {
            // Check if cancelled
            if (element.dataset.cancelled === 'true') {
                break;
            }
            
            currentText += text[i];
            
            // Update content with cursor
            element.innerHTML = this.formatMessage(currentText);
            element.appendChild(cursor);
            
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            
            // Adjust speed based on character type for natural feeling
            let delay = 20; // Base delay for smooth typing
            const char = text[i];
            
            if (char === '.' || char === '!' || char === '?') {
                delay = 400; // Longer pause after sentences
            } else if (char === ',' || char === ';' || char === ':') {
                delay = 150; // Medium pause after punctuation
            } else if (char === ' ') {
                delay = 40; // Quick for spaces
            } else if (char === '\n') {
                delay = 250; // Pause for new lines
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Final cleanup
        element.innerHTML = this.formatMessage(currentText);
        element.classList.remove('ai-typing');
        
        // Remove cursor after a brief pause
        setTimeout(() => {
            if (cursor.parentElement) {
                cursor.remove();
            }
        }, 1000);
        
        // Clean up dataset
        element.dataset.typewriterActive = 'false';
        element.dataset.cancelled = 'false';
        
        if (onComplete) onComplete();
    }
    
    formatMessage(content) {
        try {
            return marked.parse(content);
        } catch (error) {
            console.error('Markdown parsing error:', error);
            return content.replace(/\n/g, '<br>');
        }
    }
    
    renderChatList() {
        const chatArray = Object.values(this.chats);
        const noChatHistoryElement = document.getElementById('noChatHistory');
        
        if (chatArray.length === 0) {
            // Clear chat items but preserve noChatHistory element
            const chatItems = this.chatList.querySelectorAll('.chat-item');
            chatItems.forEach(item => item.remove());
            
            // Show "No chat history" message
            if (noChatHistoryElement) {
                noChatHistoryElement.style.display = 'flex';
            }
            return;
        }
        
        // Hide "No chat history" message
        if (noChatHistoryElement) {
            noChatHistoryElement.style.display = 'none';
        }
        
        chatArray.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Clear existing chat items but preserve noChatHistory
        const chatItems = this.chatList.querySelectorAll('.chat-item');
        chatItems.forEach(item => item.remove());
        
        // Add new chat items
        const chatHTML = chatArray.map(chat => 
            '<div class="chat-item p-3 rounded-xl cursor-pointer ' + 
            (this.currentChatId === chat.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50') + 
            '" onclick="app.loadChat(\'' + chat.id + '\')"><div class="flex items-center justify-between gap-2"><div class="flex-1 min-w-0"><div class="font-medium text-sm truncate mb-1">' +
            (chat.isPinned ? '<svg class="w-3 h-3 text-blue-600 inline mr-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>' : '') + chat.title + 
            '</div><div class="text-xs text-gray-500">' + new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date(chat.createdAt)) + 
            '</div></div><div class="flex items-center space-x-1 flex-shrink-0"><button class="p-1.5 hover:bg-blue-100 rounded-lg transition-colors" onclick="event.stopPropagation(); app.togglePin(\'' + chat.id + '\')" title="' + 
            (chat.isPinned ? 'Bỏ ghim' : 'Ghim cuộc trò chuyện') + '">' + 
            (!chat.isPinned ? 
                '<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>' : 
                '<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 17v5"/><path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89"/><path d="m2 2 20 20"/><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"/></svg>') + 
            '</button><button class="p-1.5 hover:bg-red-100 rounded-lg transition-colors" onclick="event.stopPropagation(); app.deleteChat(\'' + chat.id + '\')" title="Xóa cuộc trò chuyện"><svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div></div></div>'
        ).join('');
        
        // Insert chat items before noChatHistory element
        if (noChatHistoryElement) {
            noChatHistoryElement.insertAdjacentHTML('beforebegin', chatHTML);
        } else {
            // Fallback if noChatHistory element is missing
            this.chatList.innerHTML = chatHTML;
        }
    }
    
    loadChat(chatId) {
        const chat = this.chats[chatId];
        if (!chat) return;
        
        this.currentChatId = chatId;
        this.showChatScreen();
        
        this.messagesContainer.innerHTML = '';
        chat.messages.forEach(message => this.renderMessage(message));
        this.renderChatList();
        
        if (window.innerWidth < 1024) {
            this.closeSidebar();
        }
    }
    
    deleteChat(chatId) {
        const chat = this.chats[chatId];
        if (chat && chat.isPinned) {
            if (confirm('Cuộc trò chuyện này đã được ghim. Bạn có chắc muốn bỏ ghim và xóa?')) {
                delete this.chats[chatId];
                this.saveChats();
                this.renderChatList();
                
                if (this.currentChatId === chatId) {
                    this.showHomeScreen();
                }
            }
        } else if (confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
            delete this.chats[chatId];
            this.saveChats();
            this.renderChatList();
            
            if (this.currentChatId === chatId) {
                this.showHomeScreen();
            }
        }
    }
    
    togglePin(chatId) {
        const chat = this.chats[chatId];
        if (chat) {
            chat.isPinned = !chat.isPinned;
            this.saveChats();
            this.renderChatList();
        }
    }
    
    
    searchChats(query) {
        const chatItems = this.chatList.querySelectorAll('.chat-item');
        
        chatItems.forEach(item => {
            const title = item.querySelector('.font-medium').textContent.toLowerCase();
            if (title.includes(query.toLowerCase())) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('nexorax_dark_mode', this.isDarkMode);
        this.loadTheme();
    }
    
    loadTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }
    
    showSettings() {
        this.settingsModal.classList.remove('hidden');
        // Force reflow to ensure hidden class is removed before animation
        this.settingsModal.offsetHeight;
        
        const content = document.getElementById('settingsContent');
        content.classList.add('show');
    }
    
    hideSettings() {
        const content = document.getElementById('settingsContent');
        content.classList.remove('show');
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            this.settingsModal.classList.add('hidden');
        }, 250);
    }
    
    showAbout() {
        this.aboutModal.classList.remove('hidden');
        setTimeout(() => {
            const content = document.getElementById('aboutContent');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
    
    hideAbout() {
        const content = document.getElementById('aboutContent');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.aboutModal.classList.add('hidden');
        }, 300);
    }
    
    showClearAllConfirmation() {
        this.clearAllModal.classList.remove('hidden');
        setTimeout(() => {
            const content = document.getElementById('clearAllContent');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
    
    hideClearAllConfirmation() {
        const content = document.getElementById('clearAllContent');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.clearAllModal.classList.add('hidden');
        }, 300);
    }
    
    clearAllChats() {
        this.chats = {};
        this.saveChats();
        this.renderChatList();
        this.showHomeScreen();
        this.hideClearAllConfirmation();
        this.showNotification('Đã xóa tất cả cuộc trò chuyện!', 'success');
    }
    
    showFeedback() {
        this.currentRating = 0;
        this.resetStarHighlight();
        document.getElementById('feedbackText').value = '';
        document.getElementById('ratingText').textContent = 'Nhấn vào sao để đánh giá';
        
        this.feedbackModal.classList.remove('hidden');
        setTimeout(() => {
            const content = document.getElementById('feedbackContent');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
    
    hideFeedback() {
        const content = document.getElementById('feedbackContent');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.feedbackModal.classList.add('hidden');
        }, 300);
    }
    
    setRating(rating) {
        this.currentRating = rating;
        this.updateStarDisplay(rating);
        
        const ratingTexts = {
            1: 'Rất tệ 😞',
            2: 'Tệ 😕',
            3: 'Bình thường 😐',
            4: 'Tốt 😊',
            5: 'Xuất sắc 🤩'
        };
        
        document.getElementById('ratingText').textContent = ratingTexts[rating];
    }
    
    highlightStars(rating) {
        this.updateStarDisplay(rating);
    }
    
    resetStarHighlight() {
        this.updateStarDisplay(this.currentRating);
    }
    
    updateStarDisplay(rating) {
        document.querySelectorAll('.star').forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('text-gray-300');
                star.classList.add('text-yellow-400');
            } else {
                star.classList.remove('text-yellow-400');
                star.classList.add('text-gray-300');
            }
        });
    }
    
    submitFeedback() {
        const feedbackText = document.getElementById('feedbackText').value.trim();
        
        if (this.currentRating === 0) {
            this.showNotification('Vui lòng chọn số sao đánh giá!', 'error');
            return;
        }
        
        const feedback = {
            rating: this.currentRating,
            comment: feedbackText,
            timestamp: new Date().toISOString()
        };
        
        const feedbacks = JSON.parse(localStorage.getItem('nexorax_feedbacks') || '[]');
        feedbacks.push(feedback);
        localStorage.setItem('nexorax_feedbacks', JSON.stringify(feedbacks));
        
        this.hideFeedback();
        this.showNotification('Cảm ơn bạn đã đánh giá! 🙏', 'success');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 z-[110] px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full ' + 
            (type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white');
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    
    changeModel(modelType) {
        this.selectedModel = modelType;
        localStorage.setItem('nexorax_selected_model', modelType);
        
        // Update both selectors to stay in sync
        if (this.homeModelSelector) {
            this.homeModelSelector.value = modelType;
        }
        if (this.chatModelSelector) {
            this.chatModelSelector.value = modelType;
        }
        
        const modelNames = {
            'nexorax1': 'NexoraX 1 (Gemini)',
            'nexorax2': 'NexoraX 2 (Tìm kiếm)'
        };
        
        this.showNotification('Đã chuyển sang ' + (modelNames[modelType] || modelType) + '!', 'success');
    }
    
    loadModelSelection() {
        // Update both model selectors to show current selection
        if (this.homeModelSelector) {
            this.homeModelSelector.value = this.selectedModel;
        }
        if (this.chatModelSelector) {
            this.chatModelSelector.value = this.selectedModel;
        }
    }
    
    toggleModelOptions() {
        const modelOptions = document.getElementById('modelOptions');
        const modelArrow = document.getElementById('modelArrow');
        
        if (modelOptions && modelArrow) {
            if (modelOptions.classList.contains('hidden')) {
                modelOptions.classList.remove('hidden');
                modelArrow.classList.add('rotate-180');
            } else {
                modelOptions.classList.add('hidden');
                modelArrow.classList.remove('rotate-180');
            }
        }
    }
    
    toggleQuickModelDropdown(inputType) {
        const dropdownId = inputType === 'home' ? 'homeQuickModelDropdown' : 'chatQuickModelDropdown';
        const otherDropdownId = inputType === 'home' ? 'chatQuickModelDropdown' : 'homeQuickModelDropdown';
        
        const dropdown = document.getElementById(dropdownId);
        const otherDropdown = document.getElementById(otherDropdownId);
        
        // Close other dropdown first
        if (otherDropdown) {
            otherDropdown.classList.add('hidden');
        }
        
        // Toggle current dropdown
        if (dropdown) {
            if (dropdown.classList.contains('hidden')) {
                dropdown.classList.remove('hidden');
                dropdown.classList.add('scale-in');
            } else {
                dropdown.classList.add('hidden');
            }
        }
    }
    
    selectQuickModel(model) {
        // Close all dropdowns
        const homeDropdown = document.getElementById('homeQuickModelDropdown');
        const chatDropdown = document.getElementById('chatQuickModelDropdown');
        
        if (homeDropdown) homeDropdown.classList.add('hidden');
        if (chatDropdown) chatDropdown.classList.add('hidden');
        
        // Update selected model
        this.changeModel(model);
        
        // Update model radio buttons in settings
        const modelRadio = document.querySelector('input[name="aiModel"][value="' + model + '"]');
        if (modelRadio) {
            modelRadio.checked = true;
        }
        
        // Visual feedback - highlight selected model in dropdowns
        document.querySelectorAll('.quick-model-option').forEach(option => {
            if (option.getAttribute('data-model') === model) {
                option.style.backgroundColor = '#f0f9ff';
                setTimeout(() => {
                    option.style.backgroundColor = '';
                }, 1000);
            }
        });
    }
    
    
    saveChats() {
        localStorage.setItem('nexorax_chats', JSON.stringify(this.chats));
    }

    // Voice Recording Methods
    initializeSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            this.disableMicButtons();
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.speechRecognition = new SpeechRecognition();
        
        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = true; // Enable interim results
        this.speechRecognition.lang = 'vi-VN'; // Vietnamese language
        this.speechRecognition.maxAlternatives = 1;
        
        // Buffer để lưu text đã hoàn thành
        this.speechFinalBuffer = '';

        this.speechRecognition.onstart = () => {
            this.isRecording = true;
            this.speechFinalBuffer = ''; // Reset buffer khi bắt đầu
            this.updateRecordingUI(true);
        };

        this.speechRecognition.onend = () => {
            this.isRecording = false;
            this.updateRecordingUI(false);
            
            // Khi kết thúc, đảm bảo text cuối cùng được lưu và focus vào input
            if (this.speechFinalBuffer.trim()) {
                this.handleSpeechResult(this.speechFinalBuffer.trim());
            }
        };

        this.speechRecognition.onresult = (event) => {
            let interimTranscript = '';
            
            // Thêm final results vào buffer
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    this.speechFinalBuffer += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Hiển thị tổng hợp: text đã hoàn thành + text tạm thời
            const fullTranscript = this.speechFinalBuffer + interimTranscript;
            this.updateInputWithTranscript(fullTranscript);
        };

        this.speechRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isRecording = false;
            this.updateRecordingUI(false);
            
            let errorMessage = 'Lỗi nhận diện giọng nói';
            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'Không phát hiện giọng nói. Vui lòng thử lại.';
                    break;
                case 'audio-capture':
                    errorMessage = 'Không thể truy cập microphone.';
                    break;
                case 'not-allowed':
                    errorMessage = 'Quyền truy cập microphone bị từ chối.';
                    break;
                case 'network':
                    errorMessage = 'Lỗi mạng. Vui lòng kiểm tra kết nối.';
                    break;
            }
            this.showNotification(errorMessage, 'error');
        };
    }

    setupVoiceRecordingListeners() {
        const homeMicBtn = document.getElementById('homeMicBtn');
        const chatMicBtn = document.getElementById('chatMicBtn');

        if (homeMicBtn) {
            homeMicBtn.addEventListener('click', () => {
                this.toggleVoiceRecording('home');
            });
        }

        if (chatMicBtn) {
            chatMicBtn.addEventListener('click', () => {
                this.toggleVoiceRecording('chat');
            });
        }
    }

    toggleVoiceRecording(inputType) {
        if (!this.speechRecognition) {
            this.showNotification('Trình duyệt không hỗ trợ nhận diện giọng nói', 'error');
            return;
        }

        if (this.isRecording) {
            this.speechRecognition.stop();
            return;
        }

        // Set current active input
        this.currentActiveInput = inputType;

        try {
            this.speechRecognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.showNotification('Không thể khởi động nhận diện giọng nói', 'error');
        }
    }

    updateRecordingUI(isRecording) {
        const homeMicBtn = document.getElementById('homeMicBtn');
        const chatMicBtn = document.getElementById('chatMicBtn');

        [homeMicBtn, chatMicBtn].forEach(btn => {
            if (btn) {
                if (isRecording) {
                    btn.classList.add('recording');
                    btn.title = 'Đang ghi âm... Nhấn để dừng';
                } else {
                    btn.classList.remove('recording');
                    btn.title = 'Nói để nhập văn bản';
                }
            }
        });
    }

    updateInputWithTranscript(transcript) {
        // Hiển thị transcript trong input field (bao gồm interim results)
        if (this.currentActiveInput === 'home' && this.homeInput) {
            this.homeInput.value = transcript;
        } else if (this.currentActiveInput === 'chat' && this.chatInput) {
            this.chatInput.value = transcript;
        }
    }

    handleSpeechResult(transcript) {
        if (!transcript) return;

        // Chỉ focus vào input khi hoàn thành, không hiển thị thông báo
        if (this.currentActiveInput === 'home' && this.homeInput) {
            this.homeInput.focus();
        } else if (this.currentActiveInput === 'chat' && this.chatInput) {
            this.chatInput.focus();
        }
    }

    disableMicButtons() {
        const homeMicBtn = document.getElementById('homeMicBtn');
        const chatMicBtn = document.getElementById('chatMicBtn');

        [homeMicBtn, chatMicBtn].forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.title = 'Trình duyệt không hỗ trợ nhận diện giọng nói';
            }
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-lg text-white transition-all duration-300 transform translate-x-full`;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.className += ' bg-green-500';
                break;
            case 'error':
                notification.className += ' bg-red-500';
                break;
            default:
                notification.className += ' bg-blue-500';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// ================================
// TYPING EFFECT FUNCTIONS
// ================================

class TypingEffect {
    
    // Typing effect for simple text
    static async typeText(element, text, speed = 50) {
        if (!element) return;
        
        element.textContent = '';
        element.style.width = '0';
        element.classList.add('typing-text');
        
        for (let i = 0; i < text.length; i++) {
            element.textContent += text.charAt(i);
            await new Promise(resolve => setTimeout(resolve, speed));
        }
        
        element.style.width = 'auto';
    }
    
    // Typing effect with blinking cursor
    static async typeTextWithCursor(element, text, speed = 80, showCursor = true) {
        if (!element) return;
        
        // Clear element
        element.innerHTML = '';
        
        // Create cursor element
        const cursor = document.createElement('span');
        cursor.classList.add('typing-cursor');
        
        if (showCursor) {
            element.appendChild(cursor);
        }
        
        // Type each character
        for (let i = 0; i < text.length; i++) {
            // Remove cursor temporarily
            if (cursor.parentElement) {
                cursor.remove();
            }
            
            // Add character
            element.textContent += text.charAt(i);
            
            // Add cursor back
            if (showCursor) {
                element.appendChild(cursor);
            }
            
            // Wait before next character
            await new Promise(resolve => setTimeout(resolve, speed));
        }
        
        // Remove cursor after completion if desired
        setTimeout(() => {
            if (cursor.parentElement) {
                cursor.remove();
            }
        }, 3000);
    }
    
    // Typing effect for AI responses (word by word)
    static async typeAIResponse(element, text, speed = 30) {
        if (!element) return;
        
        element.textContent = '';
        element.classList.add('ai-typing');
        
        const words = text.split(' ');
        
        for (let i = 0; i < words.length; i++) {
            element.textContent += (i > 0 ? ' ' : '') + words[i];
            await new Promise(resolve => setTimeout(resolve, speed));
        }
        
        // Remove typing class after completion
        setTimeout(() => {
            element.classList.remove('ai-typing');
        }, 500);
    }
    
    // Initialize home page typing effects
    static initHomePageTyping() {
        // Wait for DOM to be ready
        setTimeout(() => {
            const titleElement = document.querySelector('h1');
            const subtitleElement = document.querySelector('p');
            
            if (titleElement) {
                titleElement.classList.add('typing-title');
            }
            
            if (subtitleElement && subtitleElement.textContent.includes('Xin chào')) {
                subtitleElement.classList.add('typing-subtitle');
            }
        }, 100);
    }
    
    // Enhanced typing for chat messages
    static async typeMessage(element, text, isAI = false) {
        if (!element || !text) return;
        
        // Check if user prefers reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            element.textContent = text;
            return;
        }
        
        if (isAI) {
            await this.typeAIResponse(element, text, 25);
        } else {
            await this.typeTextWithCursor(element, text, 60, false);
        }
    }
    
    // Utility to check if element is in viewport
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Auto trigger typing when element comes into view
    static observeElement(element, text, options = {}) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.hasAttribute('data-typed')) {
                    entry.target.setAttribute('data-typed', 'true');
                    
                    if (options.isAI) {
                        this.typeAIResponse(entry.target, text, options.speed || 30);
                    } else {
                        this.typeTextWithCursor(entry.target, text, options.speed || 80, options.showCursor !== false);
                    }
                    
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        
        observer.observe(element);
    }
}

// Initialize the app
const app = new NexoraXChat();