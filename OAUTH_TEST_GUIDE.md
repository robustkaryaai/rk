# 🧪 Quick Test Guide - Custom OAuth Callback

## Test on Web First (Easiest)

```bash
# 1. Start dev server
npm run dev

# 2. Open browser
# http://localhost:3000/login

# 3. Click "Sign in with Google"

# 4. Expected flow:
#    - Redirected to Google login ✓
#    - Sign in with Google account ✓
#    - See loading spinner ✓
#    - Redirected to /home ✓
#    - User email shown ✓

# 5. If working:
#    ✅ Test passed! Ready for Android!
```

---

## What to Check in Browser

### Check 1: Browser Console
```javascript
// Open DevTools → Console
// Should see logs like:
// "[OAuth Callback] Page loaded"
// "[OAuth Callback] Session established! User: user@gmail.com"
// "[OAuth Callback] Redirecting to /home"

// NOT: errors
```

### Check 2: Session Cookie
```javascript
// DevTools → Application → Cookies
// Should see: Appwrite session cookie
// NOT: empty
```

### Check 3: User Data
```javascript
// At /home page
// Should display: user@gmail.com
// Should show: user data
```

---

## If It Doesn't Work

### Problem 1: Stays at /auth/callback page
**Cause:** Session not created
**Solution:**
1. Check browser console for errors
2. Verify Appwrite OAuth configured
3. Clear cookies and try again

### Problem 2: Redirects to /login with error
**Cause:** Session check failed
**Solution:**
1. Check Appwrite is accessible
2. Verify OAuth credentials
3. Check network requests in DevTools

### Problem 3: Still at Google login screen
**Cause:** Redirect not working
**Solution:**
1. Check browser console
2. Check network tab for /auth/callback request
3. Verify success URL is correct

---

## Next: Test on Android

Once web works:

```bash
# 1. Sync & build
npx cap sync
npx cap build android
npx cap open android

# 2. Deploy to device
# Build and run APK

# 3. Test on device:
#    - Click "Sign in with Google"
#    - Chrome opens ✓
#    - Sign in ✓
#    - See loading spinner ✓
#    - 🔥 Chrome closes/minimizes
#    - 🔥 App comes back
#    - Already logged in ✓
```

---

## Success Criteria

### Web ✅
- [ ] Click "Sign in with Google"
- [ ] Redirected to Google
- [ ] Sign in works
- [ ] Loading spinner shows
- [ ] Redirected to /home
- [ ] User email displayed
- [ ] No errors in console

### Android ✅
- [ ] All of web, PLUS:
- [ ] Chrome closes
- [ ] App comes back to foreground
- [ ] Already at /home
- [ ] Session persisted

---

## Key URLs

| URL | Purpose |
|-----|---------|
| `/login` | Click "Sign in with Google" here |
| `/auth/callback` | Loading page (automatic redirect) |
| `/home` | Final destination - user logged in |

---

## Debug Tips

### See what's happening:
```javascript
// Browser console shows:
console.log('[OAuth Callback] Page loaded');
console.log('[OAuth Callback] Session established!');
console.log('[OAuth Callback] Redirecting to /home');
```

### Check session manually:
```javascript
// In browser console:
const user = await account.get();
console.log(user); // Should show user email
```

### Check cookies:
```javascript
// In browser console:
console.log(document.cookie); // Should show Appwrite session
```

---

## Commands

```bash
# Web test
npm run dev
# Visit http://localhost:3000/login

# Android build
npx cap sync
npx cap build android

# Android open
npx cap open android

# Clear cache/cookies
# DevTools → Application → Clear All
```

---

## Summary

1. **Test web first** - should work immediately
2. **If works** - build Android
3. **Test Android** - deep link should bring app back
4. **If everything works** - OAuth is complete! 🎉

---

**Let me know what happens!** 🚀
