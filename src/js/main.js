/**
 * MAIN.JS - Entry point
 * 
 * Entry point của ứng dụng:
 * - Import NexoraXChat class
 * - Khởi tạo app khi DOM ready
 * - Export app instance ra global scope
 */

import { NexoraXChat } from './chat-app.js';

// Khởi tạo app - ES6 modules tự động defer nên không cần DOMContentLoaded
window.app = new NexoraXChat();

console.log('NexoraX AI Chat initialized successfully!');
