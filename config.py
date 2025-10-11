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

# SerpAPI Search API Key
# API tìm kiếm web để lấy kết quả từ Google, Bing, etc: https://serpapi.com
# Environment variable SERPAPI_API_KEY will override this if set
SERPAPI_API_KEY = "e5e04b97a6f406a53f9430701e795fb8d306cdc7514a8d68bbbc6c6b0a4d4a98"

# LLM7.io API Key
# API miễn phí cho nhiều mô hình AI: https://llm7.io/
# Environment variable LLM7_API_KEY will override this if set
LLM7_API_KEY = "nw8G+LKJny13aUM7OYCWTe47Uwg7uo4TM4EMPf1JxFjhKMK9pjFbp09NXqSkAka57mikeYbJPn99WToaqpQjddd2k95oNvNxxVb8VvP5mc8mAVPL6H/Lym34g9/YUgWV3WKM"


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

# Request timeout (seconds) - Optimized for better performance
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
    elif service.lower() == "serpapi":
        return os.getenv('SERPAPI_API_KEY', SERPAPI_API_KEY)
    elif service.lower() == "llm7":
        return os.getenv('LLM7_API_KEY', LLM7_API_KEY)
    else:
        return None

def get_server_port():
    """Lấy port từ environment hoặc config"""
    return int(os.getenv('PORT', DEFAULT_PORT))

# Kiểm tra cấu hình khi import
def check_config():
    """Kiểm tra xem API keys đã được cấu hình chưa"""
    gemini_key = get_api_key("gemini")
    serpapi_key = get_api_key("serpapi")
    llm7_key = get_api_key("llm7")
    
    warnings = []
    if gemini_key == "your_gemini_api_key_here":
        warnings.append("⚠️  GEMINI_API_KEY chưa được cấu hình")
    
    if serpapi_key == "your_serpapi_api_key_here":
        warnings.append("⚠️  SERPAPI_API_KEY chưa được cấu hình")
    
    if llm7_key == "your_llm7_api_key_here":
        warnings.append("⚠️  LLM7_API_KEY chưa được cấu hình")
    
    return warnings

if __name__ == "__main__":
    print("🔧 NexoraX AI Configuration")
    print("=" * 40)
    warnings = check_config()
    if warnings:
        for warning in warnings:
            print(warning)
        print("\n📝 Hướng dẫn (KHUYẾN NGHỊ dùng Environment Variables):")
        print("\n🔐 Cách 1 - Environment Variables (BẢO MẬT, khuyến nghị):")
        print("  • Render: Vào Dashboard > Environment > Thêm biến môi trường")
        print("  • Replit: Nhấn biểu tượng khóa (Secrets) > Thêm secret mới")
        print("  • Local: export GEMINI_API_KEY='key_của_bạn'")
        print("\n⚠️  Cách 2 - Chỉnh sửa config.py (KHÔNG khuyến nghị cho production):")
        print("  1. Chỉnh sửa file config.py")  
        print("  2. Thay thế 'your_xxx_api_key_here' bằng API key thực")
        print("  3. QUAN TRỌNG: Không commit file này lên Git!")
        print("  4. Lưu file và khởi động lại server")
    else:
        print("✅ Tất cả API keys đã được cấu hình!")