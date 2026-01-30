import { NextResponse } from "next/server";
import { generateText } from "ai";
import { corsHeaders } from '@/lib/cors';
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

//CORS HEADERS
export function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: corsHeaders
    })
}


async function uploadPreviewToR2(
    key: string,
    base64: string,
    mimeType: string,
    folderPrefix = "templated"
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
    if (!publicBase) {
        console.error("⚠️ R2_PUBLIC_BASE_URL is not set! Images will not be publicly accessible.");
        throw new Error("R2_PUBLIC_BASE_URL environment variable is required for public image URLs");
    }

    const publicUrl = `${publicBase.replace(/\/+$/, "")}/${finalKey}`;
    console.log(`[SERVER] Generated public URL: ${publicUrl}`);

    return publicUrl;
}

function generateRandomFilename(extension = "png"): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomId}.${extension}`;
}

export const maxDuration = 30;
export const bodyParser = {
    sizeLimit: "20mb",
};
/*export const config = {
    maxDuration: 30,
    api: {
        bodyParser: {
            sizeLimit: "20mb",
        },
    },
};*/

export async function POST(req: Request) {
    console.log(`[SERVER] Received request to /api/nanobanana.`);
    console.log(`[SERVER] Request Origin: ${req.headers.get('origin')}`);

    const { textPrompt, images, save } = req.body as {
        textPrompt?: string;
        images?: ImageInput[];
        save?: string;
    };

    if (!textPrompt) {
        return NextResponse.json({ error: "textPrompt required" }, { status: 400, headers: corsHeaders });
    }

    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.NEXT_PUBLIC_AI_GATEWAY_API_KEY;
    if (!apiKey) {
        console.warn("Warning: AI_GATEWAY_API_KEY not found. AI Gateway requests may fail.");
    }

    try {
        // Determine which model to use based on whether input images are provided
        // Text-to-Image (no images): google/imagen-4.0-ultra-generate-001
        // Image-to-Image (with images): google/gemini-3-pro-image
        const hasInputImages = images && images.length > 0;
        // Use Gemini 3 Pro Image for all - it supports both text-to-image and image-to-image
        const model = "google/gemini-3-pro-image";

        console.log(`[SERVER] Using model: ${model} (Input images: ${hasInputImages ? images?.length : 0})`);

        const result = await generateText({
            model,
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
                        ...(images || []).map((img) => {
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
                        }),
                    ],
                },
            ],
        });

        const firstStep: any = result.steps?.[0];
        const filePart: any = firstStep?.content?.find((c: any) => c?.type === "file");
        const generatedFile = filePart?.file ?? filePart;

        if (!generatedFile?.base64Data) {
            console.error("No file returned from Gemini:", result);
            return NextResponse.json(
                { error: "No image returned from Gemini" },
                { status: 500, headers: corsHeaders }
            );
        }

        const { base64Data, mediaType = "image/png" } = filePart.file;

        // If a 'save' directory is specified, upload to R2 and return the URL
        if (save) {
            const filename = generateRandomFilename("png");
            const r2Url = await uploadPreviewToR2(
                filename,
                base64Data,
                mediaType,
                save,
            );

            console.log(`[SERVER] Successfully uploaded image to: ${r2Url}`);

            return NextResponse.json({
                imageUrl: r2Url,
                mimeType: mediaType,
            }, { status: 200, headers: corsHeaders });
        } else {
            // Otherwise, return the base64 data directly
            return NextResponse.json({
                imageBase64: base64Data,
                mimeType: mediaType,
            }, { status: 200, headers: corsHeaders });
        }
    } catch (err: unknown) {
        console.error("Nanobanana/Gemini error:", err);

        if (err && typeof err === "object") {
            const anyErr = err as any;
            if (anyErr.message) {
                return NextResponse.json({ error: anyErr.message }, { status: 500, headers: corsHeaders });
            }
            if (anyErr.responseBody) {
                try {
                    const parsed = JSON.parse(anyErr.responseBody);
                    if (parsed?.error?.message) {
                        return NextResponse.json({ error: parsed.error.message }, { status: 500, headers: corsHeaders });
                    }
                } catch { }
            }
        }

        if (err instanceof Error) {
            return NextResponse.json(
                { error: "Error calling Gemini image model", message: err.message },
                { status: 500, headers: corsHeaders }
            );
        }

        return NextResponse.json(
            { error: "Unknown error calling Gemini image model" },
            { status: 500, headers: corsHeaders }
        );
    }
}
