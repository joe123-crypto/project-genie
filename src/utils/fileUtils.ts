export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Converts a File to a base64 data URL, with special handling for HEIF/HEIC
export const fileToBase64WithHEIFSupport = async (file: File): Promise<string> => {
  const lowerName = file.name?.toLowerCase?.() || "";
  const isHeifLike =
    file.type === "image/heif" ||
    file.type === "image/heic" ||
    lowerName.endsWith(".heif") ||
    lowerName.endsWith(".heic");

  if (!isHeifLike) {
    return fileToBase64(file);
  }

  // Try converting HEIF/HEIC using browser decoding (Safari/iOS supports HEIF natively)
  try {
    const converted = await convertHeifLikeToJpeg(file);
    return converted;
  } catch (err) {
    // Fallback to raw base64 (may fail server-side if not supported)
    console.warn("HEIF/HEIC conversion failed, falling back to raw base64:", err);
    return fileToBase64(file);
  }
};

// Attempt to decode HEIF/HEIC and re-encode as JPEG via canvas
const convertHeifLikeToJpeg = async (file: File): Promise<string> => {
  const objectUrl = URL.createObjectURL(file);

  // Prefer createImageBitmap when available (often faster and more robust)
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");
      ctx.drawImage(bitmap, 0, 0);
      URL.revokeObjectURL(objectUrl);
      return canvas.toDataURL("image/jpeg", 0.92);
    } catch (e) {
      // Fall through to <img> decoding path
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D context unavailable");
        ctx.drawImage(img, 0, 0);
        const jpeg = canvas.toDataURL("image/jpeg", 0.92);
        URL.revokeObjectURL(objectUrl);
        resolve(jpeg);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode HEIF/HEIC image in this browser"));
    };
    img.src = objectUrl;
  });
};

export const isSupportedImageFormat = (file: File): boolean => {
  const supportedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heif",
    "image/heic",
    "image/bmp",
    "image/tiff",
  ];
  const name = file.name?.toLowerCase?.() || "";
  const supportedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".heif",
    ".heic",
    ".bmp",
    ".tiff",
  ];
  return (
    supportedTypes.includes(file.type) ||
    supportedExtensions.some((ext) => name.endsWith(ext))
  );
};

export const getConvertedMimeType = (file: File): string => {
  const name = file.name?.toLowerCase?.() || "";
  const isHeifLike =
    file.type === "image/heif" ||
    file.type === "image/heic" ||
    name.endsWith(".heif") ||
    name.endsWith(".heic");
  return isHeifLike ? "image/jpeg" : file.type || "image/jpeg";
};

export const parseDataUrl = (dataUrl: string): { mimeType: string; data: string } | null => {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    return null;
  }
  return {
    mimeType: match[1],
    data: match[2],
  };
};

export const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File | null> => {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  } catch (error) {
    console.error("Error converting data URL to file:", error);
    return null;
  }
};
