# 🚀 HƯỚNG DẪN DEPLOY NEXORAX AI LÊN RENDER

## 📋 Tổng quan
Hướng dẫn chi tiết cách deploy NexoraX AI lên Render.com - nền tảng hosting miễn phí với HTTPS tự động.

---

## 🔧 Bước 1: Chuẩn bị Repository

### 1.1. Push code lên GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 1.2. Kiểm tra file cần thiết
Đảm bảo repository có các file:
- ✅ `server.py` - Python server
- ✅ `Procfile` - File cấu hình start server cho Render
- ✅ `requirements.txt` - Python dependencies (có thể để trống nếu dùng built-in modules)
- ✅ `index.html` - Frontend
- ✅ `assets/` và `src/` - Static files

---

## 🌐 Bước 2: Tạo Web Service trên Render

### 2.1. Đăng nhập Render
1. Truy cập: https://render.com/
2. Đăng nhập bằng GitHub account
3. Cho phép Render truy cập repositories

### 2.2. Tạo Web Service mới
1. Click nút **"New +"** → Chọn **"Web Service"**
2. Chọn repository **NexoraX AI** từ danh sách
3. Click **"Connect"**

### 2.3. Cấu hình Web Service

**Basic Settings:**
- **Name**: `nexorax-ai` (hoặc tên bạn muốn)
- **Region**: Singapore (gần Việt Nam nhất)
- **Branch**: `main`
- **Root Directory**: Để trống
- **Runtime**: `Python 3`
- **Build Command**: Để trống (không cần build)
- **Start Command**: `python3 server.py` (Render sẽ tự động đọc từ Procfile)

**Instance Type:**
- Chọn **"Free"** (miễn phí, đủ dùng)

---

## 🔑 Bước 3: Thiết lập Environment Variables

### 3.1. Thêm API Keys (BẮT BUỘC)

Trong phần **"Environment"**, click **"Add Environment Variable"** và thêm:

#### 1. Gemini API Key (BẮT BUỘC)
```
Key: GEMINI_API_KEY
Value: [API key của bạn]
```
🔗 Lấy tại: https://aistudio.google.com/app/apikey

#### 2. SerpAPI Key (cho tính năng search)
```
Key: SERPAPI_API_KEY
Value: [API key của bạn]
```
🔗 Lấy tại: https://serpapi.com/manage-api-key

#### 3. LLM7 API Key (cho GPT-5 Mini và Gemini Search)
```
Key: LLM7_API_KEY
Value: [API key của bạn]
```
🔗 Lấy tại: https://llm7.io/api

### 3.2. PORT (Tự động)
Render sẽ tự động set biến `PORT`, bạn **KHÔNG cần** thêm thủ công.

---

## 📦 Bước 4: Deploy

1. Click nút **"Create Web Service"**
2. Render sẽ:
   - Clone repository
   - Install dependencies (nếu có trong requirements.txt)
   - Chạy lệnh trong Procfile: `python3 server.py`
   - Tạo HTTPS URL miễn phí

3. Đợi 2-5 phút để deploy hoàn tất
4. Khi thấy ✅ **"Live"**, click vào URL để xem web

---

## 🌍 Bước 5: Thêm Custom Domain từ Pavietnam

### 5.1. Chuẩn bị Domain

Sau khi mua domain trên **Pavietnam** (pavietnam.vn), bạn cần cấu hình DNS.

### 5.2. Lấy thông tin từ Render

1. Trong Render Dashboard, vào Web Service của bạn
2. Click tab **"Settings"** 
3. Scroll xuống phần **"Custom Domains"**
4. Click **"Add Custom Domain"**
5. Nhập domain của bạn (ví dụ: `nexorax.com` hoặc `www.nexorax.com`)
6. Render sẽ hiển thị thông tin DNS cần cấu hình:
   - **CNAME record** (cho www subdomain)
   - **A record** (cho root domain)

**Ví dụ:**
```
Type: CNAME
Name: www
Value: nexorax-ai.onrender.com
```

### 5.3. Cấu hình DNS trên Pavietnam

#### Bước 1: Đăng nhập Pavietnam
1. Truy cập: https://pavietnam.vn/
2. Đăng nhập tài khoản
3. Vào **"Quản lý Domain"** → Chọn domain của bạn

#### Bước 2: Vào DNS Manager
1. Click vào domain cần cấu hình
2. Tìm phần **"DNS Management"** hoặc **"Quản lý DNS"**
3. Click **"Manage DNS Records"** hoặc **"Quản lý bản ghi DNS"**

#### Bước 3: Thêm CNAME Record (cho www subdomain)
1. Click **"Add Record"** hoặc **"Thêm bản ghi"**
2. Chọn **Type: CNAME**
3. Điền thông tin:
   ```
   Type: CNAME
   Name: www
   Value: [domain từ Render, ví dụ: nexorax-ai.onrender.com]
   TTL: 3600 (hoặc Auto)
   ```
4. Click **"Save"** hoặc **"Lưu"**

#### Bước 4: Thêm A Record (cho root domain) - TÙY CHỌN
Nếu bạn muốn dùng domain gốc (không có www), thêm A record:

1. Lấy IP từ Render (hoặc dùng CNAME flattening nếu Pavietnam hỗ trợ)
2. Thêm bản ghi:
   ```
   Type: A
   Name: @ (hoặc để trống)
   Value: [IP từ Render]
   TTL: 3600
   ```

