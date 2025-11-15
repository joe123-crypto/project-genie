// pages/api/nanobanana.ts
import { NextApiRequest, NextApiResponse } from "next";
import { generateText } from "ai";
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";

interface ImageInput {
  mediaType: string;
  data?: string;
  url?: string;
}

// --- Cloudflare R2 (S3-compatible) setup ---
const r2BucketName = process.env.R2_BUCKET_NAME || "genie-bucket";
const r2Client = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials:
    process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
        }
      : undefined,
});

// helper: decode base64 into buffer
function parseBase64ToBuffer(
  base64: string,
  mimeType: string
): { mimeType: string; buffer: Buffer } {
  const buffer = Buffer.from(base64, "base64");
  return { mimeType, buffer };
}

async function uploadPreviewToR2(
  key: string,
  base64: string,
  mimeType: string,
  folderPrefix = "filtered"
): Promise<string> {
  const { buffer } = parseBase64ToBuffer(base64, mimeType);
  const finalKey = `${folderPrefix.replace(/\/$/, "")}/${key}`;

  const params: PutObjectCommandInput = {
    Bucket: r2BucketName,
    Key: finalKey,
    Body: buffer,
    ContentType: mimeType,
  };

  await r2Client.send(new PutObjectCommand(params));

  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${finalKey}`;
  }
  const endpoint = (process.env.R2_ENDPOINT || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  return `https://${endpoint}/${r2BucketName}/${finalKey}`;
}

function generateRandomFilename(extension = "png"): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomId}.${extension}`;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Server-side logging
  console.log(`[SERVER] Received request to /api/nanobanana.`);
  console.log(`[SERVER] Request Origin: ${req.headers.origin}`);

  if (req.method === 'OPTIONS') {
    // Handle preflight OPTIONS request for CORS
    return res.status(200).json({ message: 'OPTIONS request successful' });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { textPrompt, images, imageBase64, destination } = req.body as {
    textPrompt?: string;
    images?: ImageInput[];
    imageBase64?: string;
    destination?: string;
  };

  if (!textPrompt) {
    return res.status(400).json({ error: "textPrompt required" });
  }
  try {
    const result = await generateText({
      model: "google/gemini-2.5-flash-image",
      providerOptions: {
        google: {
          responseModalities: ["IMAGE"],
        },
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: textPrompt },
            ...(imageBase64
              ? [
                  {
                    type: "file" as const,
                    mediaType: "image/png",
                    data: imageBase64,
                  },
                ]
              : (images || []).map((img) => {
                  if (img.data) {
                    return {
                      type: "file" as const,
                      mediaType: img.mediaType,
                      data: img.data,
                    };
                  } else if (img.url) {
                    return {
                      type: "file" as const,
                      mediaType: img.mediaType,
                      data: img.url,
                    };
                  } else {
                    throw new Error("Image must have either data or url");
                  }
                })),
          ],
        },
      ],
    });

    const firstStep: any = result.steps?.[0];
    const filePart: any = firstStep?.content?.find((c: any) => c?.type === "file");
    const generatedFile = filePart?.file ?? filePart;

    if (!generatedFile?.base64Data) {
      console.error("No file returned from Gemini:", result);
      return res.status(500).json({ error: "No image returned from Gemini" });
    }

    const { base64Data, mediaType = "image/png" } = filePart.file;
    const filename = generateRandomFilename("png");
    const folder = destination || "filtered";

    const r2Url = await uploadPreviewToR2(
      filename,
      base64Data,
      mediaType,
      folder,
    );
    
    console.log(`[SERVER] Successfully uploaded image to: ${r2Url}`);
    
    return res.status(200).json({
      imageUrl: r2Url,
      mimeType: mediaType,
    });
  } catch (err: unknown) {
    console.error("Nanobanana/Gemini error:", err);

    if (err && typeof err === "object") {
      const anyErr = err as any;
      if (anyErr.message) {
        return res.status(500).json({ error: anyErr.message });
      }
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
      return res
        .status(500)
        .json({ error: "Error calling Gemini image model", message: err.message });
    }

    return res
      .status(500)
      .json({ error: "Unknown error calling Gemini image model" });
  }
}
