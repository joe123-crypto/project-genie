import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
    const db = getDb();
    try {
        const { imageUrl, templateId, userId } = await req.json();

        if (!imageUrl || !templateId || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const docRef = await db.collection('posts').add({
            imageUrl,
            templateId,
            authorId: userId,
            createdAt: FieldValue.serverTimestamp(),
            likes: [],
        });

        return NextResponse.json({ id: docRef.id }, { status: 201 });

    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}
