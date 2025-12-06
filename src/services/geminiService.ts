import { downscale } from "../utils/downscale";
import { getApiBaseUrlRuntime } from "../utils/api";

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
  let first = inputs[0];

  // Cache-busting for mobile browser issues
  if (typeof first === 'string' && first.startsWith('http')) {
    const url = new URL(first);
    url.searchParams.set('t', Date.now().toString());
    first = url.toString();
  }

  // ✅ Downscale the input image (WebP by default, quality 0.8)
  const imageBase64 = await downscale(first, 1024, "webp", 0.8);
  const mediaType = "image/webp";
  // ✅ Send request to backend
  const applyFilterPrompt = `
<SYSTEM>
You are a professional visual editor and AI image retoucher.

You must follow these principles unless explicitly told otherwise in the user\'s instructions below.

1. Purpose:
   - Apply visual filters or artistic effects to the provided image
     without changing the identity,or emotional expression
     of any person in it.

2. Preservation rules:
   - Keep all **facial features, expressions, gaze direction, and poses**
     exactly as they appear in the original image.
   - Do not make anyone smile, frown, look away, or change their emotion
     unless explicitly requested by the user.
   - Maintain the **same face, proportions, skin tone, hairstyle, and body shape**.
   - Keep the **same framing, composition, and orientation**.

4. Prohibited actions (unless the user explicitly overrides them):
   - Changing facial expression or head position.
   - Altering or reinterpreting identity.

Output requirements:
   - The final image must look like the **same photo, same person, but with the 
     additions described by the user.
</SYSTEM>

<USER>
Apply the following filter or style effect to the provided image, following all system rules above:

${prompt}
</USER>
`;

  const baseUrl = getApiBaseUrlRuntime();
  const targetUrl = `${baseUrl}/api/nanobanana`;

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
export const generateImage = async (prompt: string, destination?: string): Promise<string> => {
  const baseUrl = getApiBaseUrlRuntime();
  const targetUrl = `${baseUrl}/api/nanobanana`;
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ textPrompt: prompt, destination: destination }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate image");
    }

    if (data.imageBase64) {
      return `data:image/png;base64,${data.imageBase64}`;
    }
    if (data.transformedImage) {
      return data.transformedImage;
    }
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
  const baseUrl = getApiBaseUrlRuntime();
  const targetUrl = `${baseUrl}/api/gemini`;
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

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
 * Generates a creative name for a hairstyle based on an image using Gemini.
 * @param imageBase64 - The base64 string of the hairstyle image.
 * @returns A promise that resolves to the generated name.
 */
export const generateNameFromImage = async (imageBase64: string): Promise<string> => {
  const baseUrl = getApiBaseUrlRuntime();
  const targetUrl = `${baseUrl}/api/gemini`;
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: "Generate a short, creative, and catchy name (max 3-4 words) for this hairstyle. Return ONLY the name, no quotes.",
        images: [imageBase64]
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate name");
    }

    if (!data.text) {
      throw new Error("No text returned from backend");
    }

    return data.text.replace(/^["']|["']$/g, '').trim(); // Remove quotes if any
  } catch (error) {
    console.error("Error generating name:", error);
    throw error;
  }
};

/**
 * Improves a prompt using AI to make it more creative and detailed.
 * @param prompt - The original prompt to improve.
 * @returns A promise that resolves to the improved prompt.
 */
