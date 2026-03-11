const targetUrl = process.argv[2];
const timeoutMs = Number(process.argv[3] ?? 60_000);
const intervalMs = 1_000;

if (!targetUrl) {
  console.error("Usage: node scripts/ci/wait-for-url.mjs <url> [timeoutMs]");
  process.exit(1);
}

const deadline = Date.now() + timeoutMs;

while (Date.now() < deadline) {
  try {
    const response = await fetch(targetUrl, { redirect: "manual" });
    if (response.status >= 200 && response.status < 500) {
      console.log(`Server is ready at ${targetUrl} (${response.status})`);
      process.exit(0);
    }
  } catch {
    // Ignore connection errors while the server is starting.
  }

  await new Promise((resolve) => setTimeout(resolve, intervalMs));
}

console.error(`Timed out waiting for ${targetUrl}`);
process.exit(1);
