# NexoraX AI - Replit Setup

## Project Overview
NexoraX AI is a modern Vietnamese AI chat application that provides conversations using Google Gemini language model. Successfully imported and configured for Replit environment on September 18, 2025.

## Recent Changes
- **October 2, 2025 (Latest - Fresh Import)**: GitHub Repository Successfully Re-imported to Replit
  - **Fresh Import Completed**: Successfully cloned and configured GitHub repository in Replit
  - **Environment**: Python 3.12.11 verified and working
  - **Server Status**: Running on port 5000 with 0.0.0.0 binding (Replit-compatible)
  - **CORS Configuration**: Wildcard CORS (*) enabled for Replit iframe proxy
  - **Frontend**: All static assets (HTML, CSS, JS, SVG) loading correctly
  - **API Configuration**: User's existing API keys preserved unchanged (as requested)
  - **Workflow**: "NexoraX AI Server" active and running successfully
  - **Deployment**: Autoscale deployment configured with python3 server.py
  - **Testing**: UI confirmed working with screenshot verification
  - **Status**: ✅ Project fully operational and ready for production deployment
- **October 2, 2025 (Earlier)**: Fixed Puter.ai Authentication - No Redirect Required
  - **Authentication Fix**: Removed unnecessary OAuth authentication flow from Puter.ai integration
  - **No Redirect**: Puter.ai now works directly without redirecting to puter.com
  - **Serverless**: Following official Puter.js documentation - no sign-in required
  - **Models Available**: GPT-5 Nano and Claude Sonnet 4.5 work immediately without authentication
  - **User Experience**: Seamless integration - users can use Puter models instantly
  - **API Keys Preserved**: All existing Gemini and SerpAPI configurations remain unchanged
- **October 2, 2025 (Morning)**: Fresh GitHub Import Successfully Configured for Replit
  - **Fresh Import**: Completed fresh GitHub repository clone to Replit
  - **Environment Verified**: Python 3.12.11 installed and working
  - **Server Running**: Successfully running on port 5000 with 0.0.0.0 binding
  - **CORS Configured**: Wildcard CORS (*) enabled for Replit proxy/iframe
  - **Frontend Working**: All static assets loading correctly (HTML, CSS, JS, SVG)
  - **API Keys Preserved**: User's existing API configuration maintained as requested (not modified)
  - **Deployment Configured**: Autoscale deployment ready with python3 server.py
  - **Workflow Active**: "NexoraX AI Server" workflow running successfully
  - **Status**: ✅ Project fully operational in Replit environment and ready for use
- **October 1, 2025**: GitHub Import Successfully Completed
  - **Fresh Import**: Completed fresh GitHub repository clone to Replit
  - **Environment Verified**: Python 3.11 working, all dependencies satisfied
  - **Server Running**: Confirmed on port 5000 with 0.0.0.0 binding
  - **CORS Configured**: Wildcard CORS enabled for Replit proxy
  - **Frontend Working**: Static assets loading correctly, UI displaying properly
  - **API Endpoints**: All API proxies (Gemini, SerpAPI, Search) functional
  - **API Keys Preserved**: User's existing API configuration maintained as requested
  - **Deployment Ready**: Autoscale deployment config already set
  - **Status**: ✅ Project fully operational in Replit environment
- **October 1, 2025 (Afternoon)**: Added Puter.ai Integration with GPT-5 and Claude 3.7
  - **Puter.ai SDK**: Integrated Puter.ai JavaScript SDK for free, unlimited AI API access
  - **New Models Added**: 
    - GPT-5 Nano (via Puter.ai) - working perfectly
    - Claude Sonnet 4.5 (via Puter.ai) - working perfectly with Vietnamese support
  - **Response Handling**: Enhanced to support both GPT (string content) and Claude (array content) formats
  - **UI Updates**: Added model options in both home and chat selectors
  - **Error Handling**: Improved formatMessage to handle non-string content gracefully
  - **Cache Management**: Implemented cache-busting with versioned assets (v=5)
  - **Testing Confirmed**: Both new models tested and verified working via browser logs
  - **Existing APIs Preserved**: Gemini and SerpAPI endpoints remain unchanged and functional
