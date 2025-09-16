# NovaX AI Chat Application

## Overview

NovaX AI is a modern web-based chat application that provides AI-powered conversations using Google Gemini and Groq language models. The application features a clean, responsive interface with file upload capabilities, chat history management, and support for multiple AI models. Built with vanilla JavaScript and Python, it offers a lightweight yet feature-rich chatbot experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Vanilla JavaScript with TailwindCSS for styling
- **Design Pattern**: Single-page application with component-based structure
- **Responsive Design**: Mobile-first approach with adaptive sidebar and interface
- **State Management**: Browser localStorage for chat history and user preferences
- **File Handling**: Client-side file upload with preview functionality
- **Theme Support**: Dark/light mode toggle with user preference persistence

### Backend Architecture
- **Server**: Python HTTP server using built-in `http.server` and `socketserver`
- **Architecture Pattern**: Static file server with API proxy functionality
- **Request Handling**: Custom request handler extending `SimpleHTTPRequestHandler`
- **API Proxy**: Server-side proxy for AI model APIs to handle authentication securely
- **CORS Support**: Built-in CORS handling for cross-origin requests
- **Port Configuration**: Dynamic port assignment supporting both development and production environments

### Data Storage
- **Client Storage**: localStorage for chat history, user preferences, and selected models
- **Chat Persistence**: JSON-based chat storage with unique chat IDs
- **File Storage**: Temporary client-side file handling for uploads
- **No Database**: Stateless server design with client-side data persistence

### Authentication and Security
- **API Key Management**: Server-side environment variable storage for API keys
- **Secure Proxy**: Backend proxy prevents client-side API key exposure
- **Environment Configuration**: Replit Secrets integration for sensitive data
- **CORS Protection**: Configured for secure cross-origin resource sharing

## External Dependencies

### AI Services
- **Google Gemini API**: Primary AI model for chat responses via `/api/gemini` proxy
- **Groq API**: Alternative AI model access via `/api/groq` proxy
- **Model Support**: Gemini Flash and Gemma models

### Frontend Libraries
- **TailwindCSS**: Utility-first CSS framework via CDN
- **Marked.js**: Markdown parsing library for message rendering
- **Native Browser APIs**: File API, localStorage, Fetch API

### Deployment Platform
- **Replit**: Primary hosting environment with integrated development tools
- **Environment Variables**: `GEMINI_API_KEY` and `GROQ_API_KEY` required
- **Port Configuration**: Supports `$PORT` environment variable for deployment

### Development Tools
- **Python 3.11**: Runtime environment
- **HTTP Server**: Built-in Python modules for serving static content
- **Logging**: Python logging module for server monitoring