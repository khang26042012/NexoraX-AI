/**
 * MESSAGE-FORMATTER.JS - Format message content
 * 
 * Module xử lý format và hiển thị message:
 * - Parse markdown với marked.js
 * - Syntax highlighting code với highlight.js
 * - Preprocess code blocks
 * - Escape HTML
 */

// ===================================
// MARKED.JS CONFIGURATION
// ===================================

/**
 * Cấu hình marked.js cho markdown rendering với syntax highlighting
 */
export function configureMarked() {
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false,
            sanitize: false,
            highlight: function(code, lang) {
                if (typeof hljs !== 'undefined') {
                    if (lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(code, { language: lang }).value;
                        } catch (err) {
                            console.error('Highlight error:', err);
                        }
                    }
                    try {
                        return hljs.highlightAuto(code).value;
                    } catch (err) {
                        console.error('Auto-highlight error:', err);
                    }
                }
                return escapeHtml(code);
            }
        });
    }
}

// ===================================
// MESSAGE FORMATTING
// ===================================

/**
 * Format message content với markdown parsing
 * @param {string} content - Nội dung message cần format
 * @returns {string} HTML đã format
 */
export function formatMessage(content) {
    try {
        // Ensure content is a string
        if (typeof content !== 'string') {
            content = String(content || '');
        }
        
        // Auto-detect và wrap code blocks không có triple backticks
        content = preprocessCodeBlocks(content);
        
        return marked.parse(content);
    } catch (error) {
        console.error('Markdown parsing error:', error);
        // Ensure content is a string before calling replace
        if (typeof content === 'string') {
            return escapeHtml(content).replace(/\n/g, '<br>');
        }
        return String(content || '').replace(/\n/g, '<br>');
    }
}

/**
 * Preprocess code blocks - tự động wrap HTML/code không có backticks
 * @param {string} content - Nội dung cần preprocess
 * @returns {string} Nội dung đã wrap code blocks
 */
export function preprocessCodeBlocks(content) {
    // Detect HTML/XML code blocks không wrap trong backticks
    const htmlPattern = /(<(!DOCTYPE|html|head|body|div|span|p|a|ul|ol|li|table|form|input|button|script|style)[^>]*>[\s\S]*?<\/[^>]+>)/gi;
    
    // Kiểm tra nếu content có HTML tags nhưng không có triple backticks
    if (htmlPattern.test(content) && !content.includes('```')) {
        // Tìm start của HTML content
        const lines = content.split('\n');
        let htmlStartIndex = -1;
        let beforeHtml = '';
        let htmlContent = '';
        let afterHtml = '';
        
        for (let i = 0; i < lines.length; i++) {
            if (/<(!DOCTYPE|html|head|body|div|span|p|ul|ol|li|table|form|input|button|script|style)/i.test(lines[i])) {
                htmlStartIndex = i;
                break;
            }
        }
        
        if (htmlStartIndex >= 0) {
            beforeHtml = lines.slice(0, htmlStartIndex).join('\n');
            
            // Tìm where HTML ends (thường là last closing tag)
            let htmlEndIndex = lines.length - 1;
            for (let i = lines.length - 1; i >= htmlStartIndex; i--) {
                if (/<\/[^>]+>/.test(lines[i]) && lines[i].trim().length > 0) {
                    htmlEndIndex = i;
                    break;
                }
            }
            
            htmlContent = lines.slice(htmlStartIndex, htmlEndIndex + 1).join('\n');
            afterHtml = lines.slice(htmlEndIndex + 1).join('\n');
            
            // Wrap HTML trong code block
            return beforeHtml + '\n\n```html\n' + htmlContent + '\n```\n\n' + afterHtml;
        }
    }
    
    return content;
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

/**
 * Format file size thành string dễ đọc
 * @param {number} bytes - Kích thước file (bytes)
 * @returns {string} Chuỗi định dạng (VD: "2.5 MB")
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
