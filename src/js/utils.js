/**
 * UTILS.JS - Các hàm tiện ích chung
 * 
 * File này chứa các hàm helper và utility được sử dụng xuyên suốt ứng dụng:
 * - Migration localStorage
 * - Format dữ liệu
 * - Validation
 * - Helper functions khác
 */

import { STORAGE_KEYS, LEGACY_STORAGE_KEYS } from './constants.js';

// ===================================
// LOCALSTORAGE MIGRATION
// ===================================

/**
 * Migrate localStorage keys từ NovaX sang NexoraX
 * Chạy một lần duy nhất khi app khởi động
 */
export function migrateLocalStorageKeys() {
    LEGACY_STORAGE_KEYS.forEach(([oldKey, newKey]) => {
        const oldValue = localStorage.getItem(oldKey);
        if (oldValue !== null && localStorage.getItem(newKey) === null) {
            localStorage.setItem(newKey, oldValue);
            localStorage.removeItem(oldKey);
        }
    });
}

// ===================================
// FORMAT FUNCTIONS
// ===================================

/**
 * Format timestamp thành string ngày giờ
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Chuỗi ngày giờ định dạng
 */
export function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
}

/**
 * Tạo ID ngẫu nhiên
 * @returns {string} ID duy nhất
 */
export function generateId() {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Truncate text với ellipsis
 * @param {string} text - Văn bản cần cắt
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string} Văn bản đã cắt
 */
export function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ===================================
// VALIDATION FUNCTIONS
// ===================================

/**
 * Kiểm tra xem message có phải là câu hỏi về thời gian/ngày không
 * @param {string} message - Tin nhắn cần kiểm tra
 * @returns {boolean}
 */
export function isTimeRelatedQuery(message) {
    // Normalize message để xử lý dấu tiếng Việt
    const normalized = message.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    
    // Các pattern tiếng Việt
    const vietnamesePatterns = [
        /b(a|ay)\s*gio\s*(la\s*)?(may|gi|nao)/i,
        /may\s*gio(\s*roi)?/i,
        /gio\s*(hien\s*tai|bay\s*gio)/i,
        /hom\s*nay\s*(la\s*)?(ngay\s*)?(may|gi)/i,
        /thu\s*may(\s*hom\s*nay)?/i,
        /ngay\s*(hom\s*nay|hien\s*tai)/i,
        /thoi\s*gian\s*(hien\s*tai|bay\s*gio)/i
    ];
    
    // Các pattern tiếng Anh
    const englishPatterns = [
        /what('|')?s\s+the\s+time/i,
        /what\s+time\s+is\s+it/i,
        /time\s+(now|right\s*now)/i,
        /current\s+(time|date)/i,
        /what('|')?s\s+today('|')?s\s+(date|day)/i,
        /what\s+day\s+is\s+(it|today)/i,
        /what('|')?s\s+the\s+date/i
    ];
    
    const allPatterns = [...vietnamesePatterns, ...englishPatterns];
    return allPatterns.some(pattern => pattern.test(normalized));
}

/**
 * Kiểm tra xem message có phải là search query không
 * @param {string} message - Tin nhắn cần kiểm tra
 * @returns {boolean}
 */
export function isSearchQuery(message) {
    const normalized = message.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
    
    const vietnamesePatterns = [
        /^tim\s*kiem\s*/i,
        /^tim\s+/i,
        /^search\s*/i,
        /^tra\s*cuu\s*/i,
        /^tim\s*hieu\s*/i,
        /^kiem\s*tra\s*/i,
        /^google\s*/i,
        /^bing\s*/i,
    ];
    
    const englishPatterns = [
        /^search\s+for\s*/i,
        /^look\s+up\s*/i,
        /^find\s+(out\s+)?about\s*/i,
        /^google\s*/i,
        /^bing\s*/i,
    ];
    
    const allPatterns = [...vietnamesePatterns, ...englishPatterns];
    return allPatterns.some(pattern => pattern.test(normalized));
}

/**
 * Trích xuất search query bằng cách loại bỏ các từ khóa tìm kiếm
 * @param {string} message - Tin nhắn chứa search query
 * @returns {string} Query đã được làm sạch
 */
export function extractSearchQuery(message) {
    const normalized = message.trim();
    
    const searchKeywords = [
        /^tim\s*kiem\s*/i,
        /^tim\s+/i,
        /^search\s*(for\s*)?/i,
        /^tra\s*cuu\s*/i,
        /^tim\s*hieu\s*/i,
        /^kiem\s*tra\s*/i,
        /^look\s+up\s*/i,
        /^find\s+(out\s+)?about\s*/i,
        /^google\s*/i,
        /^bing\s*/i,
    ];
    
    let query = normalized;
    for (const keyword of searchKeywords) {
        query = query.replace(keyword, '').trim();
    }
    
    return query || normalized;
}

