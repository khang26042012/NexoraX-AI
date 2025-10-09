/**
 * CHAT-APP.JS - Main NexoraXChat class
 * 
 * Class chính của ứng dụng, tổng hợp tất cả các module:
 * - Initialize app state
 * - Coordinate các modules
 * - Provide public API cho HTML/DOM
 */

import { configureMarked } from './message-formatter.js';
import { renderMessage, updateMessage, renderDualChatLayout } from './message-renderer.js';
import { 
    getGeminiResponse, 
    getLLM7Response,
    getLLM7GPT5ChatResponse,
    getLLM7GeminiSearchResponse,
    getImageGenerationResponse,
    prepareConversationHistoryGemini,
    prepareConversationHistoryLLM7
} from './ai-api.js';
import { 
    loadChatsFromStorage, 
    saveChatsToStorage, 
    clearAllChats,
    createNewChat,
    getChatById,
    deleteChat,
    togglePinChat,
    renderChatList
} from './chat-manager.js';
import {
    toggleSidebar,
    closeSidebar,
    toggleDesktopSidebar,
    initializeDesktopSidebar,
    showHomeScreen,
    showChatScreen,
    toggleTheme,
    loadTheme,
    getCurrentTheme,
    showModal,
    hideModal,
    showSettings,
    hideSettings,
    showNotification,
    toggleModelOptions
} from './ui-manager.js';
import {
    checkUserSession,
    handleLogin,
    handleSignup,
    handleLogout,
    updateUIForLoggedInUser,
    updateUIForLoggedOutUser,
    setupUserMenuDropdown
} from './auth-manager.js';
import {
    handleFileSelection,
    clearSelectedFiles,
    removeFile,
    updateFilePreviewList,
    showFilePreview,
    hideFilePreview,
    openImageModal,
    closeImageModal
} from './file-upload.js';
import {
    initializeSpeechRecognition,
    toggleVoiceRecording
} from './voice-manager.js';
import {
    loadDualChatMode,
    saveDualChatMode,
    loadDualChatModels,
    saveDualChatModels,
    toggleDualMode,
    loadDualModeState
} from './dual-chat.js';
import {
    setupMainEventListeners,
    setupFileUploadListeners,
    setupVoiceRecordingListeners,
    setupAuthEventListeners,
    setupTextareaAutoExpand
} from './event-handlers.js';
import { 
    STORAGE_KEYS, 
    MODEL_NAMES,
    DUAL_CHAT_MODELS,
    DEFAULTS 
} from './constants.js';
import { migrateLocalStorageKeys, isTimeRelatedQuery, isSearchQuery, extractSearchQuery } from './utils.js';

/**
 * NexoraXChat - Main application class
 */
export class NexoraXChat {
    constructor() {
        // Configure marked.js
        configureMarked();
        
        // Migrate localStorage keys
        migrateLocalStorageKeys();
        
        // State
        this.currentChatId = null;
        this.chats = loadChatsFromStorage();
        this.isDarkMode = getCurrentTheme();
        this.currentRating = 0;
        this.selectedModel = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || DEFAULTS.MODEL;
        localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, this.selectedModel);
        this.selectedFiles = new Map();
        
        // Dual Chat Mode
        this.dualChatMode = loadDualChatMode();
        const dualModels = loadDualChatModels();
        this.dualChatPrimaryModel = dualModels.primaryModel;
        this.dualChatSecondaryModel = dualModels.secondaryModel;
        
        // Special mode toggles
        this.previousModelBeforeImageGen = null;
        this.previousModelBeforeSearch = null;
        
        // Initialize
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSpeechRecognition();
        this.loadTheme();
        this.loadModelSelection();
        this.loadDualModeState();
        this.initializeDesktopSidebar();
        this.renderChatList();
        
        // Authentication - check session
        this.checkUserSession();
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
        this.authModal = document.getElementById('authModal');
        this.filePreviewModal = document.getElementById('filePreviewModal');
        this.filePreviewList = document.getElementById('filePreviewList');
        this.homeFileInput = document.getElementById('homeFileInput');
        this.chatFileInput = document.getElementById('chatFileInput');
        
