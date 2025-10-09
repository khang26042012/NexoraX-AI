/**
 * VOICE-MANAGER.JS - Speech recognition
 * 
 * Module xử lý voice input:
 * - Initialize speech recognition
 * - Start/stop recording
 * - Handle recognition results
 */

import { showNotification } from './ui-manager.js';

// ===================================
// SPEECH RECOGNITION
// ===================================

let speechRecognition = null;
let isRecording = false;
let currentActiveInput = null;

/**
 * Initialize speech recognition
 * @returns {Object|null} Speech recognition instance hoặc null nếu không support
 */
export function initializeSpeechRecognition() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.warn('Speech Recognition not supported in this browser');
        return null;
    }
    
    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'vi-VN'; // Vietnamese
    
    return speechRecognition;
}

/**
 * Start voice recording
 * @param {HTMLElement} inputElement - Input element để nhận text
 * @param {HTMLElement} voiceButton - Voice button element
 * @param {Function} onResult - Callback khi có kết quả (nhận transcript)
 * @param {Function} onError - Callback khi có lỗi
 */
export function startVoiceRecording(inputElement, voiceButton, onResult, onError) {
    if (!speechRecognition) {
        showNotification('Trình duyệt không hỗ trợ nhận dạng giọng nói', 'error');
        if (onError) onError('Speech recognition not supported');
        return;
    }
    
    if (isRecording) {
        stopVoiceRecording(voiceButton);
        return;
    }
    
    try {
        currentActiveInput = inputElement;
        isRecording = true;
        
        // Update button UI
        if (voiceButton) {
            voiceButton.classList.add('recording');
        }
        
        // Setup event handlers
        speechRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            
            if (currentActiveInput) {
                const currentValue = currentActiveInput.value;
                currentActiveInput.value = currentValue + (currentValue ? ' ' : '') + transcript;
                
                // Trigger input event để auto-expand textarea
                const inputEvent = new Event('input', { bubbles: true });
                currentActiveInput.dispatchEvent(inputEvent);
            }
            
            if (onResult) onResult(transcript);
            
            // Reset state
            isRecording = false;
            if (voiceButton) {
                voiceButton.classList.remove('recording');
            }
        };
        
        speechRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            let errorMessage = 'Lỗi nhận dạng giọng nói';
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                errorMessage = 'Vui lòng cho phép truy cập microphone';
            } else if (event.error === 'no-speech') {
                errorMessage = 'Không nhận được giọng nói. Vui lòng thử lại';
            } else if (event.error === 'network') {
                errorMessage = 'Lỗi kết nối mạng';
            }
            
            showNotification(errorMessage, 'error');
            
            if (onError) onError(event.error);
            
            // Reset state
            isRecording = false;
            if (voiceButton) {
                voiceButton.classList.remove('recording');
            }
        };
        
        speechRecognition.onend = () => {
            isRecording = false;
            if (voiceButton) {
                voiceButton.classList.remove('recording');
            }
        };
        
        // Start recognition
        speechRecognition.start();
        showNotification('Đang nghe... 🎤', 'info');
        
    } catch (error) {
        console.error('Error starting speech recognition:', error);
        showNotification('Không thể bắt đầu nhận dạng giọng nói', 'error');
        
        if (onError) onError(error.message);
        
        // Reset state
        isRecording = false;
        if (voiceButton) {
            voiceButton.classList.remove('recording');
        }
    }
}

/**
 * Stop voice recording
 * @param {HTMLElement} voiceButton - Voice button element
 */
export function stopVoiceRecording(voiceButton) {
    if (speechRecognition && isRecording) {
        speechRecognition.stop();
        isRecording = false;
        
        if (voiceButton) {
            voiceButton.classList.remove('recording');
        }
    }
}

/**
 * Toggle voice recording (start/stop)
 * @param {HTMLElement} inputElement - Input element
 * @param {HTMLElement} voiceButton - Voice button
 * @param {Function} onResult - Callback khi có kết quả
 * @param {Function} onError - Callback khi có lỗi
 */
export function toggleVoiceRecording(inputElement, voiceButton, onResult, onError) {
    if (isRecording) {
        stopVoiceRecording(voiceButton);
    } else {
        startVoiceRecording(inputElement, voiceButton, onResult, onError);
    }
}

/**
 * Check if currently recording
 * @returns {boolean}
 */
export function isCurrentlyRecording() {
    return isRecording;
}

/**
 * Get speech recognition instance
 * @returns {Object|null}
 */
export function getSpeechRecognition() {
    return speechRecognition;
}
