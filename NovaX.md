# NovaX AI Chat Application

## Overview
NovaX AI is a modern chat application that provides AI-powered conversations using Gemini and Groq models. The application features a sleek, responsive interface with file upload capabilities and multi-model AI support.

## Current State
- **Status**: Successfully imported and fully configured in Replit environment
- **Port**: 5000 (configured for Replit proxy)
- **Architecture**: Python backend serving static frontend files
- **Date Imported**: September 15, 2025
- **Date Configured**: September 16, 2025

## Project Architecture
### Backend (server.py)
- Python 3.11 HTTP server using built-in `http.server` and `socketserver`
- Serves static files (HTML, CSS, JavaScript)
- Proxies API requests to:
  - Google Gemini API (`/api/gemini`)
  - Groq API (`/api/groq`)
- CORS handling for Replit environment
- API key management through environment variables

### Frontend
- **Framework**: Vanilla JavaScript with TailwindCSS
- **Main Files**:
  - `index.html`: Main application page
  - `assets/css/style.css`: Custom styling and animations
  - `assets/js/app.js`: Application logic and AI chat functionality
- **Features**:
  - Responsive design with mobile/desktop sidebar
  - File upload with preview
  - Dark mode toggle
  - Multiple AI model selection (Gemini Flash, Gemma)
  - Chat history with local storage

## Recent Changes
- **2025-09-15**: Initial import and Replit setup
- **2025-09-16**: Complete environment configuration
  - Installed Python 3.11 module
  - Configured workflow to run on port 5000 with webview output
  - Verified server functionality and static file serving (all files served with 200 status)
  - Set up deployment configuration for autoscale production deployment
  - Fixed server to handle $PORT environment variable for deployment compatibility
  - Updated deployment configuration to use automatic port assignment
  - Confirmed frontend assets loading properly

## Configuration
### Environment Variables Required
- `GEMINI_API_KEY`: Google Gemini API key for AI responses
- `GROQ_API_KEY`: Groq API key for alternative AI model

### Deployment Settings
- **Target**: Autoscale (stateless web application)
- **Command**: `python3 server.py` (uses $PORT environment variable for port assignment)
- **Host Configuration**: Already set to 0.0.0.0 for Replit proxy compatibility
- **Port Handling**: Automatically reads from $PORT environment variable in production deployments

## User Preferences
- Application is designed for Vietnamese users (interface in Vietnamese)
- Supports both light and dark themes
- Mobile-first responsive design

## Technical Notes
- Server already configured for Replit environment with proper CORS headers
- File upload limited to 10MB per file, max 5 files
- Uses TailwindCSS CDN (shows development warning in console - normal)
- Missing favicon.ico (minor cosmetic issue)
- All critical functionality working correctly
