import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Configure S3 client
const s3Client = new S3Client({
    region: process.env.R2_REGION || 'auto',
    endpoint: process.env.R2_ENDPOINT as string,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { image, destination, directoryName } = req.body;

        if (!image || !image.startsWith('data:image')) {
            return res.status(400).json({ error: 'Invalid image data' });
        }

        const base64Data = image.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const fileExtension = image.substring(image.indexOf('/') + 1, image.indexOf(';'));
        const fileName = `${directoryName || Date.now()}.${fileExtension}`;
        const key = `${destination}/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME as string,
            Key: key,
            Body: buffer,
            ContentType: `image/${fileExtension}`,
        });

        await s3Client.send(command);

        const publicUrl = `${process.env.R2_PUBLIC_BASE_URL}/${key}`;

        res.status(200).json({ url: publicUrl });

    } catch (error) {
        console.error('Error uploading image to R2:', error);
        res.status(500).json({ error: 'Failed to save image' });
    }
}
