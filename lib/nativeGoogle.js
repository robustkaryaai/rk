import { Capacitor } from '@capacitor/core';

export async function signInWithGoogleNative() {
  try {
    const gc =
      Capacitor?.Plugins?.GoogleAuth ||
      window?.GoogleAuth ||
      window?.Capacitor?.Plugins?.GoogleAuth;

    if (!gc) {
      throw new Error('GoogleAuth plugin not available');
    }

    const res = await gc.signIn();
    return res;
  } catch (error) {
    console.error('Native Google sign-in failed:', error);
    throw error;
  }
}
