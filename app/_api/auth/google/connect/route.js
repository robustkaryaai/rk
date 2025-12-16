export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
    const scope = 'https://www.googleapis.com/auth/drive.file email';

    if (!clientId || !redirectUri) {
        return Response.json({ error: 'Google OAuth not configured' }, { status: 500 });
    }

    if (!slug) {
        return Response.json({ error: 'Device slug required' }, { status: 400 });
    }

    // Build OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('access_type', 'offline'); // Get refresh token
    authUrl.searchParams.append('prompt', 'consent'); // Force consent to get refresh token
    authUrl.searchParams.append('state', slug); // Pass slug through OAuth flow

    // Redirect to Google OAuth
    return Response.redirect(authUrl.toString());
}
