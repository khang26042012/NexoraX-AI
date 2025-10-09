/**
 * FILE-UPLOAD.JS - File handling
 * 
 * Module xử lý upload và quản lý files:
 * - File selection
 * - Image preview
 * - Base64 conversion
 * - File validation
 */

import { FILE_UPLOAD_CONFIG } from './constants.js';
import { fileToBase64, createImagePreview, isImageFile } from './utils.js';
import { formatFileSize } from './message-formatter.js';
import { showNotification } from './ui-manager.js';

// ===================================
// FILE SELECTION & VALIDATION
// ===================================

/**
 * Handle file selection
 * @param {FileList} files - Files được chọn
 * @param {Map} selectedFiles - Map chứa files đã chọn
 * @param {Function} updatePreviewCallback - Callback để update preview UI
 * @returns {Promise<void>}
 */
export async function handleFileSelection(files, selectedFiles, updatePreviewCallback) {
    if (!files || files.length === 0) return;
    
    const maxSize = FILE_UPLOAD_CONFIG.MAX_FILE_SIZE;
    const maxFiles = FILE_UPLOAD_CONFIG.MAX_FILES;
    
    if (selectedFiles.size + files.length > maxFiles) {
        showNotification(`Chỉ có thể chọn tối đa ${maxFiles} files`, 'error');
        return;
    }
    
    for (let file of files) {
        if (file.size > maxSize) {
            showNotification(`File "${file.name}" quá lớn (tối đa ${formatFileSize(maxSize)})`, 'error');
            continue;
        }
        
        const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Create file data object
        const fileData = {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            file: file,
            preview: null,
            base64: null
        };
        
        // Generate preview cho images
        if (isImageFile(file)) {
            try {
                fileData.preview = await createImagePreview(file);
                fileData.base64 = await fileToBase64(file);
            } catch (error) {
                console.error('Error creating image preview:', error);
            }
        } else {
            // For non-images, convert to base64 cho AI processing
            try {
                fileData.base64 = await fileToBase64(file);
            } catch (error) {
                console.error('Error converting file to base64:', error);
            }
        }
        
        selectedFiles.set(fileId, fileData);
    }
    
    // Update preview UI
    if (updatePreviewCallback) {
        updatePreviewCallback();
    }
}

/**
 * Clear selected files
 * @param {Map} selectedFiles - Map chứa files đã chọn
 * @param {Function} updatePreviewCallback - Callback để update preview UI
 */
export function clearSelectedFiles(selectedFiles, updatePreviewCallback) {
    selectedFiles.clear();
    if (updatePreviewCallback) {
        updatePreviewCallback();
    }
}

/**
 * Remove một file khỏi selection
 * @param {Map} selectedFiles - Map chứa files đã chọn
 * @param {string} fileId - ID của file cần remove
 * @param {Function} updatePreviewCallback - Callback để update preview UI
 */
export function removeFile(selectedFiles, fileId, updatePreviewCallback) {
    selectedFiles.delete(fileId);
    if (updatePreviewCallback) {
        updatePreviewCallback();
    }
}

// ===================================
// FILE PREVIEW UI
// ===================================

/**
 * Update file preview list trong modal
 * @param {Map} selectedFiles - Map chứa files đã chọn
 * @param {HTMLElement} filePreviewList - Element chứa preview list
 * @param {Function} removeFileCallback - Callback khi remove file
 */
export function updateFilePreviewList(selectedFiles, filePreviewList, removeFileCallback) {
    if (!filePreviewList) return;
    
    const fileArray = Array.from(selectedFiles.values());
    
    filePreviewList.innerHTML = fileArray.map(fileData => {
        const sizeText = formatFileSize(fileData.size);
        const isImage = isImageFile(fileData.file);
        
        return `
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg" data-file-id="${fileData.id}">
                <div class="flex-shrink-0">
                    ${isImage && fileData.preview ? 
                        `<img src="${fileData.preview}" alt="Preview" class="w-12 h-12 object-cover rounded">` : 
                        `<div class="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>`
                    }
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">${fileData.name}</p>
                    <p class="text-xs text-gray-500">${sizeText}</p>
                </div>
                <button class="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors remove-file-btn" 
                        data-file-id="${fileData.id}">
                    <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
    
    // Wire up remove buttons
    filePreviewList.querySelectorAll('.remove-file-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const fileId = btn.getAttribute('data-file-id');
            if (removeFileCallback) {
                removeFileCallback(fileId);
            }
        });
    });
}

/**
 * Show file preview modal
 * @param {HTMLElement} filePreviewModal - Modal element
 */
export function showFilePreview(filePreviewModal) {
    if (!filePreviewModal) return;
    filePreviewModal.classList.remove('hidden');
}

/**
 * Hide file preview modal
 * @param {HTMLElement} filePreviewModal - Modal element
 */
export function hideFilePreview(filePreviewModal) {
    if (!filePreviewModal) return;
    filePreviewModal.classList.add('hidden');
}

// ===================================
// IMAGE MODAL
// ===================================

/**
 * Open image modal để xem full size
 * @param {string} imageSrc - Source của image
 * @param {string} imageTitle - Title của image
 */
export function openImageModal(imageSrc, imageTitle) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalImageTitle');
    
    if (modalImage) {
        modalImage.src = imageSrc;
        modalImage.alt = imageTitle;
    }
    
    if (modalTitle) {
        modalTitle.textContent = imageTitle;
    }
    
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * Close image modal
 */
export function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Clear image source để free memory
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        modalImage.src = '';
    }
}
