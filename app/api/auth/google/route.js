/**
 * Google OAuth Initiation Route
 * 
 * This route initiates the Google OAuth flow for mobile app deep link handling.
 * When called from the Capacitor app, it redirects to Google's auth endpoint,
 * which will eventually redirect back to our app via the deep link registered
 * in AndroidManifest.xml
 */

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    appUrl = appUrl.replace(/\/$/, ''); // Remove trailing slash

    // The callback URL - this will be intercepted by Android deep link
    // and routed back to the app
    const callbackUrl = `${appUrl}/api/auth/google/callback`;

    // Build Google OAuth consent screen URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    
    googleAuthUrl.searchParams.append('client_id', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.append('redirect_uri', callbackUrl);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', 'openid email profile https://www.googleapis.com/auth/drive.file');
    googleAuthUrl.searchParams.append('access_type', 'offline'); // Request refresh token
    googleAuthUrl.searchParams.append('prompt', 'consent'); // Force consent screen
    
    // Redirect to Google OAuth endpoint
    return Response.redirect(googleAuthUrl.toString());
}
