import { spawn } from "node:child_process";
import { once } from "node:events";
import { createWriteStream } from "node:fs";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { resolveSmokeEnv } from "./smoke-env.mjs";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const smokeTestScript = path.join(__dirname, "smoke-test.mjs");
const logPath = path.join(repoRoot, ".smoke-next.log");
const readinessPath = "/login";
const readinessTimeoutMs = Number(process.env.SMOKE_TEST_WAIT_TIMEOUT_MS ?? 90_000);
const shutdownTimeoutMs = 5_000;
const localHosts = new Set(["127.0.0.1", "localhost", "::1", "0.0.0.0"]);

function parseBaseUrl(baseUrl) {
  const url = new URL(baseUrl);
  const hostname = url.hostname;
  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  return { url, hostname, port };
}

async function isReachable(targetUrl) {
  try {
    const response = await fetch(targetUrl, { redirect: "manual" });
    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(targetUrl, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await isReachable(targetUrl)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`Timed out waiting for ${targetUrl}`);
}

function waitForServerOrExit(child, targetUrl, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const exitHandler = (code, signal) => {
      cleanup();
      reject(
        new Error(
          signal
            ? `${label} terminated by signal ${signal}`
            : `${label} exited before becoming ready with code ${code ?? "unknown"}`
        )
      );
    };
    const errorHandler = (error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      child.off("exit", exitHandler);
      child.off("error", errorHandler);
    };

    child.on("exit", exitHandler);
    child.on("error", errorHandler);

    waitForServer(targetUrl, timeoutMs)
      .then(() => {
        cleanup();
        resolve();
      })
      .catch((error) => {
        cleanup();
        reject(error);
      });
  });
}

function runNodeCommand(label, args, env, stdio = "inherit") {
  console.log(`[smoke] ${label}`);

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: repoRoot,
      env,
      stdio,
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          signal
            ? `${label} terminated by signal ${signal}`
            : `${label} failed with exit code ${code ?? "unknown"}`
        )
      );
    });
  });
}

function startServer(env, hostname, port) {
  const logStream = createWriteStream(logPath, { flags: "w" });
  const child = spawn(process.execPath, [nextBin, "start", "--hostname", hostname, "--port", port], {
    cwd: repoRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);

  return { child, logStream };
}

async function stopServer(server) {
  if (!server) {
    return;
  }

  const { child, logStream } = server;

  if (child.exitCode === null && child.signalCode === null) {
    child.kill();

    try {
      await Promise.race([
        once(child, "exit"),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timed out waiting for smoke server to stop")), shutdownTimeoutMs)
        ),
      ]);
    } catch {
      child.kill("SIGKILL");
      await once(child, "exit");
    }
  }

  await new Promise((resolve) => logStream.end(resolve));
}

async function printServerLog() {
  try {
    await access(logPath);
    const logContents = await readFile(logPath, "utf8");
    if (logContents.trim().length > 0) {
      console.error("[smoke] Next server log:");
      console.error(logContents);
    }
  } catch {
    // Ignore missing log files.
  }
}

async function main() {
  const env = resolveSmokeEnv();
  const { url: baseUrl, hostname, port } = parseBaseUrl(env.SMOKE_TEST_BASE_URL);
  const readinessUrl = new URL(readinessPath, baseUrl);
  let server;
  let startedServer = false;

  try {
    if (await isReachable(readinessUrl)) {
      console.log(`[smoke] Reusing existing server at ${baseUrl.origin}`);
    } else {
      if (!localHosts.has(hostname)) {
        throw new Error(
          `Smoke server is not reachable at ${baseUrl.origin} and cannot be started automatically for host ${hostname}`
        );
      }

      await runNodeCommand("Building app for smoke tests", [nextBin, "build"], env);
      console.log(`[smoke] Starting Next server at ${baseUrl.origin}`);
      server = startServer(env, hostname, port);
      startedServer = true;
      await waitForServerOrExit(server.child, readinessUrl, readinessTimeoutMs, "Smoke server");
    }

    await runNodeCommand("Running smoke test suite", [smokeTestScript], env);
  } catch (error) {
    if (startedServer) {
      await printServerLog();
    }
    throw error;
  } finally {
    await stopServer(server);
  }
}

try {
  await main();
} catch (error) {
  console.error("[smoke] failed", error instanceof Error ? error.message : error);
  process.exit(1);
}
