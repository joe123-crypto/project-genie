import { NextResponse } from 'next/server';
import { getTemplates, getOutfits } from '../../../services/firebaseService';
import { Template, Outfit } from '../../../types';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q') || '';
        const type = searchParams.get('type') || ''; // 'template' | 'outfit' | undefined (both)

        const searchQuery = q.toLowerCase();
        const searchType = type;

        let results: (Template | Outfit)[] = [];

        if (!searchType || searchType === 'template' || searchType === 'filter') {
            const templates = await getTemplates();
            const matchedTemplates = templates.filter(t =>
                (t.name || '').toLowerCase().includes(searchQuery) ||
                (t.prompt || '').toLowerCase().includes(searchQuery)
            );
            results = [...results, ...matchedTemplates];
        }

        if (!searchType || searchType === 'outfit') {
            const outfits = await getOutfits();
            const matchedOutfits = outfits.filter(o =>
                (o.name || '').toLowerCase().includes(searchQuery) ||
                (o.prompt || '').toLowerCase().includes(searchQuery)
            );
            results = [...results, ...matchedOutfits];
        }
        return NextResponse.json(results, { status: 200 });
    } catch (error: any) {
        console.error('Error searching:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
