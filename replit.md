# NexoraX AI - Replit Setup

## Overview
NexoraX AI is a modern Vietnamese AI chat application designed for the Replit environment. It leverages Google Gemini, search-enhanced AI, and LLM7.io for GPT-5 Mini and Gemini Search models. The project emphasizes a modular ES6 architecture and is configured for seamless deployment, offering a feature-rich, responsive user experience with advanced Markdown rendering and conversation memory.

## Recent Changes (11/12/2025 - Buổi 25)
- **GitHub OAuth Integration**: Thêm tính năng đăng nhập bằng GitHub:
  - Endpoint `/auth/github` để khởi tạo OAuth flow với CSRF protection (state parameter)
  - Endpoint `/auth/github/callback` để xử lý callback từ GitHub
  - Endpoint `/api/auth/github/status` để kiểm tra cấu hình
  - User GitHub được lưu với format `gh_<github_login>` và password `oauth:github:<github_id>`
  - Tự động lấy email từ GitHub API nếu không có trong profile
  - Nút "Đăng nhập bằng GitHub" trên giao diện login
  - Cấu hình qua GITHUB_CLIENT_ID và GITHUB_CLIENT_SECRET (environment variables)

## Previous Changes (04/12/2025 - Buổi 24)
- **Serper + Gemini 2.5 Flash Search Integration**: Kết hợp Serper API với Gemini 2.5 Flash để tóm gọn và phân tích kết quả tìm kiếm:
  - Serper API lấy kết quả tìm kiếm từ Google
  - Gemini 2.5 Flash tóm tắt và phân tích kết quả (format: Tóm tắt, Phân tích, Nguồn tham khảo)
  - Fallback tự động: Nếu Gemini lỗi, trả về Serper Markdown thuần
  - History metadata: `powered_by: "serper+gemini"` hoặc `"serper"` (khi fallback)
  - Response bao gồm expandable raw sources cho tham khảo chi tiết

## Previous Changes (30/10/2025 - Buổi 13)
- **Admin Panel API Expansion**: Built comprehensive admin APIs for system management without modifying AI endpoints. Includes:
  - Logs API: `/api/admin/logs` with pagination and log level filtering (rotating file handler)
  - AI History Tracking: `/api/admin/history` - tracks all AI calls (prompt + response) in JSONL format
  - Usage Statistics: `/api/admin/usage` - aggregates per-user and per-model usage stats
  - Config Management: `/api/admin/config` GET/POST - hot-reload API keys without server restart, masked key display
  - Fixed 2 critical bugs: save_config_override() naming conflict and has_override stale reference
  - All endpoints tested and architect-approved for production use

## Previous Changes (12/10/2025 - Buổi 11)
- **Desktop Sidebar Behavior Change**: Removed collapse/expand functionality on PC. Desktop sidebar now only opens/closes completely (like mobile). When open, use X button in sidebar to close. When closed, use toggle button to open. Simplified and cleaner UX.
- **Desktop Sidebar Display Fix**: Fixed desktop sidebar not showing at all. Added CSS to ensure sidebar is always visible on desktop (transform: translateX(0)) instead of hidden like mobile. Desktop sidebar now properly shows/hides with toggle button working correctly.
- **Desktop Sidebar Toggle Fix**: Fixed pointer-events issue preventing desktop sidebar toggle from being clickable. Desktop toggle is now completely independent from mobile sidebar logic and always clickable.

## Previous Changes (11/10/2025 - Buổi 10)
- **Session Persistence**: Sessions now default to 30 days (remember_me=true) without requiring checkbox
- **Typing Speed**: AI response typing increased 3x (10ms/character, down from 30ms)
- **Onboarding Tutorial**: Expanded from 4 to 5 steps (added config button guidance), fixed selectors, bumped to version 2.0

## User Preferences
- Vietnamese interface (main target audience)
- Simple, everyday language for communication
- Prefers lightweight, secure solutions
- Critical: Do not delete or change API configurations
- No "Remember me" checkbox - feature works automatically with 30-day sessions

## System Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript, TailwindCSS (CDN), Marked.js (CDN), Highlight.js (CDN).
- **Backend**: Python 3.12.11 HTTP server (built-in modules only).
- **Server Configuration**: Port 5000, host 0.0.0.0 (for Replit compatibility).
- **File Structure**: Modular ES6 JavaScript in `src/js/` (14 files), Python server in `server.py`, static assets in `assets/`.
- **UI/UX**: Responsive Vietnamese chat interface, dark/light theme toggle, mobile-responsive sidebar, multi-model AI support with emoji icons.
- **Technical Implementations**: Enhanced Markdown rendering with GitHub Flavored Markdown, syntax highlighting (Highlight.js), tables, checkboxes, XSS protection in Markdown. Chat history management with conversation context memory for all AI models. File upload support. Server-side API proxy for secure API key handling. CORS configured for Replit iframe.
- **Admin Panel API**: Comprehensive admin endpoints for system management:
  - `/api/admin/users` - User management (list, delete)
  - `/api/admin/sessions` - Session management (list, delete)
  - `/api/admin/stats` - System statistics overview
  - `/api/admin/rate-limits` - Rate limit management (list, clear)
  - `/api/admin/logs` - Server logs with pagination and filtering (rotating file handler, 5MB max)
  - `/api/admin/history` - AI call history tracking (JSONL format, thread-safe operations)
  - `/api/admin/usage` - Usage statistics aggregation (per-user, per-model)
  - `/api/admin/config` - API key management with hot-reload (no restart needed, masked key display)
  - All endpoints production-ready with architect approval
- **Deployment**: Configured for autoscale deployment on Koyeb.com. Uses `Procfile` (`web: python3 server.py`). Server auto-detects Koyeb via `KOYEB_APP_NAME` environment variable. No build step required; uses static files and Python server. See `KOYEB_DEPLOYMENT.md` for complete deployment guide.

## External Dependencies
- **Google Gemini API**: For Gemini 2.5 Flash conversations and search result analysis.
- **Serper API**: For Google search functionality (replaced SerpAPI).
- **LLM7.io API**: Integrates GPT-5, Gemini Search, and other AI models.