import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { taskId } = req.query;

    if (!taskId || typeof taskId !== "string") {
        return res.status(400).json({ error: "taskId is required" });
    }

    const apiKey = process.env.POLLO_AI_API_KEY;
    if (!apiKey) {
        console.error("POLLO_AI_API_KEY is missing");
        return res.status(500).json({ error: "Server configuration error" });
    }

    try {
        const response = await fetch(`https://pollo.ai/api/platform/generation/${taskId}/status`, {
            method: "GET",
            headers: {
                "x-api-key": apiKey,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Pollo AI Status API Error:", response.status, errorText);
            return res.status(response.status).json({ error: `Pollo AI Status API Error: ${errorText}` });
        }

        const data = await response.json();
        // Expected response: { "taskId": "...", "generations": [ { "status": "...", "url": "..." } ] }
        return res.status(200).json(data);

    } catch (error) {
        console.error("Error checking video status:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
