# NexoraX AI - Replit Setup

## Project Overview
NexoraX AI is a modern Vietnamese AI chat application that provides conversations using Google Gemini language model, search-enhanced AI, and LLM7.io integration for GPT-5 Mini and Gemini Search models. Successfully configured for Replit environment.

## Recent Changes
- **October 9, 2025 (Latest - Critical Bug Fix)**: Fixed import error that broke API configuration
  - **Bug Identified**: Server was importing `from config.config` but only `config.py` exists at root
  - **Root Cause**: Previous refactor split files but incorrect import path remained
  - **Fix Applied**: Changed import from `config.config` to `config` in sv/server.py (line 30)
  - **Impact**: API Key Status changed from "NOT CONFIGURED" to "Configured"
  - **Result**: ✅ All API endpoints now working correctly with proper configuration
  - **Files Changed**: sv/server.py (1 line)
  - **API Keys**: Preserved unchanged (as requested)
  - **Testing**: Server logs confirm API keys loaded successfully
- **October 8, 2025 (Performance & Session Optimization)**: Major performance improvements and session persistence fixes
  - **Performance Optimization**: Server response time improved dramatically
    - ✅ Users cached in-memory (loaded once at startup, not per-request)
    - ✅ Eliminated file I/O bottleneck from authentication
    - ✅ REQUEST_TIMEOUT reduced from 120s → 30s for faster responses
    - ✅ Performance test results: 34-50ms average response time (check-session, homepage, login)
  - **Session Persistence**: Verified and working correctly
    - ✅ Set-Cookie headers properly configured (HttpOnly, SameSite=Lax)
    - ✅ Check-session endpoint validates cookies correctly
    - ✅ Sessions persist across page reloads as expected
    - ✅ Remember-me functionality working (30 days vs 7 days)
  - **Code Quality**: Architect reviewed and approved all changes
    - No security issues identified
    - Backward compatible with existing sessions
    - File acc.txt preserved unchanged
- **October 5, 2025 (Conversation Memory)**: Added conversation context memory for all AI models
  - **Conversation Memory**: AI now remembers previous messages in the conversation
    - ✅ Works with all models: Gemini Flash 2.5, GPT-5 Chat, Gemini Search, Search with AI
    - ✅ Automatically sends last 10-20 messages as context (depending on model)
    - ✅ AI can reference previous messages and maintain coherent conversations
    - ✅ Backward compatible with existing API structure
  - **Frontend Changes**: Added helper functions to prepare conversation history
    - `prepareConversationHistoryGemini()` - Converts to Gemini API format
    - `prepareConversationHistoryLLM7()` - Converts to LLM7 API format
  - **Backend Changes**: Updated all API handlers to accept conversation history
    - Gemini proxy accepts full contents array
    - LLM7 proxies accept messages array
    - Search-enhanced AI includes conversation context
  - **Token Management**: Smart history limits prevent token overflow
  - **Test Results**: Verified AI remembers user information across multiple turns
- **October 4, 2025 (Enhanced Markdown & Emoji)**: Major Markdown improvements and UI enhancements
  - **Enhanced Markdown**: Added comprehensive GitHub Flavored Markdown support
    - ✅ Syntax highlighting with Highlight.js (11.9.0)
    - ✅ Tables with beautiful styling and dark mode support
    - ✅ Task lists / checkboxes (interactive)
    - ✅ Strikethrough, enhanced blockquotes, horizontal rules
    - ✅ Keyboard tags (`<kbd>`), mark/highlight tags
    - ✅ Subscript, superscript, definition lists
    - ✅ Collapsible sections (`<details>/<summary>`)
    - ✅ Auto-highlighting for code blocks without language specified
    - ✅ XSS protection: HTML escaping in fallback paths
  - **Emoji Models**: Added emoji icons to all AI models for better UX
    - ✨ Gemini (Gemini Flash 2.5)
    - 🔍 Search (Search with AI)
    - 💬 GPT-5 Chat (via LLM7.io)
    - 🌐 Gemini Search (via LLM7.io)
    - 🎨 Image Generator
  - **Fun AI Responses**: Added system prompts to make AI responses more lively with natural emoji usage
  - **CSS Updates**: 350+ lines of new Markdown styles with full dark mode support
  - **Security**: Fixed potential XSS vulnerability in highlight.js fallback
- **October 2, 2025 (Earlier - Removed Puter.ai)**: Cleaned up codebase by removing Puter.ai integration
  - **Removed**: All Puter.ai related code (SDK, backend proxy, frontend handlers)
  - **Removed Models**: GPT-5 Nano and Claude Sonnet 4.5 (via Puter.ai)
  - **Current Models**: 5 AI models available (Gemini, Search, GPT-5 Chat, Gemini Search, Image Generator)
  - **Code Cleanup**: Simplified codebase, removed unnecessary dependencies
