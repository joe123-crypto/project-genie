import { NextResponse } from 'next/server';
import { applyImageTemplate } from '../../../services/geminiService';

export async function POST(req: Request) {
    try {
        const { image, templatePrompt } = await req.json();

        if (!image || !templatePrompt) {
            return NextResponse.json({ error: 'Missing required fields: image, templatePrompt' }, { status: 400 });
        }

        const resultImageUrl = await applyImageTemplate([image], templatePrompt);

        return NextResponse.json({ resultImageUrl }, { status: 200 });
    } catch (error: any) {
        console.error('Error applying template:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
