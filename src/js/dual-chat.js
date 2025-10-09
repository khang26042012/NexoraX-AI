/**
 * DUAL-CHAT.JS - Dual chat mode
 * 
 * Module xử lý dual chat mode:
 * - Toggle dual chat mode
 * - Quản lý dual chat models
 * - Send message trong dual mode
 */

import { STORAGE_KEYS, DUAL_CHAT_MODELS } from './constants.js';
import { renderDualChatLayout } from './message-renderer.js';

// ===================================
// DUAL CHAT STATE
// ===================================

/**
 * Load dual chat mode state từ localStorage
 * @returns {boolean}
 */
export function loadDualChatMode() {
    return localStorage.getItem(STORAGE_KEYS.DUAL_CHAT_MODE) === 'true';
}

/**
 * Save dual chat mode state
 * @param {boolean} dualChatMode - Dual chat mode state
 */
export function saveDualChatMode(dualChatMode) {
    localStorage.setItem(STORAGE_KEYS.DUAL_CHAT_MODE, dualChatMode);
}

/**
 * Load dual chat models từ localStorage
 * @returns {Object} {primaryModel, secondaryModel}
 */
export function loadDualChatModels() {
    const primaryModel = localStorage.getItem(STORAGE_KEYS.DUAL_PRIMARY_MODEL) || 'gpt-5-chat';
    const secondaryModel = localStorage.getItem(STORAGE_KEYS.DUAL_SECONDARY_MODEL) || 'nexorax1';
    
    return { primaryModel, secondaryModel };
}

/**
 * Save dual chat models
 * @param {string} primaryModel - Primary model ID
 * @param {string} secondaryModel - Secondary model ID
 */
export function saveDualChatModels(primaryModel, secondaryModel) {
    localStorage.setItem(STORAGE_KEYS.DUAL_PRIMARY_MODEL, primaryModel);
    localStorage.setItem(STORAGE_KEYS.DUAL_SECONDARY_MODEL, secondaryModel);
}

// ===================================
// DUAL CHAT UI
// ===================================

/**
 * Toggle dual chat mode
 * @param {boolean} currentMode - Current dual chat mode
 * @param {Object} context - Context {messagesContainer, currentChatId, chats, etc}
 * @returns {boolean} New dual chat mode
 */
export function toggleDualMode(currentMode, context) {
    const newMode = !currentMode;
    saveDualChatMode(newMode);
    
    const { messagesContainer, currentChatId, chats } = context;
    
    // Update button states
    const homeDualModeBtn = document.getElementById('homeDualModeBtn');
    const chatDualModeBtn = document.getElementById('chatDualModeBtn');
    
    if (newMode) {
        if (homeDualModeBtn) homeDualModeBtn.classList.add('active');
        if (chatDualModeBtn) chatDualModeBtn.classList.add('active');
        if (messagesContainer) messagesContainer.classList.add('dual-chat-mode');
    } else {
        if (homeDualModeBtn) homeDualModeBtn.classList.remove('active');
        if (chatDualModeBtn) chatDualModeBtn.classList.remove('active');
        if (messagesContainer) messagesContainer.classList.remove('dual-chat-mode');
    }
    
    // Re-render current chat nếu có
    if (currentChatId && chats[currentChatId]) {
        const chat = chats[currentChatId];
        if (newMode) {
            renderDualChatLayout(chat, context);
        } else {
            // Normal mode - render all messages
            messagesContainer.innerHTML = '';
            chat.messages.forEach(message => context.renderMessage(message, context));
        }
    }
    
    return newMode;
}

/**
 * Load và apply dual mode state khi khởi động app
 * @param {boolean} dualChatMode - Dual chat mode
 */
export function loadDualModeState(dualChatMode) {
    const homeDualModeBtn = document.getElementById('homeDualModeBtn');
    const chatDualModeBtn = document.getElementById('chatDualModeBtn');
    const messagesContainer = document.getElementById('messagesContainer');
    
    if (dualChatMode) {
        if (homeDualModeBtn) homeDualModeBtn.classList.add('active');
        if (chatDualModeBtn) chatDualModeBtn.classList.add('active');
        if (messagesContainer) messagesContainer.classList.add('dual-chat-mode');
    } else {
        if (homeDualModeBtn) homeDualModeBtn.classList.remove('active');
        if (chatDualModeBtn) chatDualModeBtn.classList.remove('active');
        if (messagesContainer) messagesContainer.classList.remove('dual-chat-mode');
    }
}

/**
 * Get dual chat models options (exclude image-gen và nexorax2)
 * @returns {Array} Array of model options
 */
export function getDualChatModelOptions() {
    return DUAL_CHAT_MODELS;
}
