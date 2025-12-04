/**
 * MESSAGE-RENDERER.JS - Render message vào DOM
 * 
 * Module xử lý rendering message:
 * - Render message vào messagesContainer
 * - Update message đã có
 * - Render dual chat layout
 * - Render files trong message
 */

import { formatMessage, formatFileSize } from './message-formatter.js';
import { MODEL_NAMES } from './constants.js';
import { scrollToBottom } from './utils.js';

// ===================================
// MESSAGE RENDERING
// ===================================

/**
 * Render một message vào DOM
 * @param {Object} message - Message object cần render
 * @param {Object} context - Context chứa messagesContainer và các element khác
 */
export function renderMessage(message, context) {
    const { messagesContainer, dualChatMode, dualChatPrimaryModel, dualChatSecondaryModel } = context;
    
    // Xác định container để render
    let targetContainer = messagesContainer;
    
    // Nếu dual chat mode, render vào panel tương ứng
    if (messagesContainer.classList.contains('dual-chat-mode')) {
        if (message.isPrimary || message.model === dualChatPrimaryModel) {
            const panel = document.getElementById('primaryPanel');
            if (panel) targetContainer = panel;
        } else if (message.isPrimary === false || message.model === dualChatSecondaryModel) {
            const panel = document.getElementById('secondaryPanel');
            if (panel) targetContainer = panel;
        }
    }
    
    if (!targetContainer) {
        console.error('Target container not found for message:', message);
        return;
    }
    
    // Tạo message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role === 'user' ? 'user-message' : 'ai-message'}`;
    messageDiv.setAttribute('data-message-id', message.id);
    
    // Thêm model badge cho AI message (chỉ khi KHÔNG ở dual mode)
    let modelBadge = '';
    if (message.role === 'assistant' && message.model && !messagesContainer.classList.contains('dual-chat-mode')) {
        const modelName = MODEL_NAMES[message.model] || message.model;
        modelBadge = `<div class="model-badge">${modelName}</div>`;
    }
    
    // Render files nếu có (với role-specific class)
    const filesHtml = message.files ? renderFilesInMessage(message.files, message.role, context) : '';
    
    // Tạo message content
    let contentHtml = '';
    if (message.isTyping) {
        contentHtml = '<div class="ai-loading"><span class="ai-loading-text">Đang suy nghĩ</span><div class="ai-loading-dots"><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div></div></div>';
    } else if (message.isHtml) {
        contentHtml = message.content;
    } else {
        contentHtml = formatMessage(message.content);
        // Strip wrapping <p> tags for user messages to reduce bubble height
        if (message.role === 'user') {
            contentHtml = contentHtml.replace(/^<p>(.*?)<\/p>$/s, '$1');
        }
    }
    
    // Files hiển thị NGOÀI message-content để không bị ảnh hưởng bởi bubble styling
    messageDiv.innerHTML = `
        ${modelBadge}
        <div class="message-wrapper">
            <div class="message-content">
                ${contentHtml}
            </div>
            ${filesHtml}
        </div>
    `;
    
    targetContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    scrollToBottom(targetContainer);
}

/**
 * Update message đã có trong DOM
 * @param {Object} message - Message object cần update
 * @param {Object} context - Context chứa các element và methods
 */
export function updateMessage(message, context) {
    const { messagesContainer, dualChatPrimaryModel, dualChatSecondaryModel, typewriterEffect } = context;
    
    // Tìm message element - check trong dual chat panels nếu dual mode
    let messageElement;
    if (messagesContainer.classList.contains('dual-chat-mode')) {
        // Dual mode - search trong panel tương ứng
        if (message.isPrimary || message.model === dualChatPrimaryModel) {
            const primaryPanel = document.getElementById('primaryPanel');
            messageElement = primaryPanel?.querySelector('[data-message-id="' + message.id + '"]');
        } else if (message.isPrimary === false || message.model === dualChatSecondaryModel) {
            const secondaryPanel = document.getElementById('secondaryPanel');
            messageElement = secondaryPanel?.querySelector('[data-message-id="' + message.id + '"]');
        }
    } else {
        // Normal mode - search trong messagesContainer
        messageElement = messagesContainer.querySelector('[data-message-id="' + message.id + '"]');
    }
    
    if (messageElement) {
        const contentElement = messageElement.querySelector('.message-content');
        if (message.isTyping) {
            contentElement.innerHTML = '<div class="ai-loading"><span class="ai-loading-text">Đang suy nghĩ</span><div class="ai-loading-dots"><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div></div></div>';
        } else {
            // Check nếu message là raw HTML (VD: cho images)
            if (message.isHtml) {
                contentElement.innerHTML = message.content;
            } else if (message.role === 'assistant' && message.content && !message.isFinalized) {
                // AI message có content, dùng typing animation
                typewriterEffect(contentElement, message.content, () => {
                    message.isFinalized = true;
                });
            } else {
                contentElement.innerHTML = formatMessage(message.content);
            }
        }
        
        // Scroll to bottom của container tương ứng
        if (messagesContainer.classList.contains('dual-chat-mode')) {
            const panel = messageElement.closest('.dual-chat-panel-messages');
            if (panel) {
                scrollToBottom(panel);
            }
        } else {
            scrollToBottom(messagesContainer);
        }
    }
}

