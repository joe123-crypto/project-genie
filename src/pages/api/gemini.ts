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
    data: string; // base64
    mediaType: string;
  };
}

interface GeminiTextContent {
  type: "text";
  text: string;
}

type GeminiContent = GeminiFileContent | GeminiTextContent;

interface GeminiStep {
  content?: GeminiContent[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeminiResponse>
) {
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
    const model = isImageRequest ? "google/gemini-2.5-flash-image-preview" : "google/gemini-2.5-flash";

    const result = await generateText({
      model,
      providerOptions: {
        google: {
          apiKey,
          responseModalities: isImageRequest ? ["IMAGE", "TEXT"] : ["TEXT"],
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

    const steps: GeminiStep[] = result.steps || [];

    const textContent = steps
      .flatMap((step) => step.content || [])
      .filter((c): c is GeminiTextContent => c.type === "text")
      .map((c) => c.text)
      .join("\n");

    const fileContent = steps
      .flatMap((step) => step.content || [])
      .filter((c): c is GeminiFileContent => c.type === "file" && c.file?.data)
      .map((c) => c.file.data)
      .join("");

    if (isImageRequest && fileContent) {
      const firstMediaType = steps
        .flatMap((step) => step.content || [])
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
