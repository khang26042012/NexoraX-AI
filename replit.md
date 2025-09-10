# NovaX AI - AI Chat Assistant

## Overview
NovaX AI is a modern web-based chat application that integrates with AI models (primarily Google Gemini) to provide intelligent conversational assistance. The application features a sleek, responsive interface with support for file uploads, chat history, and dark mode themes.

## Project Architecture
- **Frontend**: HTML5, CSS3, JavaScript (ES6+) with Tailwind CSS
- **Backend**: Python 3.11 HTTP server for serving static files
- **Language**: Vietnamese (with English fallback)
- **AI Integration**: Google Gemini API for chat responses

## Key Features
- Real-time AI chat with streaming responses
- File upload support (images, documents)
- Chat history with local storage
- Dark/light theme toggle
- Responsive design (mobile-friendly)
- Sidebar navigation with chat management
- Settings modal with model selection

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
- Set up Python 3.11 environment
- Configured workflow for development server
- Verified application functionality
- Set up deployment configuration for autoscale

## User Preferences
- Application interface is in Vietnamese
- Uses modern, clean design patterns
- Optimized for both desktop and mobile usage