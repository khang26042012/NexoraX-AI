/**
 * MAIN.JS - Entry point
 * 
 * Entry point của ứng dụng:
 * - Import NexoraXChat class
 * - Khởi tạo app khi DOM ready
 * - Export app instance ra global scope
 */

import { NexoraXChat } from './chat-app.js';

// Khởi tạo app khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Tạo instance của NexoraXChat
    window.app = new NexoraXChat();
    
    console.log('NexoraX AI Chat initialized successfully!');
});
