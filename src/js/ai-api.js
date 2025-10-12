/**
 * AI-API.JS - AI API calls
 * 
 * Module xử lý tất cả API calls đến AI services:
 * - Gemini API
 * - LLM7 API (GPT-5, Gemini Search, và các models khác)
 * - Image Generation API
 * - Prepare conversation history
 */

import { API_ENDPOINTS, API_TIMEOUTS } from './constants.js';

// ===================================
// CONVERSATION HISTORY PREPARATION
// ===================================

/**
 * Prepare conversation history cho Gemini API format
 * @param {Array} messages - Mảng messages
 * @param {number} limit - Giới hạn số lượng messages
 * @returns {Array} History ở định dạng Gemini
 */
export function prepareConversationHistoryGemini(messages, limit = 20) {
    // Lọc bỏ typing messages và messages rỗng
    const historyMessages = messages.filter(msg => !msg.isTyping && msg.content && msg.content.trim() !== '');
    const recentMessages = historyMessages.slice(-limit);
    
    return recentMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{
            text: msg.content
        }]
    }));
}

/**
 * Prepare conversation history cho LLM7 API format
 * @param {Array} messages - Mảng messages
 * @param {number} limit - Giới hạn số lượng messages
 * @returns {Array} History ở định dạng LLM7
 */
export function prepareConversationHistoryLLM7(messages, limit = 15) {
    // Lọc bỏ typing messages và messages rỗng
    const historyMessages = messages.filter(msg => !msg.isTyping && msg.content && msg.content.trim() !== '');
    const recentMessages = historyMessages.slice(-limit);
    
    return recentMessages.map(msg => ({
        role: msg.role, // Đã đúng format (user/assistant)
        content: msg.content
    }));
}

// ===================================
// GEMINI API
// ===================================

/**
 * Gọi Gemini API để nhận response
 * @param {string} message - User message
 * @param {Object} aiMessage - AI message object để update
 * @param {Array} files - Files đính kèm (nếu có)
 * @param {Array} conversationHistory - Lịch sử conversation
 * @param {Function} updateCallback - Callback để update message
 */
export async function getGeminiResponse(message, aiMessage, files, conversationHistory, updateCallback) {
    try {
        const url = API_ENDPOINTS.GEMINI;
        
        // Build contents array từ history + current message
        const contents = [...conversationHistory];
        
        // Add current user message
        const currentMessage = {
            role: 'user',
            parts: [{ text: message }]
        };
        
        // Thêm files nếu có
        if (files && files.length > 0) {
            console.log('🔍 Files to send:', files.length, files);
            files.forEach(file => {
                console.log('📁 Processing file:', file.name, 'type:', file.type, 'has base64:', !!file.base64);
                
                // Validate file data before adding
                if (file.base64 && file.type) {
                    // file.base64 có thể là pure base64 (không có prefix) hoặc có prefix
                    let base64Data = file.base64;
                    
                    // Nếu có prefix data:image/...;base64, thì bỏ đi
                    if (file.base64.includes(',')) {
                        base64Data = file.base64.split(',')[1];
                    }
                    
                    // Validate base64 data
                    if (base64Data && base64Data.trim() !== '') {
                        console.log('✅ File added to inline_data:', file.name, 'base64 length:', base64Data.length);
                        currentMessage.parts.push({
                            inline_data: {
                                mime_type: file.type,
                                data: base64Data
                            }
                        });
                    } else {
                        console.warn('⚠️ File has empty base64 data:', file.name);
                    }
                } else {
                    console.warn('⚠️ File validation failed:', file.name, {
                        hasBase64: !!file.base64,
                        hasType: !!file.type
                    });
                }
            });
            console.log('📤 Final message parts:', currentMessage.parts.length, 'parts');
        }
        
        contents.push(currentMessage);
        
        const requestBody = {
            model: 'gemini-2.0-flash-exp',
            payload: {
                contents: contents
            }
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(API_TIMEOUTS.GEMINI)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'HTTP error! status: ' + response.status);
        }
        
        const data = await response.json();
        console.log('Gemini API response:', data);
        
        // Extract response text
        let responseText = '';
        if (data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                responseText = candidate.content.parts[0].text;
            } else {
                responseText = JSON.stringify(candidate);
            }
        } else {
            responseText = data.text || JSON.stringify(data);
        }
        
        // Update AI message
        aiMessage.content = responseText;
        aiMessage.isTyping = false;
        updateCallback(aiMessage);
        
    } catch (error) {
        console.error('Gemini API Error:', error);
        
        let errorMessage = 'Xin lỗi, đã có lỗi xảy ra khi gọi Gemini API.';
        if (error.message) {
            errorMessage += ` Chi tiết: ${error.message}`;
        }
        errorMessage += ' Vui lòng thử lại hoặc chọn model khác.';
        
        aiMessage.content = errorMessage;
        aiMessage.isTyping = false;
        updateCallback(aiMessage);
    }
}

