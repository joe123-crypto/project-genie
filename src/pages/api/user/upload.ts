
import { NextApiRequest, NextApiResponse } from 'next';
import { initializeFirebaseAdmin } from '../../../lib/firebaseAdmin';
import formidable from 'formidable';
import fs from 'fs';

// Disable Next.js body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  const app = initializeFirebaseAdmin();
  const auth = app.auth();
  const storage = app.storage();
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const idToken = authorization.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const tokenUid = decodedToken.uid;

    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    const uid = Array.isArray(fields.uid) ? fields.uid[0] : fields.uid;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (tokenUid !== uid) {
      return res.status(403).json({ error: 'Forbidden: You can only upload a profile picture for your own account.' });
    }

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const bucket = storage.bucket();
    const filePath = `profile-pictures/${uid}/${Date.now()}_${file.originalFilename}`;
    const fileUpload = bucket.file(filePath);

    const fileBuffer = fs.readFileSync(file.filepath);

    await fileUpload.save(fileBuffer, {
        metadata: {
            contentType: file.mimetype || undefined,
        },
    });

    const [publicUrl] = await fileUpload.getSignedUrl({ action: 'read', expires: '03-09-2491' });

    res.status(200).json({ photoURL: publicUrl });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return res.status(500).json({ error: 'Failed to upload profile picture' });
  }
}
