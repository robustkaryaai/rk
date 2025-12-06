import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    let appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl || appUrl.trim() === '') {
        appUrl = 'http://localhost:3000';
    }
    appUrl = appUrl.replace(/\/$/, ''); // Remove trailing slash

    console.log('[Google Callback] appUrl:', appUrl);
    console.log('[Google Callback] Redirecting to:', `${appUrl}/settings`);

    if (error) {
        return Response.redirect(`${appUrl}/settings?google_error=${error}`);
    }

    if (!code) {
        return Response.redirect(`${appUrl}/settings?google_error=no_code`);
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            throw new Error('Failed to get access token');
        }

        // Get user info
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const userInfo = await userInfoResponse.json();

        // Check if RK AI Files folder already exists
        const searchFolderResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='RK AI Files' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
            {
                headers: { Authorization: `Bearer ${tokens.access_token}` }
            }
        );
        const searchResult = await searchFolderResponse.json();

        let folder;
        if (searchResult.files && searchResult.files.length > 0) {
            // Folder exists, reuse it
            folder = searchResult.files[0];
            console.log('[Google Callback] Reusing existing folder:', folder.id);
        } else {
            // Create new RK AI folder in Google Drive
            const createFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'RK AI Files',
                    mimeType: 'application/vnd.google-apps.folder'
                })
            });
            folder = await createFolderResponse.json();
            console.log('[Google Callback] Created new folder:', folder.id);
        }

        // Get device slug from OAuth state parameter
        const slug = searchParams.get('state');
        console.log('[Google Callback] Device slug from state:', slug);

        if (slug) {
            const deviceResponse = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.DEVICES,
                [Query.equal('slug', parseInt(slug, 10))]
            );

            if (deviceResponse.documents.length > 0) {
                const deviceId = deviceResponse.documents[0].$id;

                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.DEVICES,
                    deviceId,
                    {
                        storageUsing: 'google',
                        googleRefreshToken: tokens.refresh_token,  // Store refresh token here
                        googleFolderId: folder.id,
                        email: userInfo.email
                    }
                );
            }
        }

        return Response.redirect(`${appUrl}/settings?google_connected=true`);
    } catch (error) {
        console.error('Google OAuth callback error:', error);
        return Response.redirect(`${appUrl}/settings?google_error=callback_failed`);
    }
}
