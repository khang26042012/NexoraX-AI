class NovaXChat {
    constructor() {
        this.currentChatId = null;
        this.chats = JSON.parse(localStorage.getItem('novax_chats') || '{}');
        this.apiKey = localStorage.getItem('novax_api_key') || 'AIzaSyBh1t_Ab1C3t53nka9Lt2gbtzrFxP6SZWM';
        this.isDarkMode = localStorage.getItem('novax_dark_mode') === 'true';
        this.currentRating = 0;
        this.selectedModel = localStorage.getItem('novax_selected_model') || 'gemini';
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadTheme();
        this.loadModelSelection();
        this.initializeDesktopSidebar();
        this.renderChatList();
    }
    
    initializeElements() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.homeScreen = document.getElementById('homeScreen');
        this.chatScreen = document.getElementById('chatScreen');
        this.homeInput = document.getElementById('homeInput');
        this.chatInput = document.getElementById('chatInput');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.chatList = document.getElementById('chatList');
        this.themeToggle = document.getElementById('themeToggle');
        this.settingsModal = document.getElementById('settingsModal');
        this.aboutModal = document.getElementById('aboutModal');
        this.clearAllModal = document.getElementById('clearAllModal');
        this.feedbackModal = document.getElementById('feedbackModal');
        this.searchInput = document.getElementById('searchInput');
    }
    
    setupEventListeners() {
        // Sidebar toggle mobile
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        
        // Sidebar toggle desktop
        document.getElementById('desktopSidebarToggle').addEventListener('click', () => this.toggleDesktopSidebar());
        
        // Close sidebar button (works for both mobile and desktop)
        document.getElementById('closeSidebar').addEventListener('click', () => this.closeSidebar());
        
        // Home input
        this.homeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && this.homeInput.value.trim()) {
                e.preventDefault();
                this.startNewChat(this.homeInput.value.trim());
            }
        });
        
        document.getElementById('homeSendBtn').addEventListener('click', () => {
            if (this.homeInput.value.trim()) {
                this.startNewChat(this.homeInput.value.trim());
            }
        });
        
        // Chat input
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && this.chatInput.value.trim()) {
                e.preventDefault();
                this.sendMessage(this.chatInput.value.trim());
            }
        });
        
        document.getElementById('sendBtn').addEventListener('click', () => {
            if (this.chatInput.value.trim()) {
                this.sendMessage(this.chatInput.value.trim());
            }
        });
        
        // New chat button
        document.getElementById('newChatBtn').addEventListener('click', () => {
            this.showHomeScreen();
            this.closeSidebar();
        });
        
        // Theme toggle
        this.themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleTheme();
        });
        
        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('cancelSettings').addEventListener('click', () => this.hideSettings());
        
        // About
        document.getElementById('aboutBtn').addEventListener('click', () => this.showAbout());
        document.getElementById('closeAbout').addEventListener('click', () => this.hideAbout());
        
        // Clear All
        document.getElementById('clearAllBtn').addEventListener('click', () => this.showClearAllConfirmation());
        document.getElementById('cancelClearAll').addEventListener('click', () => this.hideClearAllConfirmation());
        document.getElementById('confirmClearAll').addEventListener('click', () => this.clearAllChats());
        
        // Feedback
        document.getElementById('feedbackBtn').addEventListener('click', () => this.showFeedback());
        document.getElementById('cancelFeedback').addEventListener('click', () => this.hideFeedback());
        document.getElementById('submitFeedback').addEventListener('click', () => this.submitFeedback());
        
        // Star rating
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => this.setRating(parseInt(e.target.dataset.rating)));
            star.addEventListener('mouseenter', (e) => this.highlightStars(parseInt(e.target.dataset.rating)));
        });
        
        document.getElementById('starRating').addEventListener('mouseleave', () => this.resetStarHighlight());
        
        // Model selection
        document.querySelectorAll('input[name="aiModel"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.changeModel(e.target.value));
        });
        
        // Search
        this.searchInput.addEventListener('input', (e) => this.searchChats(e.target.value));
        
        // Quick suggestions
        document.querySelectorAll('.quick-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', (e) => {
                const text = e.currentTarget.querySelector('span').textContent;
                if (text === 'Hỏi về kiến thức') {
                    this.homeInput.value = 'Bạn có thể giải thích cho tôi về ';
                } else if (text === 'Hỗ trợ lập trình') {
                    this.homeInput.value = 'Giúp tôi viết code ';
                }
                this.homeInput.focus();
                // Move cursor to end
                const len = this.homeInput.value.length;
                this.homeInput.setSelectionRange(len, len);
            });
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 1024 && 
                !this.sidebar.contains(e.target) && 
                !this.sidebarToggle.contains(e.target) &&
                !this.settingsModal.contains(e.target) &&
                !this.aboutModal.contains(e.target) &&
                !this.clearAllModal.contains(e.target) &&
                !this.feedbackModal.contains(e.target)) {
                this.closeSidebar();
            }
        });
    }
    
    toggleSidebar() {
        const isHidden = this.sidebar.classList.contains('-translate-x-full');
        
        if (isHidden) {
            this.sidebar.classList.remove('-translate-x-full');
            this.sidebarToggle.style.opacity = '0';
            this.sidebarToggle.style.pointerEvents = 'none';
        } else {
            this.sidebar.classList.add('-translate-x-full');
            this.sidebarToggle.style.opacity = '1';
            this.sidebarToggle.style.pointerEvents = 'auto';
        }
    }
    
    closeSidebar() {
        this.sidebar.classList.add('-translate-x-full');
        this.sidebarToggle.style.opacity = '1';
        this.sidebarToggle.style.pointerEvents = 'auto';
        
        const desktopToggle = document.getElementById('desktopSidebarToggle');
        if (desktopToggle) {
            desktopToggle.style.opacity = '1';
            desktopToggle.style.pointerEvents = 'auto';
        }
    }
    
    toggleDesktopSidebar() {
        const isHidden = this.sidebar.classList.contains('-translate-x-full');
        const desktopToggle = document.getElementById('desktopSidebarToggle');
        
        if (isHidden) {
            this.sidebar.classList.remove('-translate-x-full');
            desktopToggle.style.opacity = '0';
            desktopToggle.style.pointerEvents = 'none';
        } else {
            this.sidebar.classList.add('-translate-x-full');
            desktopToggle.style.opacity = '1';
            desktopToggle.style.pointerEvents = 'auto';
        }
    }
    
    initializeDesktopSidebar() {
        const desktopToggle = document.getElementById('desktopSidebarToggle');
        this.sidebar.classList.add('-translate-x-full');
        
        if (desktopToggle) {
            desktopToggle.style.opacity = '1';
            desktopToggle.style.pointerEvents = 'auto';
        }
    }
    
    showHomeScreen() {
        this.homeScreen.classList.remove('hidden');
        this.chatScreen.classList.add('hidden');
        this.currentChatId = null;
        this.homeInput.value = '';
        this.homeInput.focus();
    }
    
    showChatScreen() {
        this.homeScreen.classList.add('hidden');
        this.chatScreen.classList.remove('hidden');
        this.chatInput.focus();
    }
    
    startNewChat(message) {
        this.currentChatId = null;
        this.messagesContainer.innerHTML = '';
        
        const chatId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
        this.currentChatId = chatId;
        
        this.chats[chatId] = {
            id: chatId,
            title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
            messages: [],
            createdAt: new Date().toISOString(),
            isPinned: false
        };
        
        this.saveChats();
        this.showChatScreen();
        this.sendMessage(message);
        this.renderChatList();
    }
    
    async sendMessage(message) {
        if (!this.currentChatId || !message || !message.trim()) return;
        
        const chat = this.chats[this.currentChatId];
        if (!chat) return;
        
        const trimmedMessage = message.trim();
        
        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: trimmedMessage,
            timestamp: new Date().toISOString()
        };
        
        chat.messages.push(userMessage);
        this.renderMessage(userMessage);
        this.chatInput.value = '';
        
        const aiMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isTyping: true
        };
        
        chat.messages.push(aiMessage);
        this.renderMessage(aiMessage);
        
        try {
            await this.getAIResponse(trimmedMessage, aiMessage);
        } catch (error) {
            console.error('Error getting AI response:', error);
            aiMessage.content = "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.";
            aiMessage.isTyping = false;
            this.updateMessage(aiMessage);
        } finally {
            this.saveChats();
        }
    }
    
    async getAIResponse(message, aiMessage) {
        try {
            if (this.selectedModel === 'gemini') {
                await this.getGeminiResponse(message, aiMessage);
            } else if (this.selectedModel === 'llama') {
                await this.getMixtralResponse(message, aiMessage);
            }
        } catch (error) {
            console.error('AI API Error:', error);
            aiMessage.content = "Xin lỗi, hiện tại tôi không thể trả lời. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.";
            aiMessage.isTyping = false;
            this.updateMessage(aiMessage);
        }
    }
    
    async getGeminiResponse(message, aiMessage) {
        try {
            const apiKey = this.apiKey || 'AIzaSyBh1t_Ab1C3t53nka9Lt2gbtzrFxP6SZWM';
            const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: message
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            
            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && 
                data.candidates[0].content.parts && data.candidates[0].content.parts[0] && 
                data.candidates[0].content.parts[0].text) {
                
                const aiResponse = data.candidates[0].content.parts[0].text.trim();
                
                if (aiResponse) {
                    const words = aiResponse.split(' ');
                    let currentText = '';
                    
                    for (let i = 0; i < words.length; i++) {
                        currentText += (i > 0 ? ' ' : '') + words[i];
                        aiMessage.content = currentText;
                        this.updateMessage(aiMessage);
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                    
                    aiMessage.isTyping = false;
                    this.updateMessage(aiMessage);
                    return;
                }
            }
            
            throw new Error('Invalid Gemini response format or empty content');
            
        } catch (error) {
            console.error('Gemini API Error:', error);
            
            const demoResponses = [
                "Xin chào! Tôi là NovaX v1.0 sử dụng Google Gemini Flash 2.0. Tôi có thể giúp bạn trả lời câu hỏi, giải thích khái niệm, và hỗ trợ học tập.",
                "Đây là phản hồi từ Google Gemini Flash 2.0 - model AI tiên tiến với khả năng hiểu ngôn ngữ tự nhiên và cung cấp thông tin chính xác.",
                "Tôi có thể giúp bạn với nhiều chủ đề khác nhau như học tập, giải bài tập, tìm hiểu kiến thức, và trò chuyện thông thường. Hãy hỏi tôi bất cứ điều gì!"
            ];
            
            const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
            
            const words = randomResponse.split(' ');
            let currentText = '';
            
            for (let i = 0; i < words.length; i++) {
                currentText += (i > 0 ? ' ' : '') + words[i];
                aiMessage.content = currentText;
                this.updateMessage(aiMessage);
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            aiMessage.isTyping = false;
            this.updateMessage(aiMessage);
        }
    }
    
    async getMixtralResponse(message, aiMessage) {
        try {
            const API_TOKEN = "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";
            const API_URL = "https://api.groq.com/openai/v1/chat/completions";
            
            console.log('NovaX 2.0 using Groq Llama 3.1 8B Instant for message: ' + message.substring(0, 50) + '...');
            
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + API_TOKEN,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "system",
                            content: "Bạn là NovaX v2.0 được hỗ trợ bởi Llama 3.1 8B Instant trên Groq - một trí tuệ nhân tạo siêu nhanh và thông minh. Hãy trả lời bằng tiếng Việt một cách tự nhiên, thân thiện và chính xác."
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024,
                    top_p: 0.95,
                    stream: false
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Groq Llama 3.1 API Error:', response.status, errorText);
                throw new Error('HTTP ' + response.status + ': ' + errorText);
            }
            
            const data = await response.json();
            console.log('NovaX 2.0 Groq Llama 3.1 response:', data);
            
            if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                const aiResponse = data.choices[0].message.content.trim();
                
                if (aiResponse && aiResponse.length > 0) {
                    console.log('Successfully got NovaX 2.0 response from Groq Llama 3.1');
                    
                    const words = aiResponse.split(' ');
                    let currentText = '';
                    
                    for (let i = 0; i < words.length; i++) {
                        currentText += (i > 0 ? ' ' : '') + words[i];
                        aiMessage.content = currentText;
                        this.updateMessage(aiMessage);
                        await new Promise(resolve => setTimeout(resolve, 25));
                    }
                    
                    aiMessage.isTyping = false;
                    this.updateMessage(aiMessage);
                    return;
                }
            }
            
            throw new Error('Invalid or empty response from Groq Llama 3.1');
            
        } catch (error) {
            console.error('NovaX 2.0 Groq Llama 3.1 API Error:', error);
            
            const smartResponses = [
                "Xin chào! Tôi là NovaX v2.0 được hỗ trợ bởi Llama 3.1 8B Instant trên Groq - AI siêu nhanh từ Meta!\n\nVề câu hỏi \"" + message.substring(0, 50) + (message.length > 50 ? '...' : '') + "\", đây là một chủ đề thú vị! Tôi có khả năng mạnh mẽ trong cả trò chuyện thông thường và hỗ trợ lập trình.",
                "Chào bạn! NovaX v2.0 với Llama 3.1 8B Instant trên Groq đang xử lý câu hỏi của bạn. Với Groq LPU (Language Processing Unit), tôi có thể phản hồi siêu nhanh và chính xác!"
            ];
            
            const randomResponse = smartResponses[Math.floor(Math.random() * smartResponses.length)];
            
            const words = randomResponse.split(' ');
            let currentText = '';
            
            for (let i = 0; i < words.length; i++) {
                currentText += (i > 0 ? ' ' : '') + words[i];
                aiMessage.content = currentText;
                this.updateMessage(aiMessage);
                await new Promise(resolve => setTimeout(resolve, 30));
            }
            
            aiMessage.isTyping = false;
            this.updateMessage(aiMessage);
        }
    }
    
    renderMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-bubble ' + (message.role === 'user' ? 'user-message' : 'ai-message');
        messageDiv.setAttribute('data-message-id', message.id);
        
        const avatarImg = message.role === 'user' ? 
            '' : '<img src="https://i.postimg.cc/Jyz7fhf8/image.png" alt="AI" class="w-8 h-8 object-contain" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">';
        const fallbackAvatar = message.role === 'user' ? 
            'U' : '<div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg" style="display: none;"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg></div>';
        
        messageDiv.innerHTML = '<div class="message-wrapper"><div class="avatar ' + (message.role === 'user' ? 'user-avatar' : 'ai-avatar') + '">' +
            (message.role === 'user' ? 'U' : avatarImg + fallbackAvatar) +
            '</div><div class="message-bubble-content ' + (message.role === 'user' ? 'user-bubble' : 'ai-bubble') + 
            '"><div class="message-content">' +
            (message.isTyping ? '<span class="typing-indicator">Đang soạn tin...</span>' : this.formatMessage(message.content)) +
            '</div></div></div>';
        
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    updateMessage(message) {
        const messageElement = this.messagesContainer.querySelector('[data-message-id="' + message.id + '"]');
        if (messageElement) {
            const contentElement = messageElement.querySelector('.message-content');
            if (message.isTyping) {
                contentElement.innerHTML = '<span class="typing-indicator">Đang soạn tin...</span>';
            } else {
                contentElement.innerHTML = this.formatMessage(message.content);
            }
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }
    
    formatMessage(content) {
        try {
            return marked.parse(content);
        } catch (error) {
            console.error('Markdown parsing error:', error);
            return content.replace(/\n/g, '<br>');
        }
    }
    
    renderChatList() {
        const chatArray = Object.values(this.chats);
        chatArray.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        this.chatList.innerHTML = chatArray.map(chat => 
            '<div class="chat-item p-3 hover:bg-gray-100 rounded-xl cursor-pointer transition-all duration-300 ' + 
            (this.currentChatId === chat.id ? 'bg-blue-50 border-l-4 border-blue-500' : '') + 
            '" onclick="app.loadChat(\'' + chat.id + '\')"><div class="flex items-center justify-between"><div class="flex-1"><div class="font-medium text-sm truncate mb-1">' +
            (chat.isPinned ? '📌 ' : '') + chat.title + 
            '</div><div class="text-xs text-gray-500">' + new Date(chat.createdAt).toLocaleDateString('vi-VN') + 
            '</div></div><div class="flex items-center space-x-1"><button class="p-1 hover:bg-gray-200 rounded" onclick="event.stopPropagation(); app.togglePin(\'' + chat.id + '\')" title="' + 
            (chat.isPinned ? 'Bỏ ghim' : 'Ghim cuộc trò chuyện') + '">' + (chat.isPinned ? '📌' : '📍') + 
            '</button><button class="p-1 hover:bg-red-200 rounded text-red-500" onclick="event.stopPropagation(); app.deleteChat(\'' + chat.id + '\')" title="Xóa cuộc trò chuyện">🗑️</button></div></div></div>'
        ).join('');
    }
    
    loadChat(chatId) {
        const chat = this.chats[chatId];
        if (!chat) return;
        
        this.currentChatId = chatId;
        this.showChatScreen();
        
        this.messagesContainer.innerHTML = '';
        chat.messages.forEach(message => this.renderMessage(message));
        this.renderChatList();
        
        if (window.innerWidth < 1024) {
            this.closeSidebar();
        }
    }
    
    deleteChat(chatId) {
        if (confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
            delete this.chats[chatId];
            this.saveChats();
            this.renderChatList();
            
            if (this.currentChatId === chatId) {
                this.showHomeScreen();
            }
        }
    }
    
    togglePin(chatId) {
        const chat = this.chats[chatId];
        if (chat) {
            chat.isPinned = !chat.isPinned;
            this.saveChats();
            this.renderChatList();
        }
    }
    
    searchChats(query) {
        const chatItems = this.chatList.querySelectorAll('.chat-item');
        
        chatItems.forEach(item => {
            const title = item.querySelector('.font-medium').textContent.toLowerCase();
            if (title.includes(query.toLowerCase())) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('novax_dark_mode', this.isDarkMode);
        this.loadTheme();
    }
    
    loadTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }
    
    showSettings() {
        this.settingsModal.classList.remove('hidden');
        setTimeout(() => {
            const content = document.getElementById('settingsContent');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
    
    hideSettings() {
        const content = document.getElementById('settingsContent');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.settingsModal.classList.add('hidden');
        }, 300);
    }
    
    showAbout() {
        this.aboutModal.classList.remove('hidden');
        setTimeout(() => {
            const content = document.getElementById('aboutContent');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
    
    hideAbout() {
        const content = document.getElementById('aboutContent');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.aboutModal.classList.add('hidden');
        }, 300);
    }
    
    showClearAllConfirmation() {
        this.clearAllModal.classList.remove('hidden');
        setTimeout(() => {
            const content = document.getElementById('clearAllContent');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
    
    hideClearAllConfirmation() {
        const content = document.getElementById('clearAllContent');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.clearAllModal.classList.add('hidden');
        }, 300);
    }
    
    clearAllChats() {
        this.chats = {};
        this.saveChats();
        this.renderChatList();
        this.showHomeScreen();
        this.hideClearAllConfirmation();
        this.showNotification('Đã xóa tất cả cuộc trò chuyện!', 'success');
    }
    
    showFeedback() {
        this.currentRating = 0;
        this.resetStarHighlight();
        document.getElementById('feedbackText').value = '';
        document.getElementById('ratingText').textContent = 'Nhấn vào sao để đánh giá';
        
        this.feedbackModal.classList.remove('hidden');
        setTimeout(() => {
            const content = document.getElementById('feedbackContent');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
    
    hideFeedback() {
        const content = document.getElementById('feedbackContent');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.feedbackModal.classList.add('hidden');
        }, 300);
    }
    
    setRating(rating) {
        this.currentRating = rating;
        this.updateStarDisplay(rating);
        
        const ratingTexts = {
            1: 'Rất tệ 😞',
            2: 'Tệ 😕',
            3: 'Bình thường 😐',
            4: 'Tốt 😊',
            5: 'Xuất sắc 🤩'
        };
        
        document.getElementById('ratingText').textContent = ratingTexts[rating];
    }
    
    highlightStars(rating) {
        this.updateStarDisplay(rating);
    }
    
    resetStarHighlight() {
        this.updateStarDisplay(this.currentRating);
    }
    
    updateStarDisplay(rating) {
        document.querySelectorAll('.star').forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('text-gray-300');
                star.classList.add('text-yellow-400');
            } else {
                star.classList.remove('text-yellow-400');
                star.classList.add('text-gray-300');
            }
        });
    }
    
    submitFeedback() {
        const feedbackText = document.getElementById('feedbackText').value.trim();
        
        if (this.currentRating === 0) {
            this.showNotification('Vui lòng chọn số sao đánh giá!', 'error');
            return;
        }
        
        const feedback = {
            rating: this.currentRating,
            comment: feedbackText,
            timestamp: new Date().toISOString()
        };
        
        const feedbacks = JSON.parse(localStorage.getItem('novax_feedbacks') || '[]');
        feedbacks.push(feedback);
        localStorage.setItem('novax_feedbacks', JSON.stringify(feedbacks));
        
        this.hideFeedback();
        this.showNotification('Cảm ơn bạn đã đánh giá! 🙏', 'success');
    }
    
    showNotification(message, type = 'info') {
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
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    
    changeModel(modelType) {
        this.selectedModel = modelType;
        localStorage.setItem('novax_selected_model', modelType);
        
        const modelNames = {
            'gemini': 'NovaX (v1.0) - Gemini Flash 2.0',
            'llama': 'NovaX (v2.0) - Llama 3.1 8B Instant'
        };
        
        
        this.showNotification('Đã chuyển sang ' + modelNames[modelType] + '!', 'success');
    }
    
    loadModelSelection() {
        const modelRadio = document.querySelector('input[name="aiModel"][value="' + this.selectedModel + '"]');
        if (modelRadio) {
            modelRadio.checked = true;
        }
        
        const modelNames = {
            'gemini': 'NovaX (v1.0) - Gemini Flash 2.0',
            'llama': 'NovaX (v2.0) - Llama 3.1 8B Instant'
        };
        
    }
    
    saveChats() {
        localStorage.setItem('novax_chats', JSON.stringify(this.chats));
    }
}

// Initialize the app
const app = new NovaXChat();