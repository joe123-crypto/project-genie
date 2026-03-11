type GeneratedFileCandidate = {
  base64?: unknown;
  base64Data?: unknown;
  data?: unknown;
  mediaType?: unknown;
  uint8Array?: unknown;
  file?: GeneratedFileCandidate;
};

type GeneratedStepCandidate = {
  files?: unknown[];
  content?: unknown[];
};

type GeneratedResultCandidate = {
  files?: unknown[];
  steps?: GeneratedStepCandidate[];
};

export interface ExtractedGeneratedImage {
  base64: string;
  mediaType: string;
}

function parseDataUrl(data: string): ExtractedGeneratedImage | null {
  if (!data.startsWith("data:")) {
    return null;
  }

  const match = data.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    mediaType: match[1],
    base64: match[2],
  };
}

function normalizeGeneratedFile(candidate: unknown): ExtractedGeneratedImage | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const raw = candidate as GeneratedFileCandidate;
  const file = raw.file && typeof raw.file === "object" ? raw.file : raw;
  const mediaType = typeof file.mediaType === "string" ? file.mediaType : "image/png";

  if (typeof file.base64 === "string" && file.base64.length > 0) {
    return { base64: file.base64, mediaType };
  }

  if (typeof file.base64Data === "string" && file.base64Data.length > 0) {
    return { base64: file.base64Data, mediaType };
  }

  if (typeof file.data === "string" && file.data.length > 0) {
    const dataUrl = parseDataUrl(file.data);
    if (dataUrl) {
      return dataUrl;
    }

    if (!file.data.startsWith("http")) {
      return { base64: file.data, mediaType };
    }
  }

  if (file.uint8Array instanceof Uint8Array) {
    return {
      base64: Buffer.from(file.uint8Array).toString("base64"),
      mediaType,
    };
  }

  return null;
}

export function extractGeneratedImage(result: GeneratedResultCandidate): ExtractedGeneratedImage | null {
  const candidates: unknown[] = [
    ...(result.files ?? []),
    ...((result.steps ?? []).flatMap((step) => [
      ...(step.files ?? []),
      ...(step.content ?? []),
    ])),
  ];

  for (const candidate of candidates) {
    const image = normalizeGeneratedFile(candidate);
    if (image) {
      return image;
    }
  }

  return null;
}
