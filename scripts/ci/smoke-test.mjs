import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
const SMOKE_IMAGE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9s1mNn8AAAAASUVORK5CYII=";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const apiRoot = path.join(repoRoot, "src", "app", "api");
const baseUrl = process.env.SMOKE_TEST_BASE_URL ?? "http://127.0.0.1:3101";

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  absorb(response) {
    const getSetCookie = response.headers.getSetCookie?.bind(response.headers);
    const rawCookies = typeof getSetCookie === "function" ? getSetCookie() : [];

    for (const rawCookie of rawCookies) {
      const [cookiePart, ...attributeParts] = rawCookie.split(";");
      const separatorIndex = cookiePart.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const name = cookiePart.slice(0, separatorIndex).trim();
      const value = cookiePart.slice(separatorIndex + 1).trim();
      const maxAgePart = attributeParts.find((part) =>
        part.trim().toLowerCase().startsWith("max-age=")
      );
      const expiresImmediately = maxAgePart && Number(maxAgePart.split("=")[1]) <= 0;

      if (!value || expiresImmediately) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  header() {
    return [...this.cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  has(name) {
    return this.cookies.has(name);
  }

  clear() {
    this.cookies.clear();
  }
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function listRouteFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listRouteFiles(fullPath);
      }
      return entry.name === "route.ts" ? [fullPath] : [];
    })
  );

  return files.flat();
}

function routePathFromFile(filePath) {
  const relativePath = path.relative(apiRoot, filePath).split(path.sep).join("/");
  const withoutSuffix = relativePath.replace(/\/route\.ts$/, "").replace(/^route\.ts$/, "");
  return withoutSuffix ? `/api/${withoutSuffix}` : "/api";
}

function discoverMethods(fileContents) {
  const methods = new Set();
  const functionRegex = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g;
  const constRegex = /export\s+const\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s*=/g;

  for (const regex of [functionRegex, constRegex]) {
    let match;
    while ((match = regex.exec(fileContents)) !== null) {
      methods.add(match[1]);
    }
  }

  return [...methods];
}

async function discoverApiEndpoints() {
  const routeFiles = await listRouteFiles(apiRoot);
  const endpoints = new Set();

  for (const routeFile of routeFiles) {
    const fileContents = await readFile(routeFile, "utf8");
    const routePath = routePathFromFile(routeFile);

    for (const method of discoverMethods(fileContents)) {
      endpoints.add(`${method} ${routePath}`);
    }
  }

  return endpoints;
}

async function request(method, routePath, options = {}) {
  const {
    headers = {},
    json,
    jar,
    redirect = "manual",
  } = options;

  const requestHeaders = new Headers(headers);
  if (json !== undefined) {
    requestHeaders.set("content-type", "application/json");
  }

  if (jar) {
    const cookieHeader = jar.header();
    if (cookieHeader) {
      requestHeaders.set("cookie", cookieHeader);
    }
  }

  const response = await fetch(new URL(routePath, baseUrl), {
    method,
    headers: requestHeaders,
    body: json === undefined ? undefined : JSON.stringify(json),
    redirect,
  });

  if (jar) {
    jar.absorb(response);
  }

  return response;
}

