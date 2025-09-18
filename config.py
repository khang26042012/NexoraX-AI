#!/usr/bin/env python3
"""
NovaX AI Configuration File
Chỉnh sửa file này để thay đổi API keys và cấu hình khác
"""

import os

# ===========================================
# API KEYS CONFIGURATION
# Thay thế các giá trị bên dưới bằng API keys thực tế của bạn
# ===========================================

# Google Gemini API Key
# Lấy miễn phí tại: https://aistudio.google.com/app/apikey
# IMPORTANT: Use Replit Secrets instead of hardcoding keys here
GEMINI_API_KEY = "your_gemini_api_key_here"

# Groq API Key
# Lấy tại: https://console.groq.com/keys
# IMPORTANT: Use Replit Secrets instead of hardcoding keys here
GROQ_API_KEY = "your_groq_api_key_here"

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

# CORS settings
ALLOWED_ORIGINS = ["localhost", "replit"]

# Request timeout (seconds)
REQUEST_TIMEOUT = 30

# Maximum file upload size (bytes)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def get_api_key(service):
    """
    Lấy API key từ config hoặc environment variables
    Environment variables luôn có ưu tiên cao hơn
    """
    if service.lower() == "gemini":
        return os.getenv('GEMINI_API_KEY', GEMINI_API_KEY)
    elif service.lower() == "groq":
        return os.getenv('GROQ_API_KEY', GROQ_API_KEY)
    else:
        return None

def get_server_port():
    """Lấy port từ environment hoặc config"""
    return int(os.getenv('PORT', DEFAULT_PORT))

# Kiểm tra cấu hình khi import
def check_config():
    """Kiểm tra xem API keys đã được cấu hình chưa"""
    gemini_key = get_api_key("gemini")
    groq_key = get_api_key("groq")
    
    warnings = []
    if gemini_key == "your_gemini_api_key_here":
        warnings.append("⚠️  GEMINI_API_KEY chưa được cấu hình")
    if groq_key == "your_groq_api_key_here":
        warnings.append("⚠️  GROQ_API_KEY chưa được cấu hình")
    
    return warnings

if __name__ == "__main__":
    print("🔧 NovaX AI Configuration")
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