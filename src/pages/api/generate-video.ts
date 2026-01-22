import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { images, prompt } = req.body;

    if (!images || !images[0] || !prompt) {
        return res.status(400).json({ error: "Image URL and prompt are required" });
    }

    const apiKey = process.env.POLLO_AI_API_KEY;
    if (!apiKey) {
        console.error("POLLO_AI_API_KEY is missing");
        return res.status(500).json({ error: "Server configuration error" });
    }

    try {
        const response = await fetch("https://pollo.ai/api/platform/generation/google/veo3-1", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            },
            body: JSON.stringify({
                input: {
                    images: [images[0]], // Veo 3.1 takes an array of strings (URLs)
                    prompt: prompt,
                    resolution: "720p",
                    generateAudio: false, // Default to false for now, can be made optional later
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Pollo AI API Error:", response.status, errorText);
            return res.status(response.status).json({ error: `Pollo AI API Error: ${errorText}` });
        }

        const data = await response.json();
        // Expected response: { "taskId": "..." }
        return res.status(200).json(data);

    } catch (error) {
        console.error("Error initiating video generation:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
