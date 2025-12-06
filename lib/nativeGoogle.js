import { Plugins } from '@capacitor/core';
// Use the community plugin name placeholder - actual plugin will be added to Android
// This file provides a small wrapper to call native Google Sign-In via Capacitor plugin

export async function signInWithGoogleNative() {
    try {
        // Prefer the official community plugin if installed: @codetrix-studio/capacitor-google-auth or similar
        // Try to call window.Capacitor.Plugins.GoogleAuth or Plugins.GoogleAuth
        const gc = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth) || (Plugins && Plugins.GoogleAuth);
        if (!gc) {
            throw new Error('GoogleAuth plugin not available');
        }

        // platforms return an object with idToken and accessToken
        const res = await gc.signIn();
        return res;
    } catch (error) {
        console.error('Native Google sign-in failed:', error);
        throw error;
    }
}
