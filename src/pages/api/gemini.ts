import type { NextApiRequest, NextApiResponse } from "next";
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeminiResponse>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust this to your app's domain for better security
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, images } = req.body as GeminiRequestBody;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server misconfiguration" });

    const isImageRequest = images && images.length > 0;
    const isImageGeneration = !isImageRequest && prompt.toLowerCase().includes("image") || 
                             !isImageRequest && (prompt.toLowerCase().includes("generate") || 
                             prompt.toLowerCase().includes("create") || 
                             prompt.toLowerCase().includes("draw") || 
                             prompt.toLowerCase().includes("paint"));
    
    // Use image generation model for image requests or when prompt suggests image generation
    const model = (isImageRequest || isImageGeneration) ? "google/gemini-2.5-flash-image-preview" : "google/gemini-2.5-flash";
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
      return res.status(200).json({ imageUrl: dataUrl });
    } else if (textContent) {
      return res.status(200).json({ text: textContent });
    } else {
      console.error("No content returned from Gemini", result);
      return res.status(500).json({ error: "No response from Gemini" });
    }
  } catch (err: unknown) {
    console.error("Error calling Gemini API:", err);
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}