**Lưu ý:** Một số DNS provider không cho phép CNAME cho root domain. Trong trường hợp này:
- Chỉ dùng `www.nexorax.com`
- HOẶC dùng ALIAS/ANAME record nếu Pavietnam hỗ trợ

### 5.4. Xác minh Domain trên Render

1. Quay lại Render Dashboard
2. Trong phần **"Custom Domains"**, domain của bạn sẽ hiển thị trạng thái **"Verifying..."**
3. Đợi 5-30 phút để DNS propagate (lan truyền)
4. Khi thấy ✅ **"Verified"**, domain đã hoạt động
5. Render sẽ tự động tạo HTTPS certificate (Let's Encrypt)

### 5.5. Kiểm tra Domain

Sau khi DNS propagate (có thể mất 5 phút - 24 giờ):
1. Truy cập domain của bạn: `https://www.nexorax.com`
2. Kiểm tra HTTPS đã hoạt động (ổ khóa xanh trên trình duyệt)
3. Test tất cả tính năng: login, chat, AI models

---

## ⚙️ Bước 6: Cấu hình Nâng cao (Tùy chọn)

### 6.1. Redirect Root Domain → www
Nếu muốn `nexorax.com` tự động chuyển sang `www.nexorax.com`:

1. Trong Pavietnam DNS, thêm URL Redirect/Forward:
   ```
   From: nexorax.com
   To: https://www.nexorax.com
   Type: 301 Permanent
   ```

### 6.2. Auto-Deploy
Render tự động deploy khi bạn push code mới lên GitHub:
```bash
git add .
git commit -m "Update feature"
git push origin main
```
→ Render tự động build và deploy trong vài phút

### 6.3. Health Check
Render tự động health check server của bạn mỗi 30 giây. Nếu server down, Render sẽ tự restart.

---

## 🔍 Bước 7: Troubleshooting

### ❌ Lỗi: "Application failed to respond"
**Nguyên nhân:** Server không chạy đúng port

**Giải pháp:**
1. Kiểm tra server.py có đọc `PORT` từ environment:
   ```python
   port = int(os.getenv('PORT', 5000))
   ```
2. Kiểm tra Procfile:
   ```
   web: python3 server.py
   ```

### ❌ Lỗi: API Keys không hoạt động
**Giải pháp:**
1. Vào Settings → Environment
2. Kiểm tra các biến:
   - `GEMINI_API_KEY` đã set chưa?
   - `SERPAPI_API_KEY` đã set chưa?
   - `LLM7_API_KEY` đã set chưa?
3. Sau khi thêm/sửa, click **"Save Changes"**
4. Render sẽ tự động redeploy

### ❌ Domain không hoạt động
**Nguyên nhân:** DNS chưa propagate

**Giải pháp:**
1. Đợi thêm thời gian (tối đa 24-48 giờ)
2. Kiểm tra DNS bằng tool: https://dnschecker.org/
3. Nhập domain và kiểm tra CNAME record đã đúng chưa
4. Clear browser cache: Ctrl + Shift + R (hoặc Cmd + Shift + R)

### ❌ HTTPS không hoạt động
**Nguyên nhân:** SSL certificate chưa được tạo

**Giải pháp:**
1. Đợi Render tự động tạo SSL (5-15 phút sau khi domain verified)
2. Nếu vẫn lỗi, remove domain và add lại
3. Đảm bảo DNS đã trỏ đúng trước khi add domain

---

## 📊 Giám sát và Logs

### Xem Logs
1. Vào Render Dashboard
2. Click vào Web Service
3. Click tab **"Logs"**
4. Xem real-time logs của server

### Metrics
1. Click tab **"Metrics"**
2. Xem:
   - CPU usage
   - Memory usage
   - Request count
   - Response time

---

## 💰 Chi phí

### Free Plan (Miễn phí)
- ✅ 750 giờ/tháng
- ✅ Auto-sleep sau 15 phút không dùng
- ✅ HTTPS miễn phí
- ✅ Custom domain miễn phí
- ⚠️ Giới hạn: 512 MB RAM, 0.1 CPU

### Paid Plan (Nếu cần)
- **Starter:** $7/tháng
  - Không auto-sleep
  - 512 MB RAM
  - Unlimited bandwidth

---

## ✅ Checklist Hoàn thành

- [ ] Code đã push lên GitHub
- [ ] Web Service đã tạo trên Render
- [ ] Environment variables đã set (GEMINI_API_KEY, SERPAPI_API_KEY, LLM7_API_KEY)
- [ ] Deploy thành công, status là "Live"
- [ ] Custom domain đã add trên Render
- [ ] DNS records đã cấu hình trên Pavietnam (CNAME)
- [ ] Domain đã verified trên Render
- [ ] HTTPS đã hoạt động
- [ ] Web đã test và hoạt động tốt

---

## 🎉 Hoàn thành!

Website của bạn đã live tại:
- 🔗 Render URL: `https://nexorax-ai.onrender.com`
- 🔗 Custom Domain: `https://www.nexorax.com` (nếu đã setup)

Mọi thay đổi chỉ cần push lên GitHub, Render sẽ tự động deploy!

---

## 📞 Hỗ trợ

- **Render Docs:** https://render.com/docs
- **Pavietnam Support:** https://pavietnam.vn/support
- **DNS Checker:** https://dnschecker.org/
- **SSL Checker:** https://www.sslshopper.com/ssl-checker.html