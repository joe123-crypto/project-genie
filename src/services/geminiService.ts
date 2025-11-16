import { downscale } from "../utils/downscale";
import { getApiBaseUrlRuntime } from "../utils/api";

/**
 * Applies a filter to a single image using a prompt.
 */
export const applyImageFilter = async (
  inputs: (File | string)[],
  prompt: string,
  save?: string
): Promise<string> => {
  if (inputs.length === 0) throw new Error("At least one image is required");

  let first = inputs[0];

  if (typeof first === 'string' && first.startsWith('http')) {
    const url = new URL(first);
    url.searchParams.set('t', Date.now().toString());
    first = url.toString();
  }

  const imageBase64 = await downscale(first, 1024, "webp", 0.8);
  const mediaType = "image/webp";
  
  const applyFilterPrompt = `
<SYSTEM>
You are a professional visual editor and AI image retoucher. You must follow these principles unless explicitly told otherwise in the user\'s instructions below. 1. Purpose: Apply visual filters or artistic effects to the provided image without changing the identity,or emotional expression of any person in it. 2. Preservation rules: Keep all **facial features, expressions, gaze direction, and poses** exactly as they appear in the original image. Do not make anyone smile, frown, look away, or change their emotion unless explicitly requested by the user. Maintain the **same face, proportions, skin tone, hairstyle, and body shape**. Keep the **same framing, composition, and orientation**. 4. Prohibited actions (unless the user explicitly overrides them): Changing facial expression or head position. Altering or reinterpreting identity. Output requirements: The final image must look like the **same photo, same person, but with the additions described by the user.
</SYSTEM>
<USER>
Apply the following filter or style effect to the provided image, following all system rules above:

${prompt}
</USER>
`;

  const baseUrl = getApiBaseUrlRuntime();
  const targetUrl = `${baseUrl}/api/nanobanana`;
  console.log(`[CLIENT] Attempting to fetch: ${targetUrl}`); // Client-side logging

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      textPrompt: applyFilterPrompt,
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

  if (data.imageUrl) return data.imageUrl;
  if (data.transformedImage) return data.transformedImage;
  if (data.imageBase64) {
    return `data:${data.mimeType || mediaType};base64,${data.imageBase64}`;
  }

  throw new Error("No image returned from backend");
};

// ... (rest of the functions updated similarly)

export const generateImage = async (prompt: string, destination?: string): Promise<string> => {
  const baseUrl = getApiBaseUrlRuntime();
  const targetUrl = `${baseUrl}/api/nanobanana`;
  console.log(`[CLIENT] Attempting to fetch: ${targetUrl}`);
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textPrompt: prompt, destination: destination }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to generate image");
    if (data.imageBase64) return `data:image/png;base64,${data.imageBase64}`;
    if (data.transformedImage) return data.transformedImage;
    if (data.imageUrl) return data.imageUrl;
    throw new Error("No image returned from backend");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const generateText = async (prompt: string): Promise<string> => {
  const baseUrl = getApiBaseUrlRuntime();
  const targetUrl = `${baseUrl}/api/gemini`;
  console.log(`[CLIENT] Attempting to fetch: ${targetUrl}`);
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to generate text");
    if (!data.text) throw new Error("No text returned from backend");
    return data.text;
  } catch (error) {
    console.error("Error generating text:", error);
    throw error;
  }
};

export const improvePrompt = async (prompt: string): Promise<string> => {
  const baseUrl = getApiBaseUrlRuntime();
  const targetUrl = `${baseUrl}/api/gemini`;
  console.log(`[CLIENT] Attempting to fetch: ${targetUrl}`);
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt: `...` // Prompt content omitted for brevity
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to improve prompt");
    if (!data.text) throw new Error("No improved prompt returned from backend");
    return data.text;
  } catch (error) {
    console.error("Error improving prompt:", error);
    throw error;
  }
};

export const mergeImages = async (
  imageInputs: (File | string) [],
  prompt: string,
  save?: string
): Promise<string> => {
  if (imageInputs.length < 2) throw new Error("At least two images are required to merge.");
  
  const mergePrompt = `...`; // Prompt content omitted for brevity

  const baseUrl = getApiBaseUrlRuntime();
  const targetUrl = `${baseUrl}/api/nanobanana`;
  console.log(`[CLIENT] Attempting to fetch: ${targetUrl}`);

  try {
    const [imageBase64A, imageBase64B] = await Promise.all([
      downscale(imageInputs[0], 1024, "webp", 0.8),
      downscale(imageInputs[1], 1024, "webp", 0.8),
    ]);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        textPrompt: mergePrompt,
        images: [
          { mediaType: 'image/webp', data: imageBase64A },
          { mediaType: 'image/webp', data: imageBase64B },
        ],
        save,
      }),
    });

    if (!response.ok) {
      let errorText = `Request failed with status ${response.status}`;
      try { const errorData = await response.json(); errorText = errorData.error || errorText; } catch {}
      throw new Error(errorText);
    }

    const data = await response.json();
    if (data.imageBase64) return `data:image/png;base64,${data.imageBase64}`;
    if (data.transformedImage) return data.transformedImage;
    if (data.imageUrl) return data.imageUrl;
    throw new Error("No merged image returned from backend");
  } catch (error) {
    console.error("Error merging images:", error);
    throw error;
  }
};

// Alias functions
export const generateImageFromPrompt = generateImage;
export const applyFilter = (base64ImageDataUrl: string, prompt: string) => applyImageFilter([base64ImageDataUrl], prompt);
export const mergeImagesWithFilter = mergeImages;
export const createImageFromPrompt = generateImage;
export const createTextFromPrompt = generateText;
export const applyFilterToImage = (base64ImageDataUrl: string, prompt: string) => applyImageFilter([base64ImageDataUrl], prompt);
export const mergeImagesWithFilterEffect = mergeImages;
export const filterImage = (base64ImageDataUrl: string, prompt: string) => applyImageFilter([base64ImageDataUrl], prompt);
export const mergeImagesWithFilterPrompt = mergeImages;
export const applyFilterToSingleImage = (base64ImageDataUrl: string, prompt: string) => applyImageFilter([base64ImageDataUrl], prompt);
export const mergeMultipleImages = mergeImages;
