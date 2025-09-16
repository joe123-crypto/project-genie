// Updated geminiService.ts to use AI SDK instead of @google/genai
// This service will make API calls to our Next.js API routes that use the AI SDK

/**
 * Applies a filter to one or more images using a prompt.
 * @param base64ImageDataUrls - An array of base64 encoded images.
 * @param prompt - The prompt describing the filter or merge effect.
 * @returns A promise that resolves to the new base64 image URL.
 */
export const applyImageFilter = async (
  base64ImageDataUrls: string[],
  prompt: string
): Promise<string> => {
  if (base64ImageDataUrls.length === 0) {
    throw new Error("At least one image is required to apply a filter.");
  }

  try {
    // Convert base64 data URLs into objects compatible with backend
    const images = base64ImageDataUrls.map((dataUrl) => {
      const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
      if (!match) throw new Error("Invalid base64 image format");
      return {
        mediaType: match[1],
        data: match[2],
      };
    });

    const response = await fetch("/api/nanobanana", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        textPrompt: prompt,
        images,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to apply filter");
    }

    const data = await response.json();
    if (!data.transformedImage) {
      throw new Error("No image returned from backend");
    }

    return data.transformedImage; // base64 data URL, can use directly in <img src={...} />
  } catch (error) {
    console.error("Error applying image filter:", error);
    throw error;
  }
};

/**
 * Generates an image from a prompt only (no input images).
 * @param prompt - The text prompt for image generation.
 * @returns A base64 data URL of the generated image.
 */
export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  const response = await fetch('/api/nanobanana', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ textPrompt: prompt, images: [] }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate image from prompt');
  }

  const data = await response.json();
  if (!data.transformedImage) throw new Error('No image returned from backend');
  return data.transformedImage;
};

/**
 * Improves a given prompt by making it more detailed and specific.
 * @param currentPrompt - The current prompt to improve.
 * @returns A promise that resolves to an improved prompt.
 */
export const improvePrompt = async (currentPrompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Improve this image generation prompt to be more detailed and specific: "${currentPrompt}". Return only the improved prompt.`
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to improve prompt');
    }

    const data = await response.json();
    return data.text || currentPrompt;
  } catch (error) {
    console.error('Error improving prompt:', error);
    return currentPrompt; // Return original prompt if improvement fails
  }
};

/**
 * Generates a random creative prompt for image generation.
 * @returns A promise that resolves to a random prompt.
 */
export const generateRandomPrompt = async (): Promise<string> => {
  const randomThemes = [
    'vintage fashion photography',
    'cyberpunk cityscape',
    'magical forest',
    'retro gaming aesthetic',
    'minimalist architecture',
    'fantasy portrait',
    'abstract art',
    'nature landscape',
    'urban street art',
    'cosmic space scene'
  ];

  const randomTheme = randomThemes[Math.floor(Math.random() * randomThemes.length)];
  
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Generate a creative and detailed image generation prompt about: ${randomTheme}. Return only the prompt.`
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate random prompt');
    }

    const data = await response.json();
    return data.text || `A beautiful ${randomTheme} with artistic lighting and composition`;
  } catch (error) {
    console.error('Error generating random prompt:', error);
    return `A beautiful ${randomTheme} with artistic lighting and composition`;
  }
};

/**
 * Generates a complete filter with name, description, prompt, and preview image.
 * @param theme - The theme for the filter.
 * @returns A promise that resolves to a complete filter object.
 */
export const generateFullFilter = async (theme: string): Promise<{ name: string, description: string, prompt: string, previewImageUrl: string }> => {
  try {
    // Generate the prompt first
    const promptResponse = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Create a detailed image generation prompt for a filter with theme: ${theme}. Return only the prompt.`
      }),
    });

    if (!promptResponse.ok) {
      throw new Error('Failed to generate prompt');
    }

    const promptData = await promptResponse.json();
    const prompt = promptData.text || `A beautiful ${theme} filter with artistic effects`;

    // Generate the preview image
    const previewImageUrl = await generateImageFromPrompt(prompt);

    // Generate name and description
    const metaResponse = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Create a name and description for an image filter with theme: ${theme}. Return in JSON format: {"name": "Filter Name", "description": "Filter description"}`
      }),
    });

    let name = `${theme} Filter`;
    let description = `A beautiful ${theme} filter for your images`;

    if (metaResponse.ok) {
      const metaData = await metaResponse.json();
      try {
        const parsed = JSON.parse(metaData.text);
        name = parsed.name || name;
        description = parsed.description || description;
      } catch (e) {
        console.warn('Failed to parse metadata JSON');
      }
    }

    return {
      name,
      description,
      prompt,
      previewImageUrl
    };
  } catch (error) {
    console.error('Error generating full filter:', error);
    throw error;
  }
};

/**
 * Categorizes a filter as either 'Useful' or 'Fun'.
 * @param name - The filter name.
 * @param description - The filter description.
 * @param prompt - The filter prompt.
 * @returns A promise that resolves to the category.
 */
export const categorizeFilter = async (name: string, description: string, prompt: string): Promise<'Useful' | 'Fun'> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Categorize this image filter as either "Useful" or "Fun" based on its name, description, and prompt. Name: "${name}", Description: "${description}", Prompt: "${prompt}". Return only "Useful" or "Fun".`
      }),
    });

    if (!response.ok) {
      return 'Fun'; // Default to Fun if categorization fails
    }

    const data = await response.json();
    const category = data.text?.trim();
    return (category === 'Useful') ? 'Useful' : 'Fun';
  } catch (error) {
    console.error('Error categorizing filter:', error);
    return 'Fun'; // Default to Fun if categorization fails
  }
};

/**
 * Generates a trending filter based on current trends.
 * @returns A promise that resolves to a trending filter object.
 */
export const generateTrendingFilter = async (): Promise<{ name: string, description: string, prompt: string, previewImageUrl: string }> => {
  const trendingThemes = [
    'vintage aesthetic',
    'cyberpunk neon',
    'minimalist design',
    'retro gaming',
    'fantasy art',
    'urban street style',
    'cosmic space',
    'nature photography',
    'abstract art',
    'futuristic tech'
  ];

  const randomTheme = trendingThemes[Math.floor(Math.random() * trendingThemes.length)];
  return generateFullFilter(randomTheme);
};
