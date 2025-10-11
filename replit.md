# NexoraX AI - Replit Setup

## Overview
NexoraX AI is a modern Vietnamese AI chat application designed for the Replit environment. It leverages Google Gemini, search-enhanced AI, and LLM7.io for GPT-5 Mini and Gemini Search models. The project emphasizes a modular ES6 architecture and is configured for seamless deployment, offering a feature-rich, responsive user experience with advanced Markdown rendering and conversation memory.

## User Preferences
- Vietnamese interface (main target audience)
- Simple, everyday language for communication
- Prefers lightweight, secure solutions
- Critical: Do not delete or change API configurations

## System Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript, TailwindCSS (CDN), Marked.js (CDN), Highlight.js (CDN).
- **Backend**: Python 3.12.11 HTTP server (built-in modules only).
- **Server Configuration**: Port 5000, host 0.0.0.0 (for Replit compatibility).
- **File Structure**: Modular ES6 JavaScript in `src/js/` (14 files), Python server in `server.py`, static assets in `assets/`.
- **UI/UX**: Responsive Vietnamese chat interface, dark/light theme toggle, mobile-responsive sidebar, multi-model AI support with emoji icons.
- **Technical Implementations**: Enhanced Markdown rendering with GitHub Flavored Markdown, syntax highlighting (Highlight.js), tables, checkboxes, XSS protection in Markdown. Chat history management with conversation context memory for all AI models. File upload support. Server-side API proxy for secure API key handling. CORS configured for Replit iframe.
- **Deployment**: Configured for autoscale deployment on Koyeb.com, using a `Procfile` for `python3 server.py`. No build step required; uses static files and Python server.

## External Dependencies
- **Google Gemini API**: For Gemini Flash 2.5 conversations.
- **SerpAPI**: For web search functionality.
- **LLM7.io API**: Integrates GPT-5 Mini and Gemini Search models.