async function readJson(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Expected JSON response but got: ${text}`);
  }
}

async function runCase(testCase) {
  const response = await request(testCase.method, testCase.path, testCase.request);
  ensure(
    response.status === testCase.expectedStatus,
    `${testCase.id}: expected status ${testCase.expectedStatus}, received ${response.status}`
  );

  const body = testCase.expectJson === false ? null : await readJson(response);
  await testCase.validate({ response, body });
  console.log(`[ok] ${testCase.id}`);
}

async function runAuthFlow() {
  const jar = new CookieJar();

  const unauthenticatedDashboard = await request("GET", "/user1/dashboard", { jar });
  ensure(
    [301, 302, 307, 308].includes(unauthenticatedDashboard.status),
    `Auth flow: expected dashboard redirect, received ${unauthenticatedDashboard.status}`
  );
  const redirectLocation = unauthenticatedDashboard.headers.get("location");
  ensure(redirectLocation, "Auth flow: missing redirect location for protected route");
  const redirectUrl = new URL(redirectLocation, baseUrl);
  ensure(redirectUrl.pathname === "/login", `Auth flow: expected redirect to /login, got ${redirectUrl.pathname}`);
  ensure(
    redirectUrl.searchParams.get("next") === "/user1/dashboard",
    `Auth flow: expected next=/user1/dashboard, got ${redirectUrl.searchParams.get("next")}`
  );

  const sessionResponse = await request("POST", "/api/auth/session", {
    jar,
    json: { token: "smoke-token", username: "user1" },
  });
  ensure(sessionResponse.status === 200, `Auth flow: expected 200 from auth session POST, got ${sessionResponse.status}`);
  const sessionBody = await readJson(sessionResponse);
  ensure(sessionBody?.success === true, "Auth flow: expected success=true from auth session POST");
  ensure(jar.has("auth-token"), "Auth flow: auth-token cookie was not set");
  ensure(jar.has("username"), "Auth flow: username cookie was not set");

  const authenticatedDashboard = await request("GET", "/user1/dashboard", { jar });
  ensure(
    authenticatedDashboard.status === 200,
    `Auth flow: expected authenticated dashboard access to return 200, got ${authenticatedDashboard.status}`
  );

  const loginWithSession = await request("GET", "/login", { jar });
  ensure(
    [301, 302, 307, 308].includes(loginWithSession.status),
    `Auth flow: expected /login redirect when authenticated, got ${loginWithSession.status}`
  );
  const loginRedirect = new URL(loginWithSession.headers.get("location"), baseUrl);
  ensure(
    loginRedirect.pathname === "/user1/dashboard",
    `Auth flow: expected /login to redirect to /user1/dashboard, got ${loginRedirect.pathname}`
  );

  const logoutResponse = await request("DELETE", "/api/auth/session", { jar });
  ensure(logoutResponse.status === 200, `Auth flow: expected 200 from auth session DELETE, got ${logoutResponse.status}`);
  const logoutBody = await readJson(logoutResponse);
  ensure(logoutBody?.success === true, "Auth flow: expected success=true from auth session DELETE");
  jar.clear();

  const dashboardAfterLogout = await request("GET", "/user1/dashboard", { jar });
  ensure(
    [301, 302, 307, 308].includes(dashboardAfterLogout.status),
    `Auth flow: expected logout to restore dashboard redirect, got ${dashboardAfterLogout.status}`
  );

  console.log("[ok] auth middleware and session flow");
}

const apiCases = [
  {
    id: "DELETE /api/user rejects missing auth",
    method: "DELETE",
    path: "/api/user",
    request: {},
    expectedStatus: 401,
    validate: async ({ body }) => ensure(body?.error, "Expected error body for unauthorized user delete"),
  },
  {
    id: "DELETE /api/user succeeds with bearer token",
    method: "DELETE",
    path: "/api/user",
    request: { headers: { Authorization: "Bearer smoke-token" } },
    expectedStatus: 200,
    validate: async ({ body }) =>
      ensure(typeof body?.message === "string", "Expected success message from user delete"),
  },
  {
    id: "GET /api/feed returns feed data",
    method: "GET",
    path: "/api/feed",
    request: {},
    expectedStatus: 200,
    validate: async ({ body }) => {
      ensure(Array.isArray(body), "Expected feed response to be an array");
      ensure(body.length > 0 && body[0].id, "Expected at least one feed item with an id");
    },
  },
  {
    id: "GET /api/search returns filtered results",
    method: "GET",
    path: "/api/search?q=smoke&type=template",
    request: {},
    expectedStatus: 200,
    validate: async ({ body }) => {
      ensure(Array.isArray(body), "Expected search response to be an array");
      ensure(body.length > 0 && body[0].name, "Expected at least one search result with a name");
    },
  },
  {
    id: "POST /api/saveImage rejects invalid payload",
    method: "POST",
    path: "/api/saveImage",
    request: { json: { image: "not-a-data-url" } },
    expectedStatus: 400,
    validate: async ({ body }) => ensure(body?.error, "Expected validation error from saveImage"),
  },
  {
    id: "POST /api/saveImage returns uploaded url",
    method: "POST",
    path: "/api/saveImage",
    request: {
      json: {
        image: SMOKE_IMAGE_DATA_URL,
        destination: "saved",
        directoryName: "smoke-image",
      },
    },
    expectedStatus: 200,
    validate: async ({ body }) => ensure(typeof body?.url === "string", "Expected uploaded image url"),
  },
  {
    id: "POST /api/posts rejects invalid payload",
    method: "POST",
    path: "/api/posts",
    request: { json: { imageUrl: "x" } },
    expectedStatus: 400,
    validate: async ({ body }) => ensure(body?.error, "Expected validation error from posts"),
  },
  {
    id: "POST /api/posts creates post",
    method: "POST",
    path: "/api/posts",
    request: {
      json: {
        imageUrl: "https://example.com/image.png",
        templateId: "smoke-template-1",
        userId: "smoke-user",
      },
    },
    expectedStatus: 201,
    validate: async ({ body }) => ensure(typeof body?.id === "string", "Expected created post id"),
  },
  {
    id: "OPTIONS /api/nanobanana responds",
    method: "OPTIONS",
    path: "/api/nanobanana",
    request: {},
    expectedStatus: 200,
    expectJson: false,
    validate: async () => {},
  },
  {
    id: "POST /api/nanobanana rejects invalid payload",
    method: "POST",
    path: "/api/nanobanana",
    request: { json: {} },
    expectedStatus: 400,
    validate: async ({ body }) => ensure(body?.error, "Expected validation error from nanobanana"),
  },
  {
    id: "POST /api/nanobanana returns base64 image",
    method: "POST",
    path: "/api/nanobanana",
    request: { json: { textPrompt: "Smoke prompt" } },
    expectedStatus: 200,
    validate: async ({ body }) => ensure(typeof body?.imageBase64 === "string", "Expected imageBase64 from nanobanana"),
  },
  {
    id: "POST /api/nanobanana returns saved image url",
    method: "POST",
    path: "/api/nanobanana",
    request: { json: { textPrompt: "Smoke prompt", save: "templated" } },
    expectedStatus: 200,
    validate: async ({ body }) => ensure(typeof body?.imageUrl === "string", "Expected imageUrl from nanobanana"),
  },
  {
    id: "POST /api/generateVideo rejects invalid payload",
    method: "POST",
    path: "/api/generateVideo",
    request: { json: { prompt: "Smoke video" } },
    expectedStatus: 400,
    validate: async ({ body }) => ensure(body?.error, "Expected validation error from generateVideo"),
  },
  {
    id: "POST /api/generateVideo returns task id",
    method: "POST",
    path: "/api/generateVideo",
    request: { json: { images: ["https://example.com/frame.png"], prompt: "Smoke video" } },
    expectedStatus: 200,
    validate: async ({ body }) => ensure(typeof body?.taskId === "string", "Expected taskId from generateVideo"),
  },
  {
    id: "GET /api/checkVideoStatus rejects missing id",
    method: "GET",
    path: "/api/checkVideoStatus",
    request: {},
    expectedStatus: 400,
    validate: async ({ body }) => ensure(body?.error, "Expected validation error from checkVideoStatus"),
  },
  {
    id: "GET /api/checkVideoStatus returns task state",
    method: "GET",
    path: "/api/checkVideoStatus?id=smoke-video-task-1",
    request: {},
    expectedStatus: 200,
    validate: async ({ body }) => {
      ensure(Array.isArray(body?.generations), "Expected generations array from checkVideoStatus");
      ensure(body.generations[0]?.status, "Expected generation status from checkVideoStatus");
    },
  },
  {
    id: "OPTIONS /api/generateTemplate responds",
    method: "OPTIONS",
    path: "/api/generateTemplate",
    request: {},
    expectedStatus: 200,
    expectJson: false,
    validate: async () => {},
  },
  {
    id: "POST /api/generateTemplate rejects invalid payload",
    method: "POST",
    path: "/api/generateTemplate",
    request: { json: {} },
    expectedStatus: 400,
    validate: async ({ body }) => ensure(body?.error, "Expected validation error from generateTemplate"),
  },
  {
    id: "POST /api/generateTemplate returns template",
    method: "POST",
    path: "/api/generateTemplate",
    request: { json: { prompt: "Smoke template prompt" } },
    expectedStatus: 200,
    validate: async ({ body }) => {
      ensure(typeof body?.id === "string", "Expected template id from generateTemplate");
      ensure(typeof body?.previewImageUrl === "string", "Expected previewImageUrl from generateTemplate");
    },
  },
  {
    id: "OPTIONS /api/gemini responds",
    method: "OPTIONS",
    path: "/api/gemini",
    request: {},
    expectedStatus: 200,
    expectJson: false,
    validate: async () => {},
  },
  {
    id: "POST /api/gemini rejects invalid payload",
    method: "POST",
    path: "/api/gemini",
    request: { json: { prompt: "   " } },
    expectedStatus: 400,
    validate: async ({ body }) => ensure(body?.error, "Expected validation error from gemini"),
  },
  {
    id: "POST /api/gemini returns text",
    method: "POST",
    path: "/api/gemini",
    request: { json: { prompt: "Explain the smoke test in one line." } },
    expectedStatus: 200,
    validate: async ({ body }) => ensure(typeof body?.text === "string", "Expected text response from gemini"),
  },
  {
    id: "POST /api/gemini returns image data",
    method: "POST",
    path: "/api/gemini",
    request: { json: { prompt: "Generate an image of a smoke test badge." } },
    expectedStatus: 200,
    validate: async ({ body }) => ensure(typeof body?.imageUrl === "string", "Expected imageUrl from gemini"),
  },
  {
    id: "POST /api/share rejects invalid payload",
    method: "POST",
    path: "/api/share",
    request: { json: { imageUrl: "https://example.com/image.png" } },
    expectedStatus: 400,
    validate: async ({ body }) => ensure(body?.error, "Expected validation error from share"),
  },
  {
    id: "POST /api/share returns share url",
    method: "POST",
    path: "/api/share",
    request: {
      json: {
        imageUrl: "https://example.com/image.png",
        templateId: "smoke-template-1",
        templateName: "Smoke Template",
        username: "user1",
      },
    },
    expectedStatus: 201,
    validate: async ({ body }) => {
      ensure(typeof body?.id === "string", "Expected share id");
      ensure(typeof body?.shareUrl === "string", "Expected shareUrl");
    },
  },
  {
    id: "POST /api/createTemplate rejects invalid payload",
    method: "POST",
    path: "/api/createTemplate",
    request: { json: { name: "Smoke" } },
    expectedStatus: 400,
    validate: async ({ body }) => ensure(body?.error, "Expected validation error from createTemplate"),
  },
  {
    id: "POST /api/createTemplate creates template",
    method: "POST",
    path: "/api/createTemplate",
    request: {
      json: {
        name: "Smoke Template",
        description: "Created in smoke test",
        prompt: "Apply a smoke look",
        previewImageUrl: "https://example.com/template.png",
        category: "Useful",
        accessCount: 0,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        creatorId: "smoke-user",
        settings: {},
      },
    },
    expectedStatus: 201,
    validate: async ({ body }) => ensure(typeof body?.id === "string", "Expected created template id"),
  },
  {
    id: "POST /api/createOutfit rejects invalid payload",
    method: "POST",
    path: "/api/createOutfit",
    request: { json: { name: "Smoke Outfit" } },
    expectedStatus: 400,
    validate: async ({ body }) => ensure(body?.error, "Expected validation error from createOutfit"),
  },
  {
    id: "POST /api/createOutfit creates outfit",
    method: "POST",
    path: "/api/createOutfit",
    request: {
      json: {
        name: "Smoke Outfit",
        description: "Created in smoke test",
        prompt: "Keep pose, apply outfit",
        previewImageUrl: "https://example.com/outfit.png",
        category: "Useful",
      },
    },
    expectedStatus: 201,
    validate: async ({ body }) => ensure(typeof body?.id === "string", "Expected created outfit id"),
  },
  {
    id: "POST /api/applyTemplate rejects invalid payload",
    method: "POST",
    path: "/api/applyTemplate",
    request: { json: { image: SMOKE_IMAGE_DATA_URL } },
    expectedStatus: 400,
    validate: async ({ body }) => ensure(body?.error, "Expected validation error from applyTemplate"),
  },
  {
    id: "POST /api/applyTemplate returns result image",
    method: "POST",
    path: "/api/applyTemplate",
    request: {
      json: {
        image: SMOKE_IMAGE_DATA_URL,
        templatePrompt: "Apply a smoke template",
      },
    },
    expectedStatus: 200,
    validate: async ({ body }) => ensure(typeof body?.resultImageUrl === "string", "Expected resultImageUrl from applyTemplate"),
  },
  {
    id: "POST /api/applyOutfit rejects invalid payload",
    method: "POST",
    path: "/api/applyOutfit",
    request: { json: { image: SMOKE_IMAGE_DATA_URL } },
    expectedStatus: 400,
    validate: async ({ body }) => ensure(body?.error, "Expected validation error from applyOutfit"),
  },
  {
    id: "POST /api/applyOutfit returns result image",
    method: "POST",
    path: "/api/applyOutfit",
    request: {
      json: {
        image: SMOKE_IMAGE_DATA_URL,
        outfitImage: SMOKE_IMAGE_DATA_URL,
        outfitPrompt: "Apply a smoke outfit",
      },
    },
    expectedStatus: 200,
    validate: async ({ body }) => ensure(typeof body?.resultImageUrl === "string", "Expected resultImageUrl from applyOutfit"),
  },
];

async function verifyCoverage() {
  const discoveredEndpoints = await discoverApiEndpoints();
  const coveredEndpoints = new Set(apiCases.map((testCase) => `${testCase.method} ${testCase.path.split("?")[0]}`));
  coveredEndpoints.add("POST /api/auth/session");
  coveredEndpoints.add("DELETE /api/auth/session");

  const missingCoverage = [...discoveredEndpoints].filter((endpoint) => !coveredEndpoints.has(endpoint));
  const staleCoverage = [...coveredEndpoints].filter((endpoint) => !discoveredEndpoints.has(endpoint));

  ensure(
    missingCoverage.length === 0,
    `Missing smoke tests for endpoints: ${missingCoverage.join(", ")}`
  );
  ensure(
    staleCoverage.length === 0,
    `Smoke manifest references endpoints that no longer exist: ${staleCoverage.join(", ")}`
  );

  console.log("[ok] smoke manifest covers current API endpoints");
}

async function main() {
  console.log(`Running smoke tests against ${baseUrl}`);
  await verifyCoverage();
  await runAuthFlow();

  for (const testCase of apiCases) {
    await runCase(testCase);
  }

  console.log("Smoke tests completed successfully.");
}

try {
  await main();
} catch (error) {
  console.error("[fail]", error instanceof Error ? error.message : error);
  process.exit(1);
}
