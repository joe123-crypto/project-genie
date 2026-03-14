import { NextResponse } from "next/server";
import { experimental_generateVideo as generateVideo } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { corsHeaders } from "@/lib/cors";
import { isCiSmokeTestMode, smokeJson } from "@/lib/ciSmoke";

// Video generation can take a long time — allow up to 5 minutes
export const maxDuration = 300;

export function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: corsHeaders,
    });
}

export async function POST(req: Request) {
    const { prompt, imageBase64, mediaType, duration, aspectRatio, motion } = (await req.json()) as {
        prompt?: string;
        imageBase64?: string;
        mediaType?: string;
        duration?: string;
        aspectRatio?: string;
        motion?: number;
    };

    if (!prompt) {
        return NextResponse.json(
            { error: "prompt is required" },
            { status: 400, headers: corsHeaders }
        );
    }

    if (!imageBase64) {
        return NextResponse.json(
            { error: "imageBase64 is required" },
            { status: 400, headers: corsHeaders }
        );
    }

    if (isCiSmokeTestMode()) {
        return smokeJson(
            { taskId: "smoke-video-task-1", status: "processing" },
            200,
            corsHeaders
        );
    }

    try {
        console.log(
            `[SERVER] Generating video with bytedance/seedance-v1.5-pro...`,
            { duration, aspectRatio, motion }
        );

        // Strip data URL prefix if present, keep only the raw base64
        let rawBase64 = imageBase64;
        if (rawBase64.includes(",")) {
            rawBase64 = rawBase64.split(",")[1];
        }

        const enhancedPrompt = `${prompt} (Aspect Ratio: ${aspectRatio || '16:9'}, Duration: ${duration || '5s'}, Motion Guidance: ${motion || 5}/10)`;

        const { video } = await generateVideo({
            model: gateway.video("bytedance/seedance-v1.5-pro"),
            prompt: {
                image: rawBase64,
                text: enhancedPrompt,
            },
        });

        const videoBase64 = video.base64;

        if (!videoBase64) {
            console.error("[SERVER] No video data returned from Seedance");
            return NextResponse.json(
                { error: "No video returned from model" },
                { status: 500, headers: corsHeaders }
            );
        }

        console.log(
            `[SERVER] Video generated successfully (${Math.round(videoBase64.length / 1024)}KB base64)`
        );

        return NextResponse.json(
            {
                videoBase64,
                mimeType: "video/mp4",
            },
            { status: 200, headers: corsHeaders }
        );
    } catch (err: unknown) {
        console.error("Video generation error:", err);

        const message =
            err instanceof Error ? err.message : "Unknown error generating video";

        return NextResponse.json(
            { error: message },
            { status: 500, headers: corsHeaders }
        );
    }
}
