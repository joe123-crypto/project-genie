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

    // Determine if this is an image processing request
    const isImageRequest = images && images.length > 0;
    const model = isImageRequest ? "google/gemini-2.5-flash-image-preview" : "google/gemini-2.5-flash";

    const result = await generateText({
      model,
      providerOptions: {
        google: { 
          apiKey, 
          responseModalities: isImageRequest ? ["IMAGE", "TEXT"] : ["TEXT"] 
        },
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...(images ? images.map(img => ({ type: "image" as const, image: img })) : [])
          ],
        },
      ],
    });

    // Look inside steps to find content
    const textContent = result.steps
      ?.flatMap(step => step.content)
      ?.filter((c: any) => c.type === "text")
      ?.map((c: any) => c.text)
      ?.join("\n");

    const imageContent = result.steps
      ?.flatMap(step => step.content)
      ?.filter((c: any) => c.type === "file")
      ?.map((c: any) => c.file?.data)
      ?.join("");

    if (isImageRequest && imageContent) {
      const dataUrl = `data:image/jpeg;base64,${imageContent}`;
      res.status(200).json({ imageUrl: dataUrl });
    } else if (textContent) {
      res.status(200).json({ text: textContent });
    } else {
      console.error("No content returned from Gemini", result);
      res.status(500).json({ error: "No response from Gemini" });
    }
  } catch (err) {
    console.error("Error calling Gemini API:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