// ===================================
// LLM7 API
// ===================================

/**
 * Gọi LLM7 GPT-5 Chat API
 * @param {string} message - User message
 * @param {Object} aiMessage - AI message object để update
 * @param {Array} files - Files đính kèm (nếu có)
 * @param {Array} conversationHistory - Lịch sử conversation
 * @param {Function} updateCallback - Callback để update message
 */
export async function getLLM7GPT5ChatResponse(message, aiMessage, files, conversationHistory, updateCallback) {
    try {
        const url = API_ENDPOINTS.LLM7_GPT5_CHAT;
        
        const requestBody = {
            message: message,
            messages: conversationHistory,
            files: files || [] // Thêm files vào request body
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(API_TIMEOUTS.LLM7)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'HTTP error! status: ' + response.status);
        }
        
        const data = await response.json();
        console.log('LLM7 GPT-5 response:', data);
        
        const responseText = data.reply || JSON.stringify(data);
        
        aiMessage.content = responseText;
        aiMessage.isTyping = false;
        updateCallback(aiMessage);
        
    } catch (error) {
        console.error('LLM7 GPT-5 Error:', error);
        
        let errorMessage = 'Xin lỗi, đã có lỗi xảy ra khi gọi GPT-5.';
        if (error.message) {
            errorMessage += ` Chi tiết: ${error.message}`;
        }
        errorMessage += ' Vui lòng thử lại hoặc chọn model khác.';
        
        aiMessage.content = errorMessage;
        aiMessage.isTyping = false;
        updateCallback(aiMessage);
    }
}

/**
 * Gọi LLM7 Gemini Search API
 * @param {string} message - User message
 * @param {Object} aiMessage - AI message object để update
 * @param {Array} files - Files đính kèm (nếu có)
 * @param {Array} conversationHistory - Lịch sử conversation
 * @param {Function} updateCallback - Callback để update message
 */
export async function getLLM7GeminiSearchResponse(message, aiMessage, files, conversationHistory, updateCallback) {
    try {
        const url = API_ENDPOINTS.LLM7_GEMINI_SEARCH;
        
        const requestBody = {
            message: message,
            messages: conversationHistory,
            files: files || [] // Thêm files vào request body
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(API_TIMEOUTS.LLM7)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'HTTP error! status: ' + response.status);
        }
        
        const data = await response.json();
        console.log('LLM7 Gemini Search response:', data);
        
        let responseText = data.reply || JSON.stringify(data);
        responseText += '\n\n*🔍 Sử dụng Gemini Search với tìm kiếm thời gian thực*';
        
        aiMessage.content = responseText;
        aiMessage.isTyping = false;
        updateCallback(aiMessage);
        
    } catch (error) {
        console.error('LLM7 Gemini Search Error:', error);
        
        let errorMessage = 'Xin lỗi, đã có lỗi xảy ra khi gọi Gemini Search.';
        if (error.message) {
            errorMessage += ` Chi tiết: ${error.message}`;
        }
        errorMessage += ' Vui lòng thử lại hoặc chọn model khác.';
        
        aiMessage.content = errorMessage;
        aiMessage.isTyping = false;
        updateCallback(aiMessage);
    }
}

/**
 * Gọi LLM7 API với model bất kỳ
 * @param {string} modelId - Model ID
 * @param {string} message - User message
 * @param {Object} aiMessage - AI message object để update
 * @param {Array} files - Files đính kèm (nếu có)
 * @param {Array} conversationHistory - Lịch sử conversation
 * @param {Function} updateCallback - Callback để update message
 */
