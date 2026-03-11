import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '../../../lib/firebaseAdmin';
import { isCiSmokeTestMode, smokeJson } from '@/lib/ciSmoke';

export async function DELETE(req: Request) {
    if (isCiSmokeTestMode()) {
        const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!idToken) {
            return smokeJson({ error: 'Unauthorized' }, 401);
        }
        return smokeJson({ message: 'User deleted successfully noooow!' }, 200);
    }

    initializeFirebaseAdmin();
    const auth = getAuth();

    try {
        const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!idToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await auth.verifyIdToken(idToken);
        await auth.deleteUser(decodedToken.uid);
        return NextResponse.json(
            { message: 'User deleted successfully noooow!' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
