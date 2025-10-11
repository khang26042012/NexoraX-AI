# Deploy NexoraX AI lên Koyeb

Hướng dẫn chi tiết để deploy ứng dụng NexoraX AI lên nền tảng Koyeb.com

## 🚀 Tại sao chọn Koyeb?

- ✅ **Miễn phí** với plan Hobby (2 web services)
- ✅ **Tự động scale** theo traffic
- ✅ **HTTPS/SSL** miễn phí tự động
- ✅ **Global CDN** - nhanh toàn cầu
- ✅ **Auto-healing** - tự động khôi phục khi lỗi
- ✅ **Zero-downtime deployment**
- ✅ **Git-based deployment** - push code là deploy tự động

## 📋 Yêu cầu

1. Tài khoản GitHub (để push code)
2. Tài khoản Koyeb (đăng ký miễn phí tại https://www.koyeb.com)
3. API Keys của bạn:
   - Gemini API Key
   - SerpAPI Key
   - LLM7 API Key

## 🛠️ Các bước Deploy

### Bước 1: Push code lên GitHub

```bash
# Nếu chưa có git repo
git init
git add .
git commit -m "Deploy to Koyeb"

# Tạo repo mới trên GitHub, sau đó:
git remote add origin https://github.com/<USERNAME>/<REPO-NAME>.git
git branch -M main
git push -u origin main
```

### Bước 2: Tạo Web Service trên Koyeb

1. Đăng nhập vào https://app.koyeb.com
2. Click **Create Web Service**
3. Chọn **GitHub** làm deployment method
4. **Authorize Koyeb** để truy cập GitHub của bạn
5. Chọn repository và branch (thường là `main`)

### Bước 3: Cấu hình Deployment

#### **Build Settings**
- **Build method**: Buildpack (Koyeb tự động detect Python)
- **Run command**: Koyeb sẽ tự động dùng `Procfile` (đã có sẵn)

#### **Environment Variables** ⚠️ **QUAN TRỌNG**

Bạn **BẮT BUỘC** phải thêm các API Keys sau để app hoạt động:

1. Click **Add Environment Variable** 
2. Thêm **từng biến** sau đây:

| Variable Name | Value | Secret | Required |
|--------------|-------|--------|----------|
| `GEMINI_API_KEY` | Gemini API key của bạn | ✅ | **BẮT BUỘC** |
| `SERPAPI_API_KEY` | SerpAPI key của bạn | ✅ | **BẮT BUỘC** |
| `LLM7_API_KEY` | LLM7 API key của bạn | ✅ | **BẮT BUỘC** |

**⚠️ Lưu ý quan trọng:**
- ✅ Check vào cột **"Secret"** để ẩn giá trị (bảo mật)
- ✅ Thay `your_xxx_api_key_here` bằng API key THẬT của bạn
- ❌ KHÔNG để giá trị mặc định `your_xxx_api_key_here` - app sẽ báo lỗi!
- Koyeb TỰ ĐỘNG set: `PORT`, `KOYEB_APP_NAME`, etc. - Bạn KHÔNG cần thêm

#### **Exposed Port**
- Port: `8000` (Koyeb sẽ tự động set PORT environment variable)

#### **Instance Type**
- **Free tier**: Chọn `eco` (512MB RAM, 0.1 vCPU)
- **Paid tier**: Chọn `small` hoặc cao hơn nếu cần performance tốt hơn

#### **Scaling**
- **Min instances**: 1
- **Max instances**: 1 (free tier) hoặc nhiều hơn để auto-scale

### Bước 4: Deploy

1. Click **Deploy** ở góc dưới bên phải
2. Koyeb sẽ:
   - Clone repository từ GitHub
   - Detect Python và cài dependencies (nếu có trong `requirements.txt`)
   - Chạy lệnh từ `Procfile`: `python3 server.py`
   - Expose ứng dụng trên HTTPS

**Deployment mất khoảng 2-3 phút**

### Bước 5: Kiểm tra

1. Sau khi deploy xong, bạn sẽ có URL dạng:
   ```
   https://<app-name>-<org-name>.koyeb.app
   ```

2. Click vào URL để mở ứng dụng
3. Kiểm tra:
   - ✅ Giao diện hiển thị đúng
   - ✅ Đăng nhập/đăng ký hoạt động
   - ✅ Chat với AI hoạt động (Gemini, GPT-5, etc.)

## 🔄 Auto Deployment

Sau khi setup xong, mỗi lần bạn push code lên GitHub:

```bash
git add .
git commit -m "Update feature X"
git push
```

→ Koyeb sẽ **TỰ ĐỘNG** deploy phiên bản mới (zero-downtime)

## 📊 Monitoring & Environment Variables

Trong Koyeb dashboard:

- **Logs**: Xem real-time logs của server (Environment sẽ hiển thị "Koyeb")
- **Metrics**: CPU, RAM, Request/s
- **Deployments**: Lịch sử các lần deploy
- **Settings**: Thay đổi environment variables, scaling, etc.

### Koyeb Environment Variables (Tự động)

Koyeb tự động set các biến sau (bạn KHÔNG cần set thủ công):

| Variable | Description |
|----------|-------------|
| `KOYEB_APP_NAME` | Tên ứng dụng của bạn |
| `KOYEB_SERVICE_NAME` | Tên service |
| `KOYEB_PUBLIC_DOMAIN` | Domain public (vd: `your-app.koyeb.app`) |
| `KOYEB_DEPLOYMENT_ID` | ID của deployment hiện tại |
| `KOYEB_INSTANCE_ID` | ID của instance cụ thể |
| `KOYEB_INSTANCE_REGION` | Region đang chạy (runtime only) |
| `PORT` | Port server cần listen (tự động set) |

Server NexoraX sẽ tự động nhận diện Koyeb qua biến `KOYEB_APP_NAME`.

## 🐛 Troubleshooting

### Lỗi: "Application failed to start"

**Nguyên nhân**: Server không bind đúng PORT

**Giải pháp**: Đảm bảo server.py đọc PORT từ environment variable:
```python
port = int(os.getenv('PORT', 5000))
```
→ Code đã có sẵn, không cần sửa gì

### Lỗi: "API Key not configured"

**Nguyên nhân**: Chưa set environment variables trong Koyeb

**Giải pháp**:
1. Vào **Settings** → **Environment Variables**
2. Thêm `GEMINI_API_KEY`, `SERPAPI_API_KEY`, `LLM7_API_KEY`
3. Click **Redeploy** để áp dụng thay đổi

### Lỗi: "Build failed"

**Nguyên nhân**: Thường do syntax error trong code

**Giải pháp**:
1. Xem **Build logs** để tìm lỗi cụ thể
2. Fix lỗi trong code
3. Push lại lên GitHub

## 💡 Tips

### Sử dụng Custom Domain

1. Vào **Settings** → **Domains**
2. Click **Add Domain**
3. Nhập domain của bạn (ví dụ: `nexorax.com`)
4. Cập nhật DNS records theo hướng dẫn của Koyeb
5. Koyeb tự động cấp SSL certificate cho domain

### Tăng Performance

1. **Enable Caching**: Thêm Cache-Control headers trong server.py
2. **Use CDN**: Koyeb đã tích hợp global CDN sẵn
3. **Scale Instances**: Tăng số instance trong Settings → Scaling

### Backup & Rollback

- Mỗi lần deploy, Koyeb lưu snapshot
- Nếu có lỗi, click vào deployment cũ và **Redeploy** để rollback

## 📞 Hỗ trợ

- **Koyeb Docs**: https://www.koyeb.com/docs
- **Koyeb Discord**: https://discord.gg/koyeb
- **Email Support**: support@koyeb.com

## ✅ Checklist Deploy

- [ ] Push code lên GitHub
- [ ] Tạo Web Service trên Koyeb
- [ ] Kết nối GitHub repository
- [ ] Thêm Environment Variables (GEMINI_API_KEY, SERPAPI_API_KEY, LLM7_API_KEY)
- [ ] Set exposed port: 8000
- [ ] Deploy
- [ ] Kiểm tra app hoạt động
- [ ] (Optional) Add custom domain

---

**Chúc bạn deploy thành công! 🎉**

Nếu cần hỗ trợ thêm, hãy xem logs trong Koyeb dashboard hoặc liên hệ support.
