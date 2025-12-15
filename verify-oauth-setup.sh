#!/bin/bash

# RK OAuth Android Implementation Verification Script
# Run this to verify everything is set up correctly

echo "🔍 RK OAuth Android Implementation - Verification Script"
echo "========================================================="
echo ""

ERRORS=0
WARNINGS=0
SUCCESS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check file existence
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((SUCCESS++))
    else
        echo -e "${RED}❌${NC} $2"
        ((ERRORS++))
    fi
}

# Function to check if string exists in file
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $3"
        ((SUCCESS++))
    else
        echo -e "${RED}❌${NC} $3"
        ((ERRORS++))
    fi
}

# Function to check package installation
check_package() {
    if npm list "$1" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $2"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}⚠️ ${NC} $2"
        ((WARNINGS++))
    fi
}

echo "1️⃣ Checking File Structure..."
echo "---"
check_file "android/app/src/main/AndroidManifest.xml" "AndroidManifest.xml exists"
check_file "context/AuthContext.js" "AuthContext.js exists"
check_file "app/api/auth/google/route.js" "OAuth Google route exists"
echo ""

echo "2️⃣ Checking AndroidManifest.xml Deep Links..."
echo "---"
check_content "android/app/src/main/AndroidManifest.xml" "autoVerify=\"true\"" "Deep link autoVerify configured"
check_content "android/app/src/main/AndroidManifest.xml" "rk-alpha-nine.vercel.app" "Vercel domain configured"
check_content "android/app/src/main/AndroidManifest.xml" "pathPrefix=\"/api/auth\"" "OAuth path configured"
echo ""

echo "3️⃣ Checking AuthContext.js Capacitor Integration..."
echo "---"
check_content "context/AuthContext.js" "@capacitor/browser" "Capacitor Browser imported"
check_content "context/AuthContext.js" "@capacitor/app" "Capacitor App imported"
check_content "context/AuthContext.js" "Browser.open" "Browser.open() implemented"
check_content "context/AuthContext.js" "appUrlOpen" "Deep link listener implemented"
check_content "context/AuthContext.js" "setupDeepLinkListener" "Deep link setup function exists"
echo ""

echo "4️⃣ Checking OAuth Route..."
echo "---"
check_file "app/api/auth/google/route.js" "Google OAuth route exists"
check_content "app/api/auth/google/route.js" "accounts.google.com/o/oauth2" "Redirects to Google OAuth"
check_content "app/api/auth/google/route.js" "access_type" "Offline access requested"
echo ""

echo "5️⃣ Checking Dependencies..."
echo "---"
check_package "@capacitor/browser" "@capacitor/browser installed"
check_package "@capacitor/app" "@capacitor/app installed"
echo ""

echo "6️⃣ Checking Documentation Files..."
echo "---"
check_file "OAUTH_IMPLEMENTATION_COMPLETE.md" "Implementation guide exists"
check_file "OAUTH_ANDROID_DEEP_LINK_GUIDE.md" "Technical guide exists"
check_file "OAUTH_QUICK_REFERENCE.md" "Quick reference exists"
check_file "OAUTH_TESTING_GUIDE.md" "Testing guide exists"
check_file "OAUTH_FINAL_SUMMARY.md" "Final summary exists"
echo ""

echo "7️⃣ Checking Environment Variables..."
echo "---"
if [ -z "$NEXT_PUBLIC_GOOGLE_CLIENT_ID" ]; then
    echo -e "${YELLOW}⚠️ ${NC} NEXT_PUBLIC_GOOGLE_CLIENT_ID not set"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅${NC} NEXT_PUBLIC_GOOGLE_CLIENT_ID is set"
    ((SUCCESS++))
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo -e "${YELLOW}⚠️ ${NC} GOOGLE_CLIENT_SECRET not set"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅${NC} GOOGLE_CLIENT_SECRET is set"
    ((SUCCESS++))
fi

if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
    echo -e "${YELLOW}⚠️ ${NC} NEXT_PUBLIC_APP_URL not set"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅${NC} NEXT_PUBLIC_APP_URL is set"
    ((SUCCESS++))
fi
echo ""

echo "========================================================="
echo "📊 Verification Summary"
echo "========================================================="
echo -e "${GREEN}✅ Passed: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️ Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Errors: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Everything looks good! Ready for testing and deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. npm run build"
    echo "2. npx cap sync"
    echo "3. npx cap build android"
    echo "4. npx cap open android"
    echo "5. Run on device/emulator"
else
    echo -e "${RED}❌ Some issues found. Please check the items above.${NC}"
    echo ""
    echo "Quick fixes:"
    echo "- Install missing packages: npm install"
    echo "- Check all env vars are set: .env.local"
    echo "- Rebuild Android: npx cap build android"
fi
echo ""
