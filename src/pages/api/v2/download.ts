import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { imageUrl } = req.query;

  if (typeof imageUrl !== 'string' || !imageUrl) {
    return res.status(400).json({ error: 'Image URL is required as a query parameter.' });
  }

  try {
    const url = new URL(imageUrl);

    const allowedHostname = process.env.R2_PUBLIC_BASE_URL
      ? new URL(process.env.R2_PUBLIC_BASE_URL).hostname
      : null;

    if (!allowedHostname || url.hostname !== allowedHostname) {
      return res.status(403).json({ error: 'Forbidden: Hostname not allowed.' });
    }

    const imageResponse = await fetch(url.toString());

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error(`Error fetching image from source: ${imageResponse.status} ${errorText}`);
      return res.status(imageResponse.status).send(imageResponse.statusText);
    }

    res.setHeader('Content-Type', 'application/octet-stream');

    const originalPath = url.pathname;
    const lastDotIndex = originalPath.lastIndexOf('.');
    const extension = (lastDotIndex > 0 && lastDotIndex < originalPath.length - 1)
                      ? originalPath.substring(lastDotIndex + 1)
                      : 'png';

    const filename = `${uuidv4()}.${extension}`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    res.send(imageBuffer);

  } catch (error) {
    console.error('Download proxy error:', error);
    res.status(500).json({ error: 'An error occurred while trying to download the image.' });
  }
}
