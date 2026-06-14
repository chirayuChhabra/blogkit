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
  const { exitCode } = await $`bun run ${CLI_PATH} init`.cwd(tempDir);
  expect(exitCode).toBe(0);
  
  const bunFs = require("fs");
  expect(bunFs.existsSync(join(tempDir, "package.json"))).toBe(true);
});

test("E2E: Should generate chapter and lesson", async () => {
  const { exitCode: chCode } = await $`bun run ${CLI_PATH} g ch physics`.cwd(tempDir);
  expect(chCode).toBe(0);

  const { exitCode: lessonCode } = await $`bun run ${CLI_PATH} g lesson intro`.cwd(join(tempDir, "chapters", "01-physics"));
  expect(lessonCode).toBe(0);

  const bunFs = require("fs");
  expect(bunFs.existsSync(join(tempDir, "chapters", "01-physics", "intro.md"))).toBe(true);
});

test("E2E: Should start dev server and serve files", async () => {
  // Start the dev server in the background using Bun's spawn (so it doesn't block)
  const { spawn } = require("child_process");
  const devProc = spawn("bun", ["run", CLI_PATH, "dev", "."], { cwd: tempDir, env: process.env });
  
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
    expect(bunFs.existsSync(join(tempDir, "out")) || bunFs.existsSync(join(tempDir, "dist"))).toBe(true);
  } finally {
    devProc.kill();
  }
});
