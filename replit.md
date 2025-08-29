# NovaX AI - AI Chat Assistant

## Overview

NovaX AI is a web-based AI chat assistant application that provides an interactive conversational interface. The application is a single-page web application built with modern frontend technologies, featuring a ChatGPT-style messaging interface with animated message bubbles and markdown rendering capabilities.

**Current Status**: ✅ Successfully deployed and running in Replit environment
- Server running on port 5000 using Python HTTP server  
- Configured for production deployment with autoscale target
- All features functional including AI chat integration
- ✅ Fresh GitHub import successfully configured for Replit (Aug 29, 2025)

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (Aug 29, 2025)

- **Successfully restructured monolithic application**: Split single index.html file into organized components
- **Created structured file organization**: HTML (index.html), CSS (assets/css/style.css), JavaScript (assets/js/app.js)
- **Set up Python HTTP server** (server.py) to serve static files on port 5000 with proper Replit configuration
- **Fixed JavaScript issues**: Resolved template literal errors and syntax problems during file separation
- **Configured workflow** "NovaX AI Server" for development and testing environment
- **Added deployment configuration** for production using autoscale target
- **Verified application functionality** in Replit environment after restructuring
- **Implemented comprehensive file upload system**: Added file/image upload functionality with preview and AI integration
  - File upload buttons in both home and chat input areas
  - Support for multiple file types (images, documents, PDFs)
  - File preview modal with drag-and-drop-like experience
  - Image gallery display in chat messages with modal viewer
  - AI integration to analyze and respond to uploaded files
  - File size validation (10MB limit) and file count limit (5 files max)
- **Added typing animation for AI responses**: Character-by-character display like ChatGPT with smart punctuation pauses
- **Implemented stunning gradient input styling**: Applied advanced CSS gradient effects with animated borders, star backgrounds, and glow animations to both home and chat input areas for enhanced visual appeal
- All AI features (Gemini and Llama models) working correctly with new file structure and file processing

## System Architecture

### Frontend Architecture
- **Modular Structure**: Organized into separate HTML, CSS, and JavaScript files for better maintainability
  - `index.html`: Main HTML structure and semantic markup
  - `assets/css/style.css`: All styling including animations and responsive design
  - `assets/js/app.js`: Complete application logic and API integration
- **Responsive Design**: Uses Tailwind CSS for mobile-first responsive design with viewport meta tag configuration
- **Component-Based UI**: Implements a chat interface with distinct user and AI message components
- **Animation System**: Custom CSS animations for message bubbles with smooth slide-in effects using cubic-bezier timing functions
- **Server Integration**: Python HTTP server (server.py) serves static files with proper CORS and Replit proxy support

### UI/UX Design Patterns
- **ChatGPT-Style Interface**: Implements familiar chat patterns with user messages aligned right and AI responses aligned left
- **Message Bubble System**: Animated message containers with proper spacing and responsive width constraints (max 80% width)
- **Typography**: Optimized text rendering with proper line-height, word-wrapping, and paragraph spacing
- **Internationalization**: Configured for Vietnamese language (lang="vi") indicating potential multilingual support

### Styling Architecture
- **Utility-First CSS**: Leverages Tailwind CSS for rapid UI development and consistent design system
- **Custom CSS Overrides**: Selective custom styling for message-specific animations and layout adjustments
- **Progressive Enhancement**: Graceful handling of text formatting with proper fallbacks

## External Dependencies

### CSS Framework
- **Tailwind CSS**: Delivered via CDN for utility-first styling and responsive design system

### JavaScript Libraries
- **Marked.js**: Markdown parsing library for rendering formatted text content in chat messages, enabling rich text display including code blocks, links, and formatting

### Content Delivery Networks
- All external dependencies are loaded via CDN for simplified deployment and reduced build complexity
- No local dependency management or build process required