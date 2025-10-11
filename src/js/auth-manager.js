/**
 * AUTH-MANAGER.JS - Authentication management
 * 
 * Module xử lý authentication:
 * - Login
 * - Signup
 * - Logout
 * - Session check
 * - UI updates for auth state
 */

import { API_ENDPOINTS } from './constants.js';
import { isValidEmail, isValidPassword } from './utils.js';
import { showNotification } from './ui-manager.js';

// ===================================
// AUTHENTICATION API CALLS
// ===================================

/**
 * Check user session
 * @param {Function} onSuccess - Callback khi có session hợp lệ (nhận username)
 * @param {Function} onFail - Callback khi không có session
 */
export async function checkUserSession(onSuccess, onFail) {
    try {
        const response = await fetch('/api/auth/check-session', {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.valid && data.username) {
            if (onSuccess) onSuccess(data.username);
        } else {
            if (onFail) onFail();
        }
    } catch (error) {
        console.error('Error checking session:', error);
        if (onFail) onFail();
    }
}

/**
 * Handle login
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {boolean} rememberMe - Remember me checkbox (mặc định true để session 30 ngày)
 * @param {Function} onSuccess - Callback khi login thành công
 * @param {Function} onError - Callback khi login thất bại
 */
export async function handleLogin(username, password, rememberMe = true, onSuccess, onError) {
    if (!username || !password) {
        showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }
    
    try {
        const response = await fetch(API_ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password, remember_me: true })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(`Đăng nhập thành công! Chào ${username} 👋`, 'success');
            if (onSuccess) onSuccess(username);
        } else {
            showNotification(data.error || 'Đăng nhập thất bại!', 'error');
            if (onError) onError(data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Lỗi kết nối! Vui lòng thử lại.', 'error');
        if (onError) onError(error.message);
    }
}

/**
 * Handle signup
 * @param {Object} signupData - Signup data {username, password, email (optional)}
 * @param {Function} onSuccess - Callback khi signup thành công
 * @param {Function} onError - Callback khi signup thất bại
 */
export async function handleSignup(signupData, onSuccess, onError) {
    const { username, password, email } = signupData;
    
    if (!username || !password) {
        showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }
    
    if (email && !isValidEmail(email)) {
        showNotification('Email không hợp lệ!', 'error');
        return;
    }
    
    if (!isValidPassword(password)) {
        showNotification('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
        return;
    }
    
    try {
        const requestBody = { username, password, remember_me: true };
        if (email) {
            requestBody.email = email;
        }
        
        const response = await fetch(API_ENDPOINTS.SIGNUP, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(`Đăng ký thành công! Chào mừng ${username} 🎉`, 'success');
            if (onSuccess) onSuccess(username);
        } else {
            showNotification(data.error || 'Đăng ký thất bại!', 'error');
            if (onError) onError(data.error);
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Lỗi kết nối! Vui lòng thử lại.', 'error');
        if (onError) onError(error.message);
    }
}

/**
 * Handle logout
 * @param {Function} onSuccess - Callback khi logout thành công
 * @param {Function} onError - Callback khi logout thất bại
 */
export async function handleLogout(onSuccess, onError) {
    try {
        const response = await fetch(API_ENDPOINTS.LOGOUT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({})
        });
        
        if (response.ok) {
            showNotification('Đã đăng xuất!', 'success');
            if (onSuccess) onSuccess();
        } else {
            showNotification('Đăng xuất thất bại!', 'error');
            if (onError) onError();
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Lỗi kết nối! Vui lòng thử lại.', 'error');
        if (onError) onError(error.message);
    }
}

// ===================================
// UI UPDATES FOR AUTH STATE
// ===================================

/**
 * Update UI cho logged in user
 * @param {string} username - Username
 */
export function updateUIForLoggedInUser(username) {
    console.log('User logged in:', username);
    
    // Show user profile section
    const userProfileSection = document.getElementById('userProfileSection');
    const settingsBtn = document.getElementById('settingsBtn');
    const userDisplayName = document.getElementById('userDisplayName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userProfileSection && settingsBtn) {
        userProfileSection.classList.remove('hidden');
        settingsBtn.classList.add('hidden');
    }
    
    // Update username display
    if (userDisplayName) {
        userDisplayName.textContent = username;
    }
    
    // Update avatar với first letter của username
    if (userAvatar) {
        const firstLetter = username.charAt(0).toUpperCase();
        userAvatar.textContent = firstLetter;
    }
}

/**
 * Update UI cho logged out user
 */
export function updateUIForLoggedOutUser() {
    console.log('User logged out');
    
    // Hide user profile section
    const userProfileSection = document.getElementById('userProfileSection');
    const settingsBtn = document.getElementById('settingsBtn');
    
    if (userProfileSection && settingsBtn) {
        userProfileSection.classList.add('hidden');
        settingsBtn.classList.remove('hidden');
    }
}

/**
 * Setup user menu dropdown
 * @param {Function} handleLogoutCallback - Callback khi click logout
 */
export function setupUserMenuDropdown(handleLogoutCallback) {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const settingsBtnFromMenu = document.getElementById('settingsBtnFromMenu');
    const logoutBtnFromMenu = document.getElementById('logoutBtnFromMenu');
    
    if (!userMenuBtn || !userDropdownMenu) return;
    
    // Toggle dropdown on menu button click
    if (!userMenuBtn.hasAttribute('data-listener')) {
        userMenuBtn.setAttribute('data-listener', 'true');
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdownMenu.classList.toggle('hidden');
        });
    }
    
    // Settings button handler
    if (settingsBtnFromMenu && !settingsBtnFromMenu.hasAttribute('data-listener')) {
        settingsBtnFromMenu.setAttribute('data-listener', 'true');
        settingsBtnFromMenu.addEventListener('click', () => {
            userDropdownMenu.classList.add('hidden');
            const settingsBtn = document.getElementById('settingsBtn');
            if (settingsBtn) settingsBtn.click();
        });
    }
    
    // Logout button handler
    if (logoutBtnFromMenu && !logoutBtnFromMenu.hasAttribute('data-listener')) {
        logoutBtnFromMenu.setAttribute('data-listener', 'true');
        logoutBtnFromMenu.addEventListener('click', () => {
            userDropdownMenu.classList.add('hidden');
            if (handleLogoutCallback) handleLogoutCallback();
        });
    }
    
    // Close dropdown khi click outside
    document.addEventListener('click', (e) => {
        if (!userDropdownMenu.contains(e.target) && !userMenuBtn.contains(e.target)) {
            userDropdownMenu.classList.add('hidden');
        }
    });
}
