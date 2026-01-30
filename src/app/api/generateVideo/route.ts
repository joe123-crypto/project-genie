import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { images, prompt } = await req.json();

    if (!images || !images[0] || !prompt) {
        return NextResponse.json({ error: "Image URL and prompt are required" }, { status: 400 });
    }

    const apiKey = process.env.POLLO_AI_API_KEY;
    if (!apiKey) {
        console.error("POLLO_AI_API_KEY is missing");
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
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
            return NextResponse.json({ error: `Pollo AI API Error: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        // Expected response: { "taskId": "..." }
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Error initiating video generation:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
