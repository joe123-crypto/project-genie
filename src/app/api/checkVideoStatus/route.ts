import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const taskId = new URL(req.url).searchParams.get('id');

    if (!taskId || typeof taskId !== "string") {
        return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const apiKey = process.env.POLLO_AI_API_KEY;
    if (!apiKey) {
        console.error("POLLO_AI_API_KEY is missing");
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
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
            return NextResponse.json({ error: `Pollo AI Status API Error: ${errorText}` }, { status: 500 });
        }

        const data = await response.json();
        // Expected response: { "taskId": "...", "generations": [ { "status": "...", "url": "..." } ] }
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Error checking video status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
