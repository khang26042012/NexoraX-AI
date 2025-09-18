class NovaXChat {
    constructor() {
        this.currentChatId = null;
        this.chats = JSON.parse(localStorage.getItem('novax_chats') || '{}');
        // API calls now go through server-side proxy - no client-side key needed
        this.isDarkMode = localStorage.getItem('novax_dark_mode') === 'true';
        this.currentRating = 0;
        // Only support gemini-flash model now
        this.selectedModel = 'gemini-flash';
        localStorage.setItem('novax_selected_model', this.selectedModel);
        this.selectedFiles = new Map(); // Store selected files with their data
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadTheme();
        this.loadModelSelection();
        this.initializeDesktopSidebar();
        this.renderChatList();
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
        
        // File upload elements
        this.filePreviewModal = document.getElementById('filePreviewModal');
        this.filePreviewList = document.getElementById('filePreviewList');
        this.homeFileInput = document.getElementById('homeFileInput');
        this.chatFileInput = document.getElementById('fileInput');
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
        
        // Home input
        if (this.homeInput) {
            this.homeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && this.homeInput.value.trim()) {
                    e.preventDefault();
                    this.startNewChat(this.homeInput.value.trim());
                }
            });
        }
        
        const homeSendBtn = document.getElementById('homeSendBtn');
        if (homeSendBtn) {
            homeSendBtn.addEventListener('click', () => {
                if (this.homeInput && (this.homeInput.value.trim() || this.selectedFiles.size > 0)) {
                    this.startNewChat(this.homeInput.value.trim());
                }
            });
        }
        
        // Chat input
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && this.chatInput.value.trim()) {
                    e.preventDefault();
                    this.sendMessage(this.chatInput.value.trim());
                }
            });
        }
        
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                if (this.chatInput && (this.chatInput.value.trim() || this.selectedFiles.size > 0)) {
                    this.sendMessage(this.chatInput.value.trim());
                }
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
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
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
        // Home file upload button
        const homeFileUploadBtn = document.getElementById('homeFileUploadBtn');
        if (homeFileUploadBtn) {
            homeFileUploadBtn.addEventListener('click', () => {
                this.homeFileInput.click();
            });
        }
        
        // Chat file upload button (removed from new design)
        const fileUploadBtn = document.getElementById('fileUploadBtn');
        if (fileUploadBtn) {
            fileUploadBtn.addEventListener('click', () => {
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
        this.filePreviewModal.classList.add('hidden');
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
        this.selectedFiles.clear();
        this.hideFilePreview();
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    toggleSidebar() {
        const isHidden = this.sidebar.classList.contains('-translate-x-full');
        
        if (isHidden) {
            // Opening animation
            this.sidebarToggle.classList.add('opening');
            setTimeout(() => this.sidebarToggle.classList.remove('opening'), 600);
            
            this.sidebar.classList.remove('-translate-x-full');
            this.sidebarToggle.style.opacity = '0';
            this.sidebarToggle.style.pointerEvents = 'none';
        } else {
            // Closing animation
            this.sidebarToggle.classList.add('closing');
            setTimeout(() => this.sidebarToggle.classList.remove('closing'), 600);
            
            this.sidebar.classList.add('-translate-x-full');
            this.sidebarToggle.style.opacity = '1';
            this.sidebarToggle.style.pointerEvents = 'auto';
        }
    }
    
    closeSidebar() {
        this.sidebar.classList.add('-translate-x-full');
        this.sidebarToggle.style.opacity = '1';
        this.sidebarToggle.style.pointerEvents = 'auto';
        
        const desktopToggle = document.getElementById('desktopSidebarToggle');
        if (desktopToggle) {
            desktopToggle.style.opacity = '1';
            desktopToggle.style.pointerEvents = 'auto';
        }
    }
    
    toggleDesktopSidebar() {
        const isHidden = this.sidebar.classList.contains('-translate-x-full');
        const desktopToggle = document.getElementById('desktopSidebarToggle');
        
        if (isHidden) {
            // Opening animation
            desktopToggle.classList.add('opening');
            setTimeout(() => desktopToggle.classList.remove('opening'), 600);
            
            this.sidebar.classList.remove('-translate-x-full');
            desktopToggle.style.opacity = '0';
            desktopToggle.style.pointerEvents = 'none';
        } else {
            // Closing animation
            desktopToggle.classList.add('closing');
            setTimeout(() => desktopToggle.classList.remove('closing'), 600);
            
            this.sidebar.classList.add('-translate-x-full');
            desktopToggle.style.opacity = '1';
            desktopToggle.style.pointerEvents = 'auto';
        }
    }
    
    initializeDesktopSidebar() {
        const desktopToggle = document.getElementById('desktopSidebarToggle');
        this.sidebar.classList.add('-translate-x-full');
        
        if (desktopToggle) {
            desktopToggle.style.opacity = '1';
            desktopToggle.style.pointerEvents = 'auto';
        }
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
        
        const title = message ? message.substring(0, 30) + (message.length > 30 ? '...' : '') : 
                     (this.selectedFiles.size > 0 ? `File: ${Array.from(this.selectedFiles.values())[0].name}` : 'New Chat');
        
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
        if (!this.currentChatId || (!message?.trim() && this.selectedFiles.size === 0)) return;
        
        const chat = this.chats[this.currentChatId];
        if (!chat) return;
        
        const trimmedMessage = message?.trim() || '';
        const attachedFiles = this.selectedFiles.size > 0 ? Array.from(this.selectedFiles.values()) : null;
        
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
            // Route to appropriate API based on selected model
            if (this.selectedModel === 'gemma') {
                return await this.getGroqResponse(message, aiMessage, files);
            } else {
                return await this.getGeminiResponse(message, aiMessage, files);
            }
        } catch (error) {
            console.error('AI Response Error:', error);
            this.handleAIError(aiMessage);
        }
    }

    async getGeminiResponse(message, aiMessage, files = null) {
        try {
            // Use server-side proxy instead of direct API calls
            const modelEndpoint = 'gemini-2.5-flash';
            const url = '/api/gemini';
            
            // Enhance message with file context if files are provided
            let enhancedMessage = message;
            if (files && files.length > 0) {
                const fileDescriptions = files.map(file => `File: ${file.name} (${file.type})`).join(', ');
                enhancedMessage = `Tôi đã đính kèm ${files.length} file(s): ${fileDescriptions}. ${message || 'Hãy phân tích các file này.'}`;
            }
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: enhancedMessage
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
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
                })
            });
            
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            
            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && 
                data.candidates[0].content.parts && data.candidates[0].content.parts[0] && 
                data.candidates[0].content.parts[0].text) {
                
                const aiResponse = data.candidates[0].content.parts[0].text.trim();
                
                if (aiResponse) {
                    aiMessage.content = aiResponse;
                    aiMessage.isTyping = false;
                    aiMessage.isFinalized = false; // Trigger typing animation
                    this.updateMessage(aiMessage);
                    return;
                }
            }
            
            throw new Error('Invalid Gemini response format or empty content');
            
        } catch (error) {
            console.error('Gemini API Error:', error);
            
            const demoResponses = [
                "Xin chào! Tôi là NovaX AI với Google Gemini. Tôi có thể giúp bạn trả lời câu hỏi, giải thích khái niệm, và hỗ trợ học tập.",
                "Đây là phản hồi từ Google Gemini - model AI tiên tiến với khả năng hiểu ngôn ngữ tự nhiên và cung cấp thông tin chính xác.",
                "Tôi có thể giúp bạn với nhiều chủ đề khác nhau như học tập, giải bài tập, tìm hiểu kiến thức, và trò chuyện thông thường. Hãy hỏi tôi bất cứ điều gì!"
            ];
            
            const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
            
            aiMessage.content = randomResponse;
            aiMessage.isTyping = false;
            aiMessage.isFinalized = false; // Trigger typing animation
            this.updateMessage(aiMessage);
        }
    }

    async getGroqResponse(message, aiMessage, files = null) {
        try {
            // Enhance message with file context if files are provided
            let enhancedMessage = message;
            if (files && files.length > 0) {
                const fileDescriptions = files.map(file => `File: ${file.name} (${file.type})`).join(', ');
                enhancedMessage = `Tôi đã đính kèm ${files.length} file(s): ${fileDescriptions}. ${message || 'Hãy phân tích các file này.'}`;
            }

            const response = await fetch('/api/groq', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gemma-7b-it',
                    message: enhancedMessage,
                    temperature: 0.7,
                    max_tokens: 1024,
                    top_p: 0.95
                })
            });

            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }

            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                const aiResponse = data.choices[0].message.content.trim();
                
                if (aiResponse) {
                    aiMessage.content = aiResponse;
                    aiMessage.isTyping = false;
                    aiMessage.isFinalized = false; // Trigger typing animation
                    this.updateMessage(aiMessage);
                    return;
                }
            }
            
            throw new Error('Invalid Groq response format or empty content');
            
        } catch (error) {
            console.error('Groq API Error:', error);
            
            const demoResponses = [
                "Xin chào! Tôi là NovaX AI với Gemma (Google DeepMind). Tôi có thể giúp bạn trả lời câu hỏi, giải thích khái niệm, và hỗ trợ học tập.",
                "Đây là phản hồi từ Gemma - model AI mạnh mẽ của Google DeepMind với khả năng hiểu ngôn ngữ tự nhiên và cung cấp thông tin chính xác.",
                "Tôi có thể giúp bạn với nhiều chủ đề khác nhau như học tập, giải bài tập, tìm hiểu kiến thức, và trò chuyện thông thường. Hãy hỏi tôi bất cứ điều gì!"
            ];
            
            const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
            
            aiMessage.content = randomResponse;
            aiMessage.isTyping = false;
            aiMessage.isFinalized = false; // Trigger typing animation
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
        
        const avatarImg = message.role === 'user' ? 
            '' : '<img src="https://i.postimg.cc/Jyz7fhf8/image.png" alt="AI" class="w-8 h-8 object-contain" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">';
        const fallbackAvatar = message.role === 'user' ? 
            'U' : '<div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg" style="display: none;"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg></div>';
        
        // Generate files display HTML
        const filesHtml = message.files && message.files.length > 0 ? this.renderFilesInMessage(message.files) : '';
        
        messageDiv.innerHTML = '<div class="message-wrapper"><div class="avatar ' + (message.role === 'user' ? 'user-avatar' : 'ai-avatar') + '">' +
            (message.role === 'user' ? 'U' : avatarImg + fallbackAvatar) +
            '</div><div class="message-bubble-content ' + (message.role === 'user' ? 'user-bubble' : 'ai-bubble') + 
            '">' + filesHtml + '<div class="message-content">' +
            (message.isTyping ? '<div class="ai-loading"><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div></div>' : this.formatMessage(message.content)) +
            '</div></div></div>';
        
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
                contentElement.innerHTML = '<div class="ai-loading"><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div></div>';
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
        const words = text.split(' ');
        let currentText = '';
        
        // Add typing cursor
        element.classList.add('typing-cursor');
        element.innerHTML = '';
        
        for (let i = 0; i < words.length; i++) {
            currentText += (i > 0 ? ' ' : '') + words[i];
            element.innerHTML = this.formatMessage(currentText);
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            
            // Adjust speed based on word length and punctuation
            let delay = 50; // Base delay
            const word = words[i];
            if (word.includes('.') || word.includes('!') || word.includes('?')) {
                delay = 200; // Longer pause after sentences
            } else if (word.includes(',') || word.includes(';')) {
                delay = 100; // Medium pause after commas
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Remove typing cursor when done
        element.classList.remove('typing-cursor');
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
            '" onclick="app.loadChat(\'' + chat.id + '\')"><div class="flex items-center justify-between"><div class="flex-1"><div class="font-medium text-sm truncate mb-1">' +
            (chat.isPinned ? '<svg class="w-3 h-3 text-blue-600 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>' : '') + chat.title + 
            '</div><div class="text-xs text-gray-500">' + new Date(chat.createdAt).toLocaleDateString('vi-VN') + 
            '</div></div><div class="flex items-center space-x-1"><button class="p-2 hover:bg-blue-100 rounded-lg transition-colors" onclick="event.stopPropagation(); app.togglePin(\'' + chat.id + '\')" title="' + 
            (chat.isPinned ? 'Bỏ ghim' : 'Ghim cuộc trò chuyện') + '"><svg class="w-4 h-4 ' + (chat.isPinned ? 'text-blue-600' : 'text-gray-400') + '" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>' + 
            '</button><button class="p-2 hover:bg-red-100 rounded-lg transition-colors" onclick="event.stopPropagation(); app.deleteChat(\'' + chat.id + '\')" title="Xóa cuộc trò chuyện"><svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div></div></div>'
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
        localStorage.setItem('novax_dark_mode', this.isDarkMode);
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
        setTimeout(() => {
            const content = document.getElementById('settingsContent');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
    
    hideSettings() {
        const content = document.getElementById('settingsContent');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.settingsModal.classList.add('hidden');
        }, 300);
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
        
        const feedbacks = JSON.parse(localStorage.getItem('novax_feedbacks') || '[]');
        feedbacks.push(feedback);
        localStorage.setItem('novax_feedbacks', JSON.stringify(feedbacks));
        
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
        localStorage.setItem('novax_selected_model', modelType);
        
        const modelNames = {
            'gemini-flash': 'Gemini Flash 2.5'
        };
        
        this.showNotification('Đã chuyển sang ' + (modelNames[modelType] || modelType) + '!', 'success');
    }
    
    loadModelSelection() {
        const modelRadio = document.querySelector('input[name="aiModel"][value="' + this.selectedModel + '"]');
        if (modelRadio) {
            modelRadio.checked = true;
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
    
    saveChats() {
        localStorage.setItem('novax_chats', JSON.stringify(this.chats));
    }
}

// Initialize the app
const app = new NovaXChat();