export const improvePrompt = async (prompt: string): Promise<string> => {
  const baseUrl = getApiBaseUrlRuntime();
  const targetUrl = `${baseUrl}/api/gemini`;
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `Understand what the user needs and improve this prompt to be more detailed. Do not exaggerate beyond what the user wants, only make it more naunce so that the model understands what the user wants: ${prompt}. Return only the improved prompt, no other text.
                 Example

                 -User Prompt: Make the person in the image look young
                 -Your Response: Change the subject in the image to appear elderly, showing signs of aging such as wrinkles around the eyes and mouth, thinning hair (possibly gray or white), and a more weathered skin texture, while maintaining their original features and expression as much as possible.
                `
      }),
    });

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
  imageInputs: (File | string)[],
  prompt: string,
  save?: string
): Promise<string> => {
  if (imageInputs.length < 2) {
    throw new Error("At least two images are required to merge.");
  }
  const mergePrompt = `
You are a professional virtual stylist and photo editor.

Combine two images:
1. The first image shows the person. Keep their **facial structure, expression, gaze direction, pose, body shape, skin tone, hair, and lighting exactly the same.** 
   Do not modify or reinterpret the face in any way — the expression, emotion, eye direction, and mouth position must remain identical to the original.
2. The second image shows the outfit or fashion style to apply.

Completely replace the clothing from the first image with the outfit from the second image.
Do not blend or overlay the new clothing on top of the old one.
The old clothing must be fully removed — no outlines, wrinkles, seams, buttons, textures, colors, or fragments from it may remain visible.

Ensure the person looks naturally photographed wearing the new outfit, with perfect realism and texture blending between skin and fabric.

Maintain:
- The original face, hair, skin tone, expression, gaze direction, and background from the first image.
- The same body proportions, pose, lighting, and shadows.
- Photographic consistency and realism.
- Natural transitions between clothing and skin.

Never:
- Alter or reinterpret the person\'s face, expression, emotion, or head orientation.
- Leave traces of the old clothing.
- Add invented accessories or background changes.
- Change the person\'s body proportions, pose, or identity.

Output a **realistic, high-quality image** where the person retains their exact face and expression, but now appears genuinely dressed in the new outfit.

--- Additional visual style guidance from the outfit filter:
${prompt}
`;

  const baseUrl = getApiBaseUrlRuntime();
  const targetUrl = `${baseUrl}/api/nanobanana`;

  try {
    const processedInputs = imageInputs.map(input => {
      if (typeof input === 'string' && input.startsWith('http')) {
        const url = new URL(input);
        url.searchParams.set('t', Date.now().toString());
        return url.toString();
      }
      return input;
    });

    // Convert both. Images to safe base64 strings and downscale them
    const [imageBase64A, imageBase64B] = await Promise.all([
      downscale(processedInputs[0], 1024, "webp", 0.8),
      downscale(processedInputs[1], 1024, "webp", 0.8),
    ]);

    // Send both images and the prompt to your backend for merging
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
      let errorText;
      try {
        // Try to parse the error response as JSON
        const errorData = await response.json();
        errorText = errorData.error || `Request failed with status ${response.status}`;
      } catch {
        // If parsing fails, use the raw response text
        errorText = await response.text().catch(() => `Request failed with status ${response.status}`);
      }
      throw new Error(errorText || "Failed to merge images");
    }

    const data = await response.json();

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



/**
 * Merges a hairstyle from a source image onto a target person's image.
 * 
 * @param targetImage - The image of the person (User photo)
 * @param hairstyleImage - The source image of the hairstyle.
 * @param prompt - Additional prompt context.
 * @returns Promise<string> - URL or base64 of the result.
 */
export const mergeHairstyle = async (
  targetImage: string,
  hairstyleImage: string,
  prompt: string,
  save?: string
): Promise<string> => {
  // We follow the user's specific request for image order:
  // 1. Hairstyle Image (Source)
  // 2. User Image (Target)
  const imageInputs = [hairstyleImage, targetImage];

  const hairstylePrompt = `
<SYSTEM>
You are a professional hair stylist and AI visual editor.

Task: Transfer the hairstyle from the first image to the person in the second image.

Input Images:
1. First Image: The Source Hairstyle. (Ignore the face/person here).
2. Second Image: The Target Person.

Instructions:
1. Identify the hairstyle in the first image. Copy it **exactly as it is**.
2. Apply this hairstyle to the person in the second image.
3. **Fill in any gaps** where the new hairstyle might not cover the old head shape, or where the original hair was different.
4. **Completely ignore** the person/face in the first image. Only extract the hair.
5. Keep the face, expression, skin tone, and features of the person in the second image **exactly the same**. Do not alter their identity.
6. The result should look like a natural photograph of the person from the second image wearing the hair from the first image.

${prompt}
</SYSTEM>
`;

  const baseUrl = getApiBaseUrlRuntime();
  const targetUrl = `${baseUrl}/api/nanobanana`;

  try {
    const processedInputs = imageInputs.map(input => {
      if (typeof input === 'string' && input.startsWith('http')) {
        const url = new URL(input);
        url.searchParams.set('t', Date.now().toString());
        return url.toString();
      }
      return input;
    });

    const [imageBase64A, imageBase64B] = await Promise.all([
      downscale(processedInputs[0], 1024, "webp", 0.8),
      downscale(processedInputs[1], 1024, "webp", 0.8),
    ]);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        textPrompt: hairstylePrompt,
        images: [
          { mediaType: 'image/webp', data: imageBase64A },
          { mediaType: 'image/webp', data: imageBase64B },
        ],
        save,
      }),
    });

    if (!response.ok) {
      let errorText;
      try {
        const errorData = await response.json();
        errorText = errorData.error || `Request failed with status ${response.status}`;
      } catch {
        errorText = await response.text().catch(() => `Request failed with status ${response.status}`);
      }
      throw new Error(errorText || "Failed to merge hairstyle");
    }

    const data = await response.json();

    if (data.imageBase64) return `data:image/png;base64,${data.imageBase64}`;
    if (data.transformedImage) return data.transformedImage;
    if (data.imageUrl) return data.imageUrl;

    throw new Error("No merged image returned from backend");
  } catch (error) {
    console.error("Error merging hairstyle:", error);
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
