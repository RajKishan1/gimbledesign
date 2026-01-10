# WebSocket Error in Production - Troubleshooting Guide

## 🔍 Common Causes

Your app uses `@inngest/realtime` which relies on WebSocket connections. Here are the most common reasons why WebSockets fail in production but work locally:

### 1. **HTTPS/WSS Protocol Mismatch** (Most Common)
**Problem**: Production sites use HTTPS, but WebSocket connections might be trying to use insecure `ws://` instead of secure `wss://`

**Solution**: 
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly with `https://` protocol
- The `@inngest/realtime` library should automatically use WSS when your site is HTTPS, but verify your environment variable

### 2. **Missing or Incorrect Environment Variables**
**Problem**: Required environment variables for Inngest Realtime are missing or incorrect

**Required Variables**:
```bash
# REQUIRED for production
INNGEST_SIGNING_KEY=signkey_prod_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://your-domain.com  # Must use https://

# Optional but recommended
INNGEST_EVENT_KEY=xxxxxxxxxxxxx
```

**Check**:
- [ ] `INNGEST_SIGNING_KEY` is set in production environment
- [ ] `NEXT_PUBLIC_APP_URL` is set and uses `https://` (not `http://`)
- [ ] No trailing slashes in `NEXT_PUBLIC_APP_URL` (e.g., `https://domain.com` not `https://domain.com/`)

### 3. **Reverse Proxy/Platform Configuration**
**Problem**: Your hosting platform (Vercel, Railway, etc.) might not be configured to handle WebSocket upgrades

**Platform-Specific Solutions**:

#### **Vercel**:
- Vercel supports WebSockets, but ensure:
  - You're using the latest Next.js version
  - No custom server configuration blocking WebSocket upgrades
  - Edge functions are not interfering

#### **Railway/Render/Other Platforms**:
- Ensure your platform supports WebSocket connections
- Check if you need to configure a reverse proxy (nginx) to handle WebSocket upgrades

### 4. **CORS/Network Restrictions**
**Problem**: Production network policies might block WebSocket connections

**Solution**: 
- Check browser console for CORS errors
- Verify Inngest realtime service allows connections from your domain
- Check if your firewall/network blocks WebSocket traffic

### 5. **Inngest Realtime Service Configuration**
**Problem**: The Inngest realtime service might not be properly configured for your production environment

**Solution**:
- Verify your Inngest account is set up correctly
- Check Inngest Dashboard → Settings → Realtime
- Ensure your app is synced with Inngest Cloud

## 🔧 Step-by-Step Fix

### Step 1: Verify Environment Variables

Check your production environment has these variables set:

```bash
# In your production platform (Vercel, Railway, etc.)
INNGEST_SIGNING_KEY=signkey_prod_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://your-actual-domain.com
```

**Important**: 
- `NEXT_PUBLIC_APP_URL` must start with `https://` (not `http://`)
- Remove any trailing slashes
- Use your actual production domain

### Step 2: Check Browser Console

Open your production site and check the browser console for specific errors:

1. **Open DevTools** (F12)
2. **Go to Console tab**
3. **Look for errors like**:
   - `WebSocket connection failed`
   - `Mixed Content` errors (HTTP on HTTPS page)
   - `CORS` errors
   - `Failed to fetch` errors

### Step 3: Verify Token Generation

The `fetchRealtimeSubscriptionToken()` function should work in production. Check:

1. **Network Tab** in DevTools
2. **Look for requests to** `/api/inngest` or realtime endpoints
3. **Check if they return 200 OK** or error codes

### Step 4: Test Realtime Connection

Add temporary logging to verify the connection:

```typescript
// In context/canvas-context.tsx, temporarily add:
useEffect(() => {
  console.log('Realtime subscription status:', {
    hasFreshData: !!freshData,
    dataLength: freshData?.length || 0,
  });
}, [freshData]);
```

### Step 5: Check Inngest Dashboard

1. Go to [Inngest Dashboard](https://app.inngest.com)
2. Navigate to your app
3. Check **Realtime** section (if available)
4. Verify your app is properly synced

## 🐛 Debugging Steps

### 1. Check Server Logs

Look for errors in your production server logs:
- WebSocket connection errors
- Token generation failures
- Authentication errors

### 2. Test Token Endpoint

Manually test the token endpoint:

```bash
# Replace with your actual domain and add auth headers
curl -X POST https://your-domain.com/api/action/realtime \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie"
```

### 3. Verify Authentication

The `fetchRealtimeSubscriptionToken()` requires authentication. Ensure:
- User is properly authenticated in production
- Kinde session is valid
- No auth middleware blocking the request

## ✅ Quick Checklist

- [ ] `INNGEST_SIGNING_KEY` is set in production
- [ ] `NEXT_PUBLIC_APP_URL` is set with `https://` protocol
- [ ] `NEXT_PUBLIC_APP_URL` has no trailing slash
- [ ] User authentication is working in production
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows successful token requests
- [ ] Inngest Dashboard shows app is synced
- [ ] No firewall/network blocking WebSocket traffic

## 🚨 Most Likely Fix

Based on common issues, try this first:

1. **Set `NEXT_PUBLIC_APP_URL` correctly**:
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```
   (No trailing slash, must be HTTPS)

2. **Verify `INNGEST_SIGNING_KEY` is set**:
   ```bash
   INNGEST_SIGNING_KEY=signkey_prod_xxxxxxxxxxxxx
   ```

3. **Redeploy your application** after setting these variables

4. **Clear browser cache** and test again

## 📞 Still Not Working?

If the issue persists:

1. **Check browser console** for specific error messages
2. **Check server logs** for backend errors
3. **Verify Inngest account** is active and configured
4. **Test with a different browser** to rule out browser-specific issues
5. **Check if your hosting platform** supports WebSockets (some platforms have limitations)

## 🔗 Additional Resources

- [Inngest Realtime Documentation](https://www.inngest.com/docs/realtime)
- [Inngest Support](https://www.inngest.com/support)
- [WebSocket Troubleshooting Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)