/**
 * Kiểm tra email hợp lệ
 * @param {string} email - Email cần kiểm tra
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Kiểm tra username hợp lệ (3-20 ký tự, chữ cái số và underscore)
 * @param {string} username - Username cần kiểm tra
 * @returns {boolean}
 */
export function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
}

/**
 * Kiểm tra password hợp lệ (tối thiểu 6 ký tự)
 * @param {string} password - Password cần kiểm tra
 * @returns {boolean}
 */
export function isValidPassword(password) {
    return password && password.length >= 6;
}

/**
 * Kiểm tra confirm password khớp với password
 * @param {string} password - Password gốc
 * @param {string} confirmPassword - Confirm password
 * @returns {boolean}
 */
export function isPasswordMatch(password, confirmPassword) {
    return password === confirmPassword && password.length > 0;
}

// ===================================
// DOM UTILITIES
// ===================================

/**
 * Kiểm tra element có trong viewport không
 * @param {HTMLElement} element - Element cần kiểm tra
 * @returns {boolean}
 */
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Scroll đến cuối container
 * @param {HTMLElement} container - Container cần scroll
 * @param {boolean} smooth - Sử dụng smooth scroll hay không
 */
export function scrollToBottom(container, smooth = true) {
    if (!container) return;
    
    if (smooth) {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });
    } else {
        container.scrollTop = container.scrollHeight;
    }
}

/**
 * Escape HTML để tránh XSS
 * @param {string} text - Text cần escape
 * @returns {string} Text đã escape
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================
// FILE UTILITIES
// ===================================

/**
 * Kiểm tra file có phải là image không
 * @param {File} file - File cần kiểm tra
 * @returns {boolean}
 */
export function isImageFile(file) {
    return file && file.type.startsWith('image/');
}

/**
 * Convert file thành base64
 * @param {File} file - File cần convert
 * @returns {Promise<string>} Base64 string (không có prefix data:)
 */
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Tạo preview cho image file
 * @param {File} file - Image file
 * @returns {Promise<string>} Data URL của image
 */
export function createImagePreview(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ===================================
// DEBOUNCE & THROTTLE
// ===================================

/**
 * Debounce function - trì hoãn thực thi cho đến khi không có gọi mới
 * @param {Function} func - Hàm cần debounce
 * @param {number} wait - Thời gian chờ (ms)
 * @returns {Function}
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function - giới hạn số lần gọi trong khoảng thời gian
 * @param {Function} func - Hàm cần throttle
 * @param {number} limit - Giới hạn thời gian (ms)
 * @returns {Function}
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===================================
// AUTH FORM UI HELPERS
// ===================================

/**
 * Hiển thị error message cho field
 * @param {string} fieldId - ID của field input
 * @param {string} message - Error message
 */
export function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
    
    if (inputElement) {
        inputElement.classList.add('border-red-500');
        inputElement.classList.remove('border-slate-200');
    }
}

/**
 * Ẩn error message cho field
 * @param {string} fieldId - ID của field input
 */
export function hideFieldError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.add('hidden');
    }
    
    if (inputElement) {
        inputElement.classList.remove('border-red-500');
        inputElement.classList.add('border-slate-200');
    }
}

/**
 * Clear tất cả error messages trong form
 * @param {string[]} fieldIds - Array các field IDs cần clear
 */
export function clearAllErrors(fieldIds) {
    fieldIds.forEach(fieldId => hideFieldError(fieldId));
}

/**
 * Toggle password visibility
 * @param {HTMLInputElement} passwordField - Password input field
 * @param {HTMLElement} showIcon - Icon hiển thị khi password đang ẩn
 * @param {HTMLElement} hideIcon - Icon hiển thị khi password đang hiện
 */
export function togglePasswordVisibility(passwordField, showIcon, hideIcon) {
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

/**
 * Set loading state cho button
 * @param {HTMLElement} button - Button element
 * @param {boolean} isLoading - Loading state
 * @param {string} textElementId - ID của text element trong button
 * @param {string} spinnerElementId - ID của spinner element trong button
 */
export function setButtonLoading(button, isLoading, textElementId, spinnerElementId) {
    if (!button) return;
    
    const textElement = document.getElementById(textElementId);
    const spinnerElement = document.getElementById(spinnerElementId);
    
    if (isLoading) {
        button.disabled = true;
        button.classList.add('opacity-50', 'cursor-not-allowed');
        if (textElement) textElement.classList.add('hidden');
        if (spinnerElement) spinnerElement.classList.remove('hidden');
    } else {
        button.disabled = false;
        button.classList.remove('opacity-50', 'cursor-not-allowed');
        if (textElement) textElement.classList.remove('hidden');
        if (spinnerElement) spinnerElement.classList.add('hidden');
    }
}
