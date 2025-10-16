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


  const response = await fetch("/api/nanobanana", {
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
  console.log("hello world");
  try {
    console.log("Generating image with prompt:", prompt);
    
    // Use nanobanana API for image generation; will return base64 now
    const response = await fetch("/api/nanobanana", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ textPrompt: prompt, destination: destination }),
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
        prompt: `Understand what the user needs and improve this prompt to be more detailed. Do not exaggerate beyond what the user wants, only make it more naunce so that the model understands what the user wants: ${prompt}. Return only the improved prompt, no other text.`
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

  try {
    const processedInputs = imageInputs.map(input => {
      if (typeof input === 'string' && input.startsWith('http')) {
        const url = new URL(input);
        url.searchParams.set('t', Date.now().toString());
        return url.toString();
      }
      return input;
    });
      
    // Convert both images to safe base64 strings and downscale them
    const [imageBase64A, imageBase64B] = await Promise.all([
      downscale(processedInputs[0], 1024, "webp", 0.8),
      downscale(processedInputs[1], 1024, "webp", 0.8),
    ]);

    // Send both images and the prompt to your backend for merging
    const response = await fetch("/api/nanobanana", {
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
      } catch (e) {
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
