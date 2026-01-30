import { NextResponse } from 'next/server';
import { saveOutfit } from '../../../services/firebaseService';
import { Outfit } from '../../../types';

export async function POST(req: Request) {
    try {
        const outfitData: Omit<Outfit, 'id'> = await req.json();

        // Basic validation
        if (!outfitData.name || !outfitData.prompt || !outfitData.previewImageUrl) {
            return NextResponse.json({ error: 'Missing required fields: name, prompt, previewImageUrl' }, { status: 400 });
        }

        const newOutfit = await saveOutfit(outfitData);
        return NextResponse.json(newOutfit, { status: 201 });
    } catch (error) {
        console.error('Error creating outfit:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
