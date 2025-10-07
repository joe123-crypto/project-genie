import { downscale } from "../utils/downscale";

/**
 * Applies a filter to a single image using a prompt.
 * Supports both PNG and WebP via downscale().
 *
 * @param inputs - One or more image sources (File, base64, or URL)
 * @param prompt - The text prompt describing the filter or effect
 * @param save - Optional flag indicating whether to persist result
 * @returns Promise<string> - URL or base64 of the filtered image
 */
export const applyImageFilter = async (
  inputs: (File | string)[],
  prompt: string,
  save?: string
): Promise<string> => {
  if (inputs.length === 0) throw new Error("At least one image is required");

  // Only supports a single image; use mergeImages for multiple
  const first = inputs[0];

  // ✅ Downscale the input image (WebP by default, quality 0.8)
  const imageBase64 = await downscale(first, 1024, "webp", 0.8);
  const mediaType = "image/png";
  // ✅ Send request to backend
  const response = await fetch("/api/nanobanana", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      textPrompt: prompt,
      images: [
        {
          mediaType,
          data: imageBase64,
        },
      ],
      save,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to apply filter");
  }

  // ✅ Handle various possible backend responses
  if (data.imageUrl) return data.imageUrl;
  if (data.transformedImage) return data.transformedImage;
  if (data.imageBase64) {
    return `data:${data.mimeType || mediaType};base64,${data.imageBase64}`;
  }

  throw new Error("No image returned from backend");
};

/**
 * Generates an image from a prompt only (no input images).
 * @param prompt - The text prompt for image generation.
 * @returns A public URL of the generated image (uploaded to R2).
 */
export const generateImage = async (prompt: string): Promise<string> => {
  console.log("hello world");
  try {
    console.log("Generating image with prompt:", prompt);
    
    // Use nanobanana API for image generation; will return base64 now
    const response = await fetch("/api/nanobanana", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ textPrompt: prompt }),
    });

    console.log("Response status:", response.status);

    // Parse the response only once
    const data = await response.json();
    console.log("Response data keys:", Object.keys(data));
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to generate image");
    }

    if (data.imageBase64) {
      return `data:image/png;base64,${data.imageBase64}`;
    }
    if (data.transformedImage) {
      return data.transformedImage;
    }
    if (data.imageUrl){
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
        prompt: `Understand what the user needs and improve this prompt to be more detailed. Do not exaggerate beyond what the user needs, only make it more naunce so that the model understands what the user wants: ${prompt}. Return only the improved prompt, no other text.`
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
 * Applies a filter to multiple images and merges them using a prompt.
 * @param base64ImageDataUrls - An array of base64 encoded images.
 * @param prompt - The prompt describing the merge effect.
 * @returns A promise that resolves to the merged base64 image URL.
 */
export const mergeImages = async (
  imageInputs: (File | string) [],
  prompt: string
): Promise<string> => {
  if (imageInputs.length < 2) {
    throw new Error("At least two images are required to merge.");
  }
  const mergePrompt = `
You are a professional virtual stylist and photo editor.

Combine two images:
1. The first image shows the person. Keep their body shape, face, skin, hair, pose, and lighting exactly the same.
2. The second image shows the outfit or fashion style to apply.

Completely replace the clothing from the first image with the outfit from the second image.
Do not blend or overlay the new clothing on top of the old one.
The old clothing must be fully removed — no outlines, wrinkles, seams, buttons, textures, colors, or fragments from it may remain visible.
Ensure the person looks like they are genuinely wearing the new outfit, as if photographed in it.

Maintain:
- The original face, hair, skin, and background from the first image.
- The same body proportions, lighting, and shadows.
- Perfect realism and photographic consistency.
- Natural texture transitions between skin and fabric.

Never:
- Leave traces of the old clothing.
- Add extra elements, accessories, or invented background changes.
- Alter the person’s body, pose, or identity.

Output a realistic, high-quality image where the new outfit seamlessly replaces the old one.

--- Additional visual style guidance from the outfit filter:
${prompt}
`;

  try {
    /**
     * Converts either a data URL or a remote URL (e.g. R2 image) to pure base64 safely.
     * Uses Blob + FileReader, so the canvas never gets tainted.
     */
    const [imageBase64A, imageBase64B ] = await Promise.all([
      downscale(imageInputs[0],1024,"webp", 0.8),
      downscale(imageInputs[1],1024,"webp", 0.8)
    ])
    /*
    const toBase64 = async (inputUrl: string): Promise<string> => {
      // Case 1: Already a base64 data URL (starts with data:image)
      if (inputUrl.startsWith('data:image')) {
        return inputUrl.split(',')[1];
      }

      // Case 2: Remote image (R2, Firebase, etc.)
      const response = await fetch(inputUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    // Convert both images to safe base64 strings
    const [imageBase64A,imageBase64B] = await Promise.all([ //imageBase64B] = await Promise.all([
      toBase64(base64ImageDataUrls[0]),
      toBase64(base64ImageDataUrls[1]),
    ]);*/
    
    
    // Send both images and the prompt to your backend for merging
    const response = await fetch("/api/nanobanana", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        textPrompt: mergePrompt,
        images: [
          { mediaType: 'image/png', data: imageBase64A },
          { mediaType: 'image/png', data: imageBase64B },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to merge images");
    }

    // Return the generated image URL or base64 from backend
    if (data.imageBase64) return `data:image/png;base64,${data.imageBase64}`;
    if (data.transformedImage) return data.transformedImage;
    if (data.imageUrl) return data.imageUrl;

    throw new Error("No merged image returned from backend");
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
