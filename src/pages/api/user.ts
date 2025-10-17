
import { NextApiRequest, NextApiResponse } from 'next';
import { initializeFirebaseAdmin } from '../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const app = initializeFirebaseAdmin();
  const auth = app.auth();
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const idToken = authorization.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const tokenUid = decodedToken.uid;

    if (req.method === 'DELETE') {
      await auth.deleteUser(tokenUid);
      return res.status(200).json({ message: 'User deleted successfully' });
    } else if (req.method === 'PUT') {
      const { uid, profileData } = req.body;

      // Ensure users can only update their own profile
      if (tokenUid !== uid) {
        return res.status(403).json({ error: 'Forbidden: You can only update your own profile.' });
      }

      const { displayName, photoURL } = profileData;
      await auth.updateUser(uid, { displayName, photoURL });
      return res.status(200).json({ message: 'Profile updated successfully' });
    } else {
      res.setHeader('Allow', ['DELETE', 'PUT']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error processing user request:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
