/**
 * MAIN.JS - Entry point
 * 
 * Entry point của ứng dụng:
 * - Import NexoraXChat class
 * - Khởi tạo app khi DOM ready
 * - Export app instance ra global scope
 * - Initialize onboarding for first-time users
 */

import { NexoraXChat } from './chat-app.js';
import { initOnboarding } from './onboarding.js';

// Khởi tạo app - ES6 modules tự động defer nên không cần DOMContentLoaded
window.app = new NexoraXChat();

// Initialize onboarding for first-time users
initOnboarding();

console.log('NexoraX AI Chat initialized successfully!');
