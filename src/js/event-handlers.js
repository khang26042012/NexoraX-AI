/**
 * EVENT-HANDLERS.JS - Setup event listeners
 * 
 * Module setup tất cả event listeners cho app:
 * - Main UI events
 * - Auth events
 * - File upload events  
 * - Voice recording events
 * - Model selection events
 */

// ===================================
// MAIN EVENT LISTENERS SETUP
// ===================================

/**
 * Setup main event listeners cho app
 * @param {Object} app - Instance của NexoraXChat
 */
export function setupMainEventListeners(app) {
    // Sidebar toggle mobile
    if (app.sidebarToggle) {
        app.sidebarToggle.addEventListener('click', () => {
            app.toggleSidebar();
        });
    }
    
    // Sidebar toggle desktop
    const desktopToggle = document.getElementById('desktopSidebarToggle');
    if (desktopToggle) {
        desktopToggle.addEventListener('click', () => app.toggleDesktopSidebar());
    }
    
    // Close sidebar button
    const closeSidebar = document.getElementById('closeSidebar');
    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => app.closeSidebar());
    }
    
    // Home input
    if (app.homeInput) {
        app.homeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && app.homeInput.value.trim()) {
                e.preventDefault();
                app.startNewChat(app.homeInput.value.trim());
            }
        });
        
        app.homeInput.addEventListener('focus', () => {
            setTimeout(() => {
                app.homeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    }
    
    const homeSendBtn = document.getElementById('homeSendBtn');
    if (homeSendBtn) {
        const handleHomeSend = () => {
            if (app.homeInput && app.homeInput.value.trim()) {
                app.startNewChat(app.homeInput.value.trim());
            }
        };
        
        homeSendBtn.addEventListener('click', handleHomeSend);
        homeSendBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleHomeSend();
        });
    }
    
    // Chat input
    if (app.chatInput) {
        app.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && app.chatInput.value.trim()) {
                e.preventDefault();
                app.sendMessage(app.chatInput.value.trim());
            }
        });
        
        app.chatInput.addEventListener('focus', () => {
            setTimeout(() => {
                app.chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
        
        app.chatInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (app.messagesContainer) {
                    app.messagesContainer.scrollTop = app.messagesContainer.scrollHeight;
                }
            }, 100);
        });
    }
    
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        const handleSend = () => {
            if (app.chatInput && (app.chatInput.value.trim() || app.selectedFiles.size > 0)) {
                app.sendMessage(app.chatInput.value.trim());
            }
        };
        
        sendBtn.addEventListener('click', handleSend);
        sendBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleSend();
        });
    }
    
    // New chat button
    document.getElementById('newChatBtn')?.addEventListener('click', () => {
        app.showHomeScreen();
        app.closeSidebar();
    });
    
    // Theme toggle
    app.themeToggle?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        app.toggleTheme();
    });
    
    // Settings
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        app.showSettings();
    });
    document.getElementById('cancelSettings')?.addEventListener('click', () => app.hideSettings());
    
    // About
    document.getElementById('aboutBtn')?.addEventListener('click', () => app.showAbout());
    document.getElementById('closeAbout')?.addEventListener('click', () => app.hideAbout());
    document.getElementById('goToSettingsBtn')?.addEventListener('click', () => {
        app.hideAbout();
        setTimeout(() => app.showSettings(), 300);
    });
    
    // Clear All
    document.getElementById('clearAllBtn')?.addEventListener('click', () => app.showClearAllConfirmation());
    document.getElementById('cancelClearAll')?.addEventListener('click', () => app.hideClearAllConfirmation());
    document.getElementById('confirmClearAll')?.addEventListener('click', () => app.clearAllChats());
    
    // Feedback
    document.getElementById('feedbackBtn')?.addEventListener('click', () => app.showFeedback());
    document.getElementById('cancelFeedback')?.addEventListener('click', () => app.hideFeedback());
    document.getElementById('submitFeedback')?.addEventListener('click', () => app.submitFeedback());
    
    // Star rating
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', (e) => app.setRating(parseInt(e.target.dataset.rating)));
        star.addEventListener('mouseenter', (e) => app.highlightStars(parseInt(e.target.dataset.rating)));
    });
    
    document.getElementById('starRating')?.addEventListener('mouseleave', () => app.resetStarHighlight());
    
    // Dual Chat Mode Toggle
    document.getElementById('homeDualModeBtn')?.addEventListener('click', () => {
        app.toggleDualMode();
    });
    document.getElementById('chatDualModeBtn')?.addEventListener('click', () => {
        app.toggleDualMode();
    });
    
    // Quick Model Selector buttons
    const homeQuickModelBtn = document.getElementById('homeQuickModelBtn');
    if (homeQuickModelBtn) {
        homeQuickModelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            app.toggleQuickModelDropdown('home');
        });
    }
    
    const quickModelBtn = document.getElementById('quickModelBtn');
    if (quickModelBtn) {
        quickModelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            app.toggleQuickModelDropdown('chat');
        });
    }
    
    // Quick Model options
    document.querySelectorAll('.quick-model-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const model = e.currentTarget.getAttribute('data-model');
            app.selectQuickModel(model);
        });
    });
    
    // Model selector dropdowns
    if (app.homeModelSelector) {
        app.homeModelSelector.addEventListener('change', (e) => {
            app.changeModel(e.target.value);
        });
    }
    
    if (app.chatModelSelector) {
        app.chatModelSelector.addEventListener('change', (e) => {
            app.changeModel(e.target.value);
        });
    }
    
    // Config dropdowns
    const homeConfigBtn = document.getElementById('homeConfigBtn');
    const homeConfigDropdown = document.getElementById('homeConfigDropdown');
    const chatConfigBtn = document.getElementById('chatConfigBtn');
    const chatConfigDropdown = document.getElementById('chatConfigDropdown');
    
    if (homeConfigBtn && homeConfigDropdown) {
        homeConfigBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            homeConfigDropdown.classList.toggle('hidden');
            if (chatConfigDropdown) chatConfigDropdown.classList.add('hidden');
        });
        
        homeConfigDropdown.querySelectorAll('.config-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                app.handleConfigAction(action);
                homeConfigDropdown.classList.add('hidden');
            });
        });
    }
    
    if (chatConfigBtn && chatConfigDropdown) {
        chatConfigBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            chatConfigDropdown.classList.toggle('hidden');
            if (homeConfigDropdown) homeConfigDropdown.classList.add('hidden');
        });
        
        chatConfigDropdown.querySelectorAll('.config-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                app.handleConfigAction(action);
                chatConfigDropdown.classList.add('hidden');
            });
        });
    }
    
    // Close dropdowns khi click outside
    document.addEventListener('click', (e) => {
        const homeDropdown = document.getElementById('homeQuickModelDropdown');
        const chatDropdown = document.getElementById('chatQuickModelDropdown');
        const homeBtn = document.getElementById('homeQuickModelBtn');
        const chatBtn = document.getElementById('quickModelBtn');
        
        if (homeDropdown && !homeDropdown.contains(e.target) && 
            homeBtn && !homeBtn.contains(e.target)) {
            homeDropdown.classList.add('hidden');
        }
        
        if (chatDropdown && !chatDropdown.contains(e.target) && 
            chatBtn && !chatBtn.contains(e.target)) {
            chatDropdown.classList.add('hidden');
        }
        
        // Close config dropdowns
        if (homeConfigDropdown && !homeConfigBtn?.contains(e.target) && 
            !homeConfigDropdown.contains(e.target)) {
            homeConfigDropdown.classList.add('hidden');
        }
        
        if (chatConfigDropdown && !chatConfigBtn?.contains(e.target) && 
            !chatConfigDropdown.contains(e.target)) {
            chatConfigDropdown.classList.add('hidden');
        }
        
        // Close sidebar on mobile
        if (window.innerWidth < 1024 && 
            app.sidebar && !app.sidebar.contains(e.target) && 
            app.sidebarToggle && !app.sidebarToggle.contains(e.target) &&
            (!app.settingsModal || !app.settingsModal.contains(e.target)) &&
            (!app.aboutModal || !app.aboutModal.contains(e.target)) &&
            (!app.clearAllModal || !app.clearAllModal.contains(e.target)) &&
            (!app.feedbackModal || !app.feedbackModal.contains(e.target))) {
            app.closeSidebar();
        }
    });
}

