import { generateText } from "ai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { textPrompt, images } = req.body;

  if (!textPrompt) return res.status(400).json({ error: "textPrompt required" });

  try {
    const result = await generateText({
      model: "google/gemini-2.5-flash-image-preview",
      providerOptions: { google: { responseModalities: ["TEXT", "IMAGE"] } },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: textPrompt },
            ...(images || []).map((img: any) => ({
              type: "file",
              mediaType: img.mediaType,
              data: img.data,
            })),
          ],
        },
      ],
    });

    const step = result.steps?.[0];
    const fileObj = step?.content?.find((c: any) => c.type === "file")?.file;

    if (!fileObj) {
      console.error("No file returned from Gemini, full step object:", step);
      return res.status(500).json({ error: "No image returned from Gemini" });
    }

    const dataUrl = `data:${fileObj.mediaType};base64,${fileObj.base64Data}`;
    return res.status(200).json({ transformedImage: dataUrl });
  } catch (err: any) {
    console.error("Nanobanana/Gemini error:", err);
    return res.status(500).json({ error: "Error calling Gemini image model", message: err.message });
  }
}
