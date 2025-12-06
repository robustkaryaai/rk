# 🧪 RK OAuth Android - Testing Guide

## Pre-Testing Checklist

- [ ] All code changes applied
- [ ] `@capacitor/browser` installed
- [ ] `@capacitor/app` installed
- [ ] Environment variables configured
- [ ] Google OAuth configured in Google Cloud Console
- [ ] Appwrite OAuth configured
- [ ] Android SDK installed
- [ ] Android device or emulator available

---

## 🌐 Testing on Web Browser

### Setup
```bash
cd /Users/davthelegend/rk-ai-app
npm run dev
# Open http://localhost:3000
```

### Test Steps

1. **Navigate to Login**
   - Expected: Login page loads with "Sign in with Google" button

2. **Click "Sign in with Google"**
   - Expected: Redirected to Google's OAuth consent screen

3. **Sign in with Google Account**
   - Expected: Redirected back to app with `code` parameter

4. **Verify Session**
   - Expected: Redirected to `/home` page
   - Session established in browser

5. **Sign Out**
   - Expected: Redirected to `/login`
   - Session cleared

### ✅ Web Testing Passed If
- All steps complete without errors
- User data displays at `/home`
- Sign out works

---

## 📱 Testing on Android Emulator

### Build Android App

```bash
cd /Users/davthelegend/rk-ai-app

# 1. Sync latest web code
npx cap sync

# 2. Build Android
npx cap build android

# 3. Open Android Studio
npx cap open android
```

### Run on Emulator

In Android Studio:
1. **Select Device:** Choose emulator (Pixel 4 recommended)
2. **Run:** Click green play button or press `Shift+F10`
3. **Wait:** App builds and deploys (~1-2 minutes)

### Test Steps

#### ✅ Step 1: App Starts
- **Expected:** RK splash screen → Login page loads
- **Check:** No crashes in logcat

#### ✅ Step 2: Navigation Works
- **Action:** Click around (try clicking different buttons)
- **Expected:** Basic navigation works
- **Check:** No errors in console

#### ✅ Step 3: Google Sign-In Button Visible
- **Action:** Look at login page
- **Expected:** "Sign in with Google" button with Google icon
- **Check:** Button is clickable

#### ✅ Step 4: Open Chrome (The Critical Test!)
- **Action:** Click "Sign in with Google"
- **Expected:**
  - Chrome opens automatically
  - Shows Google login screen
  - URL is: `accounts.google.com/o/oauth2/v2/auth`
- **Check:** Logcat doesn't show errors

#### ✅ Step 5: User Signs In
- **Action:** Sign in with your Google account
- **Expected:**
  - Google processes login
  - Chrome shows redirect (might be blank page)
- **Check:** No crashes

#### ✅ Step 6: Deep Link Fires! 🔥
- **Action:** Wait 1-2 seconds
- **Expected:**
  - ✅ **Chrome disappears**
  - ✅ **RK app comes back to foreground**
  - ✅ **Redirected to `/home`**
  - ✅ **User data displays**
- **Check Logcat:** Look for:
  ```
  D/Capacitor: [appUrlOpen] App opened with URL
  ```

#### ✅ Step 7: Verify Session
- **Action:** Check home page displays user info
- **Expected:** User email, name, avatar shown
- **Check:** API calls succeeding

#### ✅ Step 8: Sign Out & Sign In Again
- **Action:** Sign out, then sign in again
- **Expected:** Same flow works consistently
- **Check:** No session errors

#### ✅ Step 9: Refresh App
- **Action:** Press back button, minimize, reopen
- **Expected:** User still logged in
- **Check:** Session persisted

---

## 🔍 Checking Logcat (Android Logs)

### Open Logcat
In Android Studio:
```
View → Tool Windows → Logcat
```

### Search for Deep Link Messages
```
adb logcat | grep -E "appUrlOpen|RK|Capacitor|deep"
```

### Expected Logs

```
D/Capacitor: [appUrlOpen] App opened with URL: 
    https://rk-alpha-nine.vercel.app/api/auth/google/callback?code=...

I/RK: User session established
I/RK: Redirecting to /home
```

### Troubleshooting with Logs

| Log Message | Meaning |
|---|---|
| `appUrlOpen` fired | ✅ Deep link working |
| `Chrome exits` → `App opens` | ✅ Deep link routing working |
| `AuthContext: checkUser called` | ✅ Session check triggered |
| No errors | ✅ Everything working |

---

## ❌ Troubleshooting

### Issue: Chrome Doesn't Open

**Cause:** Browser.open() not available or error

**Debug:**
1. Check logcat for errors
2. Verify `@capacitor/browser` installed: `npm list @capacitor/browser`
3. Verify app is running on device (not web)

**Fix:**
```bash
npm install @capacitor/browser
npx cap sync
npx cap build android  # Fresh build
```

---

### Issue: Chrome Opens But App Doesn't Return

**Cause:** Deep link not registered or URL mismatch

**Debug:**
1. Check AndroidManifest.xml has intent-filter
2. Verify domain: `rk-alpha-nine.vercel.app`
3. Check pathPrefix: `/api/auth`

