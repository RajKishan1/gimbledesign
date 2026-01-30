# Environment Variables Checklist

## ✅ Currently Configured

Based on your `.env` file, you have:

1. **DATABASE_URL** ✅
   - MongoDB connection string
   - Used by: Prisma

2. **Better Auth (Google)** ✅
   - `GOOGLE_CLIENT_ID` ✅
   - `GOOGLE_CLIENT_SECRET` ✅
   - `BETTER_AUTH_SECRET` – run `npx @better-auth/cli secret` to generate
   - `BETTER_AUTH_URL` (optional) – defaults to `NEXT_PUBLIC_APP_URL` or `http://localhost:3000`
   - Used by: Authentication (Google sign-in only)

3. **OPENROUTER_API_KEY** ✅
   - Used by: AI model generation (OpenRouter/Google Gemini)
   - Used in: `lib/openrouter.ts`, `app/action/action.ts`

## ❌ Missing Environment Variables

### 1. UNSPLASH_ACCESS_KEY (CRITICAL)

- **Required for**: Image search functionality in AI-generated screens
- **Used in**: `inngest/tool.ts` - `unsplashTool` function
- **Where to get it**:
  1.  Sign up at https://unsplash.com/developers
  2.  Create a new application
  3.  Copy your Access Key
- **Add to `.env`**:
  ```
  UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
  ```

### 2. INNGEST_SIGNING_KEY (REQUIRED for Production)

- **Required for**: Verifying Inngest webhook requests in production
- **Used by**: Inngest webhook endpoint (`/api/inngest`)
- **Where to get it**:
  1.  Sign up at https://www.inngest.com (free account)
  2.  Create an app in the dashboard
  3.  Go to Settings → Keys
  4.  Copy the Signing Key
- **Add to `.env` (production only)**:
  ```
  INNGEST_SIGNING_KEY=signkey_prod_xxxxxxxxxxxxx
  ```
- **Note**: Not needed in development mode (uses local dev server)

### 3. NEXT_PUBLIC_APP_URL (REQUIRED for Production)

- **Required for**: Inngest to know where your app is deployed
- **Used by**: Inngest to discover and sync your functions
- **Add to `.env` (production only)**:
  ```
  NEXT_PUBLIC_APP_URL=https://your-domain.com
  ```
- **Note**: Use your actual production domain

### 4. INNGEST_EVENT_KEY (Optional)

- **Required for**: Sending events to Inngest from external sources only
- **Not needed**: For normal operation (already handled by Inngest client)
- **Where to get it**: Inngest dashboard → Settings → Keys
- **Add to `.env`** (only if sending events from outside your app):
  ```
  INNGEST_EVENT_KEY=xxxxxxxxxxxxx
  ```

## 📝 Important Notes

1. **AI SDK Provider Configuration**:
   - Your `inngest/functions/generateScreens.ts` and `inngest/functions/regenerateFrame.ts` use `generateObject` and `generateText` with model strings like `"google/gemini-3-pro-preview"`.
   - These functions may need to explicitly use the OpenRouter provider. Currently, the `openrouter` import is commented out.
   - Make sure the AI SDK is configured to use OpenRouter. You might need to set up the provider in these functions.

2. **Environment Variable Format**:
   - Make sure there are **no spaces** around the `=` sign
   - Values with special characters should be in quotes
   - Example: `DATABASE_URL="mongodb+srv://..."`

3. **After Adding Variables**:
   - Restart your development server (`npm run dev`)
   - For production, redeploy your application

## 🔍 How to Verify

After adding the missing variables, check:

1. ✅ Build succeeds: `npm run build`
2. ✅ Development server starts: `npm run dev`
3. ✅ No 500 errors when creating projects
4. ✅ AI generation works (requires UNSPLASH_ACCESS_KEY)
5. ✅ Image search works in generated screens

## 🚨 Most Critical Missing Variable

**UNSPLASH_ACCESS_KEY** - This is required for the Unsplash image search tool that's used when generating AI screens. Without it, image search will fail silently and screens may generate without images.
