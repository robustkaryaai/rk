import { NextResponse } from 'next/server';
import { Client, Account, Databases } from 'node-appwrite';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 400 });
        }

        // Initialize Appwrite Server SDK with API key
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY); // Server-side API key

        const databases = new Databases(client);
        const account = new Account(client);

        // Fetch the OAuth session data from database
        const oauthDoc = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            'oauth_sessions',
            token
        );

        if (!oauthDoc || !oauthDoc.userId) {
            return NextResponse.json({ error: 'Invalid token or user not found' }, { status: 404 });
        }

        const userId = oauthDoc.userId;

        // Create a magic URL session for this user
        // This generates a secret that can be used to create a session
        const magicUrl = await account.createMagicURLToken(
            userId,
            `rkai://callback?userId=${userId}` // Doesn't matter, we just need the secret
        );

        // Return the userId and secret to the app
        return NextResponse.json({
            userId: magicUrl.userId,
            secret: magicUrl.secret,
            route: oauthDoc.route || 'home'
        });

    } catch (error) {
        console.error('[Create App Session] Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to create session',
            details: error.toString()
        }, { status: 500 });
    }
}
