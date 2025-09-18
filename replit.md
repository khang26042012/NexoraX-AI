# NovaX AI - Replit Setup

## Project Overview
NovaX AI is a modern Vietnamese AI chat application that provides conversations using Google Gemini and Groq language models. Successfully imported and configured for Replit environment on September 18, 2025.

## Recent Changes
- **September 18, 2025**: Successfully imported from GitHub and configured for Replit
- Python 3.12 module installed and configured  
- Workflow configured to run on port 5000
- Deployment settings configured for autoscale
- Application tested and verified working

## User Preferences
- Vietnamese interface (main target audience)
- Simple, everyday language for communication
- Prefers lightweight, secure solutions

## Project Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript with TailwindCSS (CDN) and Marked.js (CDN)
- **Backend**: Python 3.12 HTTP server (built-in modules only)
- **Port**: 5000 (single server for both static files and API proxy)
- **Host**: 0.0.0.0 (configured for Replit proxy requirements)

### Current Configuration
- **Workflow**: "NovaX AI Server" running `python3 server.py`
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
├── NovaX.md           # Original project documentation
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
- **Groq API**: Ready for GROQ_API_KEY secret  
- **Graceful handling**: App works without keys, shows proper error messages

### Deployment Notes
- Configured for autoscale deployment
- Uses PORT environment variable when deployed
- No build step required (static files + Python server)
- Production-ready CORS and security settings

## Next Steps for User
1. **Add API Keys** (optional): Add GEMINI_API_KEY and/or GROQ_API_KEY to Secrets for AI functionality
2. **Deploy**: Use Replit's deploy feature (already configured)
3. **Customize**: Modify branding, colors, or features as needed

## Status
🟢 **READY TO USE** - Application is fully functional and ready for deployment or further customization.