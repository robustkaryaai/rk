import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { refreshToken } = await request.json();

        if (!refreshToken) {
            return NextResponse.json({ error: 'Refresh token required' }, { status: 400 });
        }

        console.log('[Token Refresh API] Refreshing access token...');

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Token Refresh API] Failed:', response.status, errorText);
            return NextResponse.json({ error: 'Token refresh failed' }, { status: response.status });
        }

        const data = await response.json();
        console.log('[Token Refresh API] Success!');

        return NextResponse.json({ accessToken: data.access_token });
    } catch (error) {
        console.error('[Token Refresh API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