/**
 * Render files trong message
 * @param {Array} files - Mảng files cần render
 * @param {string} role - Role của message ('user' hoặc 'assistant')
 * @param {Object} context - Context chứa openImageModal method
 * @returns {string} HTML của files
 */
export function renderFilesInMessage(files, role, context) {
    if (!files || files.length === 0) return '';
    
    // Class riêng cho user/AI để align đúng hướng
    const attachmentClass = role === 'user' ? 'user-file-attachments' : 'ai-file-attachments';
    
    return `<div class="${attachmentClass}">` +
        files.map(file => {
            const isImage = file.type.startsWith('image/');
            const sizeText = formatFileSize(file.size);
            
            if (isImage && file.preview) {
                return `
                    <div class="inline-block">
                        <div class="relative group">
                            <img src="${file.preview}" alt="${file.name}" class="max-w-xs max-h-64 rounded-lg shadow-md cursor-pointer" onclick="app.openImageModal('${file.preview}', '${file.name}')">
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

/**
 * Render dual chat layout với 2 panels
 * @param {Object} chat - Chat object
 * @param {Object} context - Context chứa models và methods
 */
export function renderDualChatLayout(chat, context) {
    const { 
        messagesContainer, 
        dualChatPrimaryModel, 
        dualChatSecondaryModel,
        DUAL_CHAT_MODELS,
        saveDualChatModels,
        renderMessage
    } = context;
    
    messagesContainer.innerHTML = '';
    messagesContainer.classList.add('dual-chat-mode');
    
    // Tạo options cho model selectors
    const primaryOptions = DUAL_CHAT_MODELS.map(opt => 
        `<option value="${opt.value}" ${opt.value === dualChatPrimaryModel ? 'selected' : ''}>${opt.label}</option>`
    ).join('');
    
    const secondaryOptions = DUAL_CHAT_MODELS.map(opt => 
        `<option value="${opt.value}" ${opt.value === dualChatSecondaryModel ? 'selected' : ''}>${opt.label}</option>`
    ).join('');
    
    const dualLayoutHtml = `
        <div class="dual-chat-container">
            <div class="dual-chat-panel">
                <div class="dual-chat-panel-header">
                    <select id="dualPrimaryModelSelect" class="text-sm font-bold bg-transparent border-none outline-none cursor-pointer text-white text-center w-full hover:opacity-90 focus:opacity-100">
                        ${primaryOptions}
                    </select>
                </div>
                <div class="dual-chat-panel-messages" id="primaryPanel"></div>
            </div>
            <div class="dual-chat-panel">
                <div class="dual-chat-panel-header">
                    <select id="dualSecondaryModelSelect" class="text-sm font-bold bg-transparent border-none outline-none cursor-pointer text-white text-center w-full hover:opacity-90 focus:opacity-100">
                        ${secondaryOptions}
                    </select>
                </div>
                <div class="dual-chat-panel-messages" id="secondaryPanel"></div>
            </div>
        </div>
    `;
    
    messagesContainer.innerHTML = dualLayoutHtml;
    
    // Wire up change handlers
    const primarySelect = document.getElementById('dualPrimaryModelSelect');
    const secondarySelect = document.getElementById('dualSecondaryModelSelect');
    
    if (primarySelect) {
        primarySelect.addEventListener('change', (e) => {
            const oldPrimaryModel = context.dualChatPrimaryModel;
            const newPrimaryModel = e.target.value;
            
            // Xóa tất cả tin nhắn của model cũ (primary panel)
            chat.messages = chat.messages.filter(msg => {
                if (msg.role === 'user') return true;
                if (msg.isPrimary === false) return true;
                if (msg.isPrimary === true || msg.model === oldPrimaryModel) return false;
                return true;
            });
            
            context.dualChatPrimaryModel = newPrimaryModel;
            if (context.saveDualChatModels) {
                context.saveDualChatModels(newPrimaryModel, context.dualChatSecondaryModel);
            }
            
            if (context.saveChats) {
                context.saveChats();
            }
            
            renderDualChatLayout(chat, context);
        });
    }
    
    if (secondarySelect) {
        secondarySelect.addEventListener('change', (e) => {
            const oldSecondaryModel = context.dualChatSecondaryModel;
            const newSecondaryModel = e.target.value;
            
            // Xóa tất cả tin nhắn của model cũ (secondary panel)
            chat.messages = chat.messages.filter(msg => {
                if (msg.role === 'user') return true;
                if (msg.isPrimary === true) return true;
                if (msg.isPrimary === false || msg.model === oldSecondaryModel) return false;
                return true;
            });
            
            context.dualChatSecondaryModel = newSecondaryModel;
            if (context.saveDualChatModels) {
                context.saveDualChatModels(context.dualChatPrimaryModel, newSecondaryModel);
            }
            
            if (context.saveChats) {
                context.saveChats();
            }
            
            renderDualChatLayout(chat, context);
        });
    }
    
    // Render tất cả messages
    chat.messages.forEach(message => renderMessage(message, context));
}
