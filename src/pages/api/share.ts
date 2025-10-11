import type { NextApiRequest, NextApiResponse } from "next";
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials in environment variables.');
  }
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}
const db = admin.firestore();

const generateHtml = (imageUrl: string, filterName: string, pageUrl: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filterName}</title>
        <meta property="og:title" content="${filterName}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:url" content="${pageUrl}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${filterName}" />
        <meta name="twitter:image" content="${imageUrl}" />
        <script>
          window.location.href = "${pageUrl}";
        </script>
      </head>
      <body>
        <p>Redirecting to <a href="${pageUrl}">${pageUrl}</a>...</p>
      </body>
    </html>
  `;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { imageUrl, filterName, username, filterId } = req.body;

      if (!imageUrl || !filterName) {
        return res.status(400).json({ error: 'Missing imageUrl or filterName' });
      }

      const docRef = await db.collection('sharedImages').add({
        imageUrl,
        filterName,
        filterId: filterId || null,
        username: username || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const appUrl = process.env.APP_URL || (req.headers.origin ?? 'http://localhost:3000');
      const shareUrl = `${appUrl}/shared/${docRef.id}`;

      return res.status(200).json({ shareId: docRef.id, shareUrl, imageUrl });
      
    } catch (err: any) {
      console.error("Error creating share:", err.message || err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid id' });
      }

      const doc = await db.collection('sharedImages').doc(id).get();
      
      const isJsonRequest = req.headers.accept?.includes('application/json');

      if (!doc.exists) {
        if (isJsonRequest) {
          return res.status(404).json({ error: 'Image not found' });
        }
        return res.status(404).send('Not Found');
      }
      
      const data = doc.data();
      if (!data) {
        const errorMsg = 'Data is missing in the document';
        if (isJsonRequest) {
          return res.status(500).json({ error: errorMsg });
        }
        return res.status(500).send('Internal Server Error');
      }

      if (isJsonRequest) {
        // For client-side navigation in the Next.js app
        return res.status(200).json({
          imageUrl: data.imageUrl,
          filterName: data.filterName,
          filterId: data.filterId || null,
          username: data.username || null,
        });
      } else {
        // For social media crawlers
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const pageUrl = `${appUrl}/shared/${id}`;
        const html = generateHtml(data.imageUrl, data.filterName, pageUrl);

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
      }

    } catch (err: any) {
      console.error("Error fetching share:", err.message || err);
      if (req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
      }
      return res.status(500).send('Internal Server Error');
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
