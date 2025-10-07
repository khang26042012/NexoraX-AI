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
import secrets
import threading

# Import configuration
try:
    from config import get_api_key, check_config, get_allowed_origins, REQUEST_TIMEOUT
except ImportError:
    # Fallback nếu không có config.py
    def get_api_key(service):
        if service.lower() == "gemini":
            return os.getenv('GEMINI_API_KEY')
        elif service.lower() == "serpapi":
            return os.getenv('SERPAPI_API_KEY')
        return None
    
    def check_config():
        return []
    
    def get_allowed_origins():
        return ['http://localhost:5000']
    
    REQUEST_TIMEOUT = 30

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ACCOUNTS_FILE = 'acc.txt'
SESSIONS_FILE = 'sessions_store.json'
file_lock = threading.Lock()
sessions = {}

SESSION_EXPIRY_HOURS = 168  # 7 days

def load_users():
    """Load users from acc.txt and return dict {username: password}"""
    users = {}
    try:
        with file_lock:
            if os.path.exists(ACCOUNTS_FILE):
                with open(ACCOUNTS_FILE, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and '|' in line:
                            username, password = line.split('|', 1)
                            users[username] = password
    except Exception as e:
        logger.error(f"Error loading users: {e}")
    return users

def save_user(username, password):
    """Append new user to acc.txt"""
    try:
        with file_lock:
            with open(ACCOUNTS_FILE, 'a', encoding='utf-8') as f:
                f.write(f"{username}|{password}\n")
        return True
    except Exception as e:
        logger.error(f"Error saving user: {e}")
        return False

def check_user_exists(username):
    """Check if username already exists"""
    users = load_users()
    return username in users

def authenticate_user(username, password):
    """Verify username and password"""
    users = load_users()
    return users.get(username) == password

def load_sessions():
    """Load sessions from JSON file and clean expired ones"""
    try:
        with file_lock:
            if os.path.exists(SESSIONS_FILE):
                with open(SESSIONS_FILE, 'r', encoding='utf-8') as f:
                    stored_sessions = json.load(f)
                    
                # Clean expired sessions
                current_time = time.time()
                valid_sessions = {}
                for session_id, data in stored_sessions.items():
                    if current_time < data.get('expires_at', 0):
                        # Keep full session data with expiry
                        valid_sessions[session_id] = {
                            'username': data['username'],
                            'expires_at': data['expires_at']
                        }
                    else:
                        logger.info(f"Removed expired session for user: {data.get('username')}")
                
                return valid_sessions
    except Exception as e:
        logger.error(f"Error loading sessions: {e}")
    return {}

def save_sessions():
    """Save current sessions to JSON file preserving expiry timestamps"""
    try:
        with file_lock:
            # Sessions are already in correct format with username and expires_at
            with open(SESSIONS_FILE, 'w', encoding='utf-8') as f:
                json.dump(sessions, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving sessions: {e}")
        return False

def generate_session_id():
    """Generate random session ID"""
    return secrets.token_urlsafe(32)

def create_session(username):
    """Create new session and return session_id"""
    session_id = generate_session_id()
    sessions[session_id] = {
        'username': username,
        'expires_at': time.time() + (SESSION_EXPIRY_HOURS * 3600)
    }
    save_sessions()  # Persist to file
    logger.info(f"Session created for user: {username}")
    return session_id

def get_user_from_session(session_id):
    """Get username from session_id, checking expiry"""
    session_data = sessions.get(session_id)
    if not session_data:
        return None
    
    # Check if session has expired
    if time.time() >= session_data.get('expires_at', 0):
        # Session expired, remove it
        delete_session(session_id)
        logger.info(f"Session expired for user: {session_data.get('username')}")
        return None
    
    return session_data.get('username')

def delete_session(session_id):
    """Delete session"""
    if session_id in sessions:
        username = sessions[session_id].get('username', 'Unknown')
        del sessions[session_id]
        save_sessions()  # Persist to file
        logger.info(f"Session deleted for user: {username}")
        return True
    return False

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
            self.handle_serpapi_search()
        elif self.path == '/api/serpapi' or self.path == '/api/duckduckgo':
            self.handle_serpapi_search()
        elif self.path == '/api/search-with-ai':
            self.handle_search_with_ai()
        elif self.path == '/api/llm7/gpt-5-chat':
            self.handle_llm7_gpt5chat()
        elif self.path == '/api/llm7/gemini-search':
            self.handle_llm7_gemini_search()
        elif self.path == '/api/enhance-prompt':
            self.handle_enhance_prompt()
        elif self.path == '/api/pollinations/generate':
            self.handle_pollinations_generate()
        elif self.path == '/api/auth/signup':
            self.handle_auth_signup()
        elif self.path == '/api/auth/login':
            self.handle_auth_login()
        elif self.path == '/api/auth/logout':
            self.handle_auth_logout()
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
            
            # Get payload - supports both old and new format
            payload = request_data.get('payload', {})
            
            # The payload now contains the full conversation history in 'contents' array
            # No need to modify - frontend already sends it in correct format
            
            # Prepare request for Gemini API
            gemini_request = urllib.request.Request(
                gemini_url,
                data=json.dumps(payload).encode('utf-8'),
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


    def handle_serpapi_search(self):
        """Handle SerpAPI search requests"""
        try:
            # Get API key from config hoặc environment
            api_key = get_api_key('serpapi')
            logger.info(f"SerpAPI Key configured: {'Yes' if api_key and api_key != 'your_serpapi_api_key_here' else 'No'}")
            if not api_key or api_key == "your_serpapi_api_key_here":
                self._send_json_error(500, 
                    "SerpAPI key chưa được cấu hình. Vui lòng thêm SERPAPI_API_KEY vào environment variables.",
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
            
            # Build SerpAPI URL for Google search
            serpapi_url = "https://serpapi.com/search.json"
            serpapi_params = {
                "q": query,
                "engine": "google",
                "api_key": api_key,
                "num": request_data.get('num', 10),  # Number of results
                "hl": "vi",  # Vietnamese language
                "gl": "vn"   # Vietnam location
            }
            
            # Build URL with parameters
            url_params = urllib.parse.urlencode(serpapi_params)
            full_url = f"{serpapi_url}?{url_params}"
            
            # Make request to SerpAPI with timeout
            serpapi_request = urllib.request.Request(full_url)
            with urllib.request.urlopen(serpapi_request, timeout=REQUEST_TIMEOUT) as response:
                serpapi_response = response.read().decode('utf-8')
                serpapi_data = json.loads(serpapi_response)
            
            # Extract useful information from SerpAPI response
            organic_results = serpapi_data.get('organic_results', [])
            answer_box = serpapi_data.get('answer_box', {})
            knowledge_graph = serpapi_data.get('knowledge_graph', {})
            
            search_results = {
                "query": query,
                "answer": answer_box.get('answer', ''),
                "snippet": answer_box.get('snippet', ''),
                "title": answer_box.get('title', ''),
                "link": answer_box.get('link', ''),
                "knowledge_graph": knowledge_graph,
                "organic_results": organic_results[:5],  # Limit to first 5
                "total_results": serpapi_data.get('search_information', {}).get('total_results', 0)
            }
            
            # Format the response for better use with Gemini
            formatted_response = {
                "search_query": query,
                "search_results": search_results,
                "summary": self._format_serpapi_summary(search_results),
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
                self._send_json_error(e.code, f"SerpAPI lỗi: {error_body}", "UPSTREAM_ERROR")
            except:
                self._send_json_error(e.code, f"SerpAPI lỗi: {e.reason}", "UPSTREAM_ERROR")
        except urllib.error.URLError as e:
            logger.error(f"SerpAPI connection error: {e}")
            self._send_json_error(502, "Không thể kết nối đến SerpAPI", "CONNECTION_ERROR")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in SerpAPI request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra định dạng JSON.", "INVALID_JSON")
        except Exception as e:
            logger.error(f"SerpAPI search error: {e}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(f"Exception args: {e.args}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")
    
    def _format_serpapi_summary(self, search_results):
        """Format SerpAPI search results into a readable summary"""
        summary_parts = []
        
        if search_results.get('answer'):
            summary_parts.append(f"Trả lời: {search_results['answer']}")
        
        if search_results.get('snippet'):
            summary_parts.append(f"Tóm tắt: {search_results['snippet']}")
        
        if search_results.get('title'):
            summary_parts.append(f"Tiêu đề: {search_results['title']}")
        
        # Add knowledge graph information
        knowledge_graph = search_results.get('knowledge_graph', {})
        if knowledge_graph.get('description'):
            summary_parts.append(f"Mô tả: {knowledge_graph['description']}")
        
        # Add organic results
        organic_results = search_results.get('organic_results', [])
        if organic_results:
            result_texts = []
            for result in organic_results[:3]:  # First 3 results
                if result.get('title') and result.get('snippet'):
                    result_texts.append(f"{result['title']}: {result['snippet'][:100]}...")
            if result_texts:
                summary_parts.append(f"Kết quả tìm kiếm:\n" + "\n".join(f"- {text}" for text in result_texts))
        
        total_results = search_results.get('total_results', 0)
        if total_results > 0:
            summary_parts.append(f"Tổng số kết quả: {total_results:,}")
        
        return '\n\n'.join(summary_parts) if summary_parts else "Không tìm thấy thông tin phù hợp."

    def handle_search_with_ai(self):
        """Handle search requests that combine SerpAPI results with Gemini AI processing"""
        try:
            # Get API keys for both Gemini and SerpAPI
            gemini_key = get_api_key('gemini')
            serpapi_key = get_api_key('serpapi')
            
            if not gemini_key or gemini_key == "your_gemini_api_key_here":
                self._send_json_error(500, 
                    "Gemini API key chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào environment variables.",
                    "API_KEY_MISSING")
                return
                
            if not serpapi_key or serpapi_key == "your_serpapi_api_key_here":
                self._send_json_error(500, 
                    "SerpAPI key chưa được cấu hình. Vui lòng thêm SERPAPI_API_KEY vào environment variables.",
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

            # Step 1: Search SerpAPI
            logger.info(f"Starting search for: {user_query}")
            serpapi_url = "https://serpapi.com/search.json"
            serpapi_params = {
                "q": user_query,
                "engine": "google",
                "api_key": serpapi_key,
                "num": 5,
                "hl": "vi",
                "gl": "vn"
            }
            
            url_params = urllib.parse.urlencode(serpapi_params)
            full_url = f"{serpapi_url}?{url_params}"
            
            serpapi_request = urllib.request.Request(full_url)
            with urllib.request.urlopen(serpapi_request, timeout=REQUEST_TIMEOUT) as response:
                serpapi_response = response.read().decode('utf-8')
                serpapi_data = json.loads(serpapi_response)

            # Format search results for AI processing
            search_context = self._format_search_context_for_ai(serpapi_data, user_query)
            
            # Step 2: Create enhanced prompt for Gemini
            enhanced_prompt = self._create_search_enhanced_prompt(user_query, search_context)
            
            # Support conversation history - check if provided
            conversation_history = request_data.get('conversation_history', [])
            
            # Step 3: Send to Gemini Flash 2.5
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            
            # Build contents array with conversation history + enhanced prompt
            contents = []
            if conversation_history:
                # Use conversation history if provided
                contents = conversation_history.copy()
                # Update the last message with enhanced prompt
                if contents:
                    contents[-1]["parts"][0]["text"] = enhanced_prompt
            else:
                # Fallback to old format for backward compatibility
                contents = [{
                    "parts": [{
                        "text": enhanced_prompt
                    }]
                }]
            
            gemini_payload = {
                "contents": contents,
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
                "search_results_count": len(serpapi_data.get('organic_results', [])),
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

    def handle_llm7_gpt5chat(self):
        """Handle GPT-5-chat requests via LLM7.io"""
        try:
            # Get API key from config
            api_key = get_api_key('llm7')
            logger.info(f"LLM7 API Key configured: {'Yes' if api_key else 'No'}")
            if not api_key:
                self._send_json_error(500, 
                    "LLM7 API key chưa được cấu hình. Vui lòng kiểm tra config.py",
                    "API_KEY_MISSING")
                return
            
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract message from request
            message = request_data.get('message', '')
            if not message:
                self._send_json_error(400, "Message không được để trống", "MISSING_MESSAGE")
                return
            
            # Build LLM7.io API URL for GPT-5-chat
            llm7_url = "https://api.llm7.io/v1/chat/completions"
            llm7_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            
            # Support conversation history - check if messages array is provided
            conversation_messages = request_data.get('messages', [])
            
            # Build messages array with system prompt and conversation history
            messages = [
                {"role": "system", "content": "Bạn là trợ lý AI thân thiện và vui tính. Hãy sử dụng emoji một cách tự nhiên trong câu trả lời để làm cho cuộc trò chuyện sinh động và thú vị hơn. Đừng lạm dụng emoji, chỉ dùng khi phù hợp với ngữ cảnh. 😊"}
            ]
            
            # Add conversation history if provided
            if conversation_messages:
                messages.extend(conversation_messages)
            else:
                # Fallback to old format for backward compatibility
                messages.append({"role": "user", "content": message})
            
            llm7_payload = {
                "model": "gpt-5-chat",
                "messages": messages,
                "temperature": 0.7
            }
            
            # Make request to LLM7.io
            llm7_request = urllib.request.Request(
                llm7_url,
                data=json.dumps(llm7_payload).encode('utf-8'),
                headers=llm7_headers
            )
            
            with urllib.request.urlopen(llm7_request, timeout=REQUEST_TIMEOUT) as response:
                llm7_response = response.read().decode('utf-8')
                llm7_data = json.loads(llm7_response)
            
            # Extract response
            reply = ""
            if "choices" in llm7_data and len(llm7_data["choices"]) > 0:
                reply = llm7_data["choices"][0]["message"]["content"]
            else:
                reply = str(llm7_data)
            
            # Return response to client
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "reply": reply,
                "model": "gpt-5-chat"
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info("LLM7 GPT-5-chat completed successfully")
            
        except urllib.error.HTTPError as e:
            try:
                error_body = e.read().decode('utf-8')
                self._send_json_error(e.code, f"LLM7 API lỗi: {error_body}", "UPSTREAM_ERROR")
            except:
                self._send_json_error(e.code, f"LLM7 API lỗi: {e.reason}", "UPSTREAM_ERROR")
        except urllib.error.URLError as e:
            logger.error(f"LLM7 connection error: {e}")
            self._send_json_error(502, "Không thể kết nối đến LLM7 API", "CONNECTION_ERROR")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in LLM7 request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra định dạng JSON.", "INVALID_JSON")
        except Exception as e:
            logger.error(f"LLM7 GPT-5-chat error: {e}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(f"Exception args: {e.args}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_llm7_gemini_search(self):
        """Handle Gemini-search requests via LLM7.io"""
        try:
            # Get API key from config
            api_key = get_api_key('llm7')
            logger.info(f"LLM7 API Key configured: {'Yes' if api_key else 'No'}")
            if not api_key:
                self._send_json_error(500, 
                    "LLM7 API key chưa được cấu hình. Vui lòng kiểm tra config.py",
                    "API_KEY_MISSING")
                return
            
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract message from request
            message = request_data.get('message', '')
            if not message:
                self._send_json_error(400, "Message không được để trống", "MISSING_MESSAGE")
                return
            
            # Build LLM7.io API URL for Gemini-search
            llm7_url = "https://api.llm7.io/v1/chat/completions"
            llm7_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            
            # Support conversation history - check if messages array is provided
            conversation_messages = request_data.get('messages', [])
            
            # Build messages array with system prompt and conversation history
            messages = [
                {"role": "system", "content": "Bạn là trợ lý AI tìm kiếm thông minh và thân thiện. Hãy sử dụng emoji một cách tự nhiên trong câu trả lời để làm cho thông tin dễ hiểu và thú vị hơn. Đừng lạm dụng emoji, chỉ dùng khi phù hợp với ngữ cảnh. 🔍"}
            ]
            
            # Add conversation history if provided
            if conversation_messages:
                messages.extend(conversation_messages)
            else:
                # Fallback to old format for backward compatibility
                messages.append({"role": "user", "content": message})
            
            llm7_payload = {
                "model": "gemini-search",
                "messages": messages,
                "temperature": 0.7
            }
            
            # Make request to LLM7.io
            llm7_request = urllib.request.Request(
                llm7_url,
                data=json.dumps(llm7_payload).encode('utf-8'),
                headers=llm7_headers
            )
            
            with urllib.request.urlopen(llm7_request, timeout=REQUEST_TIMEOUT) as response:
                llm7_response = response.read().decode('utf-8')
                llm7_data = json.loads(llm7_response)
            
            # Extract response
            reply = ""
            if "choices" in llm7_data and len(llm7_data["choices"]) > 0:
                reply = llm7_data["choices"][0]["message"]["content"]
            else:
                reply = str(llm7_data)
            
            # Return response to client
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "reply": reply,
                "model": "gemini-search"
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info("LLM7 Gemini-search completed successfully")
            
        except urllib.error.HTTPError as e:
            try:
                error_body = e.read().decode('utf-8')
                self._send_json_error(e.code, f"LLM7 API lỗi: {error_body}", "UPSTREAM_ERROR")
            except:
                self._send_json_error(e.code, f"LLM7 API lỗi: {e.reason}", "UPSTREAM_ERROR")
        except urllib.error.URLError as e:
            logger.error(f"LLM7 connection error: {e}")
            self._send_json_error(502, "Không thể kết nối đến LLM7 API", "CONNECTION_ERROR")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in LLM7 request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra định dạng JSON.", "INVALID_JSON")
        except Exception as e:
            logger.error(f"LLM7 Gemini-search error: {e}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(f"Exception args: {e.args}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_enhance_prompt(self):
        """Enhance prompt using Gemini AI to expand Vietnamese abbreviations and improve quality"""
        try:
            # Get Gemini API key
            gemini_key = get_api_key('gemini')
            if not gemini_key or gemini_key == "your_gemini_api_key_here":
                self._send_json_error(500, 
                    "Gemini API key chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào environment variables.",
                    "API_KEY_MISSING")
                return
            
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract user prompt
            user_prompt = request_data.get('prompt', '')
            if not user_prompt:
                self._send_json_error(400, "Prompt không được để trống", "MISSING_PROMPT")
                return
            
            # Create system prompt for Vietnamese abbreviation expansion and enhancement
            system_prompt = """Bạn là một AI chuyên xử lý tiếng Việt và mở rộng các từ viết tắt phổ biến ở Việt Nam.

Nhiệm vụ của bạn:
1. Nhận diện và mở rộng các viết tắt tiếng Việt phổ biến, ví dụ:
   - TP.HCM, TPHCM, SG → Thành phố Hồ Chí Minh (Ho Chi Minh City)
   - HN → Hà Nội (Hanoi)
   - ĐHQG → Đại học Quốc gia (National University)
   - ĐHBK → Đại học Bách Khoa (Polytechnic University)
   - ĐH → Đại học (University)
   - TT → Trung tâm (Center)
   - BV → Bệnh viện (Hospital)
   - CV → Công viên (Park)
   - TTTM → Trung tâm thương mại (Shopping Mall)
   - K, ko → không (no/not)
   - bn, b → bạn (you/friend)
   - vs, vc → với (with)
   - đc, dc → được (can/able)
   - t → tôi (I/me)
   - m → mày (you - informal)
   - trc → trước (before)
   - r → rồi (already)

2. Giữ nguyên các từ tiếng Anh hoặc các thuật ngữ chuyên môn
3. Cải thiện prompt để phù hợp với AI tạo ảnh (mô tả rõ ràng, chi tiết hơn)
4. Chỉ trả về prompt đã được cải thiện, KHÔNG thêm giải thích hay văn bản khác

Ví dụ:
Input: "Tạo ảnh TPHCM ban đêm đẹp"
Output: "Create an image of Ho Chi Minh City at night, beautiful cityscape with neon lights and skyscrapers"

Input: "Vẽ ĐHQG HN đẹp"
Output: "Draw a beautiful image of Vietnam National University Hanoi campus with modern buildings and green trees"

Input: "ảnh BV Chợ Rẫy"
Output: "Image of Cho Ray Hospital in Ho Chi Minh City, Vietnam, modern medical facility"

Hãy xử lý prompt sau:"""
            
            # Build Gemini API URL
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            
            # Prepare Gemini request
            gemini_payload = {
                "contents": [{
                    "parts": [{
                        "text": f"{system_prompt}\n\n{user_prompt}"
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.3,  # Lower temperature for more consistent expansion
                    "topK": 20,
                    "topP": 0.8,
                    "maxOutputTokens": 500,
                }
            }
            
            gemini_request = urllib.request.Request(
                gemini_url,
                data=json.dumps(gemini_payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(gemini_request, timeout=REQUEST_TIMEOUT) as response:
                gemini_response = response.read().decode('utf-8')
                gemini_data = json.loads(gemini_response)
            
            # Extract enhanced prompt
            enhanced_prompt = ""
            if "candidates" in gemini_data and len(gemini_data["candidates"]) > 0:
                candidate = gemini_data["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    enhanced_prompt = candidate["content"]["parts"][0].get("text", "")
            
            if not enhanced_prompt:
                enhanced_prompt = user_prompt  # Fallback to original
            
            # Return response to client
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "original_prompt": user_prompt,
                "enhanced_prompt": enhanced_prompt.strip(),
                "success": True
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info(f"Prompt enhanced: '{user_prompt}' -> '{enhanced_prompt.strip()}'")
            
        except urllib.error.HTTPError as e:
            try:
                error_body = e.read().decode('utf-8')
                self._send_json_error(e.code, f"Gemini API lỗi: {error_body}", "UPSTREAM_ERROR")
            except:
                self._send_json_error(e.code, f"Gemini API lỗi: {e.reason}", "UPSTREAM_ERROR")
        except urllib.error.URLError as e:
            logger.error(f"Gemini connection error: {e}")
            self._send_json_error(502, "Không thể kết nối đến Gemini API", "CONNECTION_ERROR")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in enhance prompt request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra định dạng JSON.", "INVALID_JSON")
        except Exception as e:
            logger.error(f"Enhance prompt error: {e}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(f"Exception args: {e.args}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_pollinations_generate(self):
        """Generate image using Pollinations AI - completely free, no API key needed"""
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract parameters
            prompt = request_data.get('prompt', '')
            width = request_data.get('width', 1920)
            height = request_data.get('height', 1080)
            
            if not prompt:
                self._send_json_error(400, "Prompt không được để trống", "MISSING_PROMPT")
                return
            
            # Build Pollinations AI URL
            # Using flux model for high quality
            pollinations_url = f"https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}"
            params = {
                'width': width,
                'height': height,
                'nologo': 'true',
                'enhance': 'true',
                'model': 'flux'
            }
            
            full_url = f"{pollinations_url}?{urllib.parse.urlencode(params)}"
            
            logger.info(f"Generating image with Pollinations AI: {prompt[:50]}...")
            
            # Fetch image from Pollinations API
            pollinations_request = urllib.request.Request(
                full_url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            )
            with urllib.request.urlopen(pollinations_request, timeout=60) as response:
                image_data = response.read()
            
            # Return image URL and status
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "success": True,
                "image_url": full_url,
                "prompt": prompt,
                "dimensions": f"{width}x{height}",
                "model": "flux"
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info(f"Image generated successfully: {width}x{height}")
            
        except urllib.error.HTTPError as e:
            try:
                error_body = e.read().decode('utf-8')
                self._send_json_error(e.code, f"Pollinations AI lỗi: {error_body}", "UPSTREAM_ERROR")
            except:
                self._send_json_error(e.code, f"Pollinations AI lỗi: {e.reason}", "UPSTREAM_ERROR")
        except urllib.error.URLError as e:
            logger.error(f"Pollinations connection error: {e}")
            self._send_json_error(502, "Không thể kết nối đến Pollinations AI", "CONNECTION_ERROR")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in Pollinations request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra định dạng JSON.", "INVALID_JSON")
        except Exception as e:
            logger.error(f"Pollinations generate error: {e}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(f"Exception args: {e.args}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_auth_signup(self):
        """Handle user signup"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            username = request_data.get('username', '').strip()
            password = request_data.get('password', '').strip()
            
            if not username or not password:
                self._send_json_error(400, "Username và password không được để trống", "MISSING_CREDENTIALS")
                return
            
            if '|' in username or '|' in password:
                self._send_json_error(400, "Username và password không được chứa ký tự '|'", "INVALID_CREDENTIALS")
                return
            
            if check_user_exists(username):
                self._send_json_error(400, "Username đã tồn tại", "USERNAME_EXISTS")
                return
            
            if save_user(username, password):
                session_id = create_session(username)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                
                response_json = json.dumps({
                    "success": True,
                    "session_id": session_id,
                    "username": username
                }, ensure_ascii=False)
                self.wfile.write(response_json.encode('utf-8'))
                
                logger.info(f"User registered successfully: {username}")
            else:
                self._send_json_error(500, "Lỗi khi lưu thông tin người dùng", "SAVE_ERROR")
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in signup request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ", "INVALID_JSON")
        except Exception as e:
            logger.error(f"Signup error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_auth_login(self):
        """Handle user login"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            username = request_data.get('username', '').strip()
            password = request_data.get('password', '').strip()
            
            if not username or not password:
                self._send_json_error(400, "Username và password không được để trống", "MISSING_CREDENTIALS")
                return
            
            if authenticate_user(username, password):
                session_id = create_session(username)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                
                response_json = json.dumps({
                    "success": True,
                    "session_id": session_id,
                    "username": username
                }, ensure_ascii=False)
                self.wfile.write(response_json.encode('utf-8'))
                
                logger.info(f"User logged in successfully: {username}")
            else:
                self._send_json_error(401, "Username hoặc password không đúng", "INVALID_CREDENTIALS")
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in login request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ", "INVALID_JSON")
        except Exception as e:
            logger.error(f"Login error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_auth_logout(self):
        """Handle user logout"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            session_id = request_data.get('session_id', '').strip()
            
            if not session_id:
                self._send_json_error(400, "Session ID không được để trống", "MISSING_SESSION_ID")
                return
            
            if delete_session(session_id):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                
                response_json = json.dumps({
                    "success": True,
                    "message": "Đăng xuất thành công"
                }, ensure_ascii=False)
                self.wfile.write(response_json.encode('utf-8'))
            else:
                self._send_json_error(400, "Session không hợp lệ hoặc đã hết hạn", "INVALID_SESSION")
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in logout request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ", "INVALID_JSON")
        except Exception as e:
            logger.error(f"Logout error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_auth_check_session(self):
        """Handle check session status"""
        try:
            session_id = None
            
            if 'Cookie' in self.headers:
                cookies = self.headers['Cookie']
                for cookie in cookies.split(';'):
                    if 'session_id=' in cookie:
                        session_id = cookie.split('session_id=')[1].strip()
                        break
            
            if not session_id and 'Authorization' in self.headers:
                auth_header = self.headers['Authorization']
                if auth_header.startswith('Bearer '):
                    session_id = auth_header[7:].strip()
            
            if 'session_id' in self.path:
                from urllib.parse import parse_qs, urlparse
                parsed = urlparse(self.path)
                query_params = parse_qs(parsed.query)
                if 'session_id' in query_params:
                    session_id = query_params['session_id'][0]
            
            if session_id:
                username = get_user_from_session(session_id)
                if username:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self._send_cors_headers()
                    self.end_headers()
                    
                    response_json = json.dumps({
                        "valid": True,
                        "username": username,
                        "session_id": session_id
                    }, ensure_ascii=False)
                    self.wfile.write(response_json.encode('utf-8'))
                    return
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "valid": False,
                "username": None
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
                
        except Exception as e:
            logger.error(f"Check session error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def _format_search_context_for_ai(self, serpapi_data, query):
        """Format SerpAPI data into context for AI processing"""
        context_parts = []
        
        # Add answer box if available
        answer_box = serpapi_data.get('answer_box', {})
        if answer_box.get('answer'):
            context_parts.append(f"Câu trả lời nhanh: {answer_box['answer']}")
        if answer_box.get('snippet'):
            context_parts.append(f"Thông tin tổng quan: {answer_box['snippet']}")
        if answer_box.get('title'):
            context_parts.append(f"Tiêu đề: {answer_box['title']}")
        
        # Add knowledge graph information
        knowledge_graph = serpapi_data.get('knowledge_graph', {})
        if knowledge_graph.get('description'):
            context_parts.append(f"Định nghĩa: {knowledge_graph['description']}")
        if knowledge_graph.get('title'):
            context_parts.append(f"Chủ đề chính: {knowledge_graph['title']}")
        
        # Add organic search results
        organic_results = serpapi_data.get('organic_results', [])
        if organic_results:
            result_info = []
            for result in organic_results[:5]:  # First 5 results
                if result.get('title') and result.get('snippet'):
                    result_info.append(f"{result['title']}: {result['snippet']}")
            if result_info:
                context_parts.append(f"Kết quả tìm kiếm từ Google:\n" + "\n".join(f"- {info}" for info in result_info))
        
        # Add search information
        search_info = serpapi_data.get('search_information', {})
        if search_info.get('total_results'):
            context_parts.append(f"Tổng số kết quả tìm thấy: {search_info['total_results']:,}")
        
        return "\n\n".join(context_parts) if context_parts else "Không tìm thấy thông tin từ nguồn tìm kiếm."

    def _create_search_enhanced_prompt(self, user_query, search_context):
        """Create an enhanced prompt for Gemini that includes search context"""
        prompt = f"""Bạn là NexoraX 2, một AI assistant được tích hợp với khả năng tìm kiếm thông tin thời gian thực qua Google Search. Hãy trả lời câu hỏi của người dùng dựa trên thông tin tìm kiếm được cung cấp và kiến thức của bạn.

Câu hỏi của người dùng: {user_query}

Thông tin tìm kiếm từ Google (qua SerpAPI):
{search_context}

Hướng dẫn trả lời:
1. Sử dụng thông tin tìm kiếm để đưa ra câu trả lời chính xác và cập nhật
2. Nếu thông tin tìm kiếm không đủ, hãy bổ sung từ kiến thức của bạn
3. Trả lời bằng tiếng Việt một cách tự nhiên và dễ hiểu
4. Nếu có nguồn thông tin, hãy đề cập đến nguồn đó
5. Nếu thông tin không rõ ràng hoặc mâu thuẫn, hãy nói rõ điều đó
6. Sử dụng emoji một cách tự nhiên trong câu trả lời để làm cho thông tin sinh động và thú vị hơn (không lạm dụng)

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
        
        # Handle check-session endpoint
        if self.path.startswith('/api/auth/check-session'):
            self.handle_auth_check_session()
            return
        
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
    
    # Load existing sessions from file
    logger.info("Loading existing sessions...")
    sessions.update(load_sessions())
    logger.info(f"Loaded {len(sessions)} active session(s)")
    
    run_server(port)