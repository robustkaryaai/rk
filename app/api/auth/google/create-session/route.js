import { NextResponse } from 'next/server';
import { Client, Users, Account, Databases, Query as AppwriteQuery, ID } from 'node-appwrite';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { encrypt, decrypt } from '@/lib/crypto';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, name, googleSub, refreshToken } = body || {};

        const serviceKey = process.env.APPWRITE_API_KEY || process.env.NEXT_PUBLIC_APPWRITE_SERVICE_KEY;
        if (!serviceKey) {
            return NextResponse.json({ success: false, error: 'missing_service_key' }, { status: 500 });
        }

        const client = new Client();
        client
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
            .setKey(serviceKey);

        const users = new Users(client);
        const account = new Account(client);
        const databases = new Databases(client);

        // Query our USERS collection for existing record
        let userDoc = null;
        try {
            const list = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.USERS,
                [AppwriteQuery.equal('email', email)]
            );
            if (list.documents && list.documents.length > 0) {
                userDoc = list.documents[0];
            }
        } catch (e) {
            console.warn('[create-session] could not query USERS collection:', e.message || e);
        }

        // Determine appwrite user id and password
        const appwriteUserId = (userDoc && userDoc.appwriteUserId) ? userDoc.appwriteUserId : `google_${googleSub}`;
        let appwritePassword = null;
        const pwKey = process.env.APPWRITE_PASSWORD_KEY || null; // hex 32 bytes expected
        if (userDoc && userDoc.appwritePassword && pwKey) {
            try {
                appwritePassword = decrypt(userDoc.appwritePassword, pwKey);
            } catch (e) {
                console.warn('[create-session] failed to decrypt stored password:', e.message || e);
                appwritePassword = null;
            }
        } else if (userDoc && userDoc.appwritePassword) {
            // Stored but no key available; treat as not present
            appwritePassword = null;
        }

        // If we don't have a stored password, generate one and create/update Appwrite user
        if (!appwritePassword) {
            const generatedPassword = Math.random().toString(36).slice(-12) + '!A1';
            try {
                // Try to create user in Appwrite
                await users.create(appwriteUserId, email, generatedPassword, name || email);

                // Encrypt before storing
                let storedPassword = generatedPassword;
                if (pwKey) {
                    try {
                        storedPassword = encrypt(generatedPassword, pwKey);
                    } catch (e) {
                        console.warn('[create-session] password encryption failed:', e.message || e);
                        storedPassword = generatedPassword; // fallback
                    }
                }

                // Persist appwrite userId and password to our USERS collection for future logins
                const payload = {
                    email,
                    name: name || email.split('@')[0],
                    appwriteUserId,
                    appwritePassword: storedPassword,
                    googleSub: googleSub || null,
                    updatedAt: new Date().toISOString()
                };

                try {
                    if (userDoc) {
                        await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userDoc.$id, payload);
                    } else {
                        await databases.createDocument(DATABASE_ID, COLLECTIONS.USERS, ID.unique(), payload);
                    }
                } catch (dbErr) {
                    console.warn('[create-session] failed to persist user doc:', dbErr.message || dbErr);
                }

                appwritePassword = generatedPassword;
            } catch (createErr) {
                // If creation failed because user exists in Appwrite already, attempt to update their password
                console.warn('[create-session] users.create failed, attempting update:', createErr.message || createErr);
                try {
                    // Attempt to update existing user password (requires correct userId)
                    await users.update(appwriteUserId, undefined, generatedPassword, name || email);

                    // Encrypt before storing
                    let storedPassword2 = generatedPassword;
                    if (pwKey) {
                        try { storedPassword2 = encrypt(generatedPassword, pwKey); } catch(e) { storedPassword2 = generatedPassword; }
                    }

                    // Persist password
                    const payload = {
                        email,
                        name: name || email.split('@')[0],
                        appwriteUserId,
                        appwritePassword: storedPassword2,
                        googleSub: googleSub || null,
                        updatedAt: new Date().toISOString()
                    };

                    try {
                        if (userDoc) {
                            await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userDoc.$id, payload);
                        } else {
                            await databases.createDocument(DATABASE_ID, COLLECTIONS.USERS, ID.unique(), payload);
                        }
                    } catch (dbErr) {
                        console.warn('[create-session] failed to persist user doc after update:', dbErr.message || dbErr);
                    }

                    appwritePassword = generatedPassword;
                } catch (updateErr) {
                    console.error('[create-session] create/update user failed:', updateErr.message || updateErr);
                    return NextResponse.json({ success: false, error: 'create_or_update_user_failed' }, { status: 500 });
                }
            }
        }

        // Now create an email/password session for this user
        try {
            await account.createEmailPasswordSession(email, appwritePassword);
            const jwt = await account.createJWT();
            return NextResponse.json({ success: true, jwt: jwt.jwt });
        } catch (sessionErr) {
            console.error('[create-session] create session failed:', sessionErr.message || sessionErr);
            return NextResponse.json({ success: false, error: 'create_session_failed' }, { status: 500 });
        }

    } catch (error) {
        console.error('create-session error:', error);
        return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
    }
}
