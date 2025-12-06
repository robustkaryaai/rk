import { NextResponse } from 'next/server';
import { Client, Databases, Query, ID } from 'node-appwrite';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';

export async function POST(request) {
    try {
        const body = await request.json();
        const { idToken, accessToken, refreshToken } = body || {};

        if (!idToken) {
            return NextResponse.json({ success: false, error: 'missing_id_token' }, { status: 400 });
        }

        // Verify id_token with Google
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (!verifyRes.ok) {
            const text = await verifyRes.text();
            console.error('[native-exchange] tokeninfo failed:', text);
            return NextResponse.json({ success: false, error: 'invalid_id_token' }, { status: 400 });
        }

        const tokenInfo = await verifyRes.json();

        // If we have Appwrite server key, upsert the user document in Appwrite DB and store refresh token
        const serviceKey = process.env.APPWRITE_API_KEY || process.env.NEXT_PUBLIC_APPWRITE_SERVICE_KEY;
        let appwriteLinked = false;

        if (serviceKey) {
            try {
                const client = new Client();
                client
                    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
                    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
                    .setKey(serviceKey);

                const databases = new Databases(client);

                // Try to find existing user by email in USERS collection
                let existing = null;
                try {
                    const list = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        [Query.equal('email', tokenInfo.email)]
                    );
                    if (list.documents && list.documents.length > 0) existing = list.documents[0];
                } catch (e) {
                    console.warn('[native-exchange] could not query users collection:', e.message || e);
                }

                const payload = {
                    email: tokenInfo.email,
                    name: tokenInfo.name || tokenInfo.email.split('@')[0],
                    googleSub: tokenInfo.sub,
                    googleRefreshToken: refreshToken || null,
                    updatedAt: new Date().toISOString()
                };

                if (existing) {
                    try {
                        await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, existing.$id, payload);
                        appwriteLinked = true;
                    } catch (e) {
                        console.warn('[native-exchange] failed to update user doc:', e.message || e);
                    }
                } else {
                    try {
                        await databases.createDocument(DATABASE_ID, COLLECTIONS.USERS, ID.unique(), payload);
                        appwriteLinked = true;
                    } catch (e) {
                        console.warn('[native-exchange] failed to create user doc:', e.message || e);
                    }
                }
            } catch (e) {
                console.warn('[native-exchange] Appwrite link failed:', e.message || e);
            }
        }

        // If we linked in Appwrite, create a short-lived user JWT using Appwrite server SDK
        let userJwt = null;
        if (appwriteLinked && serviceKey) {
            try {
                const clientForJwt = new Client();
                clientForJwt
                    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
                    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
                    .setKey(serviceKey);

                // Use Accounts API to create a JWT for the user by email lookup
                // Appwrite server SDK doesn't provide createJWT by email; instead, we'll try to find the user doc id
                // and create a custom JWT via the server SDK if available. As a fallback we will not provide JWT.
                // NOTE: Appwrite requires a user session to create JWTs, creating server-side sessions requires
                // using the REST endpoint /account/sessions with email/password or other token methods.
                // For minimal flow, we return appwriteLinked=true and the client should call checkUser() which
                // will attempt to pick up a session if any cookie was set. If you want full server-created session,
                // we need to implement Account.createSession using a magic token.
            } catch (e) {
                console.warn('[native-exchange] create JWT failed:', e.message || e);
            }
        }

        // If we linked in Appwrite, attempt to create a session and get a JWT for the client
        if (appwriteLinked) {
            try {
                const createRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/google/create-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: tokenInfo.email, name: tokenInfo.name, googleSub: tokenInfo.sub, refreshToken: refreshToken })
                });

                if (createRes.ok) {
                    const createData = await createRes.json();
                    if (createData && createData.success && createData.jwt) {
                        userJwt = createData.jwt;
                    }
                }
            } catch (e) {
                console.warn('[native-exchange] create-session failed:', e.message || e);
            }
        }

        return NextResponse.json({ success: true, tokenInfo, accessToken, appwriteLinked, userJwt });
    } catch (error) {
        console.error('native-exchange error:', error);
        return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
    }
}
