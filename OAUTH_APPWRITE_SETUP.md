# ⚡ CRITICAL: RK OAuth Fix - Step by Step

## The Issue You're Experiencing

```
You: Click "Sign in with Google"
     ↓
You: Sign in successfully
     ↓
App: Redirects to /connect (WRONG!)
     ↓
You: NOT LOGGED IN ❌
```

## Root Cause

Appwrite OAuth isn't properly configured. The session cookie isn't being created.

---

## 🔧 FIX: Configure Appwrite OAuth (5 minutes)

### Step 1: Go to Appwrite Console

1. **Open:** Your Appwrite Console
2. **Login:** With your admin credentials
3. **Navigate:** Settings → OAuth 2.0 Providers

### Step 2: Configure Google Provider

#### If Google is NOT already added:
1. Click: "+ Add Provider"
2. Select: Google
3. Enter:
   - **Name:** Google (or whatever)
   - **Client ID:** `your-client-id.apps.googleusercontent.com`
   - **Client Secret:** Your Google OAuth secret

#### If Google IS already added:
1. Click: Edit Google provider
2. **Verify:**
   - Client ID correct
   - Client Secret correct

### Step 3: Critical Setting - App URL

In the same Appwrite OAuth settings:

```
App URL: https://rk-alpha-nine.vercel.app
```

This is CRUCIAL! Appwrite uses this to build the callback URL.

**Do NOT use:** localhost, http://, or other domains

---

## 🔐 Step 4: Verify Google Cloud Console

### Go to Google Cloud Console

1. **Open:** https://console.cloud.google.com
2. **Project:** Select your project
3. **APIs & Services:** → Credentials
4. **Find:** Your OAuth 2.0 Client ID

### Verify Authorized Redirect URIs

You need **BOTH** of these:

```
https://rk-alpha-nine.vercel.app/auth/oauth2/callback
https://rk-alpha-nine.vercel.app/api/auth/google/callback
```

**To add them:**
1. Click on your OAuth Client ID
2. Scroll to "Authorized redirect URIs"
3. Add both URLs above
4. Click Save

### Also Verify Authorized JavaScript Origins

```
https://rk-alpha-nine.vercel.app
http://localhost:3000
```

---

## 📝 Step 5: Environment Variables

**In your `.env.local` file (web):**

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-server.com/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://rk-alpha-nine.vercel.app/api/auth/google/callback
NEXT_PUBLIC_APP_URL=https://rk-alpha-nine.vercel.app
```

**In Vercel (production):**
- Add the same env vars in Vercel dashboard
- Settings → Environment Variables

---

## ✅ Step 6: Test on Web (http://localhost:3000)

```bash
# 1. Clear browser storage
# DevTools → Application → Clear All

# 2. Start dev server
npm run dev

# 3. Visit login page
# http://localhost:3000/login

# 4. Click "Sign in with Google"
```

### Expected Flow:
```
1. Redirected to Google login
   ↓
2. Sign in
   ↓
3. Consent screen (if first time)
   ↓
4. Redirected to /home ← KEY!
   ↓
5. User data visible
   ↓
6. In console: user object logged
```

### Check Console:
```javascript
// Open DevTools Console
// Should see: [User object with email]
// NOT: error, NOT: blank page
```

---

## 🐛 Troubleshooting

### Issue: Redirected to `/connect` instead of `/home`

**Cause:** Success URL not working properly

**Fix:**
1. Check Appwrite OAuth App URL is set
2. Verify redirect URIs in Google Console
3. Clear browser cache completely

### Issue: "Invalid Redirect URI" from Google

**Cause:** URI doesn't match Google Console exactly

**Fix:**
1. Check for typos
2. Make sure it's HTTPS (not HTTP)
3. No trailing slash
4. Exact match required

### Issue: Blank page / Can't sign in

**Cause:** Missing environment variables or wrong Appwrite endpoint

**Fix:**
1. Check all env vars are set
2. Verify Appwrite endpoint is correct
3. Check Appwrite is running
4. Check client ID/secret are correct

### Issue: Session not persisting

**Cause:** Cookies not being set properly

**Fix:**
1. Open DevTools → Application → Cookies
2. Should see Appwrite session cookie
3. If not, check Appwrite OAuth is configured
4. Try incognito mode (rules out browser issues)

---

## 📋 Complete Checklist

### Appwrite
- [ ] OAuth 2.0 provider enabled
- [ ] Google provider added
- [ ] Client ID set correctly
- [ ] Client Secret set correctly
- [ ] App URL set to: `https://rk-alpha-nine.vercel.app`

### Google Cloud Console
- [ ] OAuth 2.0 Client ID created
- [ ] Redirect URIs include both:
  - `https://rk-alpha-nine.vercel.app/auth/oauth2/callback`
  - `https://rk-alpha-nine.vercel.app/api/auth/google/callback`
- [ ] JavaScript Origins includes `https://rk-alpha-nine.vercel.app`

### Environment Variables
- [ ] `.env.local` has all required vars
- [ ] Vercel has all required vars
- [ ] No secrets exposed

### Testing
- [ ] Clear browser cache/cookies
- [ ] Test at http://localhost:3000
- [ ] Click "Sign in with Google"
- [ ] Sign in succeeds
- [ ] Redirected to /home
- [ ] User data displays

---

## 🎯 Key Points

1. **Appwrite OAuth Callback:** `/auth/oauth2/callback` (NOT your `/api/auth/google/callback`)
2. **App URL:** Must be exact domain in Appwrite settings
3. **Redirect URIs:** Must match EXACTLY in Google Console
4. **Environment Variables:** Must be set in both `.env.local` and Vercel

---

## 📞 After This Fix

Once you can sign in on **web and see `/home`**, then:

1. We'll add Android deep link support
2. Deep link will bring app back after OAuth
3. Session will work seamlessly on Android

---

## 🚀 What To Do Now

1. **Verify Appwrite OAuth** - Follow steps 1-5 above
2. **Test on Web** - Follow step 6
3. **Report back** - Tell me if it works or what error you see

Then we can move forward with Android deep link implementation! 🎉

---

Made with ❤️ for RK AI
