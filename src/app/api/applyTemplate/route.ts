import { NextResponse } from 'next/server';
import { applyImageTemplate } from '../../../services/geminiService';
import { isCiSmokeTestMode, smokeAssetUrl, smokeJson } from '@/lib/ciSmoke';

export async function POST(req: Request) {
    try {
        const { image, templatePrompt } = await req.json();

        if (!image || !templatePrompt) {
            return NextResponse.json({ error: 'Missing required fields: image, templatePrompt' }, { status: 400 });
        }

        if (isCiSmokeTestMode()) {
            return smokeJson({
                resultImageUrl: smokeAssetUrl(req, '/__smoke/applied-template.png')
            }, 200);
        }

        const resultImageUrl = await applyImageTemplate([image], templatePrompt);

        return NextResponse.json({ resultImageUrl }, { status: 200 });
    } catch (error: any) {
        console.error('Error applying template:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