// ===================================
// FILE UPLOAD EVENT LISTENERS
// ===================================

/**
 * Setup file upload event listeners
 * @param {Object} app - Instance của NexoraXChat
 */
export function setupFileUploadListeners(app) {
    // Home page upload button
    const homeUploadBtn = document.getElementById('homeUploadBtn');
    if (homeUploadBtn) {
        homeUploadBtn.addEventListener('click', () => {
            app.homeFileInput.click();
        });
    }
    
    // Chat page upload button
    const chatUploadBtn = document.getElementById('chatUploadBtn');
    if (chatUploadBtn) {
        chatUploadBtn.addEventListener('click', () => {
            app.chatFileInput.click();
        });
    }
    
    // File input change handlers
    if (app.homeFileInput) {
        app.homeFileInput.addEventListener('change', (e) => {
            app.handleFileSelection(e.target.files);
        });
    }
    
    if (app.chatFileInput) {
        app.chatFileInput.addEventListener('change', (e) => {
            app.handleFileSelection(e.target.files);
        });
    }
    
    // File preview modal events
    document.getElementById('closeFilePreview')?.addEventListener('click', () => app.hideFilePreview());
    document.getElementById('clearFiles')?.addEventListener('click', () => app.clearSelectedFiles());
    document.getElementById('confirmFiles')?.addEventListener('click', () => app.hideFilePreview());
    
    // Image modal events
    document.getElementById('closeImageModal')?.addEventListener('click', () => app.closeImageModal());
    document.getElementById('imageModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'imageModal') {
            app.closeImageModal();
        }
    });
}

// ===================================
// VOICE RECORDING EVENT LISTENERS
// ===================================

/**
 * Setup voice recording event listeners
 * @param {Object} app - Instance của NexoraXChat
 */
