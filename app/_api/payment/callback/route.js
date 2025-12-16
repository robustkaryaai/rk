import { NextResponse } from 'next/server';
import PaytmHelper from '@/lib/paytm';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const paytmParams = {};
        for (const [key, value] of formData.entries()) {
            paytmParams[key] = value;
        }

        const paytmChecksum = paytmParams.CHECKSUMHASH;
        delete paytmParams.CHECKSUMHASH;

        const paytmKey = process.env.PAYTM_MERCHANT_KEY;

        const isVerifySignature = await PaytmHelper.verifySignature(paytmParams, paytmKey, paytmChecksum);

        if (isVerifySignature) {
            if (paytmParams.STATUS === 'TXN_SUCCESS') {
                // Payment Success
                const url = new URL(request.url);
                const slug = url.searchParams.get('slug');
                const tier = parseInt(url.searchParams.get('tier'), 10);

                if (slug && !isNaN(tier)) {
                    // Update Appwrite
                    try {
                        const response = await databases.listDocuments(
                            DATABASE_ID,
                            COLLECTIONS.DEVICES,
                            [Query.equal('slug', parseInt(slug, 10))]
                        );

                        if (response.documents.length > 0) {
                            const deviceId = response.documents[0].$id;
                            await databases.updateDocument(
                                DATABASE_ID,
                                COLLECTIONS.DEVICES,
                                deviceId,
                                {
                                    'subscription': true,
                                    'subscription-tier': tier
                                }
                            );
                            console.log(`Updated device ${slug} to tier ${tier}`);
                        }
                    } catch (dbError) {
                        console.error('Database update failed:', dbError);
                        // Still success for payment, but DB failed. Log urgent.
                    }
                    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/subscription?status=success`, 303);
                } else {
                    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/subscription?status=failed&reason=invalid_params`, 303);
                }
            } else {
                return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/subscription?status=failed`, 303);
            }
        } else {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/subscription?status=failed&reason=checksum_mismatch`, 303);
        }

    } catch (error) {
        console.error('Callback handler error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
