# WebSocket Error - Quick Fix Guide

## 🎯 Most Common Fix (Try This First!)

### 1. Set Environment Variables in Production

Add these to your production environment (Vercel, Railway, etc.):

```bash
INNGEST_SIGNING_KEY=signkey_prod_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Critical**: 
- ✅ Use `https://` (not `http://`)
- ✅ No trailing slash
- ✅ Use your actual production domain

### 2. Redeploy

After setting the variables, **redeploy your application**.

### 3. Clear Browser Cache

Clear your browser cache and test again.

## 🔍 How to Verify It's Fixed

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Look for**: `[Realtime] Token generated successfully`
4. **Check Network tab** for WebSocket connections (should show `wss://`)

## 🐛 If Still Not Working

Check the browser console for specific errors:
- **"Mixed Content"** → Your site is HTTPS but trying to use `ws://` (should be `wss://`)
- **"CORS error"** → Cross-origin issue
- **"Failed to fetch"** → Token generation failed (check server logs)
- **"Unauthorized"** → Authentication issue

## 📋 Full Troubleshooting

See `WEBSOCKET_PRODUCTION_FIX.md` for detailed troubleshooting steps.

