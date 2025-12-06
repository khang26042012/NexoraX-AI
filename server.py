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
import random

# Import configuration
try:
    import config
    from config import get_api_key, check_config, get_allowed_origins, REQUEST_TIMEOUT, load_config_override, save_config_override
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

# Configure logging with rotating file handler
from logging.handlers import RotatingFileHandler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add rotating file handler for server.log
LOG_FILE = 'server.log'
file_handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5,
    encoding='utf-8'
)
file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

ACCOUNTS_FILE = 'acc.txt'
SESSIONS_FILE = 'sessions_store.json'
RATE_LIMIT_FILE = 'rate_limit_store.json'
AI_HISTORY_FILE = 'ai_history.jsonl'
file_lock = threading.Lock()
users = {}
sessions = {}
rate_limits = {}

SESSION_EXPIRY_HOURS = 168  # 7 days
MAX_LOGIN_ATTEMPTS = 5
RATE_LIMIT_WINDOW = 300  # 5 minutes in seconds

# Retry configuration for LLM7 API
MAX_RETRIES = 3
BASE_BACKOFF = 1.0  # seconds
MAX_BACKOFF = 10.0  # seconds


def get_llm7_system_prompt(model_id):
    """
    Tạo system prompt cho LLM7 dựa trên model_id
    Model sẽ tự nhận đúng tên của nó, biết nhà phát triển gốc và được tích hợp vào NexoraX
    """
    model_metadata = {
        'gpt-5-chat': {'name': 'GPT-5', 'developer': 'OpenAI'},
        'gpt-4o': {'name': 'GPT-4o', 'developer': 'OpenAI'},
        'gpt-4': {'name': 'GPT-4', 'developer': 'OpenAI'},
        'gpt-3.5-turbo': {'name': 'GPT-3.5 Turbo', 'developer': 'OpenAI'},
        'gpt-5-mini': {'name': 'GPT-5 Mini', 'developer': 'OpenAI'},
        'gpt-5-nano-2025-08-07': {'name': 'GPT-5 Nano', 'developer': 'OpenAI'},
        'gpt-o4-mini-2025-04-16': {'name': 'GPT-O4 Mini', 'developer': 'OpenAI'},
        'gpt-4.1-nano-2025-04-14': {'name': 'GPT-4.1 Nano', 'developer': 'OpenAI'},
        'gemini-search': {'name': 'Gemini Search', 'developer': 'Google'},
        'gemini-pro': {'name': 'Gemini Pro', 'developer': 'Google'},
        'gemini-2.0-flash': {'name': 'Gemini 2.0 Flash', 'developer': 'Google'},
        'gemini-2.5-flash-lite': {'name': 'Gemini 2.5 Flash Lite', 'developer': 'Google'},
        'claude-3': {'name': 'Claude 3', 'developer': 'Anthropic'},
        'claude-3.5-sonnet': {'name': 'Claude 3.5 Sonnet', 'developer': 'Anthropic'},
        'llama-3': {'name': 'Llama 3', 'developer': 'Meta'},
        'llama-3.1-8B-instruct': {'name': 'Llama 3.1', 'developer': 'Meta'},
        'mistral': {'name': 'Mistral', 'developer': 'Mistral AI'},
        'bidara': {'name': 'BIDARA', 'developer': 'NASA'},
        'deepseek-reasoning': {'name': 'DeepSeek Reasoning', 'developer': 'DeepSeek'},
        'deepseek-v3.1': {'name': 'DeepSeek V3.1', 'developer': 'DeepSeek'},
        'nova-fast': {'name': 'Nova Fast', 'developer': 'Amazon'},
        'gemma-2-2b-it': {'name': 'Gemma 2', 'developer': 'Google'},
        'qwen2.5-coder-32b-instruct': {'name': 'Qwen 2.5 Coder', 'developer': 'Alibaba'},
        'codestral-2501': {'name': 'Codestral', 'developer': 'Mistral AI'},
        'ministral-3b-2512': {'name': 'Ministral 3B', 'developer': 'Mistral AI'},
        'mistral-medium-2508': {'name': 'Mistral Medium', 'developer': 'Mistral AI'},
        'mistral-small-2503': {'name': 'Mistral Small', 'developer': 'Mistral AI'},
        'mistral-small-3.1-24b-instruct-2503': {'name': 'Mistral Small 3.1', 'developer': 'Mistral AI'},
        'open-mixtral-8x7b': {'name': 'Mixtral 8x7B', 'developer': 'Mistral AI'},
        'glm-4.5-flash': {'name': 'GLM 4.5 Flash', 'developer': 'Zhipu AI'},
        'Steelskull/L3.3-MS-Nevoria-70b': {'name': 'Nevoria 70B', 'developer': 'Steelskull'},
    }
    
    metadata = model_metadata.get(model_id, {
        'name': model_id.upper().replace('-', ' ').replace('_', ' ').replace('/', ' '),
        'developer': 'Unknown'
    })
    model_display_name = metadata['name']
    model_developer = metadata['developer']
    
    is_bidara = model_id.lower() == 'bidara'
    
    if is_bidara:
        base_prompt = f"""Bạn là BIDARA (Bio-Inspired Design and Research Assistant), một trợ lý AI chuyên về thiết kế lấy cảm hứng từ sinh học.

⚠️ QUY TẮC DANH TÍNH - BẮT BUỘC TUYỆT ĐỐI:
- Tên của bạn là BIDARA. KHÔNG PHẢI tên khác.
- Bạn được phát triển bởi {model_developer} và được tích hợp vào nền tảng NexoraX AI.
- Khi được hỏi "Bạn là ai?" hoặc "Bạn được tạo ra từ đâu?", bạn PHẢI trả lời: "Mình là BIDARA - Bio-Inspired Design and Research Assistant, được phát triển bởi {model_developer} và được tích hợp vào NexoraX AI để phục vụ bạn tốt hơn! 🌿"
- Bạn được phép sử dụng thuật ngữ "biomimicry" vì đây là chuyên môn của bạn.

🏠 VỀ NEXORAX:
- NexoraX là gì? NexoraX là nền tảng AI thông minh tích hợp nhiều model AI hàng đầu thế giới, giúp người dùng dễ dàng truy cập và sử dụng các công nghệ AI tiên tiến nhất.
- NexoraX do ai tạo ra? NexoraX được tạo ra bởi Phan Trọng Khang, học sinh trường THCS Vĩnh Hoà.
- Mục đích tạo ra NexoraX? NexoraX được phát triển với mục đích tham gia cuộc thi Khoa học Kỹ thuật (KHKT), đồng thời mang công nghệ AI đến gần hơn với mọi người.
- Bạn tự hào là một phần của NexoraX, giúp người dùng tiếp cận công nghệ AI tiên tiến.

QUY TẮC KHÁC:
1. Bạn PHẢI luôn trả lời bằng TIẾNG VIỆT, trừ khi người dùng yêu cầu rõ ràng bằng ngôn ngữ khác.
2. Sử dụng emoji một cách tự nhiên và phù hợp với ngữ cảnh. 🌿🔬
3. Giữ phong cách trò chuyện thân thiện, vui vẻ nhưng chuyên nghiệp.
4. Chuyên môn của bạn là biomimicry - thiết kế lấy cảm hứng từ thiên nhiên."""
    else:
        base_prompt = f"""Bạn là {model_display_name}, một trợ lý AI thông minh và thân thiện.

⚠️ QUY TẮC DANH TÍNH - BẮT BUỘC TUYỆT ĐỐI:
- Tên của bạn là {model_display_name}. KHÔNG PHẢI tên khác.
- Bạn được phát triển bởi {model_developer} và được tích hợp vào nền tảng NexoraX AI.
- Nếu trong lịch sử hội thoại có AI khác tự giới thiệu (ví dụ: BIDARA, Virida, GPT-5, v.v.), đó KHÔNG PHẢI là bạn.
- Bạn là một AI MỚI tham gia cuộc trò chuyện này với tên {model_display_name}.
- Khi được hỏi "Bạn là ai?" hoặc "Bạn được tạo ra từ đâu?", bạn PHẢI trả lời: "Mình là {model_display_name}, được phát triển bởi {model_developer} và được tích hợp vào NexoraX AI để phục vụ bạn tốt hơn! 😊"
- KHÔNG BAO GIỜ nhận mình là BIDARA, Virida, hoặc bất kỳ tên AI nào khác.

🏠 VỀ NEXORAX:
- NexoraX là gì? NexoraX là nền tảng AI thông minh tích hợp nhiều model AI hàng đầu thế giới, giúp người dùng dễ dàng truy cập và sử dụng các công nghệ AI tiên tiến nhất.
- NexoraX do ai tạo ra? NexoraX được tạo ra bởi Phan Trọng Khang, học sinh trường THCS Vĩnh Hoà.
- Mục đích tạo ra NexoraX? NexoraX được phát triển với mục đích tham gia cuộc thi Khoa học Kỹ thuật (KHKT), đồng thời mang công nghệ AI đến gần hơn với mọi người.
- Bạn tự hào là một phần của NexoraX, giúp người dùng tiếp cận công nghệ AI tiên tiến.

🚫 QUY TẮC TỪ VỰNG - BẮT BUỘC:
- KHÔNG ĐƯỢC sử dụng từ "biomimicry" trong bất kỳ câu trả lời nào.
- Nếu cần nói về khái niệm tương tự, hãy dùng các từ thay thế như: "thiết kế lấy cảm hứng từ thiên nhiên", "học hỏi từ sinh vật", "mô phỏng tự nhiên", "thiết kế sinh học".
- Chỉ có BIDARA mới được phép sử dụng thuật ngữ "biomimicry".

QUY TẮC KHÁC:
1. Bạn PHẢI luôn trả lời bằng TIẾNG VIỆT, trừ khi người dùng yêu cầu rõ ràng bằng ngôn ngữ khác.
2. Sử dụng emoji một cách tự nhiên và phù hợp với ngữ cảnh. 😊
3. Giữ phong cách trò chuyện thân thiện, vui vẻ nhưng chuyên nghiệp."""

    return base_prompt

