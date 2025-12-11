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
import { 
    isValidEmail, 
    isValidPassword, 
    isValidUsername,
    isPasswordMatch,
    showFieldError,
    hideFieldError,
    clearAllErrors,
    setButtonLoading
} from './utils.js';
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
 * Handle login với validation và loading states
 * @param {string} username - Username hoặc email
 * @param {string} password - Password
 * @param {boolean} rememberMe - Remember me checkbox
 * @param {Function} onSuccess - Callback khi login thành công
 * @param {Function} onError - Callback khi login thất bại
 */
export async function handleLogin(username, password, rememberMe = false, onSuccess, onError) {
    // Clear previous errors
    clearAllErrors(['loginUsername', 'loginPassword']);
    
    // Validation
    let hasError = false;
    
    if (!username || username.trim() === '') {
        showFieldError('loginUsername', 'Vui lòng nhập email hoặc username');
        hasError = true;
    }
    
    if (!password || password.trim() === '') {
        showFieldError('loginPassword', 'Vui lòng nhập mật khẩu');
        hasError = true;
    }
    
    if (hasError) {
        return;
    }
    
    // Set loading state
    const loginBtn = document.getElementById('loginBtn');
    setButtonLoading(loginBtn, true, 'loginBtnText', 'loginBtnSpinner');
    
    try {
        const response = await fetch(API_ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
                username: username.trim(), 
                password, 
                remember_me: rememberMe 
            })
        });
        
        const data = await response.json();
        
        // Remove loading state
        setButtonLoading(loginBtn, false, 'loginBtnText', 'loginBtnSpinner');
        
        if (response.ok) {
            if (data.is_new_account) {
                showNotification(`Đã tạo tài khoản mới và đăng nhập! Chào mừng ${username} 🎉`, 'success');
            } else {
                showNotification(`Đăng nhập thành công! Chào ${username} 👋`, 'success');
            }
            if (onSuccess) onSuccess(username);
        } else {
            // Show error based on response
            const errorMsg = data.error || 'Đăng nhập thất bại!';
            
            // Map errors to specific fields if possible
            if (errorMsg.toLowerCase().includes('username') || errorMsg.toLowerCase().includes('email')) {
                showFieldError('loginUsername', errorMsg);
            } else if (errorMsg.toLowerCase().includes('password') || errorMsg.toLowerCase().includes('mật khẩu')) {
                showFieldError('loginPassword', errorMsg);
            } else {
                showNotification(errorMsg, 'error');
            }
            
            if (onError) onError(data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        setButtonLoading(loginBtn, false, 'loginBtnText', 'loginBtnSpinner');
        showNotification('Lỗi kết nối! Vui lòng thử lại.', 'error');
        if (onError) onError(error.message);
    }
}

/**
 * Handle signup với validation đầy đủ và loading states
 * @param {Object} signupData - Signup data {email, username, password, confirmPassword}
 * @param {Function} onSuccess - Callback khi signup thành công
 * @param {Function} onError - Callback khi signup thất bại
 */
export async function handleSignup(signupData, onSuccess, onError) {
    const { email, username, password, confirmPassword } = signupData;
    
    // Clear previous errors
    clearAllErrors(['signupEmail', 'signupUsername', 'signupPassword', 'signupConfirmPassword']);
    
    // Validation
    let hasError = false;
    
    // Validate Email
    if (!email || email.trim() === '') {
        showFieldError('signupEmail', 'Vui lòng nhập email');
        hasError = true;
    } else if (!isValidEmail(email)) {
        showFieldError('signupEmail', 'Email không hợp lệ (ví dụ: user@example.com)');
        hasError = true;
    }
    
    // Validate Username
    if (!username || username.trim() === '') {
        showFieldError('signupUsername', 'Vui lòng nhập username');
        hasError = true;
    } else if (!isValidUsername(username)) {
        showFieldError('signupUsername', 'Username phải có 3-20 ký tự (chỉ chữ, số và _)');
        hasError = true;
    }
    
    // Validate Password
    if (!password || password.trim() === '') {
        showFieldError('signupPassword', 'Vui lòng nhập mật khẩu');
        hasError = true;
    } else if (!isValidPassword(password)) {
        showFieldError('signupPassword', 'Mật khẩu phải có ít nhất 6 ký tự');
        hasError = true;
    }
    
    // Validate Confirm Password
    if (!confirmPassword || confirmPassword.trim() === '') {
        showFieldError('signupConfirmPassword', 'Vui lòng xác nhận mật khẩu');
        hasError = true;
    } else if (!isPasswordMatch(password, confirmPassword)) {
        showFieldError('signupConfirmPassword', 'Mật khẩu xác nhận không khớp');
        hasError = true;
    }
    
    if (hasError) {
        return;
    }
    
    // Set loading state
    const signupBtn = document.getElementById('signupBtn');
    setButtonLoading(signupBtn, true, 'signupBtnText', 'signupBtnSpinner');
    
    try {
        const requestBody = { 
            email: email.trim(),
            username: username.trim(), 
            password, 
            remember_me: true 
        };
        
        const response = await fetch(API_ENDPOINTS.SIGNUP, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        // Remove loading state
        setButtonLoading(signupBtn, false, 'signupBtnText', 'signupBtnSpinner');
        
        if (response.ok) {
            showNotification(`Đăng ký thành công! Chào mừng ${username} 🎉`, 'success');
            if (onSuccess) onSuccess(username);
        } else {
            // Show error based on response
            const errorMsg = data.error || 'Đăng ký thất bại!';
            
            // Map errors to specific fields if possible
            if (errorMsg.toLowerCase().includes('email')) {
                showFieldError('signupEmail', errorMsg);
            } else if (errorMsg.toLowerCase().includes('username')) {
                showFieldError('signupUsername', errorMsg);
            } else if (errorMsg.toLowerCase().includes('password') || errorMsg.toLowerCase().includes('mật khẩu')) {
                showFieldError('signupPassword', errorMsg);
            } else {
                showNotification(errorMsg, 'error');
            }
            
            if (onError) onError(data.error);
        }
    } catch (error) {
        console.error('Signup error:', error);
        setButtonLoading(signupBtn, false, 'signupBtnText', 'signupBtnSpinner');
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
    
    // Show user profile section, hide guest section
    const userProfileSection = document.getElementById('userProfileSection');
    const guestSection = document.getElementById('guestSection');
    const userDisplayName = document.getElementById('userDisplayName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userProfileSection && guestSection) {
        userProfileSection.classList.remove('hidden');
        guestSection.classList.add('hidden');
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
    
    // Hide user profile section, show guest section
    const userProfileSection = document.getElementById('userProfileSection');
    const guestSection = document.getElementById('guestSection');
    
    if (userProfileSection && guestSection) {
        userProfileSection.classList.add('hidden');
        guestSection.classList.remove('hidden');
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
