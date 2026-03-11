import { NextResponse } from "next/server";

const SMOKE_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9s1mNn8AAAAASUVORK5CYII=";

export const SMOKE_IMAGE_DATA_URL = `data:image/png;base64,${SMOKE_IMAGE_BASE64}`;

export function isCiSmokeTestMode(): boolean {
  return process.env.CI_SMOKE_TEST_MODE === "1";
}

export function smokeOrigin(request: Request): string {
  return new URL(request.url).origin;
}

export function smokeAssetUrl(request: Request, path: string): string {
  return `${smokeOrigin(request)}${path.startsWith("/") ? path : `/${path}`}`;
}

export function smokeTemplate(request: Request) {
  return {
    id: "smoke-template-1",
    name: "Smoke Template",
    description: "Template fixture used by CI smoke tests.",
    prompt: "Apply a cinematic studio look.",
    previewImageUrl: smokeAssetUrl(request, "/__smoke/template.png"),
    category: "Useful",
    accessCount: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    creatorId: "smoke-user",
    settings: {},
    type: "single" as const,
    username: "user1",
  };
}

export function smokeOutfit(request: Request) {
  return {
    id: "smoke-outfit-1",
    name: "Smoke Outfit",
    description: "Outfit fixture used by CI smoke tests.",
    prompt: "Keep the pose and apply the outfit naturally.",
    previewImageUrl: smokeAssetUrl(request, "/__smoke/outfit.png"),
    category: "Useful",
    type: "merge" as const,
    userId: "smoke-user",
    username: "user1",
    accessCount: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

export function smokePost(request: Request) {
  return {
    id: "smoke-post-1",
    userId: "smoke-user",
    templateId: "smoke-template-1",
    templateName: "Smoke Template",
    imageUrl: smokeAssetUrl(request, "/__smoke/post.png"),
    likes: [],
    likeCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    author: {
      displayName: "Smoke User",
      photoURL: smokeAssetUrl(request, "/__smoke/avatar.png"),
    },
  };
}

export function smokeVideoTask(request: Request, taskId = "smoke-video-task-1") {
  return {
    taskId,
    generations: [
      {
        status: "completed",
        url: smokeAssetUrl(request, "/__smoke/video.mp4"),
      },
    ],
  };
}

export function smokeSearchResults(request: Request, query: string, type: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const templates = [smokeTemplate(request)];
  const outfits = [smokeOutfit(request)];
  const shouldInclude = (value: string) =>
    normalizedQuery.length === 0 || value.toLowerCase().includes(normalizedQuery);

  const results: Array<Record<string, unknown>> = [];

  if (!type || type === "template" || type === "filter") {
    results.push(...templates.filter((item) => shouldInclude(item.name) || shouldInclude(item.prompt)));
  }

  if (!type || type === "outfit") {
    results.push(...outfits.filter((item) => shouldInclude(item.name) || shouldInclude(item.prompt)));
  }

  return results;
}

export function smokeJson(body: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers });
}
