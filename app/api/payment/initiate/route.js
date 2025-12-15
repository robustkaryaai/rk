import { NextResponse } from 'next/server';
import PaytmHelper from '@/lib/paytm';

export async function POST(request) {
    try {
        const { slug, amount, tier } = await request.json();

        if (!slug || !amount || tier === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const orderId = `ORDER_${slug}_${Date.now()}`;
        const custId = `CUST_${slug}`;
        const paytmMid = process.env.PAYTM_MID;
        const paytmKey = process.env.PAYTM_MERCHANT_KEY;
        const website = process.env.PAYTM_WEBSITE || 'WEBSTAGING';
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback?slug=${slug}&tier=${tier}`;

        const paytmParams = {};

        paytmParams.body = {
            "requestType": "Payment",
            "mid": paytmMid,
            "websiteName": website,
            "orderId": orderId,
            "callbackUrl": callbackUrl,
            "txnAmount": {
                "value": amount.toString(),
                "currency": "INR",
            },
            "userInfo": {
                "custId": custId,
            },
        };

        const checksum = await PaytmHelper.generateSignature(JSON.stringify(paytmParams.body), paytmKey);

        paytmParams.head = {
            "signature": checksum
        };

        const post_data = JSON.stringify(paytmParams);

        const requestUrl = `${process.env.NEXT_PUBLIC_PAYTM_HOST}/theia/api/v1/initiateTransaction?mid=${paytmMid}&orderId=${orderId}`;

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length
            },
            body: post_data
        });

        const responseData = await response.json();

        if (responseData.body.resultInfo.resultStatus === 'S') {
            return NextResponse.json({
                txnToken: responseData.body.txnToken,
                orderId: orderId,
                mid: paytmMid,
                amount: amount
            });
        } else {
            return NextResponse.json({ error: responseData.body.resultInfo.resultMsg }, { status: 500 });
        }

    } catch (error) {
        console.error('Payment initiation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
