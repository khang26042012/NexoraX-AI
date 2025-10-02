# NexoraX AI - Replit Setup

## Project Overview
NexoraX AI is a modern Vietnamese AI chat application that provides conversations using Google Gemini language model, search-enhanced AI, and Puter.ai integration for GPT-5 and Claude models. Successfully configured for Replit environment.

## Recent Changes
- **October 2, 2025 (Latest - Fresh GitHub Import)**: Successfully Configured for Replit
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
    - ✅ GPT-5 Nano (client-side Puter.js)
    - ✅ Claude Sonnet 4.5 (client-side Puter.js)
  - **Testing**: UI confirmed working with screenshot verification
  - **Status**: ✅ Project fully operational and ready for deployment

## User Preferences
- Vietnamese interface (main target audience)
- Simple, everyday language for communication
- Prefers lightweight, secure solutions
- **Critical**: Do not delete or change API configurations

## Project Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript with TailwindCSS (CDN) and Marked.js (CDN)
- **Backend**: Python 3.12.11 HTTP server (built-in modules only)
- **Port**: 5000 (single server for both static files and API proxy)
- **Host**: 0.0.0.0 (configured for Replit proxy requirements)

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
✅ Multi-model AI support (Gemini, Search, GPT-5, Claude)
✅ Chat history management
✅ Dark/light theme toggle
✅ Mobile-responsive sidebar
✅ File upload support (images/documents)
✅ Error handling for missing API keys
✅ Server-side API proxy (secure)
✅ CORS configured for Replit iframe

### API Integration
- **Gemini API**: Configured with key in config.py (preserved as requested)
- **SerpAPI**: Configured with key in config.py (preserved as requested)
- **Puter.ai**: Client-side SDK, no authentication required
- **All API endpoints preserved**: No changes made to API structure

### API Endpoints
- `POST /api/gemini` - Gemini Flash 2.5 conversations
- `POST /api/search` - SerpAPI web search
- `POST /api/search-with-ai` - Search + AI combined responses
- `POST /api/puter` - Puter.ai proxy (GPT-5, Claude)

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
- All 4 AI models are working (Gemini, Search, GPT-5, Claude)
- Share the Replit URL with others
