# NovaX AI - AI Chat Assistant

## Overview

NovaX AI is a web-based AI chat assistant application that provides an interactive conversational interface. The application is a single-page web application built with modern frontend technologies, featuring a ChatGPT-style messaging interface with animated message bubbles and markdown rendering capabilities.

**Current Status**: ✅ Successfully deployed and running in Replit environment
- Server running on port 5000 using Python HTTP server
- Configured for production deployment with autoscale target
- All features functional including AI chat integration

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (Aug 29, 2025)

- Set up Python HTTP server to serve the static HTML application on port 5000
- Configured workflow "NovaX AI Server" for development and testing
- Added deployment configuration for production using autoscale target
- Verified application functionality in Replit environment
- All AI features (Gemini and Llama models) working correctly

## System Architecture

### Frontend Architecture
- **Single Page Application**: Built as a standalone HTML file with embedded JavaScript and CSS
- **Responsive Design**: Uses Tailwind CSS for mobile-first responsive design with viewport meta tag configuration
- **Component-Based UI**: Implements a chat interface with distinct user and AI message components
- **Animation System**: Custom CSS animations for message bubbles with smooth slide-in effects using cubic-bezier timing functions

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