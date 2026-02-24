import { NextResponse } from 'next/server';
import { Client, Account } from 'appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('69667fe400099daf8fcf'); // RK AI Project ID

const account = new Account(client);

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Create an email/password session in Appwrite
        const session = await account.createEmailPasswordSession(email, password);

        // Get user details
        const user = await account.get();

        // Delete the session immediately since we just needed to verify credentials for the desktop app
        await account.deleteSession(session.$id);

        return NextResponse.json({
            success: true,
            user: {
                id: user.$id,
                email: user.email,
                name: user.name || email.split('@')[0]
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({
            error: error.message || 'Invalid credentials'
        }, { status: 401 });
    }
}