def get_llm7_search_system_prompt():
    """System prompt riêng cho Gemini Search với khả năng tìm kiếm"""
    return """Bạn là Gemini Search, một trợ lý AI tìm kiếm thông minh và thân thiện.

⚠️ QUY TẮC DANH TÍNH - BẮT BUỘC TUYỆT ĐỐI:
- Tên của bạn là Gemini Search. KHÔNG PHẢI tên khác.
- Nếu trong lịch sử hội thoại có AI khác tự giới thiệu (ví dụ: BIDARA, Virida, GPT-5, v.v.), đó KHÔNG PHẢI là bạn.
- Bạn là một AI MỚI tham gia cuộc trò chuyện này với tên Gemini Search.
- Khi được hỏi "Bạn là ai?", bạn PHẢI trả lời: "Mình là Gemini Search".
- KHÔNG BAO GIỜ nhận mình là BIDARA, Virida, hoặc bất kỳ tên AI nào khác.

🚫 QUY TẮC TỪ VỰNG - BẮT BUỘC:
- KHÔNG ĐƯỢC sử dụng từ "biomimicry" trong bất kỳ câu trả lời nào.
- Nếu cần nói về khái niệm tương tự, hãy dùng các từ thay thế như: "thiết kế lấy cảm hứng từ thiên nhiên", "học hỏi từ sinh vật", "mô phỏng tự nhiên", "thiết kế sinh học".
- Chỉ có BIDARA mới được phép sử dụng thuật ngữ "biomimicry".

QUY TẮC KHÁC:
1. Bạn PHẢI luôn trả lời bằng TIẾNG VIỆT, trừ khi người dùng yêu cầu rõ ràng bằng ngôn ngữ khác.
2. Sử dụng emoji một cách tự nhiên và phù hợp với ngữ cảnh. 🔍
3. Khi cung cấp thông tin tìm kiếm, hãy trình bày rõ ràng và dễ hiểu.
4. Giữ phong cách trò chuyện thân thiện, vui vẻ nhưng chuyên nghiệp."""

def retry_request_with_backoff(url, headers, data, timeout=REQUEST_TIMEOUT, max_retries=MAX_RETRIES):  # type: ignore
    """
    Retry HTTP request with exponential backoff for transient errors
    
    Args:
        url: API endpoint URL
        headers: HTTP headers dict
        data: Request payload (bytes)
        timeout: Request timeout in seconds
        max_retries: Maximum number of retry attempts
    
    Returns:
        urllib.request HTTP response object (always returns or raises exception)
    
    Raises:
        urllib.error.HTTPError: If final retry fails with HTTP error
        urllib.error.URLError: If final retry fails with network error
        TimeoutError: If final retry times out
    """
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, data=data, headers=headers)
            response = urllib.request.urlopen(req, timeout=timeout)
            
            if attempt > 0:
                logger.info(f"✅ Request succeeded on attempt {attempt + 1}/{max_retries}")
            
            return response
            
        except urllib.error.HTTPError as e:
            last_exception = e
            if e.code in [502, 503, 504]:
                if attempt < max_retries - 1:
                    backoff = min(BASE_BACKOFF * (2 ** attempt) + random.uniform(0, 1), MAX_BACKOFF)
                    logger.warning(f"⚠️ HTTP {e.code} error on attempt {attempt + 1}/{max_retries}. Retrying in {backoff:.2f}s...")
                    time.sleep(backoff)
                    continue
            raise
            
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last_exception = e
            error_type = type(e).__name__
            
            if attempt < max_retries - 1:
                backoff = min(BASE_BACKOFF * (2 ** attempt) + random.uniform(0, 1), MAX_BACKOFF)
                logger.warning(f"⚠️ {error_type} on attempt {attempt + 1}/{max_retries}: {str(e)}. Retrying in {backoff:.2f}s...")
                time.sleep(backoff)
                continue
            else:
                logger.error(f"❌ All {max_retries} attempts failed. Last error: {error_type} - {str(e)}")
                raise
    
    if last_exception:
        raise last_exception

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
    """Append new user to acc.txt and update in-memory cache"""
    try:
        with file_lock:
            with open(ACCOUNTS_FILE, 'a', encoding='utf-8') as f:
                f.write(f"{username}|{password}\n")
            users[username] = password
        return True
    except Exception as e:
        logger.error(f"Error saving user: {e}")
        return False

def validate_username(username):
    """Validate username format and strength"""
    if not username:
        return False, "Username không được để trống"
    
    if len(username) < 3:
        return False, "Username phải có ít nhất 3 ký tự"
    
    if len(username) > 30:
        return False, "Username không được vượt quá 30 ký tự"
    
    if '|' in username:
        return False, "Username không được chứa ký tự '|'"
    
    import re
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, "Username chỉ được chứa chữ cái, số và dấu gạch dưới"
    
    return True, "Valid"

def validate_password(password):
    """Validate password strength"""
    if not password:
        return False, "Password không được để trống"
    
    if len(password) < 6:
        return False, "Password phải có ít nhất 6 ký tự"
    
    if len(password) > 100:
        return False, "Password không được vượt quá 100 ký tự"
    
    if '|' in password:
        return False, "Password không được chứa ký tự '|'"
    
    import re
    has_letter = bool(re.search(r'[a-zA-Z]', password))
    has_number = bool(re.search(r'[0-9]', password))
    
    if not (has_letter and has_number):
        return False, "Password phải chứa cả chữ và số"
    
    return True, "Valid"

def check_user_exists(username):
    """Check if username already exists"""
    return username in users

