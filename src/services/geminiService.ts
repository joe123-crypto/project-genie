// Updated geminiService.ts to use AI SDK instead of @google/genai
// This service will make API calls to our Next.js API routes that use the AI SDK

/**
 * Applies a filter to one or more images using a prompt.
 * @param base64ImageDataUrls - An array of base64 encoded images.
 * @param prompt - The prompt describing the filter or merge effect.
 * @returns A promise that resolves to the public URL of the filtered image.
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

    // Parse the response only once
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to apply filter");
    }

    if (!data.transformedImage) {
      throw new Error("No image returned from backend");
    }

    console.log("Filtered image uploaded to R2:", data.transformedImage);
    return data.transformedImage; // This is now a public URL
  } catch (error) {
    console.error("Error applying image filter:", error);
    throw error;
  }
};

/**
 * Generates an image from a prompt only (no input images).
 * @param prompt - The text prompt for image generation.
 * @returns A public URL of the generated image (uploaded to R2).
 */
export const generateImage = async (prompt: string): Promise<string> => {
  try {
    console.log("Generating image with prompt:", prompt);
    
    // Use nanobanana API for image generation - now uploads to R2 automatically
    const response = await fetch("/api/nanobanana", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        textPrompt: prompt,
        images: [] // Empty array for pure text-to-image generation
      }),
    });

    console.log("Response status:", response.status);

    // Parse the response only once
    const data = await response.json();
    console.log("Response data keys:", Object.keys(data));
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to generate image");
    }

    // Check for transformedImage (nanobanana API response format)
    if (data.transformedImage) {
      console.log("Image generated and uploaded to R2:", data.transformedImage);
      return data.transformedImage; // This is now a public URL
    }
    
    // Fallback to imageUrl (gemini API response format)
    if (data.imageUrl) {
      return data.imageUrl;
    }

    console.error("No image in response:", data);
    throw new Error("No image returned from backend");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * Generates text from a prompt using Gemini.
 * @param prompt - The text prompt for generation.
 * @returns A promise that resolves to the generated text.
 */
export const generateText = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    // Parse the response only once
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to generate text");
    }

    if (!data.text) {
      throw new Error("No text returned from backend");
    }

    return data.text;
  } catch (error) {
    console.error("Error generating text:", error);
    throw error;
  }
};

/**
 * Improves a prompt using AI to make it more creative and detailed.
 * @param prompt - The original prompt to improve.
 * @returns A promise that resolves to the improved prompt.
 */
export const improvePrompt = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        prompt: `Improve this prompt to be more creative, detailed, and specific for image generation: ${prompt}` 
      }),
    });

    // Parse the response only once
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to improve prompt");
    }

    if (!data.text) {
      throw new Error("No improved prompt returned from backend");
    }

    return data.text;
  } catch (error) {
    console.error("Error improving prompt:", error);
    throw error;
  }
};

/**
 * Generates a trending filter based on current trends and popular styles.
 * @returns A promise that resolves to trending filter data.
 */
export const generateTrendingFilter = async (): Promise<{ name: string; description: string; prompt: string; previewImageUrl?: string }> => {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        prompt: "Generate a trending photo filter idea for 2024. Include a creative name, description, and detailed prompt for image generation. Format as JSON with keys: name, description, prompt" 
      }),
    });

    // Parse the response only once
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to generate trending filter");
    }

    if (!data.text) {
      throw new Error("No trending filter returned from backend");
    }

    // Try to parse the JSON response
    try {
      const filterData = JSON.parse(data.text);
      return {
        name: filterData.name || "Trending Filter",
        description: filterData.description || "A popular photo filter",
        prompt: filterData.prompt || "Create a trending photo filter effect",
        previewImageUrl: filterData.previewImageUrl
      };
    } catch (parseError) {
      // If JSON parsing fails, return a default structure
      return {
        name: "Trending Filter",
        description: data.text || "A popular photo filter",
        prompt: data.text || "Create a trending photo filter effect"
      };
    }
  } catch (error) {
    console.error("Error generating trending filter:", error);
    throw error;
  }
};

/**
 * Applies a filter to multiple images and merges them using a prompt.
 * @param base64ImageDataUrls - An array of base64 encoded images.
 * @param prompt - The prompt describing the merge effect.
 * @returns A promise that resolves to the merged base64 image URL.
 */
export const mergeImages = async (
  base64ImageDataUrls: string[],
  prompt: string
): Promise<string> => {
  if (base64ImageDataUrls.length < 2) {
    throw new Error("At least two images are required to merge.");
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

    // Parse the response only once
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to merge images");
    }

    if (!data.transformedImage) {
      throw new Error("No merged image returned from backend");
    }

    console.log("Merged image uploaded to R2:", data.transformedImage);
    return data.transformedImage; // This is now a public URL
  } catch (error) {
    console.error("Error merging images:", error);
    throw error;
  }
};

// Alias functions for backward compatibility
export const generateImageFromPrompt = generateImage;
export const applyFilter = (base64ImageDataUrl: string, prompt: string) => 
  applyImageFilter([base64ImageDataUrl], prompt);
export const mergeImagesWithFilter = mergeImages;
export const createImageFromPrompt = generateImage;
export const createTextFromPrompt = generateText;
export const applyFilterToImage = (base64ImageDataUrl: string, prompt: string) => 
  applyImageFilter([base64ImageDataUrl], prompt);
export const mergeImagesWithFilterEffect = mergeImages;
export const filterImage = (base64ImageDataUrl: string, prompt: string) => 
  applyImageFilter([base64ImageDataUrl], prompt);
export const mergeImagesWithFilterPrompt = mergeImages;
export const applyFilterToSingleImage = (base64ImageDataUrl: string, prompt: string) => 
  applyImageFilter([base64ImageDataUrl], prompt);
export const mergeMultipleImages = mergeImages;
