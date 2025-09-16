import { NextApiRequest, NextApiResponse } from 'next';
import { generateText } from 'ai';

interface ImageInput {
  mediaType: string;
  data: string;
}

interface GeminiContentFile {
  type: 'file' | 'text';
  mediaType?: string;
  data?: string;
  file?: {
    mediaType: string;
    base64Data: string;
  };
}

interface GeminiStep {
  content?: GeminiContentFile[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { textPrompt, images } = req.body as { textPrompt?: string; images?: ImageInput[] };

  if (!textPrompt) return res.status(400).json({ error: 'textPrompt required' });

  try {
    const result = await generateText({
      model: 'google/gemini-2.5-flash-image-preview',
      providerOptions: { google: { responseModalities: ['TEXT', 'IMAGE'] } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: textPrompt },
            ...(images || []).map((img) => ({
              type: 'file',
              mediaType: img.mediaType,
              data: img.data,
            })),
          ],
        },
      ],
    });

    const step: GeminiStep | undefined = result.steps?.[0];

    const fileObj = step?.content?.find((c) => c.type === 'file')?.file;

    if (!fileObj) {
      console.error('No file returned from Gemini, full step object:', step);
      return res.status(500).json({ error: 'No image returned from Gemini' });
    }

    const dataUrl = `data:${fileObj.mediaType};base64,${fileObj.base64Data}`;
    return res.status(200).json({ transformedImage: dataUrl });
  } catch (err: unknown) {
    console.error('Nanobanana/Gemini error:', err);

    if (err instanceof Error) {
      return res.status(500).json({ error: 'Error calling Gemini image model', message: err.message });
    }

    return res.status(500).json({ error: 'Unknown error calling Gemini image model' });
  }
}