        // Model selectors
        this.homeModelSelector = document.getElementById('homeModelSelector');
        this.chatModelSelector = document.getElementById('chatModelSelector');
    }
    
    setupEventListeners() {
        setupMainEventListeners(this);
        setupFileUploadListeners(this);
        setupVoiceRecordingListeners(this);
        setupAuthEventListeners(this);
        setupTextareaAutoExpand();
    }
    
    // ===================================
    // UI METHODS (delegate to ui-manager)
    // ===================================
    
    toggleSidebar() {
        toggleSidebar(this.sidebar);
    }
    
    closeSidebar() {
        closeSidebar(this.sidebar);
    }
    
    toggleDesktopSidebar() {
        toggleDesktopSidebar(this.sidebar);
    }
    
    initializeDesktopSidebar() {
        initializeDesktopSidebar(this.sidebar);
    }
    
    showHomeScreen() {
        showHomeScreen(this.homeScreen, this.chatScreen);
        this.currentChatId = null;
        this.homeInput.value = '';
        this.homeInput.focus();
    }
    
    showChatScreen() {
        showChatScreen(this.homeScreen, this.chatScreen);
        this.chatInput.focus();
    }
    
    toggleTheme() {
        this.isDarkMode = toggleTheme();
    }
    
    loadTheme() {
        loadTheme(this.isDarkMode);
    }
    
    showSettings() {
        showSettings();
    }
    
    hideSettings() {
        hideSettings();
    }
    
    showAbout() {
        showModal(this.aboutModal, document.getElementById('aboutContent'));
    }
    
    hideAbout() {
        hideModal(this.aboutModal, document.getElementById('aboutContent'));
    }
    
    showClearAllConfirmation() {
        showModal(this.clearAllModal, document.getElementById('clearAllContent'));
    }
    
    hideClearAllConfirmation() {
        hideModal(this.clearAllModal, document.getElementById('clearAllContent'));
    }
    
    showFeedback() {
        this.currentRating = 0;
        this.resetStarHighlight();
        document.getElementById('feedbackText').value = '';
        document.getElementById('ratingText').textContent = 'Nhấn vào sao để đánh giá';
        showModal(this.feedbackModal, document.getElementById('feedbackContent'));
    }
    
    hideFeedback() {
        hideModal(this.feedbackModal, document.getElementById('feedbackContent'));
    }
    
    toggleModelOptions() {
        toggleModelOptions();
    }
    
    // ===================================
    // CHAT METHODS (delegate to chat-manager)
    // ===================================
    
    startNewChat(message) {
        this.currentChatId = null;
        this.messagesContainer.innerHTML = '';
        
        const chat = createNewChat(message);
        this.currentChatId = chat.id;
        this.chats[chat.id] = chat;
        
        this.showChatScreen();
        this.renderChatList();
        
        this.sendMessage(message);
    }
    
    loadChat(chatId) {
        const chat = getChatById(this.chats, chatId);
        if (!chat) return;
        
        this.currentChatId = chatId;
        this.showChatScreen();
        
        if (this.dualChatMode) {
            renderDualChatLayout(chat, this.getContext());
        } else {
            this.messagesContainer.innerHTML = '';
            chat.messages.forEach(message => this.renderMessage(message));
        }
        
        this.renderChatList();
        
        if (window.innerWidth < 1024) {
            this.closeSidebar();
        }
    }
    
    deleteChat(chatId) {
        const deleted = deleteChat(this.chats, chatId, (msg) => confirm(msg));
        if (deleted) {
            this.saveChats();
            this.renderChatList();
            
            if (this.currentChatId === chatId) {
                this.showHomeScreen();
            }
        }
    }
    
    togglePin(chatId) {
        togglePinChat(this.chats, chatId);
        this.saveChats();
        this.renderChatList();
    }
    
    clearAllChats() {
        clearAllChats(() => {
            this.chats = {};
            this.renderChatList();
            this.showHomeScreen();
            this.hideClearAllConfirmation();
            showNotification('Đã xóa tất cả cuộc trò chuyện!', 'success');
        });
    }
    
    renderChatList() {
        renderChatList(
            this.chats, 
            this.currentChatId, 
            this.chatList,
            (chatId) => this.loadChat(chatId),
            (chatId) => this.deleteChat(chatId),
            (chatId) => this.togglePin(chatId)
        );
    }
    
    saveChats() {
        saveChatsToStorage(this.chats);
    }
    
    // ===================================
    // MESSAGE METHODS
    // ===================================
    
    async sendMessage(message) {
        if (!message && this.selectedFiles.size === 0) return;
        
        const chat = this.chats[this.currentChatId];
        if (!chat) return;
        
        // Xử lý files đính kèm
        const attachedFiles = Array.from(this.selectedFiles.values());
        
        // Tạo user message
        const userMessage = {
            id: Date.now() + '_user',
            role: 'user',
            content: message || '',
            timestamp: new Date().toISOString(),
            files: attachedFiles.length > 0 ? attachedFiles : null
        };
        
        chat.messages.push(userMessage);
        this.renderMessage(userMessage);
        
        // Clear input và files
        this.chatInput.value = '';
        this.selectedFiles.clear();
        this.updateFilePreviewList();
        
        // Reset file inputs
        if (this.homeFileInput) this.homeFileInput.value = '';
        if (this.chatFileInput) this.chatFileInput.value = '';
        
        // Xử lý theo mode
        if (this.dualChatMode) {
            await this.sendDualChatMessage(message, attachedFiles, chat);
        } else {
            await this.sendSingleMessage(message, attachedFiles, chat);
        }
    }
    
    async sendSingleMessage(message, attachedFiles, chat) {
        // Tạo AI message placeholder
        const aiMessage = {
            id: Date.now() + '_ai',
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isTyping: true,
            model: this.selectedModel
        };
        
        chat.messages.push(aiMessage);
        this.renderMessage(aiMessage);
        
        try {
            const modelType = this.getModelType(this.selectedModel);
            
            if (modelType === 'gemini') {
                const conversationHistory = prepareConversationHistoryGemini(chat.messages, 20);
                await getGeminiResponse(message, aiMessage, attachedFiles, conversationHistory, (msg) => this.updateMessage(msg));
            } else if (modelType === 'llm7') {
                const conversationHistory = prepareConversationHistoryLLM7(chat.messages, 15);
                await getLLM7Response(this.selectedModel, message, aiMessage, conversationHistory, (msg) => this.updateMessage(msg));
            } else if (modelType === 'gpt5') {
                const conversationHistory = prepareConversationHistoryLLM7(chat.messages, 15);
                await getLLM7GPT5ChatResponse(message, aiMessage, conversationHistory, (msg) => this.updateMessage(msg));
            } else if (modelType === 'search') {
                const conversationHistory = prepareConversationHistoryLLM7(chat.messages, 15);
                await getLLM7GeminiSearchResponse(message, aiMessage, conversationHistory, (msg) => this.updateMessage(msg));
            } else if (modelType === 'image') {
                await getImageGenerationResponse(message, aiMessage, (msg) => this.updateMessage(msg));
            }
        } finally {
            this.saveChats();
        }
    }
    
    async sendDualChatMessage(message, attachedFiles, chat) {
        // Tạo 2 AI message placeholders
        const primaryMessage = {
            id: Date.now() + '_primary',
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isTyping: true,
            model: this.dualChatPrimaryModel,
            isPrimary: true
        };
        
        const secondaryMessage = {
            id: Date.now() + '_secondary',
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isTyping: true,
            model: this.dualChatSecondaryModel,
            isPrimary: false
        };
        
        chat.messages.push(primaryMessage, secondaryMessage);
        this.renderMessage(primaryMessage);
        this.renderMessage(secondaryMessage);
        
        try {
            const primaryType = this.getModelType(this.dualChatPrimaryModel);
            const secondaryType = this.getModelType(this.dualChatSecondaryModel);
            const conversationHistoryGemini = prepareConversationHistoryGemini(chat.messages, 20);
            const conversationHistoryLLM7 = prepareConversationHistoryLLM7(chat.messages, 15);
            
            await Promise.allSettled([
                this.getDualModelResponse(this.dualChatPrimaryModel, primaryType, message, primaryMessage, attachedFiles, conversationHistoryGemini, conversationHistoryLLM7).catch(error => {
                    console.error(`${this.dualChatPrimaryModel} Error in dual mode:`, error);
                    primaryMessage.content = `Xin lỗi, ${this.getModelDisplayName(this.dualChatPrimaryModel)} gặp lỗi. Vui lòng thử lại.`;
                    primaryMessage.isTyping = false;
                    this.updateMessage(primaryMessage);
                }),
                this.getDualModelResponse(this.dualChatSecondaryModel, secondaryType, message, secondaryMessage, attachedFiles, conversationHistoryGemini, conversationHistoryLLM7).catch(error => {
                    console.error(`${this.dualChatSecondaryModel} Error in dual mode:`, error);
                    secondaryMessage.content = `Xin lỗi, ${this.getModelDisplayName(this.dualChatSecondaryModel)} gặp lỗi. Vui lòng thử lại.`;
                    secondaryMessage.isTyping = false;
                    this.updateMessage(secondaryMessage);
                })
            ]);
        } finally {
            this.saveChats();
        }
    }
    
    async getDualModelResponse(modelId, modelType, message, aiMessage, files, conversationHistoryGemini, conversationHistoryLLM7) {
        if (modelType === 'gemini') {
            return await getGeminiResponse(message, aiMessage, files, conversationHistoryGemini, (msg) => this.updateMessage(msg));
        } else if (modelType === 'search') {
            return await getLLM7GeminiSearchResponse(message, aiMessage, conversationHistoryLLM7, (msg) => this.updateMessage(msg));
        } else if (modelType === 'llm7') {
            return await getLLM7Response(modelId, message, aiMessage, conversationHistoryLLM7, (msg) => this.updateMessage(msg));
        } else if (modelType === 'gpt5') {
            return await getLLM7GPT5ChatResponse(message, aiMessage, conversationHistoryLLM7, (msg) => this.updateMessage(msg));
        } else if (modelType === 'image') {
            return await getImageGenerationResponse(message, aiMessage, (msg) => this.updateMessage(msg));
        }
    }
    
    renderMessage(message) {
        renderMessage(message, this.getContext());
    }
    
    updateMessage(message) {
        updateMessage(message, this.getContext());
    }
    
    // ===================================
    // FILE UPLOAD METHODS (delegate to file-upload.js)
    // ===================================
    
    async handleFileSelection(files) {
        await handleFileSelection(files, this.selectedFiles, () => {
            this.updateFilePreviewList();
            if (this.selectedFiles.size > 0) {
                showFilePreview(this.filePreviewModal);
            }
        });
    }
    
    clearSelectedFiles() {
        clearSelectedFiles(this.selectedFiles, () => this.updateFilePreviewList());
    }
    
    removeFile(fileId) {
        removeFile(this.selectedFiles, fileId, () => {
            this.updateFilePreviewList();
            if (this.selectedFiles.size === 0) {
                this.hideFilePreview();
            }
        });
    }
    
    updateFilePreviewList() {
        updateFilePreviewList(this.selectedFiles, this.filePreviewList, (fileId) => this.removeFile(fileId));
    }
    
    showFilePreview() {
        showFilePreview(this.filePreviewModal);
    }
    
    hideFilePreview() {
        hideFilePreview(this.filePreviewModal);
    }
    
    openImageModal(imageSrc, imageTitle) {
        openImageModal(imageSrc, imageTitle);
    }
    
    closeImageModal() {
        closeImageModal();
    }
    
    // ===================================
    // VOICE METHODS (delegate to voice-manager.js)
    // ===================================
    
    initializeSpeechRecognition() {
        initializeSpeechRecognition();
    }
    
    toggleVoiceRecording(inputElement, voiceButton) {
        toggleVoiceRecording(inputElement, voiceButton);
    }
    
    // ===================================
    // DUAL CHAT METHODS (delegate to dual-chat.js)
    // ===================================
    
    toggleDualMode() {
        this.dualChatMode = toggleDualMode(this.dualChatMode, this.getContext());
    }
    
    loadDualModeState() {
        loadDualModeState(this.dualChatMode);
    }
    
    saveDualChatModels() {
        saveDualChatModels(this.dualChatPrimaryModel, this.dualChatSecondaryModel);
    }
    
    // ===================================
    // AUTH METHODS (delegate to auth-manager.js)
    // ===================================
    
    checkUserSession() {
        checkUserSession(
            (username) => {
                updateUIForLoggedInUser(username);
                setupUserMenuDropdown(() => this.handleLogout());
            },
            () => {
                setTimeout(() => this.showAuthModal(), 500);
            }
        );
    }
    
    showAuthModal() {
        showModal(this.authModal, document.getElementById('authContent'));
    }
    
    hideAuthModal() {
        hideModal(this.authModal, document.getElementById('authContent'));
    }
    
    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        
        await handleLogin(username, password, rememberMe, 
            (user) => {
                updateUIForLoggedInUser(user);
                setupUserMenuDropdown(() => this.handleLogout());
                this.hideAuthModal();
                
                // Clear inputs
                document.getElementById('loginUsername').value = '';
                document.getElementById('loginPassword').value = '';
                if (document.getElementById('rememberMe')) {
                    document.getElementById('rememberMe').checked = false;
                }
            }
        );
    }
    
    async handleSignup(type) {
        let username, password, email = null;
        
        if (type === 'email') {
            email = document.getElementById('signupEmail').value.trim();
            username = document.getElementById('signupEmailUsername').value.trim();
            password = document.getElementById('signupEmailPassword').value.trim();
        } else {
            username = document.getElementById('signupUsernameOnly').value.trim();
            password = document.getElementById('signupUsernamePassword').value.trim();
        }
        
        await handleSignup({ username, password, email },
            (user) => {
                updateUIForLoggedInUser(user);
                setupUserMenuDropdown(() => this.handleLogout());
                this.hideAuthModal();
                
                // Clear inputs
                if (type === 'email') {
                    document.getElementById('signupEmail').value = '';
                    document.getElementById('signupEmailUsername').value = '';
                    document.getElementById('signupEmailPassword').value = '';
                } else {
                    document.getElementById('signupUsernameOnly').value = '';
                    document.getElementById('signupUsernamePassword').value = '';
                }
            }
        );
    }
    
    async handleLogout() {
        await handleLogout(
            () => {
                setTimeout(() => this.showAuthModal(), 1000);
                updateUIForLoggedOutUser();
            }
        );
    }
    
    // ===================================
    // FEEDBACK & RATING
    // ===================================
    
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
            showNotification('Vui lòng chọn số sao đánh giá!', 'error');
            return;
        }
        
        const feedback = {
            rating: this.currentRating,
            comment: feedbackText,
            timestamp: new Date().toISOString()
        };
        
        const feedbacks = JSON.parse(localStorage.getItem(STORAGE_KEYS.FEEDBACKS) || '[]');
        feedbacks.push(feedback);
        localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(feedbacks));
        
        this.hideFeedback();
        showNotification('Cảm ơn bạn đã đánh giá! 🙏', 'success');
    }
    
    // ===================================
    // MODEL SELECTION
    // ===================================
    
    changeModel(modelId) {
        this.selectedModel = modelId;
        localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, modelId);
        this.loadModelSelection();
    }
    
    loadModelSelection() {
        document.querySelectorAll('input[name="aiModel"]').forEach(radio => {
            radio.checked = radio.value === this.selectedModel;
        });
        
        if (this.homeModelSelector) {
            this.homeModelSelector.value = this.selectedModel;
        }
        
        if (this.chatModelSelector) {
            this.chatModelSelector.value = this.selectedModel;
        }
    }
    
    getModelType(modelId) {
        if (modelId === 'nexorax1') return 'gemini';
        if (modelId === 'gpt-5-chat' || modelId === 'gpt-5-mini' || modelId === 'gpt-5-nano-2025-08-07' || modelId === 'gpt-o4-mini-2025-04-16') return 'gpt5';
        if (modelId === 'gemini-search') return 'search';
        if (modelId === 'image-gen') return 'image';
        return 'llm7';
    }
    
    getModelDisplayName(modelId) {
        return MODEL_NAMES[modelId] || modelId;
    }
    
    // ===================================
    // TYPEWRITER EFFECT
    // ===================================
    
    async typewriterEffect(element, text, onComplete = null) {
        // Check if user prefers reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            element.innerHTML = marked.parse(text);
            if (onComplete) onComplete();
            return;
        }
        
        // Cancel existing typewriter
        if (element.dataset.typewriterActive === 'true') {
            element.dataset.cancelled = 'true';
            return;
        }
        
        let currentText = '';
        element.dataset.typewriterActive = 'true';
        element.dataset.cancelled = 'false';
        
        // Add typing effect
        element.classList.add('ai-typing');
        element.innerHTML = '';
        
        const cursor = document.createElement('span');
        cursor.classList.add('typing-cursor');
        
        // Type character by character
        for (let i = 0; i < text.length; i++) {
            if (element.dataset.cancelled === 'true') break;
            
            currentText += text[i];
            element.innerHTML = marked.parse(currentText);
            element.appendChild(cursor);
            
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            
            await new Promise(resolve => setTimeout(resolve, 40));
        }
        
        // Final cleanup
        element.innerHTML = marked.parse(currentText);
        element.classList.remove('ai-typing');
        
        setTimeout(() => {
            if (cursor.parentElement) cursor.remove();
        }, 500);
        
        delete element.dataset.typewriterActive;
        delete element.dataset.cancelled;
        
        if (onComplete) onComplete();
    }
    
    // ===================================
    // HELPER METHODS
    // ===================================
    
    getContext() {
        return {
            messagesContainer: this.messagesContainer,
            dualChatMode: this.dualChatMode,
            dualChatPrimaryModel: this.dualChatPrimaryModel,
            dualChatSecondaryModel: this.dualChatSecondaryModel,
            DUAL_CHAT_MODELS: DUAL_CHAT_MODELS,
            typewriterEffect: (elem, text, cb) => this.typewriterEffect(elem, text, cb),
            saveDualChatModels: () => this.saveDualChatModels(),
            renderMessage: (msg) => this.renderMessage(msg),
            renderDualChatLayout: (chat, ctx) => renderDualChatLayout(chat, ctx)
        };
    }
}