- **October 1, 2025 (Morning)**: Successfully imported GitHub project to Replit
  - **Project Import**: Completed fresh clone import and environment setup
  - **Python Configuration**: Verified Python 3.11 is installed and working
  - **Workflow Setup**: Confirmed "NexoraX AI Server" workflow running on port 5000
  - **Server Configuration**: Verified 0.0.0.0 host binding for Replit proxy compatibility
  - **CORS Setup**: Confirmed wildcard CORS ("*") for Replit iframe proxy
  - **Deployment Config**: Configured autoscale deployment with python3 server.py
  - **Testing Verified**: Confirmed frontend loading, API endpoints working
  - **API Keys**: Gemini and SerpAPI keys already configured in config.py
  - **Status**: Project fully functional and ready for use
- **September 29, 2025**: Replaced DuckDuckGo Search with SerpAPI Integration
  - **Search API Migration**: Successfully migrated from DuckDuckGo to SerpAPI (Google search) for better search results
  - **JavaScript Updates**: Updated getSerpAPISearchResponse() function with proper SerpAPI data formatting
  - **Maintained API Structure**: All existing API endpoints (/api/search, /api/search-with-ai) preserved as requested
  - **Testing Confirmed**: Successfully tested with Vietnamese queries, confirmed working via logs
  - **SerpAPI Configuration**: Added SerpAPI key (e5e04b97a6f406a53f9430701e795fb8d306cdc7514a8d68bbbc6c6b0a4d4a98) to config.py
- **September 28, 2025**: Implemented Dual-Model AI System
  - **NexoraX 1 (Gemini)**: Original model using Google Gemini Flash 2.5 for standard AI conversations
  - **NexoraX 2 (Search)**: New search-enhanced model combining SerpAPI (Google search) with Gemini Flash 2.5 for informed responses
  - **Model Selection**: Added clean dropdown selectors in both home and chat interfaces to choose between models
  - **Backend Integration**: Implemented /api/serpapi and /api/search-with-ai endpoints for search functionality
  - **UI Simplification**: Removed customization toolbar buttons (file upload, mic, old model selector) and replaced with streamlined dropdown
  - **Search Orchestration**: Created intelligent system that searches SerpAPI (Google), processes results, and generates AI responses with current information
  - **Error Handling**: Added comprehensive error handling for search failures and API issues
  - **Frontend Logic**: Updated JavaScript to route requests based on selected model and handle search-enhanced responses
- **September 21, 2025**: Added Professional Text Typing Effects
  - **Homepage Typing Animation**: Implemented smooth character-by-character typing effect for main title "NexoraX AI" and subtitle "Xin chào! Tôi có thể giúp gì cho bạn?"
  - **Enhanced AI Responses**: Improved existing typewriter effect for AI chat responses with better timing and visual polish
  - **Cursor Animation**: Added professional blinking cursor with blue theme color and dark mode support
  - **Accessibility Support**: Full support for users with `prefers-reduced-motion` setting - typing effects are disabled gracefully
  - **Performance Optimized**: JavaScript-controlled animations with proper cleanup and no blocking operations
  - **Mobile Responsive**: Typing effects work smoothly on both desktop and mobile devices
  - **Professional Polish**: Added visual flair that enhances user experience without impacting functionality
- **Earlier September 21, 2025**: Fixed Render deployment issues and improved sidebar
  - **Render CORS Fix**: Enhanced CORS configuration to automatically detect and support Render domains
  - **API Error Handling**: Improved error messages for missing API keys on production deployments
  - **Debug Logging**: Added environment detection and status logging for easier troubleshooting
  - **Sidebar Icons**: Updated toggle buttons to use Panel Left/Right icons with proper logic (Panel Left = open, Panel Right = close)
  - **Animation Improvements**: Optimized sidebar animation timing for smoother transitions (300ms)
  - **Deployment Guide**: Created RENDER_DEPLOYMENT.md with complete setup instructions
