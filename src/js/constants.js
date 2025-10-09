/**
 * CONSTANTS.JS - Hằng số và cấu hình của ứng dụng
 * 
 * File này chứa tất cả các hằng số được sử dụng trong ứng dụng NexoraX Chat:
 * - Tên các model AI
 * - Thời gian timeout cho API
 * - Các key localStorage
 * - Giới hạn file upload
 * - Cấu hình khác
 */

// ===================================
// TÊN CÁC MODEL AI
// ===================================

/**
 * Danh sách tên hiển thị của các model AI
 * Key: ID model, Value: Tên hiển thị
 */
export const MODEL_NAMES = {
    'nexorax1': 'Gemini Flash 2.5',
    'nexorax2': 'Search',
    'gpt-5-chat': 'GPT-5',
    'gemini-search': 'Gemini Search',
    'image-gen': 'Image Generator',
    'deepseek-v3.1': 'DeepSeek V3.1',
    'deepseek-reasoning': 'DeepSeek Reasoning',
    'gemini-2.5-flash-lite': 'Gemini 2.5 Flash',
    'mistral-small-3.1-24b-instruct-2503': 'Mistral Small 3.1',
    'nova-fast': 'Nova Fast',
    'gpt-5-mini': 'GPT-5 Mini',
    'gpt-5-nano-2025-08-07': 'GPT-5 Nano',
    'gpt-o4-mini-2025-04-16': 'GPT-O4 Mini',
    'qwen2.5-coder-32b-instruct': 'Qwen Coder',
    'roblox-rp': 'Roblox RP',
    'bidara': 'Bidara',
    'rtist': 'Rtist',
    'mistral-medium-2508': 'Mistral Medium',
    'mistral-small-2503': 'Mistral Small',
    'open-mixtral-8x7b': 'Mixtral 8x7B',
    'Steelskull/L3.3-MS-Nevoria-70b': 'Nevoria 70B',
    'gemma-2-2b-it': 'Gemma 2'
};

/**
 * Các model có thể dùng trong Dual Chat Mode
 * (loại trừ image-gen và nexorax2)
 */
export const DUAL_CHAT_MODELS = [
    { value: 'gpt-5-chat', label: 'GPT-5' },
    { value: 'nexorax1', label: 'Gemini Flash 2.5' },
    { value: 'gemini-search', label: 'Gemini Search' },
    { value: 'bidara', label: 'Bidara' },
    { value: 'deepseek-v3.1', label: 'DeepSeek V3.1' },
    { value: 'deepseek-reasoning', label: 'DeepSeek Reasoning' },
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
    { value: 'mistral-small-3.1-24b-instruct-2503', label: 'Mistral Small 3.1' },
    { value: 'mistral-medium-2508', label: 'Mistral Medium' },
    { value: 'mistral-small-2503', label: 'Mistral Small' },
    { value: 'open-mixtral-8x7b', label: 'Mixtral 8x7B' },
    { value: 'nova-fast', label: 'Nova Fast' },
    { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
    { value: 'gpt-5-nano-2025-08-07', label: 'GPT-5 Nano' },
    { value: 'gpt-o4-mini-2025-04-16', label: 'GPT-O4 Mini' },
    { value: 'qwen2.5-coder-32b-instruct', label: 'Qwen Coder' },
    { value: 'roblox-rp', label: 'Roblox RP' },
    { value: 'rtist', label: 'Rtist' },
    { value: 'Steelskull/L3.3-MS-Nevoria-70b', label: 'Nevoria 70B' },
    { value: 'gemma-2-2b-it', label: 'Gemma 2' }
];

// ===================================
// CẤU HÌNH API TIMEOUT
// ===================================

/**
 * Thời gian timeout cho các API call (milliseconds)
 */
export const API_TIMEOUTS = {
    GEMINI: 120000,           // 120 giây
    LLM7: 120000,             // 120 giây
    IMAGE_GEN: 120000,        // 120 giây
    ENHANCE_PROMPT: 30000     // 30 giây
};

// ===================================
// LOCALSTORAGE KEYS
// ===================================

/**
 * Các key được sử dụng trong localStorage
 */
export const STORAGE_KEYS = {
    CHATS: 'nexorax_chats',
    DARK_MODE: 'nexorax_dark_mode',
    SELECTED_MODEL: 'nexorax_selected_model',
    FEEDBACKS: 'nexorax_feedbacks',
    DUAL_CHAT_MODE: 'nexorax_dual_chat_mode',
    DUAL_PRIMARY_MODEL: 'nexorax_dual_primary_model',
    DUAL_SECONDARY_MODEL: 'nexorax_dual_secondary_model',
    SESSION_ID: 'nexorax_session_id',
    USERNAME: 'nexorax_username'
};

/**
 * Migration mapping từ NovaX sang NexoraX (legacy)
 */
export const LEGACY_STORAGE_KEYS = [
    ['novax_chats', 'nexorax_chats'],
    ['novax_dark_mode', 'nexorax_dark_mode'],
    ['novax_selected_model', 'nexorax_selected_model'],
    ['novax_feedbacks', 'nexorax_feedbacks']
];

// ===================================
// CẤU HÌNH FILE UPLOAD
// ===================================

/**
 * Giới hạn file upload
 */
export const FILE_UPLOAD_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024,  // 10MB mỗi file
    MAX_FILES: 5,                      // Tối đa 5 files
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

// ===================================
// CẤU HÌNH HIỆU ỨNG TYPING
// ===================================

/**
 * Tốc độ typing animation (milliseconds/ký tự)
 */
export const TYPING_SPEEDS = {
    AI_RESPONSE: 30,      // Tốc độ typing cho AI response
    USER_TEXT: 80,        // Tốc độ typing cho user text
    CODE_BLOCK: 10        // Tốc độ typing cho code block
};

// ===================================
// DEFAULT VALUES
// ===================================

/**
 * Giá trị mặc định
 */
export const DEFAULTS = {
    MODEL: 'gpt-5-chat',
    DUAL_PRIMARY_MODEL: 'gpt-5-chat',
    DUAL_SECONDARY_MODEL: 'nexorax1',
    CONVERSATION_HISTORY_LIMIT_GEMINI: 20,
    CONVERSATION_HISTORY_LIMIT_LLM7: 15
};

// ===================================
// BREAKPOINTS
// ===================================

/**
 * Breakpoints cho responsive design
 */
export const BREAKPOINTS = {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1280
};

// ===================================
// API ENDPOINTS
// ===================================

/**
 * Các endpoint API
 */
export const API_ENDPOINTS = {
    GEMINI: '/api/gemini/chat',
    LLM7_CHAT: '/api/llm7/chat',
    LLM7_GPT5_CHAT: '/api/llm7/gpt-5-chat',
    LLM7_GEMINI_SEARCH: '/api/llm7/gemini-search',
    IMAGE_GEN: '/api/pollinations/generate',
    ENHANCE_PROMPT: '/api/enhance-prompt',
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    CHECK_SESSION: '/api/auth/check'
};
