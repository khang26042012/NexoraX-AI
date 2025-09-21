# NexoraX AI - Render Deployment Guide

## Quick Setup Steps

### 1. Deploy to Render
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: (leave empty - no build needed)
4. Set start command: `python3 server.py`

### 2. Environment Variables
**IMPORTANT**: Add this environment variable in Render dashboard:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Common Issues & Solutions

#### Issue: "Dữ liệu trả về không hợp lệ"
**Cause**: Missing or invalid GEMINI_API_KEY
**Solution**: 
- Go to Render Dashboard → Your Service → Environment
- Add GEMINI_API_KEY with your actual Google AI Studio API key
- Redeploy the service

#### Issue: CORS errors
**Cause**: Already fixed in latest code
**Solution**: Latest deployment automatically handles Render domains

### 4. Getting Gemini API Key
1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Create new API key
4. Copy the key and add to Render environment variables

### 5. Test Deployment
After deployment, your app will be available at:
`https://your-service-name.onrender.com`

The app will automatically detect it's running on Render and configure CORS accordingly.

## Troubleshooting
- Check Render logs for detailed error messages
- Ensure GEMINI_API_KEY is set correctly
- Verify the API key works by testing locally first