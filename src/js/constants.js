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
    'nexorax1': 'Gemini 2.5 Flash',
    'nexorax2': 'Search',
    'gpt-5-chat': 'GPT-5',
    'image-gen': 'Image Generator',
    'deepseek-reasoning': 'DeepSeek Reasoning',
    'nova-fast': 'Nova Fast',
    'gpt-5-mini': 'GPT-5 Mini',
    'gpt-5-nano-2025-08-07': 'GPT-5 Nano',
    'gpt-4.1-nano-2025-04-14': 'GPT-4.1 Nano',
    'qwen2.5-coder-32b-instruct': 'Qwen Coder',
    'codestral-2501': 'Codestral',
    'llama-3.1-8B-instruct': 'Llama 3.1',
    'bidara': 'Bidara',
    'mistral-medium-2508': 'Mistral Medium',
    'mistral-small-2503': 'Mistral Small',
    'ministral-3b-2512': 'Ministral 3B',
    'open-mixtral-8x7b': 'Mixtral 8x7B',
    'Steelskull/L3.3-MS-Nevoria-70b': 'Nevoria 70B',
    'gemma-2-2b-it': 'Gemma 2',
    'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
    'glm-4.5-flash': 'GLM 4.5 Flash'
};

/**
 * Metadata chi tiết cho từng model AI
 * Bao gồm: mô tả, icon, use cases, category
 */
export const MODEL_METADATA = {
    'gpt-5-chat': {
        name: 'GPT-5',
        icon: '🚀',
        category: 'chat',
        description: 'Model AI tiên tiến nhất từ OpenAI, vượt trội về khả năng suy luận và giải quyết vấn đề phức tạp',
        useCases: ['Phân tích dữ liệu phức tạp', 'Viết code chuyên sâu', 'Tư vấn chuyên môn', 'Giải quyết bài toán khó']
    },
    'nexorax1': {
        name: 'Gemini 2.5 Flash',
        icon: '⚡',
        category: 'chat',
        description: 'Model Gemini 2.5 Flash từ Google, nhanh chóng và thông minh với khả năng xử lý đa phương tiện',
        useCases: ['Chat nhanh', 'Phân tích hình ảnh', 'Xử lý file đa dạng', 'Tác vụ hàng ngày']
    },
    'nexorax2': {
        name: 'Search',
        icon: '🔍',
        category: 'search',
        description: 'Tìm kiếm thông tin thời gian thực từ internet với độ chính xác cao',
        useCases: ['Tìm tin tức mới nhất', 'Research chủ đề', 'Kiểm tra thông tin', 'Dữ liệu thời gian thực']
    },
    'image-gen': {
        name: 'Image Generator',
        icon: '🎨',
        category: 'image',
        description: 'Tạo hình ảnh từ văn bản với AI, chất lượng cao và đa dạng phong cách',
        useCases: ['Tạo artwork', 'Design concept', 'Minh họa ý tưởng', 'Tạo logo/banner']
    },
    'deepseek-reasoning': {
        name: 'DeepSeek Reasoning',
        icon: '🤔',
        category: 'reasoning',
        description: 'Chuyên về suy luận logic, toán học và phân tích phức tạp',
        useCases: ['Giải toán', 'Phân tích logic', 'Chứng minh định lý', 'Suy luận khoa học']
    },
    'mistral-medium-2508': {
        name: 'Mistral Medium',
        icon: '🌊',
        category: 'chat',
        description: 'Model trung bình từ Mistral, phù hợp cho nhiều tác vụ phức tạp',
        useCases: ['Phân tích văn bản', 'Creative writing', 'Technical support', 'Data analysis']
    },
    'mistral-small-2503': {
        name: 'Mistral Small',
        icon: '💨',
        category: 'chat',
        description: 'Model nhỏ gọn, nhanh chóng và hiệu quả cho tasks cơ bản',
        useCases: ['Chat đơn giản', 'Trả lời nhanh', 'Dịch văn bản', 'Tóm tắt']
    },
    'open-mixtral-8x7b': {
        name: 'Mixtral 8x7B',
        icon: '🔄',
        category: 'chat',
        description: 'Model mixture-of-experts, mạnh mẽ và linh hoạt',
        useCases: ['Multi-task', 'Code & writing', 'Phân tích đa chiều', 'Problem solving']
    },
    'nova-fast': {
        name: 'Nova Fast',
        icon: '✨',
        category: 'chat',
        description: 'Model tốc độ cao, tối ưu cho real-time conversation',
        useCases: ['Chat real-time', 'Trợ lý ảo', 'Customer support', 'Quick answers']
    },
    'gpt-5-mini': {
        name: 'GPT-5 Mini',
        icon: '🎯',
        category: 'chat',
        description: 'Phiên bản compact của GPT-5, nhanh và hiệu quả',
        useCases: ['Chat nhanh', 'Simple tasks', 'Brainstorming', 'Drafting']
    },
    'gpt-5-nano-2025-08-07': {
        name: 'GPT-5 Nano',
        icon: '⚙️',
        category: 'chat',
        description: 'Phiên bản siêu nhỏ gọn, tối ưu tốc độ phản hồi',
        useCases: ['Chat đơn giản', 'Q&A nhanh', 'Suggestions', 'Basic assistance']
    },
    'gpt-4.1-nano-2025-04-14': {
        name: 'GPT-4.1 Nano',
        icon: '⚡',
        category: 'chat',
        description: 'Model siêu nhẹ từ OpenAI, tối ưu cho phản hồi nhanh chóng',
        useCases: ['Chat đơn giản', 'Q&A nhanh', 'Trả lời tức thì', 'Hỗ trợ cơ bản']
    },
    'qwen2.5-coder-32b-instruct': {
        name: 'Qwen Coder',
        icon: '💻',
        category: 'coding',
        description: 'Chuyên gia coding AI, hỗ trợ đa ngôn ngữ lập trình',
        useCases: ['Code generation', 'Debug & refactor', 'Code review', 'Algorithm design']
    },
    'llama-3.1-8B-instruct': {
        name: 'Llama 3.1',
        icon: '🦙',
        category: 'chat',
        description: 'Model Llama 3.1 từ Meta với hiệu năng cao và đa dụng',
        useCases: ['Chat đa mục đích', 'Viết nội dung', 'Hỏi đáp', 'Hỗ trợ học tập']
    },
    'codestral-2501': {
        name: 'Codestral',
        icon: '💻',
        category: 'coding',
        description: 'Model chuyên về lập trình từ Mistral, hỗ trợ code hiệu quả',
        useCases: ['Code generation', 'Debug code', 'Refactor', 'Giải thuật']
    },
    'ministral-3b-2512': {
        name: 'Ministral 3B',
        icon: '🌟',
        category: 'chat',
        description: 'Model nhỏ gọn từ Mistral, phản hồi nhanh và hiệu quả',
        useCases: ['Chat nhanh', 'Q&A đơn giản', 'Tác vụ cơ bản', 'Trợ lý thường ngày']
    },
    'gemini-2.5-flash-lite': {
        name: 'Gemini 2.5 Flash Lite',
        icon: '✨',
        category: 'chat',
        description: 'Phiên bản nhẹ của Gemini 2.5 Flash, nhanh và tiết kiệm',
        useCases: ['Chat nhanh', 'Tác vụ đơn giản', 'Phản hồi tức thì', 'Hỗ trợ cơ bản']
    },
    'glm-4.5-flash': {
        name: 'GLM 4.5 Flash',
        icon: '🔮',
        category: 'chat',
        description: 'Model GLM 4.5 từ Tsinghua, mạnh mẽ và thông minh',
        useCases: ['Chat thông minh', 'Phân tích nội dung', 'Viết sáng tạo', 'Hỗ trợ học tập']
    },
    'bidara': {
        name: 'Bidara',
        icon: '🌟',
        category: 'chat',
        description: 'Model đa năng với khả năng hiểu context sâu sắc',
        useCases: ['Contextual chat', 'Long conversations', 'Story writing', 'Deep Q&A']
    },
    'Steelskull/L3.3-MS-Nevoria-70b': {
        name: 'Nevoria 70B',
        icon: '🛡️',
        category: 'advanced',
        description: 'Model siêu lớn 70B parameters, khả năng xử lý phức tạp cao',
        useCases: ['Advanced reasoning', 'Complex analysis', 'Research tasks', 'Expert consultation']
    },
    'gemma-2-2b-it': {
        name: 'Gemma 2',
        icon: '💎',
        category: 'chat',
        description: 'Model compact từ Google, efficient và đáng tin cậy',
        useCases: ['Daily chat', 'Quick help', 'Simple tasks', 'General assistance']
    }
};

