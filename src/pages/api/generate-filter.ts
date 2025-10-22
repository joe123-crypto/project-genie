
import type { NextApiRequest, NextApiResponse } from "next";
import { generateText } from "ai";
import { saveFilterAdmin } from "../../lib/firestoreAdmin"; // Corrected import path
import { Filter } from "../../types";
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";

// --- Cloudflare R2 (S3-compatible) setup ---
const r2BucketName = process.env.R2_BUCKET_NAME || "genie-bucket";

const requiredR2EnvVars = [
  'R2_REGION',
  'R2_ENDPOINT',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_BASE_URL'
];

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
  folderPrefix = "filters"
): Promise<string> {
  const r2Client = new S3Client({
    region: process.env.R2_REGION || "auto",
    endpoint: process.env.R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      }
  });

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

  // --- Environment Variable Validation ---
  const missingR2Vars = requiredR2EnvVars.filter(v => !process.env[v]);
  if (missingR2Vars.length > 0) {
      console.error(`Missing R2 environment variables: ${missingR2Vars.join(', ')}`);
      return res.status(500).json({ error: `Server configuration error: Missing R2 environment variables: ${missingR2Vars.join(', ')}` });
  }
  if (!process.env.AI_GATEWAY_API_KEY) {
      console.error("AI_GATEWAY_API_KEY is not set in the environment variables.");
      return res.status(500).json({ error: "Server configuration error: AI API key is missing." });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    
    // 1. Generate filter name, description and category
    const nameDescAndCategoryResponse = await generateText({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: `Generate a short, catchy name, a one-sentence description and a category for a filter based on this prompt: '${prompt}'. The category must be one of the following: "Fun", "Useful", or "Other". Return the response as a JSON object with \'name\', \'description\' and \'category\' keys.`,
        },
      ],
    });

    let name, description, category;
    try {
        const cleanedText = nameDescAndCategoryResponse.text.replace(/```json\n/g, '').replace(/\n```/g, '');
        const jsonResponse = JSON.parse(cleanedText);
        name = jsonResponse.name;
        description = jsonResponse.description;
        category = jsonResponse.category;
    } catch (e: any) {
        console.error("Failed to parse name, description and category from Gemini response", {
            responseText: nameDescAndCategoryResponse.text,
            error: e.message,
        });
        return res.status(500).json({ error: "Failed to generate filter details from AI response." });
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
            content: `Generate a thumbnail preview image for a filter with the following description: '${description}'`,
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

    const { base64Data, mediaType = "image/png" } = generatedFile;
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
      category,
    };
    
    const savedFilter = await saveFilterAdmin(newFilter);

    res.status(200).json(savedFilter);
  } catch (error: any) {
    console.error("Detailed error in generate-filter API:", {
        message: error.message,
        stack: error.stack,
        cause: error.cause,
    });
    res.status(500).json({ 
        error: "An internal server error occurred.",
        details: error.message || "No specific error message available."
    });
  }
};

export default handler;
