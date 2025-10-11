/**
 * ONBOARDING.JS - First-time user onboarding system
 * 
 * Hiển thị tooltips/cues cho user lần đầu truy cập
 * Sử dụng localStorage để track trạng thái đã xem
 * 
 * Features highlighted:
 * - Model selector
 * - Dual chat mode
 * - File upload
 */

import { STORAGE_KEYS } from './constants.js';

const ONBOARDING_KEY = 'nexorax_onboarding_completed';
const ONBOARDING_VERSION = '2.0';

class OnboardingManager {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                target: '#homeQuickModelBtn',
                title: '🤖 Chọn AI Model',
                description: 'Click vào đây để chọn model AI phù hợp với nhu cầu của bạn. Mỗi model có điểm mạnh riêng!',
                position: 'bottom'
            },
            {
                target: '#homeDualModeBtn',
                title: '🔄 Dual Chat Mode',
                description: 'Bật chế độ Dual Chat để so sánh câu trả lời từ 2 AI models khác nhau cùng lúc.',
                position: 'bottom'
            },
            {
                target: '#homeConfigBtn',
                title: '⚙️ Tùy chọn nâng cao',
                description: 'Truy cập các tính năng đặc biệt: Tạo ảnh với AI hoặc Tìm kiếm thông tin trên web.',
                position: 'bottom'
            },
            {
                target: '#homeUploadBtn',
                title: '📁 Upload File',
                description: 'Upload hình ảnh hoặc file để AI phân tích và trả lời câu hỏi về nội dung.',
                position: 'bottom'
            },
            {
                target: '#sidebarToggle',
                title: '📝 Chat History',
                description: 'Xem lại lịch sử chat và quản lý các cuộc trò chuyện của bạn tại đây.',
                position: 'right'
            }
        ];
        this.tooltipElement = null;
        this.overlayElement = null;
    }

    shouldShowOnboarding() {
        const completed = localStorage.getItem(ONBOARDING_KEY);
        return completed !== ONBOARDING_VERSION;
    }

    start() {
        if (!this.shouldShowOnboarding()) {
            return;
        }

        this.createOverlay();
        this.showStep(0);
    }

    createOverlay() {
        this.overlayElement = document.createElement('div');
        this.overlayElement.id = 'onboarding-overlay';
        this.overlayElement.className = 'fixed inset-0 bg-black bg-opacity-50 z-[9998] transition-opacity duration-300';
        this.overlayElement.style.opacity = '0';
        document.body.appendChild(this.overlayElement);

        setTimeout(() => {
            this.overlayElement.style.opacity = '1';
        }, 10);

        this.overlayElement.addEventListener('click', () => this.skip());
    }

    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.complete();
            return;
        }

        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];
        const targetElement = document.querySelector(step.target);

        if (!targetElement) {
            this.showStep(stepIndex + 1);
            return;
        }

        this.highlightElement(targetElement);
        this.createTooltip(step, targetElement);
    }

    highlightElement(element) {
        const rect = element.getBoundingClientRect();
        const highlight = document.createElement('div');
        highlight.id = 'onboarding-highlight';
        highlight.className = 'fixed z-[9999] pointer-events-none transition-all duration-300';
        highlight.style.cssText = `
            top: ${rect.top - 4}px;
            left: ${rect.left - 4}px;
            width: ${rect.width + 8}px;
            height: ${rect.height + 8}px;
            border: 3px solid #3b82f6;
            border-radius: 12px;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2), 0 0 20px rgba(59, 130, 246, 0.4);
            animation: pulse 2s infinite;
        `;

        document.body.appendChild(highlight);

        element.style.position = 'relative';
        element.style.zIndex = '10000';
    }

    createTooltip(step, targetElement) {
        if (this.tooltipElement) {
            this.tooltipElement.remove();
        }

        const rect = targetElement.getBoundingClientRect();
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'fixed z-[10001] bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 max-w-sm animate-fade-in';
        this.tooltipElement.style.cssText = this.getTooltipPosition(rect, step.position);

        this.tooltipElement.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${step.title}</h3>
                <button id="onboarding-close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <p class="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">${step.description}</p>
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1">
                    ${this.steps.map((_, i) => `
                        <div class="w-2 h-2 rounded-full transition-colors ${i === this.currentStep ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}"></div>
                    `).join('')}
                </div>
                <div class="flex items-center space-x-2">
                    <button id="onboarding-skip" class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        Bỏ qua
                    </button>
                    <button id="onboarding-next" class="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        ${this.currentStep === this.steps.length - 1 ? 'Hoàn tất' : 'Tiếp theo'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.tooltipElement);

        document.getElementById('onboarding-next').addEventListener('click', () => this.next());
        document.getElementById('onboarding-skip').addEventListener('click', () => this.skip());
        document.getElementById('onboarding-close').addEventListener('click', () => this.skip());
    }

    getTooltipPosition(rect, position) {
        const padding = 16;
        let styles = {};

        switch (position) {
            case 'bottom':
                styles = {
                    top: `${rect.bottom + padding}px`,
                    left: `${rect.left + rect.width / 2}px`,
                    transform: 'translateX(-50%)'
                };
                break;
            case 'top':
                styles = {
                    bottom: `${window.innerHeight - rect.top + padding}px`,
                    left: `${rect.left + rect.width / 2}px`,
                    transform: 'translateX(-50%)'
                };
                break;
            case 'left':
                styles = {
                    top: `${rect.top + rect.height / 2}px`,
                    right: `${window.innerWidth - rect.left + padding}px`,
                    transform: 'translateY(-50%)'
                };
                break;
            case 'right':
                styles = {
                    top: `${rect.top + rect.height / 2}px`,
                    left: `${rect.right + padding}px`,
                    transform: 'translateY(-50%)'
                };
                break;
        }

        return Object.entries(styles).map(([key, value]) => `${key}: ${value}`).join('; ');
    }

    next() {
        this.cleanup();
        this.showStep(this.currentStep + 1);
    }

    skip() {
        this.cleanup();
        this.complete();
    }

    cleanup() {
        const highlight = document.getElementById('onboarding-highlight');
        if (highlight) {
            highlight.remove();
        }

        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }

        document.querySelectorAll('[style*="z-index: 10000"]').forEach(el => {
            el.style.position = '';
            el.style.zIndex = '';
        });
    }

    complete() {
        this.cleanup();

        if (this.overlayElement) {
            this.overlayElement.style.opacity = '0';
            setTimeout(() => {
                this.overlayElement?.remove();
                this.overlayElement = null;
            }, 300);
        }

        localStorage.setItem(ONBOARDING_KEY, ONBOARDING_VERSION);
        console.log('✅ Onboarding completed!');
    }

    reset() {
        localStorage.removeItem(ONBOARDING_KEY);
        console.log('🔄 Onboarding reset. Refresh to see it again.');
    }
}

const onboardingManager = new OnboardingManager();

export function initOnboarding() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => onboardingManager.start(), 800);
        });
    } else {
        setTimeout(() => onboardingManager.start(), 800);
    }
}

export function resetOnboarding() {
    onboardingManager.reset();
}

export default { initOnboarding, resetOnboarding };