/**
 * Các model có thể dùng trong Dual Chat Mode
 * (loại trừ image-gen và nexorax2)
 */
export const DUAL_CHAT_MODELS = [
    { value: 'gpt-5-chat', label: 'GPT-5' },
    { value: 'nexorax1', label: 'Gemini 2.5 Flash' },
    { value: 'bidara', label: 'Bidara' },
    { value: 'deepseek-reasoning', label: 'DeepSeek Reasoning' },
    { value: 'mistral-medium-2508', label: 'Mistral Medium' },
    { value: 'mistral-small-2503', label: 'Mistral Small' },
    { value: 'open-mixtral-8x7b', label: 'Mixtral 8x7B' },
    { value: 'nova-fast', label: 'Nova Fast' },
    { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
    { value: 'gpt-5-nano-2025-08-07', label: 'GPT-5 Nano' },
    { value: 'gpt-4.1-nano-2025-04-14', label: 'GPT-4.1 Nano' },
    { value: 'qwen2.5-coder-32b-instruct', label: 'Qwen Coder' },
    { value: 'codestral-2501', label: 'Codestral' },
    { value: 'llama-3.1-8B-instruct', label: 'Llama 3.1' },
    { value: 'ministral-3b-2512', label: 'Ministral 3B' },
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
    { value: 'glm-4.5-flash', label: 'GLM 4.5 Flash' },
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
    USERNAME: 'nexorax_username',
    PREVIOUS_MODEL_BEFORE_IMAGE_GEN: 'nexorax_previous_model_image_gen',
    PREVIOUS_MODEL_BEFORE_SEARCH: 'nexorax_previous_model_search',
    PREVIOUS_MODEL_BEFORE_DUAL: 'nexorax_previous_model_dual',
    DESKTOP_SIDEBAR_OPEN: 'nexorax_desktop_sidebar_open',
    NOTIFICATIONS_ENABLED: 'nexorax_notifications_enabled',
    AUTO_SAVE_CHAT: 'nexorax_auto_save_chat'
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
    AI_RESPONSE: 10,      // Tốc độ typing cho AI response (giảm từ 30ms → 10ms cho nhanh hơn)
    USER_TEXT: 80,        // Tốc độ typing cho user text
    CODE_BLOCK: 5         // Tốc độ typing cho code block (giảm từ 10ms → 5ms)
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
    GEMINI: '/api/gemini',
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
