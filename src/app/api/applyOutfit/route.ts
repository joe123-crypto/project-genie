import { NextResponse } from 'next/server';
import { mergeImages } from '../../../services/geminiService';

export async function POST(req: Request) {
    try {
        const { image, outfitImage, outfitPrompt } = await req.json();

        if (!image || !outfitImage || !outfitPrompt) {
            return NextResponse.json(
                { error: 'Missing required fields: image, outfitImage, outfitPrompt' },
                { status: 400 }
            );
        }

        // mergeImages takes an array of inputs and a prompt
        const resultImageUrl = await mergeImages([image, outfitImage], outfitPrompt);

        return NextResponse.json({ resultImageUrl }, { status: 200 });
    } catch (error: any) {
        console.error('Error applying outfit:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
