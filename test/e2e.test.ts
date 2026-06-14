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

afterAll(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("E2E: Should initialize a new project", async () => {
  const { exitCode } = await $`bun run ${CLI_PATH} init .`.cwd(tempDir);
  expect(exitCode).toBe(0);

  // Link local mr-md for testing
  const bunFs = require("fs");
  const pkgPath = join(tempDir, "package.json");
  const pkg = JSON.parse(bunFs.readFileSync(pkgPath, "utf-8"));
  
  // Create an absolute path and force forward slashes for the file: protocol, which breaks on Windows otherwise
  const absolutePath = join(__dirname, "..").replace(/\\/g, "/");
  pkg.dependencies["mr-md"] = `file:${absolutePath}`;
  
  bunFs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  await $`bun install`.cwd(tempDir);
  
  expect(bunFs.existsSync(join(tempDir, "package.json"))).toBe(true);
}, 30000);

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
  const devProc = Bun.spawn(["bun", "run", CLI_PATH, "dev", "chapters/01-chapter"], { cwd: tempDir, env: process.env });
  
  let isReady = false;
  let html = "";
  
  for (let i = 0; i < 20; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const res = await fetch("http://localhost:3000");
      if (res.ok) {
        isReady = true;
        html = await res.text();
        break;
      }
    } catch (e) {
      // Ignore network errors while waiting
    }
  }

  try {
    expect(isReady).toBe(true);
    expect(html).toContain("<html");
    
    const bunFs = require("fs");
    expect(bunFs.existsSync(join(tempDir, "chapters", "01-chapter", "out")) || bunFs.existsSync(join(tempDir, "out"))).toBe(true);
  } finally {
    devProc.kill();
  }
}, 15000);
