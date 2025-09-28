#!/usr/bin/env python3
"""
NexoraX AI Server - Production-ready HTTP server for serving static files
Author: NexoraX AI Team
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
import urllib.error
import time

# Import configuration
try:
    from config import get_api_key, check_config, get_allowed_origins, REQUEST_TIMEOUT
except ImportError:
    # Fallback nếu không có config.py
    def get_api_key(service):
        if service.lower() == "gemini":
            return os.getenv('GEMINI_API_KEY')
        return None
    
    def check_config():
        return []
    
    def get_allowed_origins():
        return ['http://localhost:5000']
    
    REQUEST_TIMEOUT = 30

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NexoraXHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP request handler for NexoraX AI application"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def _is_origin_allowed(self, origin):
        """Check if origin is in secure allowed list"""
        if not origin:
            return True  # Allow requests without origin (server-to-server)
        allowed_origins = get_allowed_origins()
        # If allowed origins contains "*", allow all
        if "*" in allowed_origins:
            return True
        return origin in allowed_origins
    
    def _send_cors_headers(self, origin=None):
        """Send appropriate CORS headers securely"""
        origin = origin or self.headers.get('Origin', '')
        allowed_origins = get_allowed_origins()
        
        if "*" in allowed_origins:
            # For production environments like Render/Replit
            self.send_header('Access-Control-Allow-Origin', '*')
        elif self._is_origin_allowed(origin) and origin:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
        else:
            # Fallback to wildcard for production
            self.send_header('Access-Control-Allow-Origin', '*')
    
    def _send_json_error(self, status_code, error_message, error_code):
        """Send JSON error response with proper CORS"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        error_response = json.dumps({
            "error": error_message,
            "code": error_code
        })
        self.wfile.write(error_response.encode('utf-8'))
    
    def do_POST(self):
        """Handle POST requests for API proxy"""
        if self.path == '/api/gemini':
            self.handle_gemini_proxy()
        elif self.path == '/api/search':
            self.handle_search_proxy()
        elif self.path == '/api/duckduckgo':
            self.handle_duckduckgo_search()
        elif self.path == '/api/search-with-ai':
            self.handle_search_with_ai()
        else:
            self._send_json_error(404, "API endpoint không tồn tại", "NOT_FOUND")

    def handle_gemini_proxy(self):
        """Proxy requests to Gemini API using server-side API key"""
        try:
            # Get API key from config hoặc environment
            api_key = get_api_key('gemini')
            logger.info(f"API Key configured: {'Yes' if api_key and api_key != 'your_gemini_api_key_here' else 'No'}")
            if not api_key or api_key == "your_gemini_api_key_here":
                self._send_json_error(500, 
                    "API key chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào environment variables.",
                    "API_KEY_MISSING")
                return
            
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract model from request
            model = request_data.get('model', 'gemini-2.5-flash')
            
            # Build Gemini API URL
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            
            # Prepare request for Gemini API
            gemini_request = urllib.request.Request(
                gemini_url,
                data=json.dumps(request_data.get('payload', {})).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            
            # Make request to Gemini API with timeout
            with urllib.request.urlopen(gemini_request, timeout=REQUEST_TIMEOUT) as response:
                gemini_response = response.read()
                
            # Return response to client
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            # Send secure CORS headers
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(gemini_response)
            
        except urllib.error.HTTPError as e:
            # Forward exact status and error from Gemini API
            try:
                error_body = e.read().decode('utf-8')
                self._send_json_error(e.code, f"Gemini API lỗi: {error_body}", "UPSTREAM_ERROR")
            except:
                self._send_json_error(e.code, f"Gemini API lỗi: {e.reason}", "UPSTREAM_ERROR")
        except urllib.error.URLError as e:
            logger.error(f"Gemini connection error: {e}")
            self._send_json_error(502, "Không thể kết nối đến Gemini API", "CONNECTION_ERROR")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra định dạng JSON.", "INVALID_JSON")
        except Exception as e:
            logger.error(f"Gemini proxy error: {e}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(f"Exception args: {e.args}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_search_proxy(self):
        """Proxy requests to Tavily Search API using server-side API key"""
        try:
            # Get API key from config hoặc environment
            api_key = get_api_key('tavily')
            logger.info(f"Tavily API Key configured: {'Yes' if api_key and api_key != 'your_tavily_api_key_here' else 'No'}")
            if not api_key or api_key == "your_tavily_api_key_here":
                self._send_json_error(500, 
                    "Tavily API key chưa được cấu hình. Vui lòng thêm TAVILY_API_KEY vào environment variables.",
                    "API_KEY_MISSING")
                return
            
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract query from request
            query = request_data.get('query', '')
            if not query:
                self._send_json_error(400, "Query không được để trống", "MISSING_QUERY")
                return
            
            # Build Tavily API URL
            tavily_url = "https://api.tavily.com/search"
            
            # Prepare request payload for Tavily API
            tavily_payload = {
                "api_key": api_key,
                "query": query,
                "search_depth": request_data.get('search_depth', 'basic'),
                "include_answer": request_data.get('include_answer', True),
                "include_raw_content": request_data.get('include_raw_content', False),
                "max_results": request_data.get('max_results', 5),
                "include_domains": request_data.get('include_domains', []),
                "exclude_domains": request_data.get('exclude_domains', [])
            }
            
            # Prepare request for Tavily API
            tavily_request = urllib.request.Request(
                tavily_url,
                data=json.dumps(tavily_payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            
            # Make request to Tavily API with timeout
            with urllib.request.urlopen(tavily_request, timeout=REQUEST_TIMEOUT) as response:
                tavily_response = response.read()
                
            # Return response to client
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            # Send secure CORS headers
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(tavily_response)
            
        except urllib.error.HTTPError as e:
            # Forward exact status and error from Tavily API
            try:
                error_body = e.read().decode('utf-8')
                self._send_json_error(e.code, f"Tavily API lỗi: {error_body}", "UPSTREAM_ERROR")
            except:
                self._send_json_error(e.code, f"Tavily API lỗi: {e.reason}", "UPSTREAM_ERROR")
        except urllib.error.URLError as e:
            logger.error(f"Tavily connection error: {e}")
            self._send_json_error(502, "Không thể kết nối đến Tavily API", "CONNECTION_ERROR")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra định dạng JSON.", "INVALID_JSON")
        except Exception as e:
            logger.error(f"Tavily proxy error: {e}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(f"Exception args: {e.args}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_duckduckgo_search(self):
        """Handle DuckDuckGo search requests"""
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract query from request
            query = request_data.get('query', '')
            if not query:
                self._send_json_error(400, "Query không được để trống", "MISSING_QUERY")
                return
            
            # Build DuckDuckGo Instant Answer API URL
            ddg_url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(query)}&format=json&no_html=1&skip_disambig=1"
            
            # Make request to DuckDuckGo API with timeout
            ddg_request = urllib.request.Request(ddg_url)
            with urllib.request.urlopen(ddg_request, timeout=REQUEST_TIMEOUT) as response:
                ddg_response = response.read().decode('utf-8')
                ddg_data = json.loads(ddg_response)
            
            # Extract useful information from DuckDuckGo response
            search_results = {
                "query": query,
                "answer": ddg_data.get('Answer', ''),
                "abstract": ddg_data.get('Abstract', ''),
                "abstract_source": ddg_data.get('AbstractSource', ''),
                "abstract_url": ddg_data.get('AbstractURL', ''),
                "definition": ddg_data.get('Definition', ''),
                "definition_source": ddg_data.get('DefinitionSource', ''),
                "definition_url": ddg_data.get('DefinitionURL', ''),
                "related_topics": ddg_data.get('RelatedTopics', [])[:5],  # Limit to first 5
                "results": ddg_data.get('Results', [])[:5],  # Limit to first 5
                "infobox": ddg_data.get('Infobox', {}),
                "redirect": ddg_data.get('Redirect', '')
            }
            
            # Format the response for better use with Gemini
            formatted_response = {
                "search_query": query,
                "search_results": search_results,
                "summary": self._format_ddg_summary(search_results),
                "timestamp": int(time.time()) if 'time' in globals() else None
            }
            
            # Return response to client
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps(formatted_response, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
        except urllib.error.HTTPError as e:
            try:
                error_body = e.read().decode('utf-8')
                self._send_json_error(e.code, f"DuckDuckGo API lỗi: {error_body}", "UPSTREAM_ERROR")
            except:
                self._send_json_error(e.code, f"DuckDuckGo API lỗi: {e.reason}", "UPSTREAM_ERROR")
        except urllib.error.URLError as e:
            logger.error(f"DuckDuckGo connection error: {e}")
            self._send_json_error(502, "Không thể kết nối đến DuckDuckGo API", "CONNECTION_ERROR")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in DuckDuckGo request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra định dạng JSON.", "INVALID_JSON")
        except Exception as e:
            logger.error(f"DuckDuckGo search error: {e}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(f"Exception args: {e.args}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")
    
    def _format_ddg_summary(self, search_results):
        """Format DuckDuckGo search results into a readable summary"""
        summary_parts = []
        
        if search_results.get('answer'):
            summary_parts.append(f"Trả lời: {search_results['answer']}")
        
        if search_results.get('abstract'):
            summary_parts.append(f"Tóm tắt: {search_results['abstract']}")
            if search_results.get('abstract_source'):
                summary_parts.append(f"Nguồn: {search_results['abstract_source']}")
        
        if search_results.get('definition'):
            summary_parts.append(f"Định nghĩa: {search_results['definition']}")
        
        # Add related topics
        related_topics = search_results.get('related_topics', [])
        if related_topics:
            topic_texts = []
            for topic in related_topics[:3]:  # First 3 topics
                if isinstance(topic, dict) and topic.get('Text'):
                    topic_texts.append(topic['Text'])
            if topic_texts:
                summary_parts.append(f"Chủ đề liên quan: {'; '.join(topic_texts)}")
        
        return '\n\n'.join(summary_parts) if summary_parts else "Không tìm thấy thông tin phù hợp."

    def handle_search_with_ai(self):
        """Handle search requests that combine DuckDuckGo results with Gemini AI processing"""
        try:
            # Get API key for Gemini
            api_key = get_api_key('gemini')
            if not api_key or api_key == "your_gemini_api_key_here":
                self._send_json_error(500, 
                    "API key chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào environment variables.",
                    "API_KEY_MISSING")
                return

            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract user query
            user_query = request_data.get('query', '')
            if not user_query:
                self._send_json_error(400, "Query không được để trống", "MISSING_QUERY")
                return

            # Step 1: Search DuckDuckGo
            logger.info(f"Starting search for: {user_query}")
            ddg_url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(user_query)}&format=json&no_html=1&skip_disambig=1"
            
            ddg_request = urllib.request.Request(ddg_url)
            with urllib.request.urlopen(ddg_request, timeout=REQUEST_TIMEOUT) as response:
                ddg_response = response.read().decode('utf-8')
                ddg_data = json.loads(ddg_response)

            # Format search results for AI processing
            search_context = self._format_search_context_for_ai(ddg_data, user_query)
            
            # Step 2: Create enhanced prompt for Gemini
            enhanced_prompt = self._create_search_enhanced_prompt(user_query, search_context)
            
            # Step 3: Send to Gemini Flash 2.5
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            
            gemini_payload = {
                "contents": [{
                    "parts": [{
                        "text": enhanced_prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 8192,
                },
                "safetySettings": [
                    {
                        "category": "HARM_CATEGORY_HARASSMENT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_HATE_SPEECH",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            }
            
            gemini_request = urllib.request.Request(
                gemini_url,
                data=json.dumps(gemini_payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(gemini_request, timeout=REQUEST_TIMEOUT) as response:
                gemini_response = response.read().decode('utf-8')
                gemini_data = json.loads(gemini_response)

            # Format the final response
            final_response = {
                "query": user_query,
                "model": "nexorax2-search",
                "search_performed": True,
                "search_results_count": len(ddg_data.get('RelatedTopics', [])) + len(ddg_data.get('Results', [])),
                "ai_response": gemini_data,
                "search_context": search_context,
                "timestamp": int(time.time())
            }

            # Return response to client
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps(final_response, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info(f"Search with AI completed for query: {user_query}")
            
        except urllib.error.HTTPError as e:
            try:
                error_body = e.read().decode('utf-8')
                self._send_json_error(e.code, f"API lỗi: {error_body}", "UPSTREAM_ERROR")
            except:
                self._send_json_error(e.code, f"API lỗi: {e.reason}", "UPSTREAM_ERROR")
        except urllib.error.URLError as e:
            logger.error(f"Search with AI connection error: {e}")
            self._send_json_error(502, "Không thể kết nối đến dịch vụ tìm kiếm", "CONNECTION_ERROR")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in search with AI request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra định dạng JSON.", "INVALID_JSON")
        except Exception as e:
            logger.error(f"Search with AI error: {e}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(f"Exception args: {e.args}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def _format_search_context_for_ai(self, ddg_data, query):
        """Format DuckDuckGo data into context for AI processing"""
        context_parts = []
        
        # Add instant answer if available
        if ddg_data.get('Answer'):
            context_parts.append(f"Câu trả lời nhanh: {ddg_data['Answer']}")
        
        # Add abstract information
        if ddg_data.get('Abstract'):
            context_parts.append(f"Thông tin tổng quan: {ddg_data['Abstract']}")
            if ddg_data.get('AbstractSource'):
                context_parts.append(f"Nguồn: {ddg_data['AbstractSource']}")
        
        # Add definition if available
        if ddg_data.get('Definition'):
            context_parts.append(f"Định nghĩa: {ddg_data['Definition']}")
        
        # Add related topics
        related_topics = ddg_data.get('RelatedTopics', [])
        if related_topics:
            topic_info = []
            for topic in related_topics[:5]:  # First 5 topics
                if isinstance(topic, dict) and topic.get('Text'):
                    topic_info.append(topic['Text'])
            if topic_info:
                context_parts.append(f"Thông tin liên quan:\n" + "\n".join(f"- {info}" for info in topic_info))
        
        # Add infobox data if available
        infobox = ddg_data.get('Infobox', {})
        if infobox and infobox.get('content'):
            infobox_text = []
            for item in infobox['content'][:5]:  # First 5 items
                if isinstance(item, dict) and item.get('label') and item.get('value'):
                    infobox_text.append(f"{item['label']}: {item['value']}")
            if infobox_text:
                context_parts.append(f"Thông tin chi tiết:\n" + "\n".join(f"- {info}" for info in infobox_text))
        
        return "\n\n".join(context_parts) if context_parts else "Không tìm thấy thông tin từ nguồn tìm kiếm."

    def _create_search_enhanced_prompt(self, user_query, search_context):
        """Create an enhanced prompt for Gemini that includes search context"""
        prompt = f"""Bạn là NexoraX 2, một AI assistant được tích hợp với khả năng tìm kiếm thông tin thời gian thực. Hãy trả lời câu hỏi của người dùng dựa trên thông tin tìm kiếm được cung cấp và kiến thức của bạn.

Câu hỏi của người dùng: {user_query}

Thông tin tìm kiếm từ DuckDuckGo:
{search_context}

Hướng dẫn trả lời:
1. Sử dụng thông tin tìm kiếm để đưa ra câu trả lời chính xác và cập nhật
2. Nếu thông tin tìm kiếm không đủ, hãy bổ sung từ kiến thức của bạn
3. Trả lời bằng tiếng Việt một cách tự nhiên và dễ hiểu
4. Nếu có nguồn thông tin, hãy đề cập đến nguồn đó
5. Nếu thông tin không rõ ràng hoặc mâu thuẫn, hãy nói rõ điều đó

Vui lòng trả lời:"""
        
        return prompt

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        # Use secure CORS headers consistently
        self._send_cors_headers()
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '3600')
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
    """Run the NexoraX AI server"""
    handler = NexoraXHTTPRequestHandler
    
    # Allow reuse of socket address to prevent "Address already in use" errors
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("0.0.0.0", port), handler) as httpd:
            logger.info(f"NexoraX AI Server running on http://0.0.0.0:{port}/")
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
        port = int(os.getenv('PORT', 5000))  # Default to PORT env var or 5000
    
    # Debug logging for deployment
    logger.info("NexoraX AI - Starting production server...")
    logger.info(f"Environment: {'Render' if os.getenv('RENDER') else 'Replit' if os.getenv('REPLIT_DOMAIN') else 'Local'}")
    logger.info(f"Port: {port}")
    logger.info(f"Allowed Origins: {get_allowed_origins()}")
    
    # API Key status
    api_key = get_api_key('gemini')
    logger.info(f"API Key Status: {'Configured' if api_key and api_key != 'your_gemini_api_key_here' else 'NOT CONFIGURED - Please set GEMINI_API_KEY environment variable'}")
    
    # Check if files exist
    required_files = ['index.html', 'assets/css/style.css', 'assets/js/app.js']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        logger.error(f"Missing required files: {', '.join(missing_files)}")
        sys.exit(1)
    
    run_server(port)