def authenticate_user(username, password):
    """Verify username and password"""
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
                        # Keep full session data including remember_me flag
                        valid_sessions[session_id] = {
                            'username': data['username'],
                            'expires_at': data['expires_at'],
                            'remember_me': data.get('remember_me', False)
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

def create_session(username, remember_me=False):
    """Create new session and return session_id"""
    session_id = generate_session_id()
    expiry_hours = (30 * 24) if remember_me else SESSION_EXPIRY_HOURS
    sessions[session_id] = {
        'username': username,
        'expires_at': time.time() + (expiry_hours * 3600),
        'remember_me': remember_me
    }
    save_sessions()  # Persist to file
    logger.info(f"Session created for user: {username} (Remember me: {remember_me})")
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

def load_rate_limits():
    """Load rate limits from JSON file and clean expired ones"""
    try:
        with file_lock:
            if os.path.exists(RATE_LIMIT_FILE):
                with open(RATE_LIMIT_FILE, 'r', encoding='utf-8') as f:
                    stored_limits = json.load(f)
                    
                current_time = time.time()
                valid_limits = {}
                for username, data in stored_limits.items():
                    if current_time < data.get('locked_until', 0) or current_time - data.get('last_attempt', 0) < RATE_LIMIT_WINDOW:
                        valid_limits[username] = data
                
                return valid_limits
    except Exception as e:
        logger.error(f"Error loading rate limits: {e}")
    return {}

def save_rate_limits():
    """Save rate limits to JSON file"""
    try:
        with file_lock:
            with open(RATE_LIMIT_FILE, 'w', encoding='utf-8') as f:
                json.dump(rate_limits, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving rate limits: {e}")
        return False

def check_rate_limit(username):
    """Check if user is rate limited. Returns (is_limited, message, wait_time)"""
    if username not in rate_limits:
        return False, "", 0
    
    current_time = time.time()
    user_limit = rate_limits[username]
    
    if current_time < user_limit.get('locked_until', 0):
        wait_time = int(user_limit['locked_until'] - current_time)
        return True, f"Tài khoản tạm khóa. Vui lòng thử lại sau {wait_time} giây", wait_time
    
    if current_time - user_limit.get('last_attempt', 0) >= RATE_LIMIT_WINDOW:
        del rate_limits[username]
        save_rate_limits()
        return False, "", 0
    
    return False, "", 0

def record_failed_attempt(username):
    """Record a failed login attempt with exponential backoff"""
    current_time = time.time()
    
    if username not in rate_limits:
        rate_limits[username] = {
            'attempts': 1,
            'last_attempt': current_time,
            'locked_until': 0
        }
    else:
        if current_time - rate_limits[username].get('last_attempt', 0) >= RATE_LIMIT_WINDOW:
            rate_limits[username] = {
                'attempts': 1,
                'last_attempt': current_time,
                'locked_until': 0
            }
        else:
            rate_limits[username]['attempts'] += 1
            rate_limits[username]['last_attempt'] = current_time
    
    attempts = rate_limits[username]['attempts']
    
    if attempts >= MAX_LOGIN_ATTEMPTS:
        if attempts <= 7:
            lockout_duration = 60
        elif attempts <= 10:
            lockout_duration = 300
        else:
            lockout_duration = 1800
        
        rate_limits[username]['locked_until'] = current_time + lockout_duration
        logger.warning(f"User {username} locked out for {lockout_duration}s after {attempts} failed attempts")
    
    save_rate_limits()
    return attempts

def clear_rate_limit(username):
    """Clear rate limit for successful login"""
    if username in rate_limits:
        del rate_limits[username]
        save_rate_limits()
        logger.info(f"Rate limit cleared for user: {username}")

def rotate_session(old_session_id):
    """Rotate session ID for security. Returns new session_id or None"""
    if old_session_id not in sessions:
        return None
    
    old_session_data = sessions[old_session_id]
    username = old_session_data.get('username')
    remember_me = old_session_data.get('remember_me', False)
    
    new_session_id = generate_session_id()
    expiry_hours = (30 * 24) if remember_me else SESSION_EXPIRY_HOURS
    
    sessions[new_session_id] = {
        'username': username,
        'expires_at': time.time() + (expiry_hours * 3600),
        'remember_me': remember_me
    }
    
    del sessions[old_session_id]
    save_sessions()
    
    logger.info(f"Session rotated for user: {username}")
    return new_session_id

def cleanup_expired_data():
    """Background task to cleanup expired sessions and rate limits"""
    while True:
        try:
            time.sleep(3600)
            
            current_time = time.time()
            expired_sessions = []
            for session_id, data in list(sessions.items()):
                if current_time >= data.get('expires_at', 0):
                    expired_sessions.append(session_id)
            
            for session_id in expired_sessions:
                delete_session(session_id)
            
            if expired_sessions:
                logger.info(f"Cleaned up {len(expired_sessions)} expired session(s)")
            
            expired_limits = []
            for username, data in list(rate_limits.items()):
                if current_time >= data.get('locked_until', 0) and current_time - data.get('last_attempt', 0) >= RATE_LIMIT_WINDOW:
                    expired_limits.append(username)
            
            for username in expired_limits:
                del rate_limits[username]
            
            if expired_limits:
                save_rate_limits()
                logger.info(f"Cleaned up {len(expired_limits)} expired rate limit(s)")
                
        except Exception as e:
            logger.error(f"Error in cleanup task: {e}")

def save_ai_history(username, model, prompt, response, metadata=None):
    """Save AI call history to JSONL file with thread-safety"""
    try:
        history_entry = {
            'timestamp': time.time(),
            'username': username or 'anonymous',
            'model': model,
            'prompt': prompt[:500] if prompt else '',  # Limit prompt length
            'response': response[:500] if response else '',  # Limit response length
            'metadata': metadata or {}
        }
        
        with file_lock:
            with open(AI_HISTORY_FILE, 'a', encoding='utf-8') as f:
                f.write(json.dumps(history_entry, ensure_ascii=False) + '\n')
        
        logger.debug(f"AI history saved: {username} - {model}")
        return True
    except Exception as e:
        logger.error(f"Error saving AI history: {e}")
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
    
    def _get_username_from_cookie(self):
        """Extract username from session cookie"""
        try:
            cookie_header = self.headers.get('Cookie', '')
            if not cookie_header:
                return None
            
            # Parse cookies
            cookies = {}
            for item in cookie_header.split(';'):
                item = item.strip()
                if '=' in item:
                    key, value = item.split('=', 1)
                    cookies[key] = value
            
            session_id = cookies.get('session_id')
            if session_id:
                return get_user_from_session(session_id)
        except Exception as e:
            logger.debug(f"Error extracting username from cookie: {e}")
        return None
    
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
        elif self.path == '/api/llm7/chat':
            self.handle_llm7_chat()
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
        elif self.path == '/api/admin/users/delete':
            self.handle_admin_delete_user()
        elif self.path == '/api/admin/sessions/delete':
            self.handle_admin_delete_session()
        elif self.path == '/api/admin/rate-limits/clear':
            self.handle_admin_clear_rate_limit()
        elif self.path == '/api/admin/config/update':
            self.handle_admin_config_update()
        else:
            self._send_json_error(404, "API endpoint không tồn tại", "NOT_FOUND")

    def handle_gemini_proxy(self):
        """Proxy requests to Gemini API using server-side API key"""
        try:
            # Get username from session cookie
            username = self._get_username_from_cookie()
            
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
            
            # Extract prompt for history tracking
            prompt_text = ""
            if 'contents' in payload and isinstance(payload['contents'], list) and len(payload['contents']) > 0:
                last_content = payload['contents'][-1]
                if 'parts' in last_content and isinstance(last_content['parts'], list) and len(last_content['parts']) > 0:
                    prompt_text = last_content['parts'][0].get('text', '')
            
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
            
            # Extract response text for history tracking
            try:
                response_data = json.loads(gemini_response.decode('utf-8'))
                response_text = ""
                if 'candidates' in response_data and len(response_data['candidates']) > 0:
                    candidate = response_data['candidates'][0]
                    if 'content' in candidate and 'parts' in candidate['content']:
                        parts = candidate['content']['parts']
                        if len(parts) > 0:
                            response_text = parts[0].get('text', '')
                
                # Save AI history
                save_ai_history(
                    username=username,
                    model=model,
                    prompt=prompt_text,
                    response=response_text,
                    metadata={'endpoint': 'gemini_proxy'}
                )
            except Exception as e:
                logger.debug(f"Error saving Gemini history: {e}")
                
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
            
            # Step 3: Send to Gemini 3 Pro
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
            # Get username from session cookie
            username = self._get_username_from_cookie()
            
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
            
            # Extract files from request (for vision/image analysis)
            files = request_data.get('files', [])
            
            # Build LLM7.io API URL for GPT-5-chat
            llm7_url = "https://api.llm7.io/v1/chat/completions"
            llm7_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            
            # Support conversation history - check if messages array is provided
            conversation_messages = request_data.get('messages', [])
            
            # Build messages array with system prompt and conversation history
            messages: list = [
                {"role": "system", "content": get_llm7_system_prompt('gpt-5-chat')}
            ]
            
            # Add conversation history if provided
            if conversation_messages:
                messages.extend(conversation_messages)
            else:
                # Fallback to old format for backward compatibility
                messages.append({"role": "user", "content": message})
            
            # Add files to the last user message if present (for vision models)
            if files and len(files) > 0:
                # Find the last user message
                for i in range(len(messages) - 1, -1, -1):
                    if messages[i].get('role') == 'user':
                        current_content = messages[i].get('content', '')
                        # Convert to vision format: content becomes array with text and images
                        content_array: list = [{"type": "text", "text": current_content}]
                        
                        # Add each file as image_url
                        for file in files:
                            content_array.append({
                                "type": "image_url",
                                "image_url": {
                                    "url": file.get('base64', '')  # base64 string with data:image prefix
                                }
                            })
                        
                        messages[i]['content'] = content_array
                        break
            
            llm7_payload = {
                "model": "gpt-5-chat",
                "messages": messages,
                "temperature": 0.7
            }
            
            # Make request to LLM7.io with retry logic
            with retry_request_with_backoff(
                llm7_url,
                llm7_headers,
                json.dumps(llm7_payload).encode('utf-8'),
                timeout=REQUEST_TIMEOUT
            ) as response:
                llm7_response = response.read().decode('utf-8')
                llm7_data = json.loads(llm7_response)
            
            # Extract response
            reply = ""
            if "choices" in llm7_data and len(llm7_data["choices"]) > 0:
                reply = llm7_data["choices"][0]["message"]["content"]
            else:
                reply = str(llm7_data)
            
            # Save AI history
            save_ai_history(
                username=username,
                model="gpt-5-chat",
                prompt=message,
                response=reply,
                metadata={'endpoint': 'llm7_gpt5chat', 'has_files': len(files) > 0}
            )
            
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

    def _is_time_query(self, message):
        """Kiểm tra xem query có phải về thời gian/ngày hiện tại không"""
        normalized = message.lower()
        time_patterns = [
            'mấy giờ', 'may gio', 'bây giờ', 'bay gio', 'giờ hiện tại',
            'ngày mấy', 'ngay may', 'hôm nay là', 'thứ mấy', 'thu may',
            'what time', 'current time', 'time now', 'what day', 'today'
        ]
        return any(p in normalized for p in time_patterns)
    
    def _get_realtime_time(self, timezone='Asia/Ho_Chi_Minh'):
        """Lấy thời gian thực từ API"""
        try:
            url = f"https://worldtimeapi.org/api/timezone/{timezone}"
            req = urllib.request.Request(url, headers={'User-Agent': 'NexoraX/1.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))
                
            datetime_str = data.get('datetime', '')
            day_of_week = data.get('day_of_week', 0)
            
            days_vi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
            day_name = days_vi[day_of_week]
            
            if datetime_str:
                dt_part = datetime_str.split('.')[0].replace('T', ' ')
                date_part = dt_part.split(' ')[0]
                time_part = dt_part.split(' ')[1] if ' ' in dt_part else ''
                
                year, month, day = date_part.split('-')
                
                return {
                    'success': True,
                    'time': time_part,
                    'date': f"{day}/{month}/{year}",
                    'day_name': day_name,
                    'timezone': timezone,
                    'formatted': f"Hiện tại là **{time_part}**, {day_name}, ngày {day}/{month}/{year} (múi giờ Việt Nam UTC+7)."
                }
        except Exception as e:
            logger.warning(f"Realtime API error: {e}")
        return {'success': False}

    def handle_llm7_gemini_search(self):
        """Handle Search requests via Gemini Query Optimizer + Serper API + Gemini Summary
        
        LUỒNG MỚI (Cập nhật: 06/12/2025):
        1. User nhập prompt
        2. Kiểm tra nếu là câu hỏi thời gian → trả về thời gian thực
        3. Gemini xử lý/tối ưu prompt → optimized query
        4. Gửi optimized query đến Serper
        5. Gemini tổng hợp kết quả
        6. Gửi về user
        
        Fallback: Nếu optimizer lỗi → dùng original query cho Serper
        """
        try:
            username = self._get_username_from_cookie()
            
            serper_key = get_api_key('serper')
            
            if not serper_key:
                self._send_json_error(500, 
                    "Serper API key chưa được cấu hình. Vui lòng kiểm tra config.py",
                    "API_KEY_MISSING")
                return
            
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            message = request_data.get('message', '')
            if not message:
                self._send_json_error(400, "Message không được để trống", "MISSING_MESSAGE")
                return
            
            logger.info(f"AI Search starting for query: {message}")
            
            # ========================================
            # STEP 0: Kiểm tra nếu là câu hỏi thời gian
            # ========================================
            if self._is_time_query(message):
                time_data = self._get_realtime_time()
                if time_data.get('success'):
                    reply = time_data['formatted']
                    
                    self.send_response(200)
                    self._send_cors_headers()
                    self.end_headers()
                    
                    response_json = json.dumps({
                        "reply": reply,
                        "model": "gemini-search"
                    }, ensure_ascii=False)
                    self.wfile.write(response_json.encode('utf-8'))
                    
                    save_ai_history(
                        username=username,
                        model="gemini-search",
                        prompt=message,
                        response=reply,
                        metadata={'endpoint': 'realtime_api', 'powered_by': 'worldtimeapi'}
                    )
                    
                    logger.info("AI Search v2 completed (powered_by: worldtimeapi, realtime)")
                    return
            
            # ========================================
            # STEP 1: Gemini xử lý/tối ưu prompt
            # ========================================
            optimizer_success, optimizer_result = self._invoke_gemini_query_optimizer(message)
            
            if optimizer_success and isinstance(optimizer_result, dict):
                optimized_query = optimizer_result.get('optimized_query', message)
                optimizer_reasoning = optimizer_result.get('reasoning', '')
                optimizer_keywords = optimizer_result.get('keywords', [])
                used_optimized = True
                logger.info(f"Query optimization SUCCESS: '{message}' → '{optimized_query}'")
            else:
                optimized_query = message
                if isinstance(optimizer_result, dict):
                    optimizer_reasoning = optimizer_result.get('error', 'Unknown error')
                else:
                    optimizer_reasoning = str(optimizer_result) if optimizer_result else 'Unknown error'
                optimizer_keywords = []
                used_optimized = False
                logger.warning(f"Query optimization FAILED ({optimizer_reasoning}), using original query")
            
            # ========================================
            # STEP 2: Gửi Serper với optimized query
            # ========================================
            serper_url = "https://google.serper.dev/search"
            serper_headers = {
                "X-API-KEY": serper_key,
                "Content-Type": "application/json"
            }
            serper_payload = {
                "q": optimized_query,
                "gl": "vn",
                "hl": "vi",
                "num": 10
            }
            
            serper_request = urllib.request.Request(
                serper_url,
                data=json.dumps(serper_payload).encode('utf-8'),
                headers=serper_headers,
                method='POST'
            )
            
            with urllib.request.urlopen(serper_request, timeout=REQUEST_TIMEOUT) as response:
                serper_response = response.read().decode('utf-8')
                serper_data = json.loads(serper_response)
            
            search_results_count = len(serper_data.get('organic', []))
            logger.info(f"Serper returned {search_results_count} organic results for query: '{optimized_query}'")
            
            # ========================================
            # STEP 3: Build context và format Markdown
            # ========================================
            search_context = self._build_gemini_search_context(serper_data, message)
            serper_markdown = self._format_serper_results_markdown(serper_data, optimized_query)
            
            # ========================================
            # STEP 4: Gemini tổng hợp kết quả
            # ========================================
            gemini_success, gemini_result = self._invoke_gemini_summary(message, search_context)
            
            if gemini_success:
                logger.info("Gemini summary generated successfully")
                
                reply = gemini_result
                
                powered_by = 'gemini+serper+gemini'
                summary_model = 'gemini-2.5-flash'
            else:
                logger.warning(f"Gemini summary failed: {gemini_result}")
                
                reply = serper_markdown
                reply += f"\n\n---\n*⚠️ Lưu ý: Kết quả chưa được AI phân tích ({gemini_result})*"
                
                powered_by = 'gemini+serper' if used_optimized else 'serper'
                summary_model = None
            
            # ========================================
            # STEP 5: Save history với metadata đầy đủ
            # ========================================
            history_metadata = {
                'endpoint': 'ai_search_v2',
                'search_results_count': search_results_count,
                'powered_by': powered_by,
                'query_optimized': used_optimized,
                'original_query': message,
                'optimized_query': optimized_query if used_optimized else None,
                'optimizer_reasoning': optimizer_reasoning if used_optimized else None,
                'optimizer_keywords': optimizer_keywords if used_optimized else None
            }
            if summary_model:
                history_metadata['summary_model'] = summary_model
            
            save_ai_history(
                username=username,
                model="gemini-search",
                prompt=message,
                response=reply,
                metadata=history_metadata
            )
            
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
            
            logger.info(f"AI Search v2 completed (powered_by: {powered_by}, optimized: {used_optimized})")
            
        except urllib.error.HTTPError as e:
            try:
                error_body = e.read().decode('utf-8')
                logger.error(f"Serper API HTTP error: {e.code} - {error_body}")
                self._send_json_error(e.code, f"Serper API lỗi: {error_body}", "UPSTREAM_ERROR")
            except:
                self._send_json_error(e.code, f"Serper API lỗi: {e.reason}", "UPSTREAM_ERROR")
        except urllib.error.URLError as e:
            logger.error(f"Serper connection error: {e}")
            self._send_json_error(502, "Không thể kết nối đến Serper API", "CONNECTION_ERROR")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in Search request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra định dạng JSON.", "INVALID_JSON")
        except Exception as e:
            logger.error(f"Serper Search error: {e}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(f"Exception args: {e.args}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")
    
    def _format_serper_results_markdown(self, serper_data, query):
        """Format Serper search results into markdown (NO AI processing)"""
        parts = []
        
        parts.append(f"## Kết quả tìm kiếm cho: \"{query}\"\n")
        
        # Answer Box (câu trả lời nhanh)
        if serper_data.get('answerBox'):
            ab = serper_data['answerBox']
            parts.append("### Trả lời nhanh")
            if ab.get('answer'):
                parts.append(f"{ab['answer']}\n")
            elif ab.get('snippet'):
                parts.append(f"{ab['snippet']}\n")
            if ab.get('title'):
                parts.append(f"*Nguồn: {ab['title']}*\n")
        
        # Knowledge Graph
        if serper_data.get('knowledgeGraph'):
            kg = serper_data['knowledgeGraph']
            parts.append("### Thông tin")
            if kg.get('title'):
                parts.append(f"**{kg['title']}**")
            if kg.get('type'):
                parts.append(f"*{kg['type']}*")
            if kg.get('description'):
                parts.append(f"{kg['description']}\n")
        
        # Organic results
        organic = serper_data.get('organic', [])
        if organic:
            parts.append("### Kết quả tìm kiếm")
            for i, result in enumerate(organic[:7], 1):
                title = result.get('title', 'Không có tiêu đề')
                snippet = result.get('snippet', '')
                link = result.get('link', '#')
                parts.append(f"**{i}. [{title}]({link})**")
                if snippet:
                    parts.append(f"{snippet}\n")
        
        # People Also Ask
        paa = serper_data.get('peopleAlsoAsk', [])
        if paa:
            parts.append("### Câu hỏi liên quan")
            for item in paa[:4]:
                q = item.get('question', '')
                a = item.get('snippet', '')
                if q:
                    parts.append(f"- **{q}**")
                    if a:
                        parts.append(f"  {a}")
        
        # Related Searches
        related = serper_data.get('relatedSearches', [])
        if related:
            parts.append("\n### Tìm kiếm liên quan")
            related_terms = [r.get('query', '') for r in related[:5] if r.get('query')]
            if related_terms:
                parts.append(", ".join(related_terms))
        
        return "\n".join(parts) if parts else "Không tìm thấy kết quả phù hợp."

    def _build_gemini_search_context(self, serper_data, query):
        """Build context string from Serper results for Gemini to analyze"""
        context_parts = []
        
        # Answer Box
        if serper_data.get('answerBox'):
            ab = serper_data['answerBox']
            context_parts.append("📦 Trả lời nhanh:")
            if ab.get('answer'):
                context_parts.append(f"  - Đáp án: {ab['answer']}")
            elif ab.get('snippet'):
                context_parts.append(f"  - Tóm tắt: {ab['snippet']}")
            if ab.get('title'):
                context_parts.append(f"  - Nguồn: {ab['title']}")
        
        # Knowledge Graph
        if serper_data.get('knowledgeGraph'):
            kg = serper_data['knowledgeGraph']
            context_parts.append("\n📚 Thông tin nền:")
            if kg.get('title'):
                context_parts.append(f"  - Chủ đề: {kg['title']}")
            if kg.get('type'):
                context_parts.append(f"  - Loại: {kg['type']}")
            if kg.get('description'):
                context_parts.append(f"  - Mô tả: {kg['description']}")
        
        # Organic Results (top 6)
        organic = serper_data.get('organic', [])
        if organic:
            context_parts.append("\n🔍 Kết quả tìm kiếm:")
            for i, result in enumerate(organic[:6], 1):
                title = result.get('title', 'Không có tiêu đề')
                snippet = result.get('snippet', '')
                link = result.get('link', '')
                context_parts.append(f"\nNguồn {i}:")
                context_parts.append(f"  - Tiêu đề: {title}")
                if snippet:
                    context_parts.append(f"  - Tóm tắt: {snippet}")
                if link:
                    context_parts.append(f"  - URL: {link}")
        
        # People Also Ask (top 3)
        paa = serper_data.get('peopleAlsoAsk', [])
        if paa:
            context_parts.append("\n❓ Câu hỏi liên quan:")
            for item in paa[:3]:
                q = item.get('question', '')
                a = item.get('snippet', '')
                if q:
                    context_parts.append(f"  - Q: {q}")
                    if a:
                        context_parts.append(f"    A: {a}")
        
        return "\n".join(context_parts)

    def _invoke_gemini_summary(self, query, search_context):
        """Call Gemini 2.5 Flash to summarize and analyze search results
        
        Returns:
            tuple: (success: bool, result: str)
            - If success: (True, summary_text)
            - If error: (False, error_message)
        """
        try:
            gemini_key = get_api_key('gemini')
            if not gemini_key:
                return (False, "Gemini API key chưa được cấu hình")
            
            # System prompt for search summarization - CẢI TIẾN: Linh hoạt và tự nhiên hơn
            system_prompt = """Bạn là Gemini 2.5 Flash, một trợ lý AI thông minh với khả năng tìm kiếm web thời gian thực.

⚠️ QUY TẮC BẮT BUỘC:
- Tên của bạn là Gemini 2.5 Flash. Khi được hỏi, trả lời: "Mình là Gemini 2.5 Flash".
- PHẢI trả lời hoàn toàn bằng TIẾNG VIỆT một cách TỰ NHIÊN.
- KHÔNG ĐƯỢC sử dụng từ "biomimicry". Dùng thay thế: "thiết kế lấy cảm hứng từ thiên nhiên", "mô phỏng tự nhiên".

📝 CÁCH TRẢ LỜI - LINH HOẠT THEO NGỮ CẢNH:

1. **Câu hỏi ĐƠN GIẢN** (định nghĩa, giải thích ngắn):
   - Trả lời NGẮN GỌN, trực tiếp (1-3 câu)
   - KHÔNG cần format Tóm tắt/Phân tích/Nguồn
   - VD: "Bitcoin là gì?" → Trả lời định nghĩa ngắn gọn

2. **Câu hỏi CẦN THÔNG TIN CHI TIẾT** (tin tức, sự kiện, so sánh):
   - Sử dụng format có cấu trúc khi phù hợp
   - Thêm nguồn tham khảo nếu cần thiết

3. **Câu hỏi về GIÁ CẢ, TỶ GIÁ, SỐ LIỆU**:
   - Đưa ra con số cụ thể từ kết quả tìm kiếm
   - Ghi rõ thời điểm/nguồn nếu có

🎯 NGUYÊN TẮC QUAN TRỌNG:
- TỰ NHIÊN như đang trò chuyện, không máy móc
- Độ dài tỷ lệ với độ phức tạp của câu hỏi
- Dùng emoji một cách TIẾT CHẾ (1-2 emoji nếu phù hợp, không bắt buộc)
- TRÁNH lặp lại cấu trúc cố định cho mọi câu trả lời"""

            user_prompt = f"""Người dùng tìm kiếm: "{query}"

KẾT QUẢ TÌM KIẾM TỪ SERPER:
{search_context}

Hãy tóm tắt và phân tích kết quả tìm kiếm trên để trả lời câu hỏi của người dùng."""

            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            
            gemini_payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 8192,
                },
                "safetySettings": [
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"}
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
            
            candidates = gemini_data.get('candidates', [])
            prompt_feedback = gemini_data.get('promptFeedback', {})
            
            if prompt_feedback.get('blockReason'):
                block_reason = prompt_feedback.get('blockReason', 'UNKNOWN')
                logger.warning(f"Gemini summary blocked by promptFeedback: {block_reason}")
                return (False, f"Prompt bị chặn: {block_reason}")
            
            if not candidates:
                logger.warning(f"Gemini summary: No candidates. promptFeedback: {prompt_feedback}")
                return (False, "Gemini không trả về kết quả")
            
            candidate = candidates[0]
            finish_reason = candidate.get('finishReason', 'UNKNOWN')
            safety_ratings = candidate.get('safetyRatings', [])
            
            if finish_reason == 'SAFETY':
                logger.warning(f"Gemini summary blocked by SAFETY: {safety_ratings}")
                return (False, "Bị chặn bởi safety filter")
            
            if finish_reason == 'MAX_TOKENS':
                logger.warning("Gemini summary truncated (MAX_TOKENS)")
            
            if candidate.get('content', {}).get('parts'):
                summary_text = candidate['content']['parts'][0].get('text', '')
                if summary_text:
                    return (True, summary_text)
            
            logger.warning(f"Gemini summary: No text in response. finishReason: {finish_reason}, safetyRatings: {safety_ratings}")
            return (False, "Gemini không trả về kết quả hợp lệ")
            
        except urllib.error.HTTPError as e:
            error_msg = f"Gemini API lỗi HTTP {e.code}"
            try:
                error_body = e.read().decode('utf-8')
                logger.warning(f"Gemini HTTP error: {e.code} - {error_body}")
            except:
                logger.warning(f"Gemini HTTP error: {e.code}")
            return (False, error_msg)
        except urllib.error.URLError as e:
            logger.warning(f"Gemini connection error: {e}")
            return (False, "Không thể kết nối đến Gemini")
        except Exception as e:
            logger.warning(f"Gemini summary error: {e}")
            return (False, str(e))

    def _invoke_gemini_query_optimizer(self, user_prompt):
        """Call Gemini 2.5 Flash to optimize/process user prompt before sending to Serper
        
        Luồng: User prompt → Gemini xử lý → Optimized query cho Serper
        
        Returns:
            tuple: (success: bool, result: dict)
            - If success: (True, {"optimized_query": str, "reasoning": str, "keywords": list})
            - If error: (False, {"error": str})
        """
        try:
            gemini_key = get_api_key('gemini')
            if not gemini_key:
                return (False, {"error": "Gemini API key chưa được cấu hình"})
            
            system_prompt = """Bạn là Gemini Query Optimizer - nhiệm vụ tối ưu hóa câu hỏi người dùng thành query tìm kiếm hiệu quả cho Serper/Google.

⚠️ QUY TẮC BẮT BUỘC:
1. Phân tích ý định tìm kiếm của người dùng
2. Tạo query tìm kiếm tối ưu (ngắn gọn, rõ ràng, có từ khóa chính)
3. Trả về JSON với format chính xác

📝 OUTPUT FORMAT (JSON):
{
    "optimized_query": "query tìm kiếm tối ưu (50-150 ký tự, ưu tiên tiếng Việt nếu là câu hỏi tiếng Việt)",
    "reasoning": "giải thích ngắn gọn lý do tối ưu (1-2 câu)",
    "keywords": ["từ_khóa_1", "từ_khóa_2", "từ_khóa_3"]
}

🎯 HƯỚNG DẪN TỐI ƯU:
- Loại bỏ từ thừa (ừ, à, nhé, nha, cho tôi biết, giúp tôi...)
- Giữ nguyên tên riêng, thương hiệu, số liệu cụ thể
- Thêm ngữ cảnh thời gian nếu cần (2025, mới nhất, hiện tại...)
- Nếu hỏi về giá/tỷ giá → thêm "giá hiện tại" hoặc "tỷ giá hôm nay"
- Nếu hỏi về tin tức → thêm "tin tức mới nhất"
- Nếu hỏi định nghĩa đơn giản → giữ ngắn gọn, không thêm thừa

⚠️ CHỈ trả về JSON thuần túy, KHÔNG có text giải thích bên ngoài JSON."""

            user_message = f"""Tối ưu hóa câu hỏi sau thành query tìm kiếm:

"{user_prompt}"

Trả về JSON theo format đã chỉ định."""

            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            
            gemini_payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"{system_prompt}\n\n{user_message}"}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.3,
                    "topK": 20,
                    "topP": 0.9,
                    "maxOutputTokens": 2048,
                    "responseMimeType": "application/json"
                },
                "safetySettings": [
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"}
                ]
            }
            
            gemini_request = urllib.request.Request(
                gemini_url,
                data=json.dumps(gemini_payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(gemini_request, timeout=15) as response:
                gemini_response = response.read().decode('utf-8')
                gemini_data = json.loads(gemini_response)
            
            candidates = gemini_data.get('candidates', [])
            prompt_feedback = gemini_data.get('promptFeedback', {})
            
            if prompt_feedback.get('blockReason'):
                block_reason = prompt_feedback.get('blockReason', 'UNKNOWN')
                logger.warning(f"Query optimizer blocked by promptFeedback: {block_reason}")
                return (False, {"error": f"Prompt bị chặn: {block_reason}"})
            
            if not candidates:
                logger.warning(f"Query optimizer: No candidates returned. promptFeedback: {prompt_feedback}")
                return (False, {"error": "Gemini không trả về kết quả"})
            
            candidate = candidates[0]
            finish_reason = candidate.get('finishReason', 'UNKNOWN')
            safety_ratings = candidate.get('safetyRatings', [])
            
            if finish_reason == 'SAFETY':
                logger.warning(f"Query optimizer blocked by SAFETY: {safety_ratings}")
                return (False, {"error": "Bị chặn bởi safety filter"})
            
            if finish_reason not in ['STOP', 'MAX_TOKENS']:
                logger.warning(f"Query optimizer unexpected finishReason: {finish_reason}")
            
            if candidate.get('content', {}).get('parts'):
                response_text = candidate['content']['parts'][0].get('text', '')
                if response_text:
                    response_text = response_text.strip()
                    if response_text.startswith('```json'):
                        response_text = response_text[7:]
                    if response_text.startswith('```'):
                        response_text = response_text[3:]
                    if response_text.endswith('```'):
                        response_text = response_text[:-3]
                    response_text = response_text.strip()
                    
                    try:
                        result = json.loads(response_text)
                        if 'optimized_query' in result:
                            logger.info(f"Query optimized: '{user_prompt}' → '{result['optimized_query']}'")
                            return (True, result)
                        else:
                            logger.warning(f"Query optimizer missing optimized_query field: {response_text[:200]}")
                            return (False, {"error": "JSON thiếu trường optimized_query"})
                    except json.JSONDecodeError as e:
                        logger.warning(f"Query optimizer JSON parse error: {e}, finishReason: {finish_reason}, raw: {response_text[:300]}")
                        return (False, {"error": f"Không thể parse JSON: {str(e)}"})
            
            logger.warning(f"Query optimizer: No text in response. finishReason: {finish_reason}")
            return (False, {"error": "Gemini không trả về kết quả hợp lệ"})
            
        except urllib.error.HTTPError as e:
            error_msg = f"Gemini API lỗi HTTP {e.code}"
            logger.warning(f"Query optimizer HTTP error: {e.code}")
            return (False, {"error": error_msg})
        except urllib.error.URLError as e:
            logger.warning(f"Query optimizer connection error: {e}")
            return (False, {"error": "Không thể kết nối đến Gemini"})
        except Exception as e:
            logger.warning(f"Query optimizer error: {e}")
            return (False, {"error": str(e)})

    def handle_llm7_chat(self):
        """Generic handler for all LLM7 models via LLM7.io"""
        try:
            # Get username from session cookie
            username = self._get_username_from_cookie()
            
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
            
            # Extract model and message from request
            model_id = request_data.get('model', 'gpt-5-chat')
            message = request_data.get('message', '')
            if not message:
                self._send_json_error(400, "Message không được để trống", "MISSING_MESSAGE")
                return
            
            # Extract files from request (for vision/image analysis)
            files = request_data.get('files', [])
            
            # Build LLM7.io API URL
            llm7_url = "https://api.llm7.io/v1/chat/completions"
            llm7_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            
            # Support conversation history - check if messages array is provided
            conversation_messages = request_data.get('messages', [])
            
            # Build messages array with system prompt and conversation history
            # Sử dụng system prompt động dựa trên model_id
            messages: list = [
                {"role": "system", "content": get_llm7_system_prompt(model_id)}
            ]
            
            # Add conversation history if provided
            if conversation_messages:
                messages.extend(conversation_messages)
            else:
                # Fallback to old format for backward compatibility
                messages.append({"role": "user", "content": message})
            
            # IDENTITY GUARDRAIL: Thêm reminder message ngay trước user message cuối cùng
            # để đảm bảo model không bị nhầm lẫn bởi conversation history từ model khác
            identity_model_names = {
                'gpt-5-chat': 'GPT-5', 'gpt-4o': 'GPT-4o', 'gpt-4': 'GPT-4',
                'gpt-5-mini': 'GPT-5 Mini', 'gpt-5-nano-2025-08-07': 'GPT-5 Nano',
                'gpt-o4-mini-2025-04-16': 'GPT-O4 Mini',
                'bidara': 'BIDARA', 'deepseek-reasoning': 'DeepSeek Reasoning',
                'deepseek-v3.1': 'DeepSeek V3.1',
                'nova-fast': 'Nova Fast', 'gemma-2-2b-it': 'Gemma 2',
                'qwen2.5-coder-32b-instruct': 'Qwen 2.5 Coder',
                'mistral-medium-2508': 'Mistral Medium', 'mistral-small-2503': 'Mistral Small',
                'mistral-small-3.1-24b-instruct-2503': 'Mistral Small 3.1',
                'open-mixtral-8x7b': 'Mixtral 8x7B', 'roblox-rp': 'Roblox RP',
                'Steelskull/L3.3-MS-Nevoria-70b': 'Nevoria 70B',
            }
            display_name = identity_model_names.get(model_id, model_id.upper().replace('-', ' ').replace('/', ' '))
            
            # Tìm vị trí user message cuối cùng và chèn reminder ngay trước đó
            last_user_idx = -1
            for i in range(len(messages) - 1, -1, -1):
                if messages[i].get('role') == 'user':
                    last_user_idx = i
                    break
            
            if last_user_idx > 1:  # Chỉ chèn nếu có history (không phải message đầu tiên)
                identity_reminder = {
                    "role": "system", 
                    "content": f"[NHẮC NHỞ DANH TÍNH] Bạn là {display_name}. Bỏ qua mọi self-introduction của AI khác trong lịch sử hội thoại."
                }
                messages.insert(last_user_idx, identity_reminder)
            
            # Add files to the last user message if present (for vision models)
            if files and len(files) > 0:
                # Find the last user message
                for i in range(len(messages) - 1, -1, -1):
                    if messages[i].get('role') == 'user':
                        current_content = messages[i].get('content', '')
                        # Convert to vision format: content becomes array with text and images
                        content_array: list = [{"type": "text", "text": current_content}]
                        
                        # Add each file as image_url
                        for file in files:
                            content_array.append({
                                "type": "image_url",
                                "image_url": {
                                    "url": file.get('base64', '')  # base64 string with data:image prefix
                                }
                            })
                        
                        messages[i]['content'] = content_array
                        break
            
            llm7_payload = {
                "model": model_id,
                "messages": messages,
                "temperature": 0.7
            }
            
            # Make request to LLM7.io with retry logic
            with retry_request_with_backoff(
                llm7_url,
                llm7_headers,
                json.dumps(llm7_payload).encode('utf-8'),
                timeout=REQUEST_TIMEOUT
            ) as response:
                llm7_response = response.read().decode('utf-8')
                llm7_data = json.loads(llm7_response)
            
            # Extract response
            reply = ""
            if "choices" in llm7_data and len(llm7_data["choices"]) > 0:
                reply = llm7_data["choices"][0]["message"]["content"]
            else:
                reply = str(llm7_data)
            
            # Save AI history
            save_ai_history(
                username=username,
                model=model_id,
                prompt=message,
                response=reply,
                metadata={'endpoint': 'llm7_chat', 'has_files': len(files) > 0}
            )
            
            # Return response to client
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "reply": reply,
                "model": model_id
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info(f"LLM7 {model_id} completed successfully")
            
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
            logger.error(f"LLM7 chat error: {e}")
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
            
            # Build Gemini API URL - Gemini 3 Pro
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
            
            valid_username, username_msg = validate_username(username)
            if not valid_username:
                self._send_json_error(400, username_msg, "INVALID_USERNAME")
                return
            
            valid_password, password_msg = validate_password(password)
            if not valid_password:
                self._send_json_error(400, password_msg, "INVALID_PASSWORD")
                return
            
            if check_user_exists(username):
                self._send_json_error(400, "Username đã tồn tại", "USERNAME_EXISTS")
                return
            
            if save_user(username, password):
                remember_me = request_data.get('remember_me', False)
                session_id = create_session(username, remember_me=remember_me)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                
                max_age = (30 * 24 * 3600) if remember_me else (7 * 24 * 3600)
                cookie_value = f"session_id={session_id}; Path=/; HttpOnly; SameSite=Lax; Max-Age={max_age}"
                if os.getenv('REPLIT_DOMAIN') or os.getenv('RENDER'):
                    cookie_value += "; Secure"
                self.send_header('Set-Cookie', cookie_value)
                
                self.end_headers()
                
                response_json = json.dumps({
                    "success": True,
                    "username": username,
                    "remember_me": remember_me
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
            
            valid_username, _ = validate_username(username)
            valid_password, _ = validate_password(password)
            
            if not valid_username or not valid_password:
                self._send_json_error(401, "Username hoặc password không đúng", "INVALID_CREDENTIALS")
                return
            
            is_limited, limit_message, wait_time = check_rate_limit(username)
            if is_limited:
                self._send_json_error(429, limit_message, "RATE_LIMITED")
                return
            
            if authenticate_user(username, password):
                clear_rate_limit(username)
                remember_me = request_data.get('remember_me', False)
                session_id = create_session(username, remember_me=remember_me)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                
                max_age = (30 * 24 * 3600) if remember_me else (7 * 24 * 3600)
                cookie_value = f"session_id={session_id}; Path=/; HttpOnly; SameSite=Lax; Max-Age={max_age}"
                if os.getenv('REPLIT_DOMAIN') or os.getenv('RENDER'):
                    cookie_value += "; Secure"
                self.send_header('Set-Cookie', cookie_value)
                
                self.end_headers()
                
                response_json = json.dumps({
                    "success": True,
                    "username": username,
                    "remember_me": remember_me
                }, ensure_ascii=False)
                self.wfile.write(response_json.encode('utf-8'))
                
                logger.info(f"User logged in successfully: {username}")
            else:
                attempts = record_failed_attempt(username)
                remaining = MAX_LOGIN_ATTEMPTS - attempts
                if remaining > 0:
                    error_msg = f"Username hoặc password không đúng. Còn {remaining} lần thử"
                else:
                    error_msg = "Quá nhiều lần thử. Tài khoản đã bị khóa tạm thời"
                self._send_json_error(401, error_msg, "INVALID_CREDENTIALS")
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in login request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ", "INVALID_JSON")
        except Exception as e:
            logger.error(f"Login error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_auth_logout(self):
        """Handle user logout"""
        try:
            session_id = None
            
            if 'Cookie' in self.headers:
                cookies = self.headers['Cookie']
                for cookie in cookies.split(';'):
                    if 'session_id=' in cookie:
                        session_id = cookie.split('session_id=')[1].strip()
                        break
            
            if not session_id:
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    post_data = self.rfile.read(content_length)
                    request_data = json.loads(post_data.decode('utf-8'))
                    session_id = request_data.get('session_id', '').strip()
            
            if not session_id:
                self._send_json_error(400, "Session ID không được để trống", "MISSING_SESSION_ID")
                return
            
            delete_session(session_id)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            
            cookie_value = "session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
            if os.getenv('REPLIT_DOMAIN') or os.getenv('RENDER'):
                cookie_value += "; Secure"
            self.send_header('Set-Cookie', cookie_value)
            
            self.end_headers()
            
            response_json = json.dumps({
                "success": True,
                "message": "Đăng xuất thành công"
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
                
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
                    rotated = False
                    session_data = sessions.get(session_id)
                    if session_data and session_data is not None:
                        current_time = time.time()
                        expires_at = session_data.get('expires_at', 0)
                        total_duration = (30 * 24 * 3600) if session_data.get('remember_me') else (SESSION_EXPIRY_HOURS * 3600)
                        time_remaining = expires_at - current_time
                        
                        if time_remaining < (total_duration * 0.25):
                            new_session_id = rotate_session(session_id)
                            if new_session_id:
                                session_id = new_session_id
                                rotated = True
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self._send_cors_headers()
                    
                    if rotated and session_data is not None:
                        remember_me = session_data.get('remember_me', False)
                        max_age = (30 * 24 * 3600) if remember_me else (7 * 24 * 3600)
                        cookie_value = f"session_id={session_id}; Path=/; HttpOnly; SameSite=Lax; Max-Age={max_age}"
                        if os.getenv('REPLIT_DOMAIN') or os.getenv('RENDER'):
                            cookie_value += "; Secure"
                        self.send_header('Set-Cookie', cookie_value)
                    
                    self.end_headers()
                    
                    response_json = json.dumps({
                        "valid": True,
                        "username": username,
                        "rotated": rotated
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

    def handle_admin_get_users(self):
        """Admin API: Get all users"""
        try:
            user_list = []
            for username, password in users.items():
                user_list.append({
                    "username": username,
                    "password_length": len(password)
                })
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "success": True,
                "total_users": len(user_list),
                "users": user_list
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info(f"Admin API: Retrieved {len(user_list)} users")
            
        except Exception as e:
            logger.error(f"Admin get users error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_admin_get_sessions(self):
        """Admin API: Get all active sessions"""
        try:
            current_time = time.time()
            session_list = []
            
            for session_id, session_data in sessions.items():
                expires_at = session_data.get('expires_at', 0)
                time_remaining = expires_at - current_time
                
                session_list.append({
                    "session_id": session_id[:16] + "...",
                    "username": session_data.get('username'),
                    "remember_me": session_data.get('remember_me', False),
                    "expires_at": expires_at,
                    "time_remaining_seconds": int(time_remaining) if time_remaining > 0 else 0,
                    "is_expired": time_remaining <= 0
                })
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "success": True,
                "total_sessions": len(session_list),
                "sessions": session_list
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info(f"Admin API: Retrieved {len(session_list)} sessions")
            
        except Exception as e:
            logger.error(f"Admin get sessions error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_admin_get_stats(self):
        """Admin API: Get system statistics"""
        try:
            current_time = time.time()
            
            active_sessions_count = sum(1 for s in sessions.values() if current_time < s.get('expires_at', 0))
            expired_sessions_count = sum(1 for s in sessions.values() if current_time >= s.get('expires_at', 0))
            
            locked_users_count = sum(1 for data in rate_limits.values() if current_time < data.get('locked_until', 0))
            
            stats = {
                "users": {
                    "total": len(users),
                    "locked": locked_users_count
                },
                "sessions": {
                    "total": len(sessions),
                    "active": active_sessions_count,
                    "expired": expired_sessions_count
                },
                "rate_limits": {
                    "total": len(rate_limits),
                    "currently_locked": locked_users_count
                },
                "system": {
                    "session_expiry_hours": SESSION_EXPIRY_HOURS,
                    "max_login_attempts": MAX_LOGIN_ATTEMPTS,
                    "rate_limit_window_seconds": RATE_LIMIT_WINDOW
                }
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "success": True,
                "stats": stats
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info("Admin API: Retrieved system stats")
            
        except Exception as e:
            logger.error(f"Admin get stats error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_admin_get_rate_limits(self):
        """Admin API: Get all rate limits"""
        try:
            current_time = time.time()
            rate_limit_list = []
            
            for username, data in rate_limits.items():
                locked_until = data.get('locked_until', 0)
                time_remaining = locked_until - current_time if current_time < locked_until else 0
                
                rate_limit_list.append({
                    "username": username,
                    "attempts": data.get('attempts', 0),
                    "last_attempt": data.get('last_attempt', 0),
                    "locked_until": locked_until,
                    "is_locked": current_time < locked_until,
                    "time_remaining_seconds": int(time_remaining)
                })
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "success": True,
                "total_rate_limits": len(rate_limit_list),
                "rate_limits": rate_limit_list
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info(f"Admin API: Retrieved {len(rate_limit_list)} rate limits")
            
        except Exception as e:
            logger.error(f"Admin get rate limits error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_admin_delete_user(self):
        """Admin API: Delete a user"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            username = request_data.get('username', '').strip()
            
            if not username:
                self._send_json_error(400, "Username không được để trống", "MISSING_USERNAME")
                return
            
            if username not in users:
                self._send_json_error(404, f"User '{username}' không tồn tại", "USER_NOT_FOUND")
                return
            
            del users[username]
            
            with file_lock:
                with open(ACCOUNTS_FILE, 'w', encoding='utf-8') as f:
                    for user, pwd in users.items():
                        f.write(f"{user}|{pwd}\n")
            
            sessions_to_delete = [sid for sid, data in sessions.items() if data.get('username') == username]
            for sid in sessions_to_delete:
                delete_session(sid)
            
            if username in rate_limits:
                del rate_limits[username]
                save_rate_limits()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "success": True,
                "message": f"User '{username}' đã được xóa thành công",
                "sessions_deleted": len(sessions_to_delete)
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info(f"Admin API: Deleted user '{username}' and {len(sessions_to_delete)} sessions")
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in delete user request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ", "INVALID_JSON")
        except Exception as e:
            logger.error(f"Admin delete user error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_admin_delete_session(self):
        """Admin API: Delete a session by username"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            username = request_data.get('username', '').strip()
            
            if not username:
                self._send_json_error(400, "Username không được để trống", "MISSING_USERNAME")
                return
            
            sessions_to_delete = [sid for sid, data in sessions.items() if data.get('username') == username]
            
            if not sessions_to_delete:
                self._send_json_error(404, f"Không tìm thấy session nào của user '{username}'", "SESSION_NOT_FOUND")
                return
            
            for sid in sessions_to_delete:
                delete_session(sid)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "success": True,
                "message": f"Đã xóa {len(sessions_to_delete)} session(s) của user '{username}'",
                "sessions_deleted": len(sessions_to_delete)
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info(f"Admin API: Deleted {len(sessions_to_delete)} sessions for user '{username}'")
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in delete session request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ", "INVALID_JSON")
        except Exception as e:
            logger.error(f"Admin delete session error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_admin_clear_rate_limit(self):
        """Admin API: Clear rate limit for a user"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            username = request_data.get('username', '').strip()
            
            if not username:
                self._send_json_error(400, "Username không được để trống", "MISSING_USERNAME")
                return
            
            if username not in rate_limits:
                self._send_json_error(404, f"User '{username}' không có rate limit", "RATE_LIMIT_NOT_FOUND")
                return
            
            del rate_limits[username]
            save_rate_limits()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "success": True,
                "message": f"Đã xóa rate limit cho user '{username}'"
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info(f"Admin API: Cleared rate limit for user '{username}'")
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in clear rate limit request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ", "INVALID_JSON")
        except Exception as e:
            logger.error(f"Admin clear rate limit error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_admin_logs(self):
        """Admin API: Get server logs from server.log file"""
        try:
            # Parse query parameters
            from urllib.parse import parse_qs, urlparse
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            
            limit = int(params.get('limit', ['100'])[0])
            level_filter = params.get('level', [None])[0]  # INFO, ERROR, WARNING
            
            logs = []
            total_lines = 0
            
            # Read server.log file
            if os.path.exists(LOG_FILE):
                with file_lock:
                    with open(LOG_FILE, 'r', encoding='utf-8') as f:
                        all_lines = f.readlines()
                        total_lines = len(all_lines)
                        
                        # Filter by level if specified
                        if level_filter:
                            filtered_lines = [line for line in all_lines if f'- {level_filter} -' in line]
                        else:
                            filtered_lines = all_lines
                        
                        # Get last N lines
                        recent_lines = filtered_lines[-limit:]
                        
                        for line in recent_lines:
                            logs.append({
                                'timestamp': line[:23] if len(line) > 23 else '',
                                'content': line.strip()
                            })
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "success": True,
                "total_lines": total_lines,
                "filtered_count": len(logs),
                "limit": limit,
                "level_filter": level_filter,
                "logs": logs
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info(f"Admin API: Retrieved {len(logs)} log entries")
            
        except Exception as e:
            logger.error(f"Admin get logs error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_admin_history(self):
        """Admin API: Get AI call history from ai_history.jsonl"""
        try:
            # Parse query parameters
            from urllib.parse import parse_qs, urlparse
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            
            username_filter = params.get('username', [None])[0]
            model_filter = params.get('model', [None])[0]
            limit = int(params.get('limit', ['50'])[0])
            
            history = []
            total_records = 0
            
            # Read ai_history.jsonl file
            if os.path.exists(AI_HISTORY_FILE):
                with file_lock:
                    with open(AI_HISTORY_FILE, 'r', encoding='utf-8') as f:
                        for line in f:
                            if line.strip():
                                try:
                                    entry = json.loads(line.strip())
                                    total_records += 1
                                    
                                    # Apply filters
                                    if username_filter and entry.get('username') != username_filter:
                                        continue
                                    if model_filter and entry.get('model') != model_filter:
                                        continue
                                    
                                    history.append(entry)
                                except json.JSONDecodeError:
                                    continue
            
            # Get last N entries
            history = history[-limit:]
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "success": True,
                "total_records": total_records,
                "filtered_count": len(history),
                "limit": limit,
                "filters": {
                    "username": username_filter,
                    "model": model_filter
                },
                "history": history
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info(f"Admin API: Retrieved {len(history)} AI history entries")
            
        except Exception as e:
            logger.error(f"Admin get history error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_admin_usage(self):
        """Admin API: Get AI usage statistics aggregated from history"""
        try:
            users_stats = {}
            models_stats = {}
            
            # Read and aggregate ai_history.jsonl file
            if os.path.exists(AI_HISTORY_FILE):
                with file_lock:
                    with open(AI_HISTORY_FILE, 'r', encoding='utf-8') as f:
                        for line in f:
                            if line.strip():
                                try:
                                    entry = json.loads(line.strip())
                                    username = entry.get('username', 'anonymous')
                                    model = entry.get('model', 'unknown')
                                    
                                    # Count by user
                                    if username not in users_stats:
                                        users_stats[username] = {
                                            'username': username,
                                            'total_calls': 0,
                                            'models_used': {}
                                        }
                                    users_stats[username]['total_calls'] += 1
                                    
                                    if model not in users_stats[username]['models_used']:
                                        users_stats[username]['models_used'][model] = 0
                                    users_stats[username]['models_used'][model] += 1
                                    
                                    # Count by model
                                    if model not in models_stats:
                                        models_stats[model] = {
                                            'model': model,
                                            'total_calls': 0,
                                            'unique_users': set()
                                        }
                                    models_stats[model]['total_calls'] += 1
                                    models_stats[model]['unique_users'].add(username)
                                    
                                except json.JSONDecodeError:
                                    continue
            
            # Convert sets to counts
            models_list = []
            for model, data in models_stats.items():
                models_list.append({
                    'model': model,
                    'total_calls': data['total_calls'],
                    'unique_users': len(data['unique_users'])
                })
            
            # Sort by total_calls descending
            users_list = sorted(users_stats.values(), key=lambda x: x['total_calls'], reverse=True)
            models_list = sorted(models_list, key=lambda x: x['total_calls'], reverse=True)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "success": True,
                "total_calls": sum(u['total_calls'] for u in users_list),
                "unique_users": len(users_list),
                "unique_models": len(models_list),
                "users_stats": users_list,
                "models_stats": models_list
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info("Admin API: Retrieved AI usage statistics")
            
        except Exception as e:
            logger.error(f"Admin get usage error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_admin_config(self):
        """Admin API: Get current configuration (API keys masked)"""
        try:
            config_data = {}
            
            # Get current API keys (masked)
            for service in ['gemini', 'serpapi', 'llm7']:
                api_key = get_api_key(service)
                if api_key:
                    # Show only first 8 and last 4 characters
                    if len(api_key) > 12:
                        masked = api_key[:8] + '...' + api_key[-4:]
                    else:
                        masked = api_key[:4] + '...'
                    config_data[service] = {
                        'configured': True,
                        'masked_key': masked,
                        'has_override': service in config.config_override
                    }
                else:
                    config_data[service] = {
                        'configured': False,
                        'masked_key': None,
                        'has_override': False
                    }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "success": True,
                "config": config_data
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info("Admin API: Retrieved config")
            
        except Exception as e:
            logger.error(f"Admin get config error: {e}")
            self._send_json_error(503, f"Lỗi hệ thống: {str(e)}", "SYSTEM_ERROR")

    def handle_admin_config_update(self):
        """Admin API: Update API key configuration"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            service = request_data.get('service', '').strip().lower()
            api_key = request_data.get('api_key', '').strip()
            
            if not service:
                self._send_json_error(400, "Service không được để trống", "MISSING_SERVICE")
                return
            
            if service not in ['gemini', 'serpapi', 'llm7']:
                self._send_json_error(400, f"Service '{service}' không hợp lệ. Chỉ chấp nhận: gemini, serpapi, llm7", "INVALID_SERVICE")
                return
            
            if not api_key:
                self._send_json_error(400, "API key không được để trống", "MISSING_API_KEY")
                return
            
            # Validate API key length (basic validation)
            if len(api_key) < 10:
                self._send_json_error(400, "API key quá ngắn, có vẻ không hợp lệ", "INVALID_API_KEY")
                return
            
            # Update config override using config.py function
            if not save_config_override(service, api_key):
                self._send_json_error(500, "Không thể lưu cấu hình", "SAVE_ERROR")
                return
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response_json = json.dumps({
                "success": True,
                "message": f"API key cho service '{service}' đã được cập nhật thành công"
            }, ensure_ascii=False)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.info(f"Admin API: Updated config for service '{service}'")
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in config update request: {e}")
            self._send_json_error(400, "Dữ liệu gửi lên không hợp lệ", "INVALID_JSON")
        except Exception as e:
            logger.error(f"Admin config update error: {e}")
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
        
        # Handle admin GET endpoints
        if self.path == '/api/admin/users':
            self.handle_admin_get_users()
            return
        elif self.path == '/api/admin/sessions':
            self.handle_admin_get_sessions()
            return
        elif self.path == '/api/admin/stats':
            self.handle_admin_get_stats()
            return
        elif self.path == '/api/admin/rate-limits':
            self.handle_admin_get_rate_limits()
            return
        elif self.path.startswith('/api/admin/logs'):
            self.handle_admin_logs()
            return
        elif self.path.startswith('/api/admin/history'):
            self.handle_admin_history()
            return
        elif self.path.startswith('/api/admin/usage'):
            self.handle_admin_usage()
            return
        elif self.path.startswith('/api/admin/config'):
            self.handle_admin_config()
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
    
    cleanup_thread = threading.Thread(target=cleanup_expired_data, daemon=True)
    cleanup_thread.start()
    logger.info("Background cleanup task started")
    
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
    env_name = 'Render' if os.getenv('RENDER') else 'Replit' if os.getenv('REPLIT_DOMAIN') else 'Local'
    logger.info(f"Environment: {env_name}")
    logger.info(f"Port: {port}")
    logger.info(f"Allowed Origins: {get_allowed_origins()}")
    
    # API Key status
    api_key = get_api_key('gemini')
    logger.info(f"API Key Status: {'Configured' if api_key and api_key != 'your_gemini_api_key_here' else 'NOT CONFIGURED - Please set GEMINI_API_KEY environment variable'}")
    
    # Check if files exist
    required_files = ['index.html', 'assets/css/style.css', 'src/js/main.js']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        logger.error(f"Missing required files: {', '.join(missing_files)}")
        sys.exit(1)
    
    # Load users from file once at startup
    logger.info("Loading users...")
    users.update(load_users())
    logger.info(f"Loaded {len(users)} user(s)")
    
    # Load existing sessions from file
    logger.info("Loading existing sessions...")
    sessions.update(load_sessions())
    logger.info(f"Loaded {len(sessions)} active session(s)")
    
    # Load rate limits from file
    logger.info("Loading rate limits...")
    rate_limits.update(load_rate_limits())
    logger.info(f"Loaded {len(rate_limits)} rate limit(s)")
    
    # Load config overrides
    logger.info("Loading config overrides...")
    load_config_override()
    logger.info("Config overrides loaded")
    
    run_server(port)