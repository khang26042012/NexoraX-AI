# NovaX AI Chat Application

## Project Overview
NovaX AI is a modern web-based chat application that provides AI-powered conversations using Google Gemini and Groq language models. The application features a clean, responsive interface with file upload capabilities, chat history management, and support for multiple AI models. Built with vanilla JavaScript and Python, it offers a lightweight yet feature-rich chatbot experience.

## Recent Changes
- **September 18, 2025**: Initial setup in Replit environment
- Removed hardcoded API keys for security
- Configured for Replit Secrets management

## User Preferences
- Preferred communication style: Simple, everyday language
- Vietnamese interface (main target audience)

## Project Architecture

### Frontend
- **Technology**: Vanilla JavaScript with TailwindCSS
- **Port**: 5000 (frontend server)
- **Host**: 0.0.0.0 (required for Replit proxy)
- **Features**: 
  - Chat interface with sidebar navigation
  - File upload support
  - Dark/light theme toggle
  - Chat history management
  - Responsive design

### Backend
- **Technology**: Python 3.12 HTTP server
- **Port**: 5000 (same as frontend - static file server)
- **Host**: 0.0.0.0 (required for Replit proxy)
- **Features**:
  - Static file serving
  - API proxy for Gemini and Groq APIs
  - CORS handling for secure requests
  - Environment variable configuration

### Security
- **API Keys**: Uses Replit Secrets (GEMINI_API_KEY, GROQ_API_KEY)
- **CORS**: Configured for localhost and Replit domains
- **Proxy**: Server-side API proxies prevent client-side key exposure

### Dependencies
- **Python**: 3.12 (built-in modules only)
- **Frontend Libraries**: TailwindCSS (CDN), Marked.js (CDN)
- **APIs**: Google Gemini API, Groq API

## Environment Setup

### Required Secrets
Add these to Replit Secrets:
- `GEMINI_API_KEY`: Google Gemini API key from https://aistudio.google.com/app/apikey
- `GROQ_API_KEY`: Groq API key from https://console.groq.com/keys

### File Structure
```
/
├── index.html           # Main application interface
├── server.py           # Python HTTP server with API proxy
├── config.py           # Configuration file (uses secrets)
├── assets/
│   ├── css/style.css   # Application styles
│   └── js/app.js       # JavaScript application logic
├── attached_assets/    # User uploaded images/files
└── NovaX.md           # Original project documentation
```

## Running the Application
The server should be started with: `python3 server.py`
- Automatically serves static files
- Provides API proxy endpoints at `/api/gemini` and `/api/groq`
- Listens on port 5000 bound to 0.0.0.0 for Replit compatibility

## Deployment Notes
- Uses PORT environment variable when deployed
- Configured for Replit's deployment system
- No build step required (static files + Python server)
