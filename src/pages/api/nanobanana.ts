// pages/api/nanobanana.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { generateText } from 'ai';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';

interface ImageInput {
  mediaType: string;
  data?: string; // base64 inline data (old flow)
  url?: string;  // R2 file URL (new flow)
}

// Minimal type for Gemini's output
interface GeminiResponseContent {
  type: 'file' | 'text';
  text?: string;
  file?: {
    mediaType: string;
    data?: string;
    base64Data?: string;
  };
}

// --- Cloudflare R2 (S3-compatible) setup ---
const r2BucketName = process.env.R2_BUCKET_NAME || 'genie-bucket';
const r2Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  } : undefined,
});

/**
 * Parses a data URL (data:mime;base64,...) into { mimeType, buffer }.
 */
function parseDataUrlToBuffer(dataUrl: string): { mimeType: string; buffer: Buffer } {
  const match = /^data:(.+);base64,(.*)$/.exec(dataUrl);
  if (!match) {
    throw new Error('Invalid data URL');
  }
  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');
  return { mimeType, buffer };
}

/**
 * Uploads a data URL image to Cloudflare R2 under a deterministic key and returns a public URL.
 */
async function uploadPreviewToR2(key: string, dataUrl: string): Promise<string> {
  const { mimeType, buffer } = parseDataUrlToBuffer(dataUrl);

  const params: PutObjectCommandInput = {
    Bucket: r2BucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  };

  await r2Client.send(new PutObjectCommand(params));

  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  if (publicBase) {
    return `${publicBase.replace(/\/$/, '')}/${key}`;
  }
  const endpoint = (process.env.R2_ENDPOINT || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `https://${endpoint}/${r2BucketName}/${key}`;
}

/**
 * Generates a random filename for images
 */
function generateRandomFilename(extension: string = 'png'): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomId}.${extension}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { textPrompt, images } = req.body as { textPrompt?: string; images?: ImageInput[] };
  if (!textPrompt) return res.status(400).json({ error: 'textPrompt required' });

  try {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server misconfiguration' });

    const result = await generateText({
      model: 'google/gemini-2.5-flash-image-preview',
      providerOptions: { google: { apiKey, responseModalities: ['TEXT', 'IMAGE'] } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: textPrompt },
            ...((images || []).map((img) => {
              if (img.data) {
                // Old flow: inline base64
                return { type: 'file' as const, mediaType: img.mediaType, data: img.data };
              } else if (img.url) {
                // New flow: pass R2 URL directly
                return { type: 'file' as const, mediaType: img.mediaType, data: img.url };
              } else {
                throw new Error('Image must have either data or url');
              }
            })),
          ],
        },
      ],
    });

    const fileContent = result.steps?.[0]?.content.find((c) => c.type === 'file');

    if (!fileContent || !fileContent.file) {
      console.error('No file returned from Gemini, full result:', result);
      return res.status(500).json({ error: 'No image returned from Gemini' });
    }

    const { file } = fileContent;
    // @ts-expect-error Next.js type issue
    const base64 = (file as { base64Data: string }).base64Data;
    if (!base64) {
      console.error('File object missing base64 content:', file);
      return res.status(500).json({ error: 'Malformed image data from Gemini' });
    }

    const dataUrl = `data:${file.mediaType};base64,${base64}`;

    const isImageGeneration = !images || images.length === 0;
    const folder = isImageGeneration ? 'ai-generated' : 'filtered';
    const filename = generateRandomFilename('png');
    const key = `${folder}/${filename}`;

    const publicUrl = await uploadPreviewToR2(key, dataUrl);

    console.log(`${isImageGeneration ? 'AI-generated' : 'Filtered'} image uploaded to R2:`, publicUrl);

    return res.status(200).json({
      transformedImage: publicUrl,
      originalDataUrl: dataUrl,
      filename: filename
    });
  } catch (err: unknown) {
    console.error('Nanobanana/Gemini error:', err);

    if (err instanceof Error) {
      return res.status(500).json({ error: 'Error calling Gemini image model', message: err.message });
    }

    return res.status(500).json({ error: 'Unknown error calling Gemini image model' });
  }
}
