import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const tsx = require.resolve("tsx");
const entry = fileURLToPath(new URL("./index.ts", import.meta.url));

async function port(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => server.once("error", reject).listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No loopback port");
  const n = address.port;
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return n;
}

async function withServer(apiMax: number, writeMax: number, run: (request: (method: string, path: string) => Promise<Response>) => Promise<void>) {
  const work = await mkdtemp(join(tmpdir(), "apero-rate-test-"));
  const chosen = await port();
  const child = spawn(process.execPath, ["--import", tsx, entry], {
    cwd: work,
    env: { PATH: process.env.PATH, HOME: work, HOST: "127.0.0.1", PORT: String(chosen), NODE_ENV: "test", LOG_LEVEL: "error", STORAGE_BACKEND: "github", API_RATE_LIMIT_MAX: String(apiMax), WRITE_RATE_LIMIT_MAX: String(writeMax) },
    stdio: "ignore",
  });
  const base = `http://127.0.0.1:${chosen}`;
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      if (child.exitCode !== null) throw new Error("Temporary server exited");
      try { const res = await fetch(`${base}/health`); if (res.ok) { ready = true; break; } } catch { /* startup */ }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (!ready) throw new Error("Temporary server did not start");
    await run((method, path) => fetch(base + path, { method, ...(method === "POST" ? { headers: { "Content-Type": "application/json" }, body: "{}" } : {}) }));
  } finally {
    if (child.exitCode === null) {
      const exited = new Promise<void>(resolve => child.once("exit", () => resolve()));
      child.kill("SIGTERM");
      await exited;
    }
    await rm(work, { recursive: true, force: true });
  }
}

test("GET does not consume the write quota; POST does", async () => {
  await withServer(10, 1, async request => {
    const path = "/api/aperos/test/unknown";
    assert.equal((await request("GET", path)).status, 404);
    assert.equal((await request("GET", path)).status, 404);
    assert.equal((await request("POST", path)).status, 404);
    const limited = await request("POST", path);
    assert.equal(limited.status, 429);
    assert.ok(limited.headers.get("retry-after"));
  });
});

test("HEAD currently consumes the write quota", async () => {
  await withServer(10, 1, async request => {
    const path = "/api/aperos/test/unknown";
    assert.equal((await request("HEAD", path)).status, 404);
    assert.equal((await request("POST", path)).status, 429);
  });
});

test("the global quota applies to GET independently of the write quota", async () => {
  await withServer(2, 10, async request => {
    const path = "/api/aperos/test/unknown";
    assert.equal((await request("GET", path)).status, 404);
    assert.equal((await request("GET", path)).status, 404);
    assert.equal((await request("GET", path)).status, 429);
  });
});
