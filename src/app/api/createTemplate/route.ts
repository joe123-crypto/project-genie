import { NextResponse } from 'next/server';
import { saveTemplate } from '../../../services/firebaseService';
import { Template } from '../../../types';

export async function POST(req: Request) {
    try {
        const templateData: Omit<Template, 'id'> = await req.json();

        // Basic validation
        if (!templateData.name || !templateData.prompt || !templateData.previewImageUrl) {
            return NextResponse.json(
                { error: 'Missing required fields: name, prompt, previewImageUrl' },
                { status: 400 }
            );
        }

        const newTemplate = await saveTemplate(templateData);
        return NextResponse.json(newTemplate, { status: 201 });
    } catch (error) {
        console.error('Error creating template:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
