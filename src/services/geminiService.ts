import { downscale } from "../utils/downscale";

// Helper function to determine the correct API base URL
// Uses relative URLs for mobile/Android compatibility and to avoid CORS issues
const getApiBaseUrl = (): string => {
  // If explicitly set, use it (strip trailing slash)
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '');
  }
  
  // In browser/mobile environment, always use relative URLs
  // This works with current origin and avoids CORS issues
  if (typeof window !== 'undefined') {
    return '';
  }
  
  // Fallback for SSR/build time (shouldn't be used, but prevents errors)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Development fallback - use relative URLs
  return '';
};

// Helper to detect if running in Capacitor (mobile app)
const isCapacitor = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Check for Capacitor global object
  return !!(window as any).Capacitor || !!(window as any).capacitor;
};

// Helper to detect if we're in a static export (Android build)
const isStaticExport = (): boolean => {
  // Check if API routes are available by looking at the URL structure
  // In static export, we're likely served from a file:// or custom protocol
  if (typeof window === 'undefined') return false;
  
  // If we have a production API URL set and we're not on localhost/web dev server,
  // we might be in static export
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.startsWith('192.168.') ||
                      window.location.hostname.startsWith('10.0.');
  
  // If Capacitor is detected or we have API URL env var and not localhost, use production API
  return isCapacitor() || (!!process.env.NEXT_PUBLIC_API_BASE_URL && !isLocalhost);
};

// Get API base URL dynamically (not at module load time for better mobile support)
const getApiBaseUrlRuntime = (): string => {
  // If we're in Capacitor/static export (Android), use production API URL
  if (typeof window !== 'undefined' && isStaticExport()) {
    // Use production API URL for Android/mobile
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '');
    }
    // Fallback to Vercel URL if available
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    }
    // Hardcoded fallback - you should set NEXT_PUBLIC_API_BASE_URL in your .env.local
    return 'https://project-genie-sigma.vercel.app';
  }
  
  // For web (dev and production), always use relative URLs
  // This works because API routes are on the same server
  if (typeof window !== 'undefined') {
    return '';
  }
  
  // SSR fallback
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '');
  }
  
  return '';
};

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

  const apiBase = getApiBaseUrlRuntime();
  // Ensure we don't get double slashes - if apiBase is empty, just use /api/...
  // If apiBase has a value, make sure it doesn't end with a slash
  const baseUrl = apiBase ? apiBase.replace(/\/+$/, '') : '';
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
  const apiBase = getApiBaseUrlRuntime();
  const baseUrl = apiBase ? apiBase.replace(/\/+$/, '') : '';
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
  const apiBase = getApiBaseUrlRuntime();
  const baseUrl = apiBase ? apiBase.replace(/\/+$/, '') : '';
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
  const apiBase = getApiBaseUrlRuntime();
  const baseUrl = apiBase ? apiBase.replace(/\/+$/, '') : '';
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

  const apiBase = getApiBaseUrlRuntime();
  const baseUrl = apiBase ? apiBase.replace(/\/+$/, '') : '';
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
