import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    initializeFirebaseAdmin();
    const auth = getAuth();

    if (req.method === 'DELETE') {
        try {
            const idToken = req.headers.authorization?.split('Bearer ')[1];
            if (!idToken) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const decodedToken = await auth.verifyIdToken(idToken);
            await auth.deleteUser(decodedToken.uid);
            res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
