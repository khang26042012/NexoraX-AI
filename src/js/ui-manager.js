/**
 * UI-MANAGER.JS - Quản lý UI
 * 
 * Module xử lý tất cả UI controls:
 * - Toggle sidebar (mobile + desktop)
 * - Show/Hide screens (home, chat)
 * - Theme toggle
 * - Modals (settings, about, feedback, clear all)
 * - Notifications
 */

import { STORAGE_KEYS } from './constants.js';

// ===================================
// SIDEBAR MANAGEMENT
// ===================================

/**
 * Toggle sidebar (mobile)
 * @param {HTMLElement} sidebar - Sidebar element
 */
export function toggleSidebar(sidebar) {
    if (!sidebar) return;
    sidebar.classList.toggle('active');
    
    // Ẩn/hiện toggle buttons khi sidebar active
    const mobileToggle = document.getElementById('sidebarToggle');
    const desktopToggle = document.getElementById('desktopSidebarToggle');
    
    if (sidebar.classList.contains('active')) {
        // Sidebar đang mở - ẩn toggle buttons
        if (mobileToggle) {
            mobileToggle.style.opacity = '0';
            mobileToggle.style.pointerEvents = 'none';
        }
        if (desktopToggle) {
            desktopToggle.style.opacity = '0';
            desktopToggle.style.pointerEvents = 'none';
        }
    } else {
        // Sidebar đang đóng - hiện toggle buttons
        if (mobileToggle) {
            mobileToggle.style.opacity = '1';
            mobileToggle.style.pointerEvents = 'auto';
        }
        if (desktopToggle) {
            desktopToggle.style.opacity = '1';
            desktopToggle.style.pointerEvents = 'auto';
        }
    }
}

/**
 * Close sidebar (mobile + desktop)
 * @param {HTMLElement} sidebar - Sidebar element
 */
export function closeSidebar(sidebar) {
    if (!sidebar) return;
    sidebar.classList.remove('active');
    
    // Hiện lại toggle buttons khi đóng sidebar
    const mobileToggle = document.getElementById('sidebarToggle');
    const desktopToggle = document.getElementById('desktopSidebarToggle');
    
    if (mobileToggle) {
        mobileToggle.style.opacity = '1';
        mobileToggle.style.pointerEvents = 'auto';
    }
    if (desktopToggle) {
        desktopToggle.style.opacity = '1';
        desktopToggle.style.pointerEvents = 'auto';
    }
}

/**
 * Toggle desktop sidebar
 * @param {HTMLElement} sidebar - Sidebar element
 */
export function toggleDesktopSidebar(sidebar) {
    if (!sidebar) return;
    sidebar.classList.toggle('desktop-collapsed');
}

/**
 * Initialize desktop sidebar state
 * @param {HTMLElement} sidebar - Sidebar element
 */
export function initializeDesktopSidebar(sidebar) {
    if (!sidebar) return;
    // Desktop sidebar luôn expanded mặc định
    sidebar.classList.remove('desktop-collapsed');
}

// ===================================
// SCREEN MANAGEMENT
// ===================================

/**
 * Show home screen
 * @param {HTMLElement} homeScreen - Home screen element
 * @param {HTMLElement} chatScreen - Chat screen element
 */
export function showHomeScreen(homeScreen, chatScreen) {
    if (homeScreen) homeScreen.classList.remove('hidden');
    if (chatScreen) chatScreen.classList.add('hidden');
}

/**
 * Show chat screen
 * @param {HTMLElement} homeScreen - Home screen element
 * @param {HTMLElement} chatScreen - Chat screen element
 */
export function showChatScreen(homeScreen, chatScreen) {
    if (homeScreen) homeScreen.classList.add('hidden');
    if (chatScreen) chatScreen.classList.remove('hidden');
}

// ===================================
// THEME MANAGEMENT
// ===================================

/**
 * Toggle theme
 * @returns {boolean} New dark mode state
 */
export function toggleTheme() {
    const isDarkMode = localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
    const newDarkMode = !isDarkMode;
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, newDarkMode);
    loadTheme(newDarkMode);
    return newDarkMode;
}

/**
 * Load theme
 * @param {boolean} isDarkMode - Dark mode state
 */
export function loadTheme(isDarkMode) {
    if (isDarkMode) {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
}

/**
 * Get current theme state
 * @returns {boolean} Dark mode state
 */
export function getCurrentTheme() {
    return localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
}

// ===================================
// MODAL MANAGEMENT
// ===================================

/**
 * Show modal với animation
 * @param {HTMLElement} modal - Modal element
 * @param {HTMLElement} content - Content element bên trong modal
 */
export function showModal(modal, content) {
    if (!modal) return;
    
    modal.classList.remove('hidden');
    modal.offsetHeight; // Force reflow
    
    if (content) {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }
}

/**
 * Hide modal với animation
 * @param {HTMLElement} modal - Modal element
 * @param {HTMLElement} content - Content element bên trong modal
 */
export function hideModal(modal, content) {
    if (!modal) return;
    
    if (content) {
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
    }
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

/**
 * Show settings modal
 */
export function showSettings() {
    const modal = document.getElementById('settingsModal');
    const content = document.getElementById('settingsContent');
    
    if (modal && content) {
        modal.classList.remove('hidden');
        modal.offsetHeight; // Force reflow
        content.classList.add('show');
    }
}

/**
 * Hide settings modal
 */
export function hideSettings() {
    const modal = document.getElementById('settingsModal');
    const content = document.getElementById('settingsContent');
    
    if (content) {
        content.classList.remove('show');
    }
    
    setTimeout(() => {
        if (modal) {
            modal.classList.add('hidden');
        }
    }, 250);
}

// ===================================
// NOTIFICATION
// ===================================

/**
 * Show notification toast
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
export function showNotification(message, type = 'info') {
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
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// ===================================
// MODEL TOGGLE
// ===================================

/**
 * Toggle model options (collapsible)
 */
export function toggleModelOptions() {
    const modelOptions = document.getElementById('modelOptions');
    const modelToggle = document.getElementById('modelToggle');
    
    if (modelOptions && modelToggle) {
        const isExpanded = modelOptions.classList.toggle('show');
        
        // Update arrow direction
        const arrow = modelToggle.querySelector('svg');
        if (arrow) {
            if (isExpanded) {
                arrow.style.transform = 'rotate(180deg)';
            } else {
                arrow.style.transform = 'rotate(0deg)';
            }
        }
    }
}