**Fix:**
```bash
# Make sure you edited the right file
cat android/app/src/main/AndroidManifest.xml | grep -A5 "autoVerify"

# Should show:
# <intent-filter android:autoVerify="true">
#     <action android:name="android.intent.action.VIEW" />
#     <data android:scheme="https" android:host="rk-alpha-nine.vercel.app"
```

---

### Issue: App Returns But No Session

**Cause:** checkUser() not called or session not established

**Debug:**
1. Check App listener registered:
   ```javascript
   console.log('Deep link listener setup'); // Add in AuthContext
   ```
2. Check Appwrite session:
   ```javascript
   const session = await account.getSession('current');
   console.log('Session:', session);
   ```

**Fix:**
1. Verify Appwrite configured correctly
2. Check browser console for Appwrite errors
3. Verify cookies are sent back from callback

---

### Issue: User Stuck in Redirect Loop

**Cause:** Session check keeps redirecting

**Debug:**
1. Check if user data received
2. Monitor redirect flow in browser console

**Fix:**
1. Clear app cache: Settings → Apps → RK → Storage → Clear Cache
2. Fresh APK build: `npx cap build android`

---

### Issue: Google Says Invalid Redirect URI

**Cause:** Redirect URI in Google Cloud Console doesn't match

**Debug:**
- Expected: `https://rk-alpha-nine.vercel.app/api/auth/google/callback`
- Check what's in Google Cloud Console

**Fix:**
1. Go to Google Cloud Console
2. Search "OAuth consent screen"
3. Add correct URI:
   ```
   https://rk-alpha-nine.vercel.app/api/auth/google/callback
   ```

---

## 📊 Validation Checklist

### Code Changes
- [ ] `AndroidManifest.xml` has deep link intent-filter
- [ ] `AuthContext.js` imports `@capacitor/browser` and `@capacitor/app`
- [ ] `AuthContext.js` has `setupDeepLinkListener()`
- [ ] `AuthContext.js` has `Browser.open()` in `loginWithGoogle()`
- [ ] `/api/auth/google/route.js` exists and redirects to Google

### Dependencies
- [ ] `@capacitor/browser` installed: `npm list @capacitor/browser`
- [ ] `@capacitor/app` installed: `npm list @capacitor/app`

### Configuration
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set
- [ ] `GOOGLE_CLIENT_SECRET` set
- [ ] `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` correct
- [ ] `NEXT_PUBLIC_APP_URL` set to `https://rk-alpha-nine.vercel.app`

### Android Build
- [ ] Fresh APK built: `npx cap build android`
- [ ] APK installed on device/emulator
- [ ] Chrome is default browser

### OAuth Provider
- [ ] Google OAuth setup complete
- [ ] Appwrite OAuth enabled
- [ ] Redirect URI added to Google Console

---

## ✅ Success Criteria

Your implementation is **SUCCESSFUL** when:

1. ✅ User clicks "Sign in with Google"
2. ✅ Chrome opens with Google login screen
3. ✅ User signs in with Google account
4. ✅ **Chrome closes or minimizes**
5. ✅ **RK app comes back to foreground**
6. ✅ **User is logged in (at `/home` page)**
7. ✅ **User data displays correctly**
8. ✅ **Session persists when app minimized/reopened**
9. ✅ **Sign out works correctly**
10. ✅ **Can sign in again without issues**

---

## 🎯 Performance Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| Time from click to Chrome opens | < 500ms | - |
| Time for Google login | 3-10s | - |
| Time from callback to app opens | < 1s | - |
| Time to establish session | < 1s | - |
| Total OAuth flow | < 20s | - |

---

## 📝 Test Report Template

```
Date: [TODAY]
Device: [Emulator/Device Model]
Android Version: [11/12/13/14]

✅ Tests Passed:
- [ ] App launches
- [ ] Login page loads
- [ ] Google button visible
- [ ] Chrome opens on click
- [ ] Google login works
- [ ] App returns from Chrome
- [ ] User session established
- [ ] Redirected to /home
- [ ] User data displayed
- [ ] Sign out works

❌ Issues Found:
(List any issues)

🔧 Environment:
- Next.js version: 16.0.7
- Capacitor version: 7.4.4
- Chrome version: [latest]
- RK app domain: rk-alpha-nine.vercel.app

Notes:
(Any additional observations)
```

---

## 🆘 Need Help?

If something goes wrong:

1. **Check Documentation:**
   - `OAUTH_IMPLEMENTATION_COMPLETE.md` - Overview
   - `OAUTH_ANDROID_DEEP_LINK_GUIDE.md` - Technical details
   - `OAUTH_QUICK_REFERENCE.md` - Quick lookup

2. **Review Code:**
   - `context/AuthContext.js` - OAuth flow
   - `app/api/auth/google/route.js` - OAuth initiation
   - `android/app/src/main/AndroidManifest.xml` - Deep links

3. **Check Logs:**
   - Browser console (F12)
   - Logcat in Android Studio
   - Appwrite logs

4. **Verify Setup:**
   - All env vars set correctly
   - Google OAuth configured
   - Appwrite OAuth enabled
   - Fresh APK built and installed

---

## 🚀 You've Got This!

If all tests pass, you have a **production-ready OAuth implementation** for RK on Android! 🎉
