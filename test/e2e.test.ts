import { test, expect, beforeAll } from "bun:test";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { $ } from "bun";

const CLI_PATH = join(process.cwd(), "dist", "cli.js");
let tempDir: string;

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "mr-md-e2e-"));
  
  // Scaffold manually since init is removed
  await mkdir(join(tempDir, "chapters", "01-first-chapter", "lessons"), { recursive: true });
  await mkdir(join(tempDir, "chapters", "01-first-chapter", "sims"), { recursive: true });
  
  await writeFile(
    join(tempDir, "chapters", "01-first-chapter", "chapter.md"),
    `---
title: "First Chapter"
description: "A test chapter"
---

# Hello World
<LessonCard path="./lessons/01-first-lesson.md" />
`
  );
  
  await writeFile(
    join(tempDir, "chapters", "01-first-chapter", "lessons", "01-first-lesson.md"),
    `---
title: "First Lesson"
---
Welcome to your first lesson!
<Simulation path="../sims/example.js" />
`
  );
  
  await writeFile(
    join(tempDir, "package.json"),
    JSON.stringify({ name: "e2e-test" })
  );
});

// Cleanup is deliberately omitted to prevent 5s hook timeout on slow rm. Temp files are handled by OS.

test("E2E: Should start dev server and serve files", async () => {
  const devProc = Bun.spawn(["bun", "run", CLI_PATH, "dev", "chapters/01-first-chapter"], { cwd: tempDir, env: { ...process.env, PORT: "3005" }, stdout: "inherit", stderr: "inherit" });
  
  let isReady = false;
  let html = "";
  let lastError = null;

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
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
