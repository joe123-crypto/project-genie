/**
 * Downscale an image (File, Data URL, or remote URL) into base64 image string (PNG or WebP).
 * @param input - File | string (data URL or remote URL)
 * @param maxDim - Maximum width or height, preserving aspect ratio (default 1024)
 * @param format - "png" or "webp" (default "png")
 * @param webpQuality - (for webp) compression quality in [0,1] (default 0.8)
 * @returns Promise<string> - base64-encoded image data (without prefix)
 */
export async function downscale(
  input: File | string,
  maxDim = 1024,
  format: "png" | "webp" = "png",
  webpQuality = 0.8
): Promise<string> {
  let src: string;

  if (input instanceof File) {
    src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(input);
    });
  } else if (typeof input === "string" && input.startsWith("http")) {
    // fetch remote URL
    const response = await fetch(input, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else if (typeof input === "string") {
    src = input;
  } else {
    throw new Error("Unsupported input type for downscale()");
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

  // compute scale
  const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
  const targetW = Math.round(img.width * scale);
  const targetH = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  canvas.width = targetW;
  canvas.height = targetH;
  ctx.drawImage(img, 0, 0, targetW, targetH);

  let mime: string;
  let dataUrl: string;

  if (format === "webp") {
    mime = "image/webp";
    // Note: browsers may not support `canvas.toDataURL("image/webp")`
    dataUrl = canvas.toDataURL(mime, webpQuality);
  } else {
    mime = "image/png";
    dataUrl = canvas.toDataURL(mime);
  }

  // dataUrl is something like "data:image/png;base64,AAAA..."
  const parts = dataUrl.split(",");
  if (parts.length < 2) {
    throw new Error("Failed to produce a valid data URL");
  }
  return parts[1]; // return just the base64 part
}
