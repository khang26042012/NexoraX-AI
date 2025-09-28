#!/usr/bin/env python3
"""
NexoraX AI Configuration File
Chỉnh sửa file này để thay đổi API keys và cấu hình khác
"""

import os

# ===========================================
# API KEYS CONFIGURATION
# Thay thế các giá trị bên dưới bằng API keys thực tế của bạn
# ===========================================

# Google Gemini API Key
# Lấy miễn phí tại: https://aistudio.google.com/app/apikey
# Environment variable GEMINI_API_KEY will override this if set
GEMINI_API_KEY = "AIzaSyDhWAco4k7ajmzonA97uoRgVJvxfQblJFI"

# Tavily Search API Key
# API tìm kiếm web được tối ưu cho LLMs: https://tavily.com
# Environment variable TAVILY_API_KEY will override this if set
TAVILY_API_KEY = "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"


# ===========================================
# SERVER CONFIGURATION
# ===========================================

# Cổng mặc định cho development (sẽ tự động dùng PORT từ môi trường khi deploy)
DEFAULT_PORT = 5000

# Host binding (luôn giữ 0.0.0.0 cho Replit)
SERVER_HOST = "0.0.0.0"

# ===========================================
# ADVANCED SETTINGS
# ===========================================

# CORS settings - Secure origins only
ALLOWED_ORIGINS = [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    # Render deployment URL will be auto-detected from environment
    # Replit domain will be auto-detected from environment
]

def get_allowed_origins():
    """Get secure list of allowed origins"""
    origins = ALLOWED_ORIGINS.copy()
    
    # Add Replit domain if available
    replit_domain = os.getenv('REPLIT_DOMAIN', '') or os.getenv('REPLIT_DEV_DOMAIN', '')
    if replit_domain:
        origins.append(f"https://{replit_domain}")
    
    # Add Render domain if available  
    render_url = os.getenv('RENDER_EXTERNAL_URL', '')
    if render_url:
        origins.append(render_url)
        # Also add without trailing slash
        origins.append(render_url.rstrip('/'))
    
    # Additional Render domain detection
    render_service = os.getenv('RENDER_SERVICE_NAME', '')
    if render_service:
        origins.append(f"https://{render_service}.onrender.com")
    
    # For production on Render - allow Render domains
    if os.getenv('RENDER'):
        # Allow all .onrender.com domains for Render deployment
        return ["*"]
    
    # For Replit proxy requirements - allow all hosts for development
    # This is necessary because Replit shows the website in an iframe proxy
    if os.getenv('REPLIT_DOMAIN') or os.getenv('REPLIT_DEV_DOMAIN'):
        return ["*"]
        
    return [origin for origin in origins if origin]

# Request timeout (seconds) - Increased for Pro users with unlimited tokens
REQUEST_TIMEOUT = 120

# Maximum file upload size (bytes)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def get_api_key(service):
    """
    Lấy API key từ config hoặc environment variables
    Environment variables luôn có ưu tiên cao hơn
    """
    if service.lower() == "gemini":
        return os.getenv('GEMINI_API_KEY', GEMINI_API_KEY)
    elif service.lower() == "tavily":
        return os.getenv('TAVILY_API_KEY', TAVILY_API_KEY)
    else:
        return None

def get_server_port():
    """Lấy port từ environment hoặc config"""
    return int(os.getenv('PORT', DEFAULT_PORT))

# Kiểm tra cấu hình khi import
def check_config():
    """Kiểm tra xem API keys đã được cấu hình chưa"""
    gemini_key = get_api_key("gemini")
    tavily_key = get_api_key("tavily")
    
    warnings = []
    if gemini_key == "your_gemini_api_key_here":
        warnings.append("⚠️  GEMINI_API_KEY chưa được cấu hình")
    
    if tavily_key == "your_tavily_api_key_here":
        warnings.append("⚠️  TAVILY_API_KEY chưa được cấu hình")
    
    return warnings

if __name__ == "__main__":
    print("🔧 NexoraX AI Configuration")
    print("=" * 40)
    warnings = check_config()
    if warnings:
        for warning in warnings:
            print(warning)
        print("\n📝 Hướng dẫn:")
        print("1. Chỉnh sửa file config.py")  
        print("2. Thay thế 'your_xxx_api_key_here' bằng API key thực")
        print("3. Lưu file và khởi động lại server")
    else:
        print("✅ Tất cả API keys đã được cấu hình!")