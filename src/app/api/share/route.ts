import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
    const db = getDb();
    try {
        const { imageUrl, templateId, templateName, username } = await req.json();

        if (!imageUrl || !templateId || !templateName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const docRef = await db.collection('sharedImages').add({
            imageUrl,
            templateId,
            templateName,
            username,
            createdAt: FieldValue.serverTimestamp(),
        });

        // Generate the share URL - use request origin for better compatibility
        const origin = req.headers.get('origin') || req.headers.get('host')
            ? (req.headers.get('origin') || `https://${req.headers.get('host')}`)
            : (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'http://localhost:3000');
        const shareUrl = `${origin}/shared?id=${docRef.id}`;

        return NextResponse.json({
            id: docRef.id,
            shareUrl: shareUrl
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating share:', error);
        return NextResponse.json({ error: 'Failed to create share' }, { status: 500 });
    }
}
