import { NextResponse } from 'next/server';
import { Client, Account, Users } from 'node-appwrite';

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

        const databases = new (await import('node-appwrite')).Databases(client);
        const users = new Users(client);

        // Fetch the OAuth session data from database
        const oauthDoc = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            'oauth_sessions',
            token
        );

        if (!oauthDoc || !oauthDoc.userId || oauthDoc.userId === 'PENDING') {
            return NextResponse.json({ error: 'Invalid token or user not found' }, { status: 404 });
        }

        const userId = oauthDoc.userId;

        // Get user details to get their email
        const user = await users.get(userId);

        if (!user || !user.email) {
            return NextResponse.json({ error: 'User email not found' }, { status: 404 });
        }

        // Create a magic URL token for this user's email
        const account = new Account(client);
        const magicUrl = await account.createMagicURLToken(
            'unique()', // Generate unique ID for the token
            user.email,
            'https://rk-alpha-nine.vercel.app/auth/callback' // Use registered web domain
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
