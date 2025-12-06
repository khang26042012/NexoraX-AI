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
    toggleSidebar as uiToggleSidebar,
    closeSidebar as uiCloseSidebar,
    toggleDesktopSidebar as uiToggleDesktopSidebar,
    initializeDesktopSidebar as uiInitializeDesktopSidebar,
    showHomeScreen as uiShowHomeScreen,
    showChatScreen as uiShowChatScreen,
    toggleTheme as uiToggleTheme,
    loadTheme as uiLoadTheme,
    getCurrentTheme,
    showModal,
    hideModal,
    showSettings as uiShowSettings,
    hideSettings as uiHideSettings,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    showNotification,
    toggleModelOptions as uiToggleModelOptions
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
    handleFileSelection as fileHandleFileSelection,
    clearSelectedFiles as fileClearSelectedFiles,
    removeFile as fileRemoveFile,
    updateFilePreviewList as fileUpdateFilePreviewList,
    showFilePreview as fileShowFilePreview,
    hideFilePreview as fileHideFilePreview,
    openImageModal as fileOpenImageModal,
    closeImageModal as fileCloseImageModal
} from './file-upload.js';
import {
    initializeSpeechRecognition as voiceInitializeSpeechRecognition,
    toggleVoiceRecording as voiceToggleVoiceRecording
} from './voice-manager.js';
import {
    loadDualChatMode,
    saveDualChatMode,
    loadDualChatModels,
    saveDualChatModels,
    toggleDualMode as dualToggleDualMode,
    loadDualModeState as dualLoadDualModeState,
    updateDualChatLockState
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
    DEFAULTS,
    TYPING_SPEEDS
} from './constants.js';
import { migrateLocalStorageKeys, isTimeRelatedQuery, isSearchQuery, extractSearchQuery, shouldSearchWeb } from './utils.js';
import { startOnboardingManually } from './onboarding.js';

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
        
        // GIỮ LẠI state khi reload - không restore về model cũ
        // (chỉ restore khi user chủ động tắt mode)
        this.selectedFiles = new Map();
        
        // Dual Chat Mode
        this.dualChatMode = loadDualChatMode();
        const dualModels = loadDualChatModels();
        this.dualChatPrimaryModel = dualModels.primaryModel;
        this.dualChatSecondaryModel = dualModels.secondaryModel;
        
        // Initialize
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSpeechRecognition();
        this.loadTheme();
        this.loadModelSelection();
        this.loadDualModeState();
        this.loadSettingsState();
        this.initializeDesktopSidebar();
        this.renderChatList();
        
        // Authentication - check session
        this.checkUserSession();
        
        // TỰ ĐỘNG TẮT dual chat nếu đang ở home (không có active chat)
        // Fix: Khi reload trang ở home, dual chat nên tự động tắt
        if (this.dualChatMode && !this.currentChatId) {
            this.disableDualChatMode();
        }
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
        this.homeFilePreview = document.getElementById('homeFilePreview');
        this.chatFilePreview = document.getElementById('chatFilePreview');
        
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
        uiToggleSidebar(this.sidebar);
    }
    
    closeSidebar() {
        uiCloseSidebar(this.sidebar);
    }
    
    toggleDesktopSidebar() {
        uiToggleDesktopSidebar(this.sidebar);
    }
    
    initializeDesktopSidebar() {
        uiInitializeDesktopSidebar(this.sidebar);
    }
    
    showHomeScreen() {
        uiShowHomeScreen(this.homeScreen, this.chatScreen);
        this.currentChatId = null;
        this.homeInput.value = '';
        this.homeInput.focus();
        
        // Hiện dual chat buttons khi về home
        const homeDualModeBtn = document.getElementById('homeDualModeBtn');
        const chatDualModeBtn = document.getElementById('chatDualModeBtn');
        if (homeDualModeBtn) homeDualModeBtn.style.display = '';
        if (chatDualModeBtn) chatDualModeBtn.style.display = '';
        
        // RESTORE MODEL khi về home từ các chế độ đặc biệt
        if (this.selectedModel === 'image-gen') {
            // Restore model cũ từ localStorage
            const modelToRestore = localStorage.getItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_IMAGE_GEN) || 'gpt-5-chat';
            this.changeModel(modelToRestore);
            localStorage.removeItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_IMAGE_GEN);
            
            // Deactivate config buttons
            document.querySelectorAll('.config-option[data-action="image-gen"]').forEach(btn => {
                btn.classList.remove('active-config');
            });
        } else if (this.selectedModel === 'gemini-search') {
            // Restore model cũ từ localStorage
            const modelToRestore = localStorage.getItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_SEARCH) || 'gpt-5-chat';
            this.changeModel(modelToRestore);
            localStorage.removeItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_SEARCH);
            
            // Deactivate config buttons
            document.querySelectorAll('.config-option[data-action="search"]').forEach(btn => {
                btn.classList.remove('active-config');
            });
        }
        
        // TẮT DUAL CHAT MODE tự động khi về home
        this.disableDualChatMode();
    }
    
    showChatScreen() {
        uiShowChatScreen(this.homeScreen, this.chatScreen);
        this.chatInput.focus();
    }
    
    toggleTheme() {
        this.isDarkMode = uiToggleTheme();
    }
    
    loadTheme() {
        uiLoadTheme(this.isDarkMode);
    }
    
    showSettings() {
        uiShowSettings();
    }
    
    hideSettings() {
        uiHideSettings();
    }
    
    showAbout() {
        showModal(this.aboutModal, document.getElementById('aboutContent'));
    }
    
    hideAbout() {
        hideModal(this.aboutModal, document.getElementById('aboutContent'));
    }
    
    showClearAllConfirmation() {
        showDeleteConfirmation();
    }
    
    hideClearAllConfirmation() {
        hideDeleteConfirmation();
    }
    
    toggleNotifications() {
        const isEnabled = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED) !== 'false';
        const newState = !isEnabled;
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, String(newState));
        
        const track = document.getElementById('notificationTrack');
        if (track) {
            if (newState) {
                track.parentElement.parentElement.classList.add('dark');
            } else {
                track.parentElement.parentElement.classList.remove('dark');
            }
        }
        
        showNotification(
            newState ? 'Đã bật thông báo' : 'Đã tắt thông báo',
            'success'
        );
    }
    
    toggleAutoSave() {
        const isEnabled = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE_CHAT) === 'true';
        const newState = !isEnabled;
        localStorage.setItem(STORAGE_KEYS.AUTO_SAVE_CHAT, String(newState));
        
        const track = document.getElementById('autoSaveTrack');
        if (track) {
            if (newState) {
                track.parentElement.parentElement.classList.add('dark');
            } else {
                track.parentElement.parentElement.classList.remove('dark');
            }
        }
        
        showNotification(
            newState ? 'Đã bật tự động lưu chat' : 'Đã tắt tự động lưu chat',
            'success'
        );
    }
    
    loadSettingsState() {
        const notificationsEnabled = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED) !== 'false';
        const autoSaveEnabled = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE_CHAT) === 'true';
        
        const notificationTrack = document.getElementById('notificationTrack');
        if (notificationTrack) {
            if (notificationsEnabled) {
                notificationTrack.parentElement.parentElement.classList.add('dark');
            } else {
                notificationTrack.parentElement.parentElement.classList.remove('dark');
            }
        }
        
        const autoSaveTrack = document.getElementById('autoSaveTrack');
        if (autoSaveTrack) {
            if (autoSaveEnabled) {
                autoSaveTrack.parentElement.parentElement.classList.add('dark');
            } else {
                autoSaveTrack.parentElement.parentElement.classList.remove('dark');
            }
        }
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
        uiToggleModelOptions();
    }
    
    // ===================================
    // CHAT METHODS (delegate to chat-manager)
    // ===================================
    
    startNewChat(message) {
        this.currentChatId = null;
        
        const chat = createNewChat(message);
        this.currentChatId = chat.id;
        this.chats[chat.id] = chat;
        
        // Reset homeInput sau khi lấy message
        if (this.homeInput) {
            this.homeInput.value = '';
            this.homeInput.style.height = 'auto';
            this.homeInput.style.height = '';
        }
        
        this.showChatScreen();
        
        if (this.dualChatMode) {
            renderDualChatLayout(chat, this.getContext());
        } else {
            this.messagesContainer.innerHTML = '';
        }
        
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
        
        // Check if this is a normal chat (has messages but not dual)
        const isNormalChat = chat.messages && chat.messages.length > 0 && !chat.messages.some(msg => 
            msg.role === 'assistant' && (msg.isPrimary !== undefined)
        );
        
        // Ẩn/hiện dual chat buttons
        this.updateDualChatButtonVisibility(isNormalChat, chat);
        
        // Update config/model visibility dựa vào dual mode
        this.updateConfigAndModelVisibility(this.dualChatMode);
        
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
        
        // Update dual chat button visibility (ẩn nếu đang ở chat thường)
        if (!this.dualChatMode) {
            // Check if this is a normal chat (has messages but not dual)
            const isNormalChat = chat.messages.length > 0 && !chat.messages.some(msg => 
                msg.role === 'assistant' && (msg.isPrimary !== undefined)
            );
            this.updateDualChatButtonVisibility(isNormalChat, chat);
        }
        
        // Clear input và files
        this.chatInput.value = '';
        // Reset textarea height về ban đầu
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = ''; // Reset về CSS default
        this.selectedFiles.clear();
        this.updateInlineFilePreview();
        
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
                await getLLM7Response(this.selectedModel, message, aiMessage, attachedFiles, conversationHistory, (msg) => this.updateMessage(msg));
            } else if (modelType === 'gpt5') {
                const conversationHistory = prepareConversationHistoryLLM7(chat.messages, 15);
                await getLLM7GPT5ChatResponse(message, aiMessage, attachedFiles, conversationHistory, (msg) => this.updateMessage(msg));
            } else if (modelType === 'search') {
                const conversationHistory = prepareConversationHistoryLLM7(chat.messages, 15);
                
                // Kiểm tra xem tin nhắn có CẦN tìm kiếm web không
                // Nếu là chào hỏi/small talk → gọi chat API thường (không search)
                // Nếu cần thông tin thực tế → gọi search API
                if (shouldSearchWeb(message)) {
                    // Tin nhắn cần tìm kiếm web (tin tức, thông tin, giá cả...)
                    console.log('[Gemini Search] Tin nhắn cần search web:', message);
                    await getLLM7GeminiSearchResponse(message, aiMessage, attachedFiles, conversationHistory, (msg) => this.updateMessage(msg));
                } else {
                    // Tin nhắn không cần search (chào hỏi, small talk...)
                    // Gọi Gemini 2.5 Flash Lite qua LLM7 chat API
                    console.log('[Gemini Search] Tin nhắn không cần search, dùng chat thường:', message);
                    await getLLM7Response('gemini-2.5-flash-lite', message, aiMessage, attachedFiles, conversationHistory, (msg) => this.updateMessage(msg));
                }
            } else if (modelType === 'image') {
                await getImageGenerationResponse(message, aiMessage, (msg) => this.updateMessage(msg));
            }
        } finally {
            this.saveChats();
        }
    }
    
    async sendDualChatMessage(message, attachedFiles, chat) {
        // QUAN TRỌNG: Reload models từ localStorage để đảm bảo dùng đúng model đã chọn
        const savedModels = loadDualChatModels();
        // Chỉ cập nhật nếu có giá trị hợp lệ, nếu không giữ nguyên giá trị hiện tại
        if (savedModels.primaryModel) {
            this.dualChatPrimaryModel = savedModels.primaryModel;
        }
        if (savedModels.secondaryModel) {
            this.dualChatSecondaryModel = savedModels.secondaryModel;
        }
        
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
            
            // DUAL CHAT: Mỗi model chỉ nhận được history của riêng nó
            // Primary: user messages + primary AI responses (isPrimary=true)
            // Secondary: user messages + secondary AI responses (isPrimary=false)
            const primaryHistory = chat.messages.filter(msg => 
                msg.role === 'user' || (msg.role === 'assistant' && msg.isPrimary === true)
            );
            const secondaryHistory = chat.messages.filter(msg => 
                msg.role === 'user' || (msg.role === 'assistant' && msg.isPrimary === false)
            );
            
            const conversationHistoryGeminiPrimary = prepareConversationHistoryGemini(primaryHistory, 20);
            const conversationHistoryLLM7Primary = prepareConversationHistoryLLM7(primaryHistory, 15);
            const conversationHistoryGeminiSecondary = prepareConversationHistoryGemini(secondaryHistory, 20);
            const conversationHistoryLLM7Secondary = prepareConversationHistoryLLM7(secondaryHistory, 15);
            
            await Promise.allSettled([
                this.getDualModelResponse(this.dualChatPrimaryModel, primaryType, message, primaryMessage, attachedFiles, conversationHistoryGeminiPrimary, conversationHistoryLLM7Primary).catch(error => {
                    console.error(`${this.dualChatPrimaryModel} Error in dual mode:`, error);
                    primaryMessage.content = `Xin lỗi, ${this.getModelDisplayName(this.dualChatPrimaryModel)} gặp lỗi. Vui lòng thử lại.`;
                    primaryMessage.isTyping = false;
                    this.updateMessage(primaryMessage);
                }),
                this.getDualModelResponse(this.dualChatSecondaryModel, secondaryType, message, secondaryMessage, attachedFiles, conversationHistoryGeminiSecondary, conversationHistoryLLM7Secondary).catch(error => {
                    console.error(`${this.dualChatSecondaryModel} Error in dual mode:`, error);
                    secondaryMessage.content = `Xin lỗi, ${this.getModelDisplayName(this.dualChatSecondaryModel)} gặp lỗi. Vui lòng thử lại.`;
                    secondaryMessage.isTyping = false;
                    this.updateMessage(secondaryMessage);
                })
            ]);
        } finally {
            this.saveChats();
            // Update dual chat lock state sau khi gửi tin nhắn
            updateDualChatLockState(chat, this.dualChatMode);
        }
    }
    
    async getDualModelResponse(modelId, modelType, message, aiMessage, files, conversationHistoryGemini, conversationHistoryLLM7) {
        if (modelType === 'gemini') {
            return await getGeminiResponse(message, aiMessage, files, conversationHistoryGemini, (msg) => this.updateMessage(msg));
        } else if (modelType === 'search') {
            return await getLLM7GeminiSearchResponse(message, aiMessage, files, conversationHistoryLLM7, (msg) => this.updateMessage(msg));
        } else if (modelType === 'llm7') {
            return await getLLM7Response(modelId, message, aiMessage, files, conversationHistoryLLM7, (msg) => this.updateMessage(msg));
        } else if (modelType === 'gpt5') {
            return await getLLM7GPT5ChatResponse(message, aiMessage, files, conversationHistoryLLM7, (msg) => this.updateMessage(msg));
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
        await fileHandleFileSelection(files, this.selectedFiles, () => {
            this.updateInlineFilePreview();
        });
    }
    
    clearSelectedFiles() {
        fileClearSelectedFiles(this.selectedFiles, () => this.updateInlineFilePreview());
    }
    
    removeFile(fileId) {
        fileRemoveFile(this.selectedFiles, fileId, () => {
            this.updateInlineFilePreview();
        });
    }
    
    updateFilePreviewList() {
        fileUpdateFilePreviewList(this.selectedFiles, this.filePreviewList, (fileId) => this.removeFile(fileId));
    }
    
    updateInlineFilePreview() {
        const isHome = !this.chatScreen || this.chatScreen.classList.contains('hidden');
        const previewContainer = isHome ? this.homeFilePreview : this.chatFilePreview;
        
        if (!previewContainer) return;
        
        if (this.selectedFiles.size === 0) {
            previewContainer.classList.add('hidden');
            previewContainer.innerHTML = '';
            return;
        }
        
        previewContainer.classList.remove('hidden');
        
        const filesArray = Array.from(this.selectedFiles.values());
        previewContainer.innerHTML = filesArray.map(file => {
            const isImage = file.type.startsWith('image/');
            const fileName = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;
            
            return `
                <div class="relative inline-flex items-center gap-2 bg-gray-100 rounded-lg p-2 pr-8" data-file-id="${file.id}">
                    ${isImage && file.preview ? 
                        `<img src="${file.preview}" class="w-8 h-8 object-cover rounded" alt="${file.name}">` :
                        `<svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>`
                    }
                    <span class="text-sm text-gray-700">${fileName}</span>
                    <button class="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full transition-colors remove-inline-file" data-file-id="${file.id}" title="Xóa file">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
        
        // Wire up remove buttons
        previewContainer.querySelectorAll('.remove-inline-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = btn.getAttribute('data-file-id');
                this.removeFile(fileId);
            });
        });
    }
    
    showFilePreview() {
        fileShowFilePreview(this.filePreviewModal);
    }
    
    hideFilePreview() {
        fileHideFilePreview(this.filePreviewModal);
    }
    
    openImageModal(imageSrc, imageTitle) {
        fileOpenImageModal(imageSrc, imageTitle);
    }
    
    closeImageModal() {
        fileCloseImageModal();
    }
    
    // ===================================
    // VOICE METHODS (delegate to voice-manager.js)
    // ===================================
    
    initializeSpeechRecognition() {
        voiceInitializeSpeechRecognition();
    }
    
    toggleVoiceRecording(inputElement, voiceButton) {
        voiceToggleVoiceRecording(inputElement, voiceButton);
    }
    
    // ===================================
    // DUAL CHAT METHODS (delegate to dual-chat.js)
    // ===================================
    
    toggleDualMode() {
        // Nếu đang TẮT → BẬT: Lưu current model
        if (!this.dualChatMode) {
            localStorage.setItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_DUAL, this.selectedModel);
        }
        
        const oldMode = this.dualChatMode;
        this.dualChatMode = dualToggleDualMode(this.dualChatMode, this.getContext());
        
        // Update config/model visibility
        this.updateConfigAndModelVisibility(this.dualChatMode);
        
        // Nếu đang BẬT → TẮT: Restore previous model
        if (oldMode && !this.dualChatMode) {
            const previousModel = localStorage.getItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_DUAL) || 'gpt-5-chat';
            this.changeModel(previousModel);
            localStorage.removeItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_DUAL);
        }
    }
    
    /**
     * Tắt dual chat mode và restore previous model
     * Helper function được dùng khi về home hoặc reload trang
     */
    disableDualChatMode() {
        if (!this.dualChatMode) return; // Đã tắt rồi
        
        const homeDualModeBtn = document.getElementById('homeDualModeBtn');
        const chatDualModeBtn = document.getElementById('chatDualModeBtn');
        
        // Restore model cũ trước khi tắt dual chat
        const previousModel = localStorage.getItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_DUAL);
        if (previousModel && previousModel !== this.selectedModel) {
            this.changeModel(previousModel);
        }
        
        // Tắt dual chat mode
        this.dualChatMode = false;
        saveDualChatMode(false);
        
        // Update UI - deactivate dual chat buttons
        if (homeDualModeBtn) {
            homeDualModeBtn.classList.remove('active');
            homeDualModeBtn.classList.remove('locked');
            homeDualModeBtn.title = 'Dual Chat Mode';
        }
        if (chatDualModeBtn) {
            chatDualModeBtn.classList.remove('active');
            chatDualModeBtn.classList.remove('locked');
            chatDualModeBtn.title = 'Dual Chat Mode';
        }
        
        // Remove dual-chat-mode class từ messagesContainer
        if (this.messagesContainer) {
            this.messagesContainer.classList.remove('dual-chat-mode');
        }
        
        // Clean up localStorage
        localStorage.removeItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_DUAL);
        
        // Update config and model visibility
        this.updateConfigAndModelVisibility(false);
    }
    
    loadDualModeState() {
        dualLoadDualModeState(this.dualChatMode);
    }
    
    updateDualChatButtonVisibility(isNormalChat, chat) {
        const homeDualModeBtn = document.getElementById('homeDualModeBtn');
        const chatDualModeBtn = document.getElementById('chatDualModeBtn');
        
        if (isNormalChat) {
            // Đang ở chat thường (có messages nhưng không phải dual) → ẨN nút
            if (homeDualModeBtn) homeDualModeBtn.style.display = 'none';
            if (chatDualModeBtn) chatDualModeBtn.style.display = 'none';
        } else {
            // Dual chat hoặc chat mới → HIỆN nút
            if (homeDualModeBtn) homeDualModeBtn.style.display = '';
            if (chatDualModeBtn) chatDualModeBtn.style.display = '';
            
            // KHÔNG lock nữa - cho phép tắt dual chat bất cứ lúc nào
            // updateDualChatLockState(chat, this.dualChatMode);
        }
    }
    
    updateConfigAndModelVisibility(inDualChat) {
        // Config buttons
        const homeConfigBtn = document.getElementById('homeConfigBtn');
        const chatConfigBtn = document.getElementById('chatConfigBtn');
        
        // Model selector buttons  
        const homeQuickModelBtn = document.getElementById('homeQuickModelBtn');
        const quickModelBtn = document.getElementById('quickModelBtn');
        
        if (inDualChat) {
            // Trong dual chat → ẨN config và model selector
            if (homeConfigBtn) homeConfigBtn.style.display = 'none';
            if (chatConfigBtn) chatConfigBtn.style.display = 'none';
            if (homeQuickModelBtn) homeQuickModelBtn.style.display = 'none';
            if (quickModelBtn) quickModelBtn.style.display = 'none';
        } else {
            // Ngoài dual chat → HIỆN lại
            if (homeConfigBtn) homeConfigBtn.style.display = '';
            if (chatConfigBtn) chatConfigBtn.style.display = '';
            if (homeQuickModelBtn) homeQuickModelBtn.style.display = '';
            if (quickModelBtn) quickModelBtn.style.display = '';
        }
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
                startOnboardingManually();
            },
            () => {
                updateUIForLoggedOutUser();
                startOnboardingManually();
            }
        );
    }
    
    showAuthModal() {
        showModal(this.authModal, document.getElementById('authContent'));
    }
    
    hideAuthModal() {
        hideModal(this.authModal, document.getElementById('authContent'));
        
        startOnboardingManually();
    }
    
    togglePasswordVisibility(passwordField, showIcon, hideIcon) {
        if (!passwordField || !showIcon || !hideIcon) return;
        
        const isPassword = passwordField.type === 'password';
        
        if (isPassword) {
            // Show password
            passwordField.type = 'text';
            showIcon.classList.add('hidden');
            hideIcon.classList.remove('hidden');
        } else {
            // Hide password
            passwordField.type = 'password';
            showIcon.classList.remove('hidden');
            hideIcon.classList.add('hidden');
        }
    }
    
    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const rememberMe = document.getElementById('loginRememberMe').checked;
        
        await handleLogin(username, password, rememberMe, 
            (user) => {
                updateUIForLoggedInUser(user);
                setupUserMenuDropdown(() => this.handleLogout());
                this.hideAuthModal();
                
                // Clear inputs
                document.getElementById('loginUsername').value = '';
                document.getElementById('loginPassword').value = '';
                document.getElementById('loginRememberMe').checked = false;
                
                startOnboardingManually();
            }
        );
    }
    
    async handleSignup() {
        const email = document.getElementById('signupEmail').value.trim();
        const username = document.getElementById('signupUsername').value.trim();
        const password = document.getElementById('signupPassword').value.trim();
        const confirmPassword = document.getElementById('signupConfirmPassword').value.trim();
        
        await handleSignup({ email, username, password, confirmPassword },
            (user) => {
                updateUIForLoggedInUser(user);
                setupUserMenuDropdown(() => this.handleLogout());
                this.hideAuthModal();
                
                // Clear inputs
                document.getElementById('signupEmail').value = '';
                document.getElementById('signupUsername').value = '';
                document.getElementById('signupPassword').value = '';
                document.getElementById('signupConfirmPassword').value = '';
                
                startOnboardingManually();
            }
        );
    }
    
    async handleLogout() {
        await handleLogout(
            () => {
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
        
        // Highlight selected model in quick model dropdown
        document.querySelectorAll('.quick-model-option').forEach(option => {
            option.classList.remove('active-model');
            if (option.getAttribute('data-model') === this.selectedModel) {
                option.classList.add('active-model');
            }
        });
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
    
    handleConfigAction(action) {
        const configButtons = document.querySelectorAll(`.config-option[data-action="${action}"]`);
        
        if (action === 'image-gen') {
            if (this.selectedModel === 'image-gen') {
                const modelToRestore = localStorage.getItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_IMAGE_GEN) || 'gpt-5-chat';
                this.changeModel(modelToRestore);
                localStorage.removeItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_IMAGE_GEN);
                configButtons.forEach(btn => btn.classList.remove('active-config'));
            } else {
                localStorage.setItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_IMAGE_GEN, this.selectedModel);
                this.changeModel('image-gen');
                // Remove active from all config options first
                document.querySelectorAll('.config-option').forEach(btn => btn.classList.remove('active-config'));
                configButtons.forEach(btn => btn.classList.add('active-config'));
            }
        } else if (action === 'search') {
            if (this.selectedModel === 'gemini-search') {
                const modelToRestore = localStorage.getItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_SEARCH) || 'gpt-5-chat';
                this.changeModel(modelToRestore);
                localStorage.removeItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_SEARCH);
                configButtons.forEach(btn => btn.classList.remove('active-config'));
            } else {
                localStorage.setItem(STORAGE_KEYS.PREVIOUS_MODEL_BEFORE_SEARCH, this.selectedModel);
                this.changeModel('gemini-search');
                // Remove active from all config options first
                document.querySelectorAll('.config-option').forEach(btn => btn.classList.remove('active-config'));
                configButtons.forEach(btn => btn.classList.add('active-config'));
            }
        }
    }
    
    // ===================================
    // QUICK MODEL SELECTOR
    // ===================================
    
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
        
        // Persistent highlight - remove active class from all and add to selected
        document.querySelectorAll('.quick-model-option').forEach(option => {
            option.classList.remove('active-model');
            if (option.getAttribute('data-model') === model) {
                option.classList.add('active-model');
            }
        });
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
        
        // Type character by character (sử dụng TYPING_SPEEDS.AI_RESPONSE từ constants)
        for (let i = 0; i < text.length; i++) {
            if (element.dataset.cancelled === 'true') break;
            
            currentText += text[i];
            element.innerHTML = marked.parse(currentText);
            element.appendChild(cursor);
            
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            
            await new Promise(resolve => setTimeout(resolve, TYPING_SPEEDS.AI_RESPONSE));
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
        const self = this;
        return {
            messagesContainer: this.messagesContainer,
            dualChatMode: this.dualChatMode,
            dualChatPrimaryModel: this.dualChatPrimaryModel,
            dualChatSecondaryModel: this.dualChatSecondaryModel,
            DUAL_CHAT_MODELS: DUAL_CHAT_MODELS,
            typewriterEffect: (elem, text, cb) => this.typewriterEffect(elem, text, cb),
            saveDualChatModels: (primary, secondary) => {
                if (primary !== undefined) self.dualChatPrimaryModel = primary;
                if (secondary !== undefined) self.dualChatSecondaryModel = secondary;
                saveDualChatModels(self.dualChatPrimaryModel, self.dualChatSecondaryModel);
            },
            saveChats: () => this.saveChats(),
            renderMessage: (msg) => this.renderMessage(msg),
            renderDualChatLayout: (chat, ctx) => renderDualChatLayout(chat, ctx)
        };
    }
}