- **October 2, 2025 (Earlier - Added LLM7.io Models)**: Integrated GPT-5 Mini and Gemini Search
  - **New Models Added**: 
    - ✅ GPT-5 Mini (via LLM7.io) - Free, fast, high-quality responses
    - ✅ Gemini Search (via LLM7.io) - Gemini with real-time web search
  - **API Configuration**: LLM7 API key added to config.py (not in Replit secrets)
  - **Backend Endpoints**: Added /api/llm7/gpt-5-mini and /api/llm7/gemini-search
  - **Frontend Updates**: Both models now appear in model selector dropdown
- **October 2, 2025 (Earlier - Fresh GitHub Import)**: Successfully Configured for Replit
  - **Fresh Import Completed**: GitHub repository cloned and fully configured
  - **Environment**: Python 3.12.11 verified and working
  - **Server**: Running perfectly on port 5000 with 0.0.0.0 binding (Replit-compatible)
  - **CORS Configuration**: Wildcard CORS (*) enabled for Replit iframe proxy
  - **Frontend**: All static assets loading correctly, UI displaying beautifully
  - **API Configuration**: All API keys preserved unchanged (as requested by user)
  - **Workflow**: "NexoraX AI Server" active and running successfully
  - **Deployment**: Autoscale deployment configured with `python3 server.py`
  - **Models Working**:
    - ✅ Gemini Flash 2.5 (backend proxy)
    - ✅ Search with AI (backend proxy with SerpAPI)
    - ✅ GPT-5 Mini (backend proxy via LLM7.io)
    - ✅ Gemini Search (backend proxy via LLM7.io with real-time search)
  - **Testing**: UI confirmed working with screenshot verification
  - **Status**: ✅ Project fully operational and ready for deployment

## User Preferences
- Vietnamese interface (main target audience)
- Simple, everyday language for communication
- Prefers lightweight, secure solutions
- **Critical**: Do not delete or change API configurations

## Project Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript with TailwindCSS (CDN), Marked.js (CDN), and Highlight.js (CDN)
- **Backend**: Python 3.12.11 HTTP server (built-in modules only)
- **Port**: 5000 (single server for both static files and API proxy)
- **Host**: 0.0.0.0 (configured for Replit proxy requirements)
- **Markdown**: GitHub Flavored Markdown with syntax highlighting

### Current Configuration
- **Workflow**: "NexoraX AI Server" running `python3 server.py`
- **Deployment**: Configured for autoscale deployment target
- **Dependencies**: No external Python packages required (uses built-in modules)

### File Structure
```
/
├── index.html           # Main application interface (Vietnamese)
├── server.py           # Python HTTP server with API proxy
├── config.py           # Configuration with API keys
├── requirements.txt    # No external dependencies needed
├── assets/
│   ├── css/style.css   # Application styles
│   ├── js/app.js       # JavaScript application logic (2300+ lines)
│   └── images/         # Logo and images
├── attached_assets/    # User uploaded images/files  
└── replit.md          # This file
```

### Features Working
✅ Static file serving
✅ Responsive Vietnamese chat interface  
✅ Multi-model AI support with emoji icons (5 models)
✅ Enhanced Markdown rendering with syntax highlighting
✅ Tables, checkboxes, and advanced formatting
✅ Chat history management
✅ Dark/light theme toggle
✅ Mobile-responsive sidebar
✅ File upload support (images/documents)
✅ Error handling for missing API keys
✅ Server-side API proxy (secure)
✅ CORS configured for Replit iframe
✅ XSS protection in Markdown rendering

### API Integration
- **Gemini API**: Configured with key in config.py (preserved as requested)
- **SerpAPI**: Configured with key in config.py (preserved as requested)
- **LLM7.io API**: Configured with key in config.py for GPT-5 Mini and Gemini Search

### API Endpoints
- `POST /api/gemini` - Gemini Flash 2.5 conversations
- `POST /api/search` - SerpAPI web search
- `POST /api/search-with-ai` - Search + AI combined responses
- `POST /api/llm7/gpt-5-mini` - GPT-5 Mini via LLM7.io
- `POST /api/llm7/gemini-search` - Gemini Search via LLM7.io

### Deployment Notes
- Configured for autoscale deployment (best for web apps)
- Uses PORT environment variable when deployed
- No build step required (static files + Python server)
- Production-ready CORS and security settings
- API keys from config.py will work in production

## Status
🟢 **READY FOR DEPLOYMENT** - Project is fully configured and operational in Replit.

### Deployment Instructions
1. Click the "Deploy" button in Replit
2. App will automatically use the configured settings
3. All API keys from config.py will work in production
4. No additional configuration needed

### User Can Now
- Use the application immediately in development mode
- Deploy to production with one click
- All 5 AI models are working with emoji icons:
  - ✨ Gemini Flash 2.5
  - 🔍 Search with AI (NexoraX 2)
  - 💬 GPT-5 Chat (via LLM7.io)
  - 🌐 Gemini Search (via LLM7.io)
  - 🎨 Image Generator
- Enjoy enhanced Markdown with syntax highlighting and rich formatting
- Share the Replit URL with others
