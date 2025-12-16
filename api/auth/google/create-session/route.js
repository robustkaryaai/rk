// route.js
import { NextResponse } from 'next/server';
import { Client, Account, Databases, ID, Query as AppwriteQuery } from 'appwrite';
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

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
      .setKey(serviceKey);

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
      if (list.documents && list.documents.length > 0) userDoc = list.documents[0];
    } catch (e) {
      console.warn('[create-session] could not query USERS collection:', e.message || e);
    }

    const appwriteUserId = userDoc?.appwriteUserId || `google_${googleSub}`;
    let appwritePassword = null;
    const pwKey = process.env.APPWRITE_PASSWORD_KEY || null;

    if (userDoc?.appwritePassword && pwKey) {
      try {
        appwritePassword = decrypt(userDoc.appwritePassword, pwKey);
      } catch {
        appwritePassword = null;
      }
    }

    // If no password stored, generate one
    if (!appwritePassword) {
      const generatedPassword = Math.random().toString(36).slice(-12) + '!A1';

      try {
        await account.create(
          appwriteUserId,
          email,
          generatedPassword,
          name || email
        );
      } catch (e) {
        if (!e.message.includes('already exists')) throw e;
        // User exists, update password
        await account.updateEmail(
          email,
          undefined,
          generatedPassword
        );
      }

      let storedPassword = generatedPassword;
      if (pwKey) {
        try {
          storedPassword = encrypt(generatedPassword, pwKey);
        } catch {}
      }

      const payload = {
        email,
        name: name || email.split('@')[0],
        appwriteUserId,
        appwritePassword: storedPassword,
        googleSub: googleSub || null,
        updatedAt: new Date().toISOString()
      };

      if (userDoc) {
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userDoc.$id, payload);
      } else {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.USERS, ID.unique(), payload);
      }

      appwritePassword = generatedPassword;
    }

    // Create email/password session
    await account.createEmailPasswordSession(email, appwritePassword);
    const jwt = await account.createJWT();
    return NextResponse.json({ success: true, jwt: jwt.jwt });
  } catch (error) {
    console.error('create-session error:', error);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }
}
