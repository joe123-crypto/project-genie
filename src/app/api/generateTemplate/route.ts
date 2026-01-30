
import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { generateText } from "ai";
import { firestoreAdmin } from "../../../lib/firestoreAdmin";
import { Template } from "../../../types";
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
  folderPrefix = "templates"
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

export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
};

export const POST = async (req: Request) => {

  // --- Environment Variable Validation ---
  const missingR2Vars = requiredR2EnvVars.filter(v => !process.env[v]);
  if (missingR2Vars.length > 0) {
    console.error(`Missing R2 environment variables: ${missingR2Vars.join(', ')}`);
    return NextResponse.json(
      { error: `Server configuration error: Missing R2 environment variables: ${missingR2Vars.join(', ')}` },
      { status: 500, headers: corsHeaders }
    );
  }
  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error("AI_GATEWAY_API_KEY is not set in the environment variables.");
    return NextResponse.json(
      { error: "Server configuration error: AI API key is missing." },
      { status: 500, headers: corsHeaders }
    );
  }

  const { prompt } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400, headers: corsHeaders });
  }

  try {
    const apiKey = process.env.AI_GATEWAY_API_KEY;

    // 1. Generate template name, description and category
    const nameDescAndCategoryResponse = await generateText({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: `Generate a short, catchy name, a one-sentence description and a category for a template based on this prompt: '${prompt}'. The category must be one of the following: "Fun", "Useful","Futuristic", "Hair Styles" or "Other". Return the response as a JSON object with \'name\', \'description\' and \'category\' keys.`,
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
      return NextResponse.json({ error: "Failed to generate template details from AI response." }, { status: 500, headers: corsHeaders });
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
          content: `Generate a thumbnail preview image for a template with the following description: '${description}'`,
        },
      ],
    });

    const firstStep: any = imageResponse.steps?.[0];
    const filePart: any = firstStep?.content?.find((c: any) => c?.type === "file");
    const generatedFile = filePart?.file ?? filePart;

    if (!generatedFile?.base64Data) {
      console.error("No file returned from Gemini:", imageResponse);
      return NextResponse.json(
        { error: "No image returned from Gemini" },
        { status: 500, headers: corsHeaders }
      );
    }

    const { base64Data, mediaType = "image/png" } = generatedFile;
    const filename = generateRandomFilename("png");

    const r2Url = await uploadPreviewToR2(
      filename,
      base64Data,
      mediaType,
    );

    // 3. Save the template
    const newTemplate: Omit<Template, "id"> = {
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

    const docRef = await firestoreAdmin.collection('filters').add(newTemplate);
    const savedTemplate = { id: docRef.id, ...newTemplate };

    return NextResponse.json(savedTemplate, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("Detailed error in generate-template API:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });
    return NextResponse.json({
      error: "An internal server error occurred.",
      details: error.message || "No specific error message available."
    },
      { status: 500, headers: corsHeaders }
    );
  }
};
