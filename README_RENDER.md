# Hướng Dẫn Deploy NexoraX AI lên Render

## Bước 1: Chuẩn bị Repository
1. Push code lên GitHub repository
2. Đảm bảo có các file: `server.py`, `requirements.txt`, `index.html`, `assets/`

## Bước 2: Tạo Web Service trên Render
1. Đăng nhập [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Kết nối GitHub repository của bạn
4. Cấu hình như sau:

### Cấu hình Cơ Bản
- **Name**: nexorax-ai (hoặc tên bạn muốn)
- **Runtime**: Python 3
- **Build Command**: `pip install -r requirements.txt` (hoặc để trống vì không cần)
- **Start Command**: `python3 server.py`

### Environment Variables (Quan Trọng!)
Thêm các biến môi trường:
- `GEMINI_API_KEY`: API key từ [Google AI Studio](https://aistudio.google.com/app/apikey)
- `GROQ_API_KEY`: API key từ [Groq Console](https://console.groq.com/keys) (tùy chọn)
- `PORT`: Render tự động set, không cần thêm

## Bước 3: Deploy
1. Click "Create Web Service"
2. Đợi deploy hoàn thành (khoảng 2-5 phút)
3. Render sẽ tự động tạo URL như: `https://your-app.onrender.com`

## Bước 4: Test
1. Mở URL được cung cấp
2. Thử gửi tin nhắn để test API
3. Kiểm tra logs nếu có lỗi

## Lưu Ý
- **Miễn phí**: Render free tier có thể sleep sau 15 phút không hoạt động
- **HTTPS**: Render tự động cung cấp SSL certificate
- **Domains**: Có thể add custom domain sau khi verify

## Troubleshooting
- Nếu lỗi "API key not configured": Kiểm tra Environment Variables
- Nếu lỗi CORS: App đã được cấu hình sẵn cho Render
- Nếu app sleep: Dùng paid plan hoặc ping định kỳ

## Files Cần Thiết
```
project/
├── server.py           # Main server
├── index.html          # Frontend
├── requirements.txt    # Python dependencies
├── config.py          # Config file
└── assets/            # CSS/JS files
    ├── css/style.css
    └── js/app.js
```