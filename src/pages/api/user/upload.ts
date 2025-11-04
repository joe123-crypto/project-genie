
import { NextApiRequest, NextApiResponse } from 'next';
import { initializeFirebaseAdmin } from '../../../lib/firebaseAdmin';
import formidable from 'formidable';
import fs from 'fs';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Disable Next.js body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

// --- Cloudflare R2 (S3-compatible) setup ---
const r2BucketName = process.env.R2_BUCKET_NAME;
const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

const s3Client = new S3Client({
    region: process.env.R2_REGION || 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Check for R2 configuration
  if (!r2BucketName || !r2PublicBaseUrl || !process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.error('Missing Cloudflare R2 environment variables.');
    return res.status(500).json({ error: 'Server configuration error: R2 storage is not configured.' });
  }
  
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
    
    const fileBuffer = fs.readFileSync(file.filepath);
    const key = `profiles/${uid}/${Date.now()}_${file.originalFilename}`;

    const putCommand = new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype || undefined,
        ACL: 'public-read',
    });

    await s3Client.send(putCommand);

    const publicUrl = `${r2PublicBaseUrl.replace(/\/$/, '')}/${key}`;

    res.status(200).json({ photoURL: publicUrl });

  } catch (error: any) {
    console.error('Error uploading profile picture:', error);
    let errorMessage = 'Failed to upload profile picture.';
    if (error.name === 'NoSuchBucket') {
        errorMessage = 'R2 Bucket not found. Please check configuration.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return res.status(500).json({ error: errorMessage });
  }
}
