
import type { NextApiRequest, NextApiResponse } from "next";
import { generateText } from "ai";
import { saveFilter } from "../../services/firebaseService";
import { Filter } from "../../types";
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";

// --- Cloudflare R2 (S3-compatible) setup ---
const r2BucketName = process.env.R2_BUCKET_NAME || "genie-bucket";
const r2Client = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    }
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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const idToken = authorization.split("Bearer ")[1];

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server misconfiguration" });

    // 1. Generate filter name and description
    const nameAndDescResponse = await generateText({
      model: "google/gemini-2.5-flash",
      providerOptions: {
        google: {
          apiKey,
        },
      },
      messages: [
        {
          role: "user",
          content: `Generate a short, catchy name and a one-sentence description for a filter based on this prompt: \'${prompt}\'. Return the response as a JSON object with \'name\' and \'description\' keys.`,
        },
      ],
    });

    let name, description;
    try {
        const cleanedText = nameAndDescResponse.text.replace(/```json\n/g, '').replace(/\n```/g, '');
        const jsonResponse = JSON.parse(cleanedText);
        name = jsonResponse.name;
        description = jsonResponse.description;
    } catch {
        console.error("Failed to parse name and description from Gemini response", nameAndDescResponse.text);
        return res.status(500).json({ error: "Failed to generate filter details" });
    }

    // 2. Generate image preview
    const imageResponse = await generateText({
        model: "google/gemini-2.5-flash-image-preview",
        providerOptions: {
            google: {
              apiKey,
              responseModalities: ["IMAGE"],
            },
        },
        messages: [
            {
            role: "user",
            content: `Generate a thumbnail preview image for a filter with the following description: \'${description}\'`,
            },
        ],
    });

    const firstStep: any = imageResponse.steps?.[0];
    const filePart: any = firstStep?.content?.find((c: any) => c?.type === "file");
    const generatedFile = filePart?.file ?? filePart;

    if (!generatedFile?.base64Data) {
      console.error("No file returned from Gemini:", imageResponse);
      return res.status(500).json({ error: "No image returned from Gemini" });
    }

    const { base64Data, mediaType = "image/png" } = filePart.file;
    const filename = generateRandomFilename("png");

    const r2Url = await uploadPreviewToR2(
      filename,
      base64Data,
      mediaType,
    );

    // 3. Save the filter
    const newFilter: Omit<Filter, "id"> = {
      name,
      description,
      prompt,
      previewImageUrl: r2Url,
      accessCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creatorId: "", // This will be set on the server
      settings: {},
      category: "Other",
    };

    const savedFilter = await saveFilter(newFilter, idToken);

    res.status(200).json(savedFilter);
  } catch (error) {
    console.error("Error generating filter:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default handler;
