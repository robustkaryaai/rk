import { NextResponse } from 'next/server';
import { Client, Account, ID } from 'appwrite';

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

        // Appwrite requires a unique ID for new users
        const userId = ID.unique();

        // Create the user in Appwrite
        const response = await account.create(userId, email, password);

        return NextResponse.json({
            success: true,
            user: { id: response.$id, email: response.email }
        });

    } catch (error) {
        console.error('Signup Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to create account'
        }, { status: 400 });
    }
}