export async function getLLM7Response(modelId, message, aiMessage, files, conversationHistory, updateCallback) {
    try {
        const url = API_ENDPOINTS.LLM7_CHAT;
        
        const requestBody = {
            model: modelId,
            message: message,
            messages: conversationHistory,
            files: files || [] // Thêm files vào request body
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(API_TIMEOUTS.LLM7)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'HTTP error! status: ' + response.status);
        }
        
        const data = await response.json();
        console.log(`LLM7 ${modelId} response:`, data);
        
        let responseText = data.reply || JSON.stringify(data);
        
        // Fix: Một số model (như gemma-2-2b-it) trả về raw JSON string
        // Cần parse thêm một lớp để lấy message content
        try {
            if (responseText.startsWith('{') && responseText.includes('choices')) {
                const parsedResponse = JSON.parse(responseText);
                if (parsedResponse.choices && parsedResponse.choices.length > 0) {
                    const messageContent = parsedResponse.choices[0].message?.content;
                    if (messageContent) {
                        responseText = messageContent;
                    }
                }
            }
        } catch (e) {
            // Nếu không parse được thì giữ nguyên responseText
            console.log('Could not parse nested JSON, using original response');
        }
        
        aiMessage.content = responseText;
        aiMessage.isTyping = false;
        updateCallback(aiMessage);
        
    } catch (error) {
        console.error(`LLM7 ${modelId} Error:`, error);
        
        let errorMessage = `Xin lỗi, đã có lỗi xảy ra khi gọi ${modelId}.`;
        if (error.message) {
            errorMessage += ` Chi tiết: ${error.message}`;
        }
        errorMessage += ' Vui lòng thử lại hoặc chọn model khác.';
        
        aiMessage.content = errorMessage;
        aiMessage.isTyping = false;
        updateCallback(aiMessage);
    }
}

// ===================================
// IMAGE GENERATION API
// ===================================

/**
 * Gọi Image Generation API
 */
export async function getImageGenerationResponse(message, aiMessage, updateCallback) {
    try {
        // Step 1: Enhance prompt với AI
        let enhancedPrompt = message;
        
        try {
            aiMessage.content = '🔄 Đang xử lý prompt với AI (nhận diện viết tắt tiếng Việt)...';
            updateCallback(aiMessage);
            
            const enhanceUrl = API_ENDPOINTS.ENHANCE_PROMPT;
            const enhanceResponse = await fetch(enhanceUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: message }),
                signal: AbortSignal.timeout(API_TIMEOUTS.ENHANCE_PROMPT)
            });
            
            if (enhanceResponse.ok) {
                const enhanceData = await enhanceResponse.json();
                enhancedPrompt = enhanceData.enhanced_prompt || message;
                
                console.log('Prompt enhanced:', {
                    original: message,
                    enhanced: enhancedPrompt
                });
            } else {
                console.warn('Enhance prompt failed, using original prompt');
            }
        } catch (enhanceError) {
            console.warn('Enhance prompt error, using original prompt:', enhanceError);
        }
        
        // Step 2: Generate image
        aiMessage.content = `✅ Prompt đã xử lý: "${enhancedPrompt}"\n\n🎨 Đang tạo ảnh với Pollinations AI...`;
        updateCallback(aiMessage);
        
        const genUrl = API_ENDPOINTS.IMAGE_GEN;
        const genResponse = await fetch(genUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: enhancedPrompt,
                width: 1920,
                height: 1080
            }),
            signal: AbortSignal.timeout(API_TIMEOUTS.IMAGE_GEN)
        });
        
        if (!genResponse.ok) {
            const errorData = await genResponse.json();
            throw new Error(errorData.error || 'HTTP error! status: ' + genResponse.status);
        }
        
        const genData = await genResponse.json();
        console.log('Image generated:', genData);
        
        // Step 3: Display image
        const imageId = 'img-' + Date.now();
        const imageHtml = `
            <div class="image-generation-result">
                <div class="relative group">
                    <img src="${genData.image_url}" 
                         alt="Generated image" 
                         id="${imageId}"
                         class="w-full rounded-lg shadow-lg cursor-pointer transition-all"
                         loading="lazy">
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <a href="${genData.image_url}" 
                           download="nexorax-generated-image.jpg"
                           class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Tải xuống
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        aiMessage.content = imageHtml;
        aiMessage.isTyping = false;
        aiMessage.isHtml = true;
        updateCallback(aiMessage);
        
    } catch (error) {
        console.error('Image Generation Error:', error);
        
        let errorMessage = 'Xin lỗi, đã có lỗi xảy ra khi tạo ảnh. ';
        if (error.message) {
            errorMessage += `Chi tiết: ${error.message} `;
        }
        errorMessage += 'Vui lòng thử lại sau.';
        
        aiMessage.content = errorMessage;
        aiMessage.isTyping = false;
        updateCallback(aiMessage);
    }
}
