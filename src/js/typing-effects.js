/**
 * TYPING-EFFECTS.JS - Hiệu ứng typing animation
 * 
 * File này chứa TypingEffect class và các hàm liên quan đến typing animation:
 * - Typing với cursor effect
 * - AI response typing với markdown parsing
 * - Code block typing
 * - Intersection Observer để trigger typing khi element vào viewport
 */

import { TYPING_SPEEDS } from './constants.js';
import { isInViewport } from './utils.js';

/**
 * TypingEffect class - Tạo hiệu ứng đánh máy cho text
 */
export class TypingEffect {
    /**
     * Đánh máy text với cursor hiển thị
     * @param {HTMLElement} element - Element để hiển thị text
     * @param {string} text - Nội dung cần đánh máy
     * @param {number} speed - Tốc độ đánh máy (ms/ký tự)
     * @param {boolean} showCursor - Hiển thị cursor hay không
     */
    static typeTextWithCursor(element, text, speed = TYPING_SPEEDS.USER_TEXT, showCursor = true) {
        if (!element || !text) return;
        
        let index = 0;
        element.textContent = '';
        
        // Thêm cursor nếu cần
        if (showCursor) {
            const cursor = document.createElement('span');
            cursor.className = 'typing-cursor';
            cursor.textContent = '|';
            element.appendChild(cursor);
        }
        
        const interval = setInterval(() => {
            if (index < text.length) {
                // Loại bỏ cursor tạm thời
                const cursor = element.querySelector('.typing-cursor');
                if (cursor) cursor.remove();
                
                // Thêm ký tự mới
                element.textContent += text.charAt(index);
                index++;
                
                // Thêm lại cursor
                if (showCursor) {
                    const newCursor = document.createElement('span');
                    newCursor.className = 'typing-cursor';
                    newCursor.textContent = '|';
                    element.appendChild(newCursor);
                }
            } else {
                clearInterval(interval);
                // Loại bỏ cursor khi hoàn thành
                if (showCursor) {
                    const cursor = element.querySelector('.typing-cursor');
                    if (cursor) cursor.remove();
                }
            }
        }, speed);
    }
    
    /**
     * Đánh máy AI response với markdown parsing
     * Xử lý markdown trong quá trình đánh máy và highlight code
     * @param {HTMLElement} element - Element để hiển thị response
     * @param {string} text - Nội dung AI response
     * @param {number} speed - Tốc độ đánh máy (ms/ký tự)
     */
    static typeAIResponse(element, text, speed = TYPING_SPEEDS.AI_RESPONSE) {
        if (!element || !text) return;
        
        let index = 0;
        let currentContent = '';
        element.innerHTML = '';
        
        const interval = setInterval(() => {
            if (index < text.length) {
                currentContent += text.charAt(index);
                index++;
                
                // Parse markdown và render
                if (typeof marked !== 'undefined') {
                    try {
                        element.innerHTML = marked.parse(currentContent);
                        
                        // Highlight code blocks
                        if (typeof hljs !== 'undefined') {
                            element.querySelectorAll('pre code').forEach((block) => {
                                hljs.highlightElement(block);
                            });
                        }
                    } catch (err) {
                        console.error('Markdown parse error:', err);
                        element.textContent = currentContent;
                    }
                } else {
                    element.textContent = currentContent;
                }
                
                // Auto scroll khi có nội dung mới
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                clearInterval(interval);
            }
        }, speed);
        
        return interval;
    }
    
    /**
     * Đánh máy từng dòng code trong code block
     * @param {HTMLElement} codeElement - Code element (pre > code)
     * @param {string} code - Mã code
     * @param {string} language - Ngôn ngữ lập trình
     * @param {number} speed - Tốc độ đánh máy
     */
    static typeCodeBlock(codeElement, code, language = '', speed = TYPING_SPEEDS.CODE_BLOCK) {
        if (!codeElement || !code) return;
        
        let index = 0;
        let currentCode = '';
        
        const interval = setInterval(() => {
            if (index < code.length) {
                currentCode += code.charAt(index);
                index++;
                
                // Set text content
                codeElement.textContent = currentCode;
                
                // Highlight nếu có hljs
                if (typeof hljs !== 'undefined') {
                    if (language && hljs.getLanguage(language)) {
                        codeElement.className = `language-${language}`;
                        hljs.highlightElement(codeElement);
                    } else {
                        hljs.highlightElement(codeElement);
                    }
                }
            } else {
                clearInterval(interval);
            }
        }, speed);
        
        return interval;
    }
    
    /**
     * Kiểm tra element có trong viewport không
     * @param {HTMLElement} element - Element cần kiểm tra
     * @returns {boolean}
     */
    static isInViewport(element) {
        return isInViewport(element);
    }
    
    /**
     * Tự động trigger typing khi element vào viewport
     * Sử dụng Intersection Observer để theo dõi
     * @param {HTMLElement} element - Element cần observe
     * @param {string} text - Text cần typing
     * @param {Object} options - Tùy chọn: {isAI, speed, showCursor}
     */
    static observeElement(element, text, options = {}) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.hasAttribute('data-typed')) {
                    entry.target.setAttribute('data-typed', 'true');
                    
                    if (options.isAI) {
                        this.typeAIResponse(entry.target, text, options.speed || TYPING_SPEEDS.AI_RESPONSE);
                    } else {
                        this.typeTextWithCursor(entry.target, text, options.speed || TYPING_SPEEDS.USER_TEXT, options.showCursor !== false);
                    }
                    
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        
        observer.observe(element);
    }
    
    /**
     * Stop tất cả typing animation trong element
     * @param {HTMLElement} element - Element chứa typing animation
     */
    static stopTyping(element) {
        if (!element) return;
        
        // Remove typing cursor nếu có
        const cursor = element.querySelector('.typing-cursor');
        if (cursor) cursor.remove();
        
        // Set attribute để đánh dấu đã complete
        element.setAttribute('data-typed', 'true');
    }
    
    /**
     * Reset typing state của element
     * @param {HTMLElement} element - Element cần reset
     */
    static resetTyping(element) {
        if (!element) return;
        element.removeAttribute('data-typed');
        element.innerHTML = '';
    }
}

// Export default
export default TypingEffect;
