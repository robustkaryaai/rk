# CORS Fix Required

## Problem
Google OAuth is failing with CORS error:
```
Access to fetch at 'https://fra.cloud.appwrite.io/v1/databases/.../oauth_sessions/...' 
from origin 'https://rk-cjt83ujm2-rk-innovators-team-leaders-projects.vercel.app' 
has been blocked by CORS policy
```

## Solution
1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Select your project
3. Go to **Settings** → **Platforms**
4. Add new **Web Platform**:
   - **Name:** Vercel Production
   - **Hostname:** `rk-ai.vercel.app` (or your custom domain)
   - **Hostname:** `*.vercel.app` (for preview deploys)

5. Click **Update**

## Alternative: Use Environment Variable
If you're using a fixed domain, add it to `.env.local`:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
```

Then redeploy on Vercel.
