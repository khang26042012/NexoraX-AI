/**
 * CHAT-MANAGER.JS - Quản lý chat
 * 
 * Module xử lý tất cả logic liên quan đến chat:
 * - Tạo chat mới
 * - Load chat
 * - Save/Delete chat
 * - Render chat list
 * - Pin/Unpin chat
 */

import { STORAGE_KEYS } from './constants.js';
import { generateId, truncateText } from './utils.js';

// ===================================
// CHAT STORAGE
// ===================================

/**
 * Load chats từ localStorage
 * @returns {Object} Chats object
 */
export function loadChatsFromStorage() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '{}');
}

/**
 * Save chats vào localStorage
 * @param {Object} chats - Chats object
 */
export function saveChatsToStorage(chats) {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
}

/**
 * Clear all chats
 * @param {Function} callback - Callback sau khi clear
 */
export function clearAllChats(callback) {
    localStorage.setItem(STORAGE_KEYS.CHATS, '{}');
    if (callback) callback();
}

// ===================================
// CHAT OPERATIONS
// ===================================

/**
 * Tạo chat mới
 * @param {string} firstMessage - Message đầu tiên
 * @returns {Object} Chat object mới
 */
export function createNewChat(firstMessage) {
    const chatId = generateId();
    const title = truncateText(firstMessage, 50);
    
    return {
        id: chatId,
        title: title,
        messages: [],
        createdAt: new Date().toISOString(),
        isPinned: false
    };
}

/**
 * Get chat theo ID
 * @param {Object} chats - Chats object
 * @param {string} chatId - ID của chat
 * @returns {Object} Chat object
 */
export function getChatById(chats, chatId) {
    return chats[chatId];
}

/**
 * Delete chat
 * @param {Object} chats - Chats object
 * @param {string} chatId - ID của chat cần xóa
 * @param {Function} confirmCallback - Callback để confirm (trả về true nếu confirm)
 * @returns {boolean} True nếu đã xóa
 */
export function deleteChat(chats, chatId, confirmCallback) {
    const chat = chats[chatId];
    if (!chat) return false;
    
    // Nếu chat đã pin, yêu cầu confirm đặc biệt
    if (chat.isPinned) {
        if (confirmCallback && confirmCallback('Cuộc trò chuyện này đã được ghim. Bạn có chắc muốn bỏ ghim và xóa?')) {
            delete chats[chatId];
            return true;
        }
        return false;
    }
    
    // Chat thường
    if (confirmCallback && confirmCallback('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
        delete chats[chatId];
        return true;
    }
    
    return false;
}

/**
 * Toggle pin chat
 * @param {Object} chats - Chats object
 * @param {string} chatId - ID của chat
 */
export function togglePinChat(chats, chatId) {
    const chat = chats[chatId];
    if (chat) {
        chat.isPinned = !chat.isPinned;
    }
}

// ===================================
// CHAT LIST RENDERING
// ===================================

/**
 * Render chat list vào DOM
 * @param {Object} chats - Chats object
 * @param {string} currentChatId - ID của chat hiện tại
 * @param {HTMLElement} chatListElement - Element chứa chat list
 * @param {Function} loadChatCallback - Callback khi click vào chat
 * @param {Function} deleteChatCallback - Callback khi xóa chat
 * @param {Function} togglePinCallback - Callback khi toggle pin
 */
export function renderChatList(chats, currentChatId, chatListElement, loadChatCallback, deleteChatCallback, togglePinCallback) {
    const chatArray = Object.values(chats);
    const noChatHistoryElement = document.getElementById('noChatHistory');
    
    if (chatArray.length === 0) {
        // Clear chat items nhưng giữ noChatHistory element
        const chatItems = chatListElement.querySelectorAll('.chat-item');
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
    
    // Sort: pinned first, then by date
    chatArray.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Clear existing chat items
    const chatItems = chatListElement.querySelectorAll('.chat-item');
    chatItems.forEach(item => item.remove());
    
    // Add new chat items
    const chatHTML = chatArray.map(chat => {
        const isActive = currentChatId === chat.id;
        const date = new Intl.DateTimeFormat('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh', 
            day: 'numeric', 
            month: 'numeric', 
            year: 'numeric' 
        }).format(new Date(chat.createdAt));
        
        return `
            <div class="chat-item p-3 rounded-xl cursor-pointer ${isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}" 
                 data-chat-id="${chat.id}">
                <div class="flex items-center justify-between gap-2">
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-sm truncate mb-1">
                            ${chat.isPinned ? '<svg class="w-3 h-3 text-blue-600 inline mr-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>' : ''}
                            ${chat.title}
                        </div>
                        <div class="text-xs text-gray-500">${date}</div>
                    </div>
                    <div class="flex items-center space-x-1 flex-shrink-0">
                        <button class="pin-btn p-1.5 hover:bg-blue-100 rounded-lg transition-colors" 
                                data-chat-id="${chat.id}"
                                title="${chat.isPinned ? 'Bỏ ghim' : 'Ghim cuộc trò chuyện'}">
                            ${!chat.isPinned ? 
                                '<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>' : 
                                '<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 17v5"/><path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89"/><path d="m2 2 20 20"/><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"/></svg>'}
                        </button>
                        <button class="delete-btn p-1.5 hover:bg-red-100 rounded-lg transition-colors" 
                                data-chat-id="${chat.id}"
                                title="Xóa cuộc trò chuyện">
                            <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Insert chat items before noChatHistory element
    if (noChatHistoryElement) {
        noChatHistoryElement.insertAdjacentHTML('beforebegin', chatHTML);
    } else {
        chatListElement.innerHTML = chatHTML;
    }
    
    // Wire up event listeners
    chatListElement.querySelectorAll('.chat-item').forEach(item => {
        const chatId = item.getAttribute('data-chat-id');
        
        // Click vào chat item để load chat
        item.addEventListener('click', (e) => {
            // Không trigger nếu click vào button
            if (e.target.closest('.pin-btn') || e.target.closest('.delete-btn')) {
                return;
            }
            loadChatCallback(chatId);
        });
    });
    
    // Pin buttons
    chatListElement.querySelectorAll('.pin-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const chatId = btn.getAttribute('data-chat-id');
            togglePinCallback(chatId);
        });
    });
    
    // Delete buttons
    chatListElement.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const chatId = btn.getAttribute('data-chat-id');
            deleteChatCallback(chatId);
        });
    });
}