export function setupVoiceRecordingListeners(app) {
    const homeVoiceBtn = document.getElementById('homeVoiceBtn');
    if (homeVoiceBtn) {
        homeVoiceBtn.addEventListener('click', () => {
            app.toggleVoiceRecording(app.homeInput, homeVoiceBtn);
        });
    }
    
    const chatVoiceBtn = document.getElementById('chatVoiceBtn');
    if (chatVoiceBtn) {
        chatVoiceBtn.addEventListener('click', () => {
            app.toggleVoiceRecording(app.chatInput, chatVoiceBtn);
        });
    }
}

// ===================================
// AUTH EVENT LISTENERS
// ===================================

/**
 * Setup authentication event listeners
 * @param {Object} app - Instance của NexoraXChat
 */
export function setupAuthEventListeners(app) {
    // Close auth modal
    document.getElementById('closeAuthModal')?.addEventListener('click', () => app.hideAuthModal());
    
    // Tab switching
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabIndicator = document.getElementById('tabIndicator');
    
    if (loginTab && signupTab && loginForm && signupForm && tabIndicator) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('text-blue-600');
            loginTab.classList.remove('text-gray-600');
            signupTab.classList.remove('text-blue-600');
            signupTab.classList.add('text-gray-600');
            
            tabIndicator.style.transform = 'translateX(0)';
            tabIndicator.style.width = '64px';
            
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        });
        
        signupTab.addEventListener('click', () => {
            signupTab.classList.add('text-blue-600');
            signupTab.classList.remove('text-gray-600');
            loginTab.classList.remove('text-blue-600');
            loginTab.classList.add('text-gray-600');
            
            tabIndicator.style.transform = 'translateX(84px)';
            tabIndicator.style.width = '64px';
            
            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        });
    }
    
    // Password visibility toggles - Login
    const loginPasswordToggle = document.getElementById('loginPasswordToggle');
    const loginPassword = document.getElementById('loginPassword');
    const loginPasswordShowIcon = document.getElementById('loginPasswordShowIcon');
    const loginPasswordHideIcon = document.getElementById('loginPasswordHideIcon');
    
    if (loginPasswordToggle && loginPassword && loginPasswordShowIcon && loginPasswordHideIcon) {
        loginPasswordToggle.addEventListener('click', () => {
            app.togglePasswordVisibility(loginPassword, loginPasswordShowIcon, loginPasswordHideIcon);
        });
    }
    
    // Password visibility toggles - Signup
    const signupPasswordToggle = document.getElementById('signupPasswordToggle');
    const signupPassword = document.getElementById('signupPassword');
    const signupPasswordShowIcon = document.getElementById('signupPasswordShowIcon');
    const signupPasswordHideIcon = document.getElementById('signupPasswordHideIcon');
    
    if (signupPasswordToggle && signupPassword && signupPasswordShowIcon && signupPasswordHideIcon) {
        signupPasswordToggle.addEventListener('click', () => {
            app.togglePasswordVisibility(signupPassword, signupPasswordShowIcon, signupPasswordHideIcon);
        });
    }
    
    // Password visibility toggles - Signup Confirm Password
    const signupConfirmPasswordToggle = document.getElementById('signupConfirmPasswordToggle');
    const signupConfirmPassword = document.getElementById('signupConfirmPassword');
    const signupConfirmPasswordShowIcon = document.getElementById('signupConfirmPasswordShowIcon');
    const signupConfirmPasswordHideIcon = document.getElementById('signupConfirmPasswordHideIcon');
    
    if (signupConfirmPasswordToggle && signupConfirmPassword && signupConfirmPasswordShowIcon && signupConfirmPasswordHideIcon) {
        signupConfirmPasswordToggle.addEventListener('click', () => {
            app.togglePasswordVisibility(signupConfirmPassword, signupConfirmPasswordShowIcon, signupConfirmPasswordHideIcon);
        });
    }
    
    // Login button
    document.getElementById('loginBtn')?.addEventListener('click', () => app.handleLogin());
    
    // Login with Enter key
    const loginUsername = document.getElementById('loginUsername');
    if (loginUsername && loginPassword) {
        [loginUsername, loginPassword].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    app.handleLogin();
                }
            });
        });
    }
    
    // Signup button
    document.getElementById('signupBtn')?.addEventListener('click', () => app.handleSignup());
    
    // Signup with Enter key
    const signupInputs = [
        'signupEmail', 'signupUsername', 'signupPassword', 'signupConfirmPassword'
    ];
    signupInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    app.handleSignup();
                }
            });
        }
    });
}

// ===================================
// TEXTAREA AUTO-EXPAND
// ===================================

/**
 * Setup textarea auto-expand
 */
export function setupTextareaAutoExpand() {
    const homeInput = document.getElementById('homeInput');
    const chatInput = document.getElementById('chatInput');
    
    function autoExpand(textarea) {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
    }
    
    if (homeInput) {
        homeInput.addEventListener('input', () => autoExpand(homeInput));
        autoExpand(homeInput);
    }
    
    if (chatInput) {
        chatInput.addEventListener('input', () => autoExpand(chatInput));
        autoExpand(chatInput);
    }
}
