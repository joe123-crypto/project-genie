import { NextResponse } from "next/server";
import { corsHeaders } from '@/lib/cors';
import { generateText } from "ai";

interface GeminiRequestBody {
  prompt: string;
  images?: string[];
}

interface GeminiResponse {
  text?: string;
  imageUrl?: string;
  error?: string;
}

// Types for Gemini API content
interface GeminiFileContent {
  type: "file";
  file: {
    mediaType: string;
    data: string;
  };
}

interface GeminiTextContent {
  type: "text";
  text: string;
}

type GeminiContent = GeminiFileContent | GeminiTextContent;

// Local type to project the SDK "steps" shape we consume
interface GeminiStepLike {
  content?: GeminiContent[];
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {

  const { prompt, images } = await req.json() as GeminiRequestBody;

  if (!prompt || !prompt.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400, headers: corsHeaders });
  }

  try {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Server misconfiguration" }, { status: 500, headers: corsHeaders });

    const isImageRequest = images && images.length > 0;
    const isImageGeneration = !isImageRequest && prompt.toLowerCase().includes("image") ||
      !isImageRequest && (prompt.toLowerCase().includes("generate") ||
        prompt.toLowerCase().includes("create") ||
        prompt.toLowerCase().includes("draw") ||
        prompt.toLowerCase().includes("paint"));

    // Use image generation model for image requests or when prompt suggests image generation
    const model = (isImageRequest || isImageGeneration) ? "google/gemini-3-pro-image" : "google/gemini-3-pro-image";
    const responseModalities = (isImageRequest || isImageGeneration) ? ["IMAGE", "TEXT"] : ["TEXT"];

    const result = await generateText({
      model,
      providerOptions: {
        google: {
          apiKey,
          responseModalities,
        },
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...(images
              ? images.map((img) => ({ type: "image" as const, image: img }))
              : []),
          ],
        },
      ],
    });

    // Use the SDK steps as-is and narrow type to the shape we consume
    const steps: GeminiStepLike[] = (result.steps as unknown as GeminiStepLike[]) ?? [];

    const textContent = steps
      .flatMap((step) => step.content ?? [])
      .filter((c): c is GeminiTextContent => c.type === "text")
      .map((c) => c.text)
      .join("\n");

    const fileContent = steps
      .flatMap((step) => step.content ?? [])
      .filter((c): c is GeminiFileContent => c.type === "file" && Boolean(c.file?.data))
      .map((c) => c.file.data)
      .join("");

    // Check for image content first (for both image requests and image generation)
    if (fileContent) {
      const firstMediaType = steps
        .flatMap((step) => step.content ?? [])
        .find((c): c is GeminiFileContent => c.type === "file" && !!c.file)
        ?.file.mediaType || "image/jpeg";

      const dataUrl = `data:${firstMediaType};base64,${fileContent}`;
      return NextResponse.json(
        { imageUrl: dataUrl },
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    } else if (textContent) {
      return NextResponse.json({ text: textContent }, { status: 200, headers: corsHeaders })
    } else {
      console.error("No content returned from Gemini", result);
      return NextResponse.json({ error: "No response from Gemini" });
    }
  } catch (err: unknown) {
    console.error("Error calling Gemini API:", err);
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}