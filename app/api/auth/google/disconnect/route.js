import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite';

export async function POST(request) {
    try {
        const { slug } = await request.json();

        if (!slug) {
            return Response.json({ error: 'Slug required' }, { status: 400 });
        }

        // Get device from Appwrite
        const deviceResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.DEVICES,
            [Query.equal('slug', parseInt(slug, 10))]
        );

        if (deviceResponse.documents.length === 0) {
            return Response.json({ error: 'Device not found' }, { status: 404 });
        }

        const device = deviceResponse.documents[0];
        const deviceId = device.$id;

        // Revoke Google token if exists
        if (device.googleRefreshToken) {
            try {
                await fetch(`https://oauth2.googleapis.com/revoke?token=${device.googleRefreshToken}`, {
                    method: 'POST'
                });
                console.log('✅ Google token revoked');
            } catch (error) {
                console.warn('Failed to revoke Google token:', error);
            }
        }

        // Build update object - only include fields that exist in schema
        const updateData = { storageUsing: 'supabase' };

        // Clear ALL Google fields if they exist
        if ('googleAccessToken' in device) updateData.googleAccessToken = null;
        if ('googleRefreshToken' in device) updateData.googleRefreshToken = null;
        if ('googleFolderId' in device) updateData.googleFolderId = null;
        if ('email' in device) updateData.email = null;

        console.log('📝 Updating device with:', updateData);

        // Update device to use Supabase and clear all Google fields
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.DEVICES,
            deviceId,
            updateData
        );

        console.log('✅ Device disconnected successfully');
        return Response.json({ success: true });
    } catch (error) {
        console.error('❌ Google disconnect error:', error);
        console.error('Error details:', error.message, error.stack);
        return Response.json({
            error: 'Failed to disconnect',
            details: error.message
        }, { status: 500 });
    }
}
