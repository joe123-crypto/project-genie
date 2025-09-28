// pages/api/nanobanana.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { generateText } from 'ai';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';

interface ImageInput {
  mediaType: string;
  data?: string; // base64 inline data (old flow)
  url?: string;  // R2 file URL (new flow)
}

// --- Cloudflare R2 (S3-compatible) setup ---
const r2BucketName = process.env.R2_BUCKET_NAME || 'genie-bucket';
const r2Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  } : undefined,
});

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

function generateRandomFilename(extension: string = 'png'): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomId}.${extension}`;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { textPrompt, images, imageBase64 } = req.body as { textPrompt?: string; images?: ImageInput[]; imageBase64?: string };
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
            ...(imageBase64
              ? [{ type: 'file' as const, mediaType: 'image/png', data: imageBase64 }]
              : (images || []).map((img) => {
                  if (img.data) {
                    return { type: 'file' as const, mediaType: img.mediaType, data: img.data };
                  } else if (img.url) {
                    return { type: 'file' as const, mediaType: img.mediaType, data: img.url };
                  } else {
                    throw new Error('Image must have either data or url');
                  }
                })
            ),
          ],
        },
      ],
    });

    // Safely extract the image file content from the first step
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstStep: any = result.steps?.[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileContent: any = firstStep?.content?.find((c: any) => c?.type === 'file');

    if (!fileContent || !fileContent.file) {
      console.error('No file returned from Gemini, full result:', result);
      return res.status(500).json({ error: 'No image returned from Gemini' });
    }

    const { file } = fileContent as { file: { mediaType?: string; base64Data?: string } };
    const base64 = file.base64Data;
    if (!base64) {
      console.error('File object missing base64 content:', file);
      return res.status(500).json({ error: 'Malformed image data from Gemini' });
    }

    const dataUrl = `data:${file.mediaType || 'image/png'};base64,${base64}`;
    const filename = generateRandomFilename('png');
    const r2Url = await uploadPreviewToR2(filename, dataUrl);

    return res.status(200).json({
      imageUrl: r2Url,
      mimeType: file.mediaType || 'image/png',
    });
  } catch (err: unknown) {
    console.error('Nanobanana/Gemini error:', err);

    // If the error is an object and has a message, return it to the client
    if (err && typeof err === 'object') {
      // Try to extract a useful error message from known error shapes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyErr = err as any;
      if (anyErr.message) {
        return res.status(500).json({ error: anyErr.message });
      }
      // Vercel AI Gateway errors may have a responseBody with a JSON error
      if (anyErr.responseBody) {
        try {
          const parsed = JSON.parse(anyErr.responseBody);
          if (parsed?.error?.message) {
            return res.status(500).json({ error: parsed.error.message });
          }
        } catch {}
      }
    }

    if (err instanceof Error) {
      return res.status(500).json({ error: 'Error calling Gemini image model', message: err.message });
    }

    return res.status(500).json({ error: 'Unknown error calling Gemini image model' });
  }
}
