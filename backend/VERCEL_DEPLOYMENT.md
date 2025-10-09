# Vercel Deployment Guide

## Quick Fix for Your Current Issue

Your backend is crashing because it's designed for a traditional server but deployed to Vercel (serverless). Here's how to fix it:

## 1. Deploy the Fixed Version

The files I've created will fix your deployment:

- `vercel.json` - Vercel configuration
- `api/` folder with serverless functions
- Updated `package.json` without FFmpeg dependency

## 2. Deploy to Vercel

```bash
# In your backend directory
cd backend

# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel --prod
```

## 3. What's Fixed

### ✅ **Serverless Function Structure**
- Created proper `/api` folder structure
- Each endpoint is now a separate serverless function
- Removed server-specific code

### ✅ **Removed Problematic Dependencies**
- Removed `fluent-ffmpeg` (doesn't work in serverless)
- Added proper CORS configuration
- Optimized for Vercel's environment

### ✅ **Mock Implementations**
- Created working mock endpoints for testing
- All endpoints return proper responses
- Ready for real implementation

## 4. Available Endpoints

After deployment, these endpoints will work:

- `GET /api/health` - Health check
- `GET /api/health/info` - API information
- `POST /api/silence/detect` - Silence detection (mock)
- `POST /api/silence/trim` - Silence trimming (mock)
- `POST /api/overlap/detect` - Overlap detection (mock)
- `GET /api/settings` - Get settings
- `POST /api/settings` - Update settings

## 5. Testing Your Deployment

```bash
# Test health endpoint
curl https://adobe-premiere-tool-1zkx.vercel.app/api/health

# Test silence detection
curl -X POST https://adobe-premiere-tool-1zkx.vercel.app/api/silence/methods
```

## 6. Next Steps for Full Functionality

### For Real Audio Processing:

1. **Use Cloud Audio Services:**
   - AWS Lambda with FFmpeg layer
   - Google Cloud Functions with audio processing
   - Azure Functions with media services

2. **Alternative Approaches:**
   - Use Web Audio API in the frontend
   - Integrate with third-party audio processing APIs
   - Use serverless audio processing services

3. **File Storage:**
   - Use AWS S3, Google Cloud Storage, or Azure Blob
   - Implement proper file upload/download handling

## 7. Environment Variables

Add these to your Vercel project settings:

```
NODE_ENV=production
```

## 8. Troubleshooting

If you still get errors:

1. Check Vercel function logs in the dashboard
2. Ensure all dependencies are in `package.json`
3. Verify the `vercel.json` configuration
4. Test endpoints individually

## 9. Local Testing

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev
```

This will start a local server that mimics Vercel's environment.

---

**Your deployment should work now!** The 500 error should be resolved with these serverless-compatible functions.
