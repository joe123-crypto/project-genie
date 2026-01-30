import { Template } from '../types';

export const fetchTemplateById = async (templateId: string): Promise<Template> => {
    const response = await fetch(`/api/templates/${templateId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch template');
    }
    return response.json();
};
