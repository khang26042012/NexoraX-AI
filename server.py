#!/usr/bin/env python3
"""
NovaX AI Server - Production-ready HTTP server for serving static files
Author: NovaX AI Team
Date: August 2025
"""

import http.server
import socketserver
import os
import mimetypes
from urllib.parse import unquote
import logging
import json
import urllib.request
import urllib.parse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NovaXHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP request handler for NovaX AI application"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def do_POST(self):
        """Handle POST requests for API proxy"""
        if self.path == '/api/gemini':
            self.handle_gemini_proxy()
        elif self.path == '/api/groq':
            self.handle_groq_proxy()
        else:
            self.send_error(404)

    def handle_gemini_proxy(self):
        """Proxy requests to Gemini API using server-side API key"""
        try:
            # Get API key from environment (Replit Secrets)
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                self.send_error(500, "API key not configured")
                return
            
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract model from request
            model = request_data.get('model', 'gemini-1.5-flash')
            
            # Build Gemini API URL
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            
            # Prepare request for Gemini API
            gemini_request = urllib.request.Request(
                gemini_url,
                data=json.dumps(request_data.get('payload', {})).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            
            # Make request to Gemini API
            with urllib.request.urlopen(gemini_request) as response:
                gemini_response = response.read()
                
            # Return response to client
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            # Only allow same-origin requests for security
            origin = self.headers.get('Origin', '')
            if (origin.startswith('http://localhost')) or ((origin.startswith('https://')) and ('replit' in origin)):
                self.send_header('Access-Control-Allow-Origin', origin)
            self.end_headers()
            self.wfile.write(gemini_response)
            
        except Exception as e:
            logger.error(f"Gemini proxy error: {e}")
            self.send_error(500, f"Proxy error: {str(e)}")

    def handle_groq_proxy(self):
        """Proxy requests to Groq API using server-side API key"""
        try:
            # Get API key from environment (Replit Secrets)
            api_key = os.getenv('GROQ_API_KEY')
            if not api_key:
                self.send_error(500, "Groq API key not configured")
                return
            
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract model from request (default to gemma-7b-it)
            model = request_data.get('model', 'gemma-7b-it')
            
            # Build Groq API request payload
            groq_payload = {
                "messages": [
                    {
                        "role": "user",
                        "content": request_data.get('message', '')
                    }
                ],
                "model": model,
                "temperature": request_data.get('temperature', 0.7),
                "max_tokens": request_data.get('max_tokens', 1024),
                "top_p": request_data.get('top_p', 0.95)
            }
            
            # Prepare request for Groq API
            groq_request = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=json.dumps(groq_payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {api_key}'
                }
            )
            
            # Make request to Groq API
            with urllib.request.urlopen(groq_request) as response:
                groq_response = response.read()
                
            # Return response to client
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            # Only allow same-origin requests for security
            origin = self.headers.get('Origin', '')
            if (origin.startswith('http://localhost')) or ((origin.startswith('https://')) and ('replit' in origin)):
                self.send_header('Access-Control-Allow-Origin', origin)
            self.end_headers()
            self.wfile.write(groq_response)
            
        except Exception as e:
            logger.error(f"Groq proxy error: {e}")
            self.send_error(500, f"Proxy error: {str(e)}")

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        # Only allow same-origin requests for security
        origin = self.headers.get('Origin', '')
        if (origin.startswith('http://localhost')) or ((origin.startswith('https://')) and ('replit' in origin)):
            self.send_header('Access-Control-Allow-Origin', origin)
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests with proper MIME types and caching"""
        # Log all requests
        logger.info(f"GET {self.path} from {self.client_address[0]}")
        
        # Handle root path
        if self.path == '/':
            self.path = '/index.html'
        
        # Clean path
        path = unquote(self.path)
        
        # Set proper MIME types
        if path.endswith('.css'):
            self.send_response(200)
            self.send_header('Content-type', 'text/css')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            
            try:
                with open(path[1:], 'rb') as file:
                    self.wfile.write(file.read())
            except FileNotFoundError:
                self.send_error(404)
            return
        
        elif path.endswith('.js'):
            self.send_response(200)
            self.send_header('Content-type', 'application/javascript')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            
            try:
                with open(path[1:], 'rb') as file:
                    self.wfile.write(file.read())
            except FileNotFoundError:
                self.send_error(404)
            return
        
        elif path.endswith('.html'):
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            
            try:
                with open(path[1:] if path != '/index.html' else 'index.html', 'rb') as file:
                    self.wfile.write(file.read())
            except FileNotFoundError:
                self.send_error(404)
            return
        
        # For all other files, use default handler
        super().do_GET()
    
    def log_message(self, format, *args):
        """Override default logging to use our logger"""
        logger.info(f"{self.client_address[0]} - {format % args}")

def run_server(port=5000):
    """Run the NovaX AI server"""
    handler = NovaXHTTPRequestHandler
    
    # Allow reuse of socket address to prevent "Address already in use" errors
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("0.0.0.0", port), handler) as httpd:
            logger.info(f"NovaX AI Server running on http://0.0.0.0:{port}/")
            logger.info("Press Ctrl+C to stop the server")
            
            # Serve forever
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        logger.info("\nServer stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")

if __name__ == "__main__":
    import sys
    
    # Get port with proper precedence: ENV variable (for deployments) > command line > default
    env_port = os.getenv('PORT')
    if env_port:
        port = int(env_port)
        if len(sys.argv) > 1:
            logger.info(f"Using PORT environment variable ({env_port}) instead of command line argument")
    elif len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            logger.error("Invalid port number")
            sys.exit(1)
    else:
        port = 5000
    
    # Check if files exist
    required_files = ['index.html', 'assets/css/style.css', 'assets/js/app.js']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        logger.error(f"Missing required files: {', '.join(missing_files)}")
        sys.exit(1)
    
    logger.info("NovaX AI - Starting production server...")
    run_server(port)