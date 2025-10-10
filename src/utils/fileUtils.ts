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

  // Try converting HEIF/HEIC using a client-side decoder first (works on Chrome/Edge)
  try {
    // Dynamic import to avoid SSR/bundle issues
    const heic2any = (await import('heic2any')).default as unknown as (options: { blob: Blob; toType?: string; quality?: number }) => Promise<Blob | Blob[]>;
    const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    // Fall back to browser decoding (Safari/iOS supports HEIF natively)
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
    } catch {
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
    img.onerror = () => {
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

// Converts any input (File | Blob | base64 string or data URL) to a PNG data URL
export async function convertToPngBase64(
  input: File | Blob | string,
  options?: { maxDimension?: number; maxBytes?: number }
): Promise<string> {
  const toDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });

  let dataUrl: string;
  if (typeof input === 'string') {
    dataUrl = input.startsWith('data:') ? input : `data:image/*;base64,${input}`;
  } else {
    dataUrl = await toDataUrl(input);
  }

  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const initialMaxDim = options?.maxDimension ?? 1024;
  const maxBytes = options?.maxBytes; // e.g., 2_500_000 (~2.5MB)

  let targetW: number;
  let targetH: number;

  const drawAndEncode = (maxDim: number): string => {
    const maxSrcDim = Math.max(srcW, srcH);
    const scale = maxSrcDim > maxDim ? maxDim / maxSrcDim : 1;
    targetW = Math.max(1, Math.round(srcW * scale));
    targetH = Math.max(1, Math.round(srcH * scale));
    canvas.width = targetW;
    canvas.height = targetH;
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);
    return canvas.toDataURL('image/png');
  };

  let currentMaxDim = initialMaxDim;
  let pngDataUrl = drawAndEncode(currentMaxDim);

  if (maxBytes) {
    // Base64 data length is ~4/3 of the binary size; the dataUrl has a header. We compare on the data part.
    const base64Size = (d: string) => {
      const idx = d.indexOf(',');
      const b64 = idx >= 0 ? d.slice(idx + 1) : d;
      return Math.floor((b64.length * 3) / 4);
    };
    let bytes = base64Size(pngDataUrl);
    // Iteratively shrink dimensions by 20% until under limit or a floor is reached
    while (bytes > maxBytes && currentMaxDim > 256) {
      currentMaxDim = Math.floor(currentMaxDim * 0.8);
      pngDataUrl = drawAndEncode(currentMaxDim);
      bytes = base64Size(pngDataUrl);
    }
  }

  return pngDataUrl;
}

// Extracts the raw base64 payload from a data URL
export function extractBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}
