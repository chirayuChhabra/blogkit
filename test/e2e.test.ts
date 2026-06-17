import { test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { $ } from "bun";

const CLI_PATH = join(process.cwd(), "dist", "cli.js");
let tempDir: string;

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "mr-md-e2e-"));
});

// Cleanup is deliberately omitted to prevent 5s hook timeout on slow rm. Temp files are handled by OS.

test("E2E: Should initialize a new project", async () => {
  const { exitCode } = await $`bun run ${CLI_PATH} init -y .`.cwd(tempDir);
  expect(exitCode).toBe(0);

  // Link local mr-md for testing
  const bunFs = require("fs");
  const pkgPath = join(tempDir, "package.json");
  const pkg = JSON.parse(bunFs.readFileSync(pkgPath, "utf-8"));
  
  // Pack the package locally to avoid EBUSY on Windows when bun install tries to copy the active directory
  const { stdout } = await $`npm pack --quiet`.cwd(join(__dirname, ".."));
  const tarballName = stdout.toString().trim().split("\n").pop()?.trim();
  if (!tarballName) throw new Error("Failed to pack mr-md");
  
  const sourceTarball = join(__dirname, "..", tarballName);
  const destTarball = join(tempDir, "mr-md.tgz");
  bunFs.copyFileSync(sourceTarball, destTarball);
  
  pkg.dependencies["mr-md"] = `file:./mr-md.tgz`;
  
  bunFs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  await $`bun install`.cwd(tempDir);
  
  expect(bunFs.existsSync(join(tempDir, "package.json"))).toBe(true);
}, 60000);

test("E2E: Should generate chapter and lesson", async () => {
  const { exitCode: chCode } = await $`bun run ${CLI_PATH} g ch physics`.cwd(tempDir);
  expect(chCode).toBe(0);

  const { exitCode: lessonCode } = await $`bun run ${CLI_PATH} g lesson intro`.cwd(join(tempDir, "chapters", "02-physics"));
  expect(lessonCode).toBe(0);

  const bunFs = require("fs");
  expect(bunFs.existsSync(join(tempDir, "chapters", "02-physics", "lessons", "01-intro", "lesson.ts"))).toBe(true);
});

test("E2E: Should start dev server and serve files", async () => {
  // The dev server expects a specific chapter directory to serve its 'out' folder
  const devProc = Bun.spawn(["bun", "run", CLI_PATH, "dev", "chapters/01-first-chapter"], { cwd: tempDir, env: { ...process.env, PORT: "3005" }, stdout: "inherit", stderr: "inherit" });
  
  let isReady = false;
  let html = "";
  
  let lastError = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const res = await fetch("http://localhost:3005");
      if (res.ok) {
        isReady = true;
        html = await res.text();
        break;
      } else {
        lastError = `Status: ${res.status}`;
      }
    } catch (e: any) {
      lastError = e.message;
    }
  }

  try {
    if (!isReady) console.error("Fetch failed with:", lastError);
    expect(isReady).toBe(true);
    expect(html).toContain("<html");
    
    const bunFs = require("fs");
    expect(bunFs.existsSync(join(tempDir, "chapters", "01-first-chapter", "out")) || bunFs.existsSync(join(tempDir, "out"))).toBe(true);
  } finally {
    devProc.kill();
  }
}, 60000);
