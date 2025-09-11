# NovaX AI - AI Chat Assistant

## Overview
NovaX AI is a modern web-based chat application that integrates with AI models (primarily Google Gemini) to provide intelligent conversational assistance. The application features a sleek, responsive interface with support for file uploads, chat history, and dark mode themes.

## Project Architecture
- **Frontend**: HTML5, CSS3, JavaScript (ES6+) with Tailwind CSS
- **Backend**: Python 3.11 HTTP server with API proxy endpoints
- **Language**: Vietnamese (with English fallback)
- **AI Integration**: 
  - Google Gemini Flash 2.5 (via Gemini API)
  - Google DeepMind Gemma (via Groq API)

## Key Features
- Real-time AI chat with streaming responses
- File upload support (images, documents)
- Chat history with local storage
- Dark/light theme toggle
- Responsive design (mobile-friendly)
- Sidebar navigation with chat management
- Settings modal with dual AI model selection

## Technical Setup
- Server runs on port 5000 with proper cache control headers
- Configured for Replit environment with 0.0.0.0 host binding
- Deployment ready with autoscale configuration
- No external dependencies beyond Python standard library

## File Structure
```
/
├── index.html              # Main application file
├── server.py              # Python HTTP server
├── assets/
│   ├── css/style.css      # Application styles
│   └── js/app.js          # Main JavaScript application
└── attached_assets/       # Project screenshots and assets
```

## Development Notes
- The server includes proper MIME type handling for CSS/JS files
- Cache control is set to 'no-cache' for development
- All assets are served with appropriate headers
- The application is ready for production deployment

## Recent Changes
- **September 2025**: Replaced Gemini Pro with Gemma (Google DeepMind)
- Added Groq API integration for Gemma model access  
- Implemented secure server-side proxy for both Gemini and Groq APIs
- Updated model migration logic for existing users
- Enhanced error handling and routing between AI models
- Maintained security with API keys in Replit Secrets

## User Preferences
- Application interface is in Vietnamese
- Uses modern, clean design patterns
- Optimized for both desktop and mobile usage