- **Earlier September 21, 2025**: Redesigned settings modal for better performance and UI
  - **Performance Optimization**: Removed heavy backdrop-filter blur effects causing lag
  - **UI Layout Fix**: Repositioned close button to right side of header with proper flex alignment
  - **Text Update**: Changed "🤖 TRÍ TUỆ NHÂN TẠO" to "🤖 Molded AI" 
  - **Animation Improvements**: Simplified animations using GPU-friendly transform3d and reduced transition times
  - **Responsive Design**: Maintained mobile responsiveness while improving performance
- **September 20, 2025**: Fixed mobile UI issues
  - **Send Button Mobile Fix**: Increased touch target size from 22px to 40px for better touch interaction
  - **Input Bar Mobile Fix**: Enhanced mobile keyboard behavior with better focus/blur handling
  - **Touch Events**: Added touchend event handling alongside click events for improved mobile responsiveness
  - **Mobile Layout**: Improved mobile styling with better spacing and touch-action optimization
  - **Send Button Visibility Fix**: Fixed missing send button by increasing size from 24px to 32px on desktop and changing color from gray to blue for better visibility
- **September 19, 2025**: Enhanced for Google Pro users with unlimited tokens
- **Security**: Restored original API key configuration per user request
- **Token Limits**: Increased maxOutputTokens from 2048 to 8192 tokens
- **Performance**: Extended server timeout from 30 to 120 seconds
- **Error Handling**: Improved API error messages and MAX_TOKENS handling
- **September 18, 2025**: Successfully imported from GitHub and configured for Replit
- Python 3.11 module installed and configured  
- Workflow configured to run on port 5000
- Deployment settings configured for autoscale
- Application tested and verified working
- **Removed Groq API**: Cleaned up codebase to only use Gemini API

## User Preferences
- Vietnamese interface (main target audience)
- Simple, everyday language for communication
- Prefers lightweight, secure solutions

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
├── config.py           # Configuration (handles secrets gracefully)
├── assets/
│   ├── css/style.css   # Application styles
│   └── js/app.js       # JavaScript application logic
├── attached_assets/    # User uploaded images/files  
├── NexoraX.md           # Original project documentation
├── README_RENDER.md   # Render deployment guide
└── replit.md          # This file
```

### Features Working
✅ Static file serving
✅ Responsive Vietnamese chat interface  
✅ File upload support
✅ Chat history management
✅ Dark/light theme toggle
✅ Mobile-responsive sidebar
✅ Error handling for missing API keys

### API Integration
- **Gemini API**: Ready for GEMINI_API_KEY secret
- **Graceful handling**: App works without keys, shows proper error messages

### Deployment Notes
- Configured for autoscale deployment
- Uses PORT environment variable when deployed
- No build step required (static files + Python server)
- Production-ready CORS and security settings

## Next Steps for User
1. **Add API Keys** (optional): Add GEMINI_API_KEY to Secrets for AI functionality
2. **Deploy**: Use Replit's deploy feature (already configured)
3. **Customize**: Modify branding, colors, or features as needed

## Status
🟢 **READY FOR DEPLOYMENT** - Dual-model system fully implemented and functional.

### Current Features
- ✅ **Dual AI Models**: NexoraX 1 (standard Gemini) and NexoraX 2 (search-enhanced)
- ✅ **Search Integration**: DuckDuckGo API integration with AI processing
- ✅ **Model Selection**: Clean dropdown interface for model switching
- ✅ **Error Handling**: Comprehensive error handling for API failures
- ✅ **Mobile Responsive**: Full mobile support with touch-optimized interface

### Deployment Support
- ✅ **Replit**: Works perfectly with auto CORS configuration
- ✅ **Render**: Fixed CORS issues, added deployment guide
- ✅ **Local**: Full development support with detailed logging