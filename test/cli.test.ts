import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { $ } from "bun";

describe("CLI Deep Tests", () => {
  let tempDir: string;
  const CLI_PATH = join(import.meta.dir, "..", "dist", "cli.js");

  beforeEach(async () => {
    tempDir = join(tmpdir(), `mr-md-cli-test-${Math.random().toString(36).substring(7)}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  describe("dev command", () => {
    test("Should fall back to a different port if port 3080 is occupied", async () => {
      await writeFile(join(tempDir, "chapter.md"), "test");
      const dummyServer = Bun.serve({
        port: 3080,
        fetch() { return new Response("dummy"); }
      });

      const devProc = Bun.spawn(["bun", "run", CLI_PATH, "dev", "."], {
        cwd: tempDir,
        env: { ...process.env, PORT: "3080" }
      });

      let res;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500));
        res = await fetch("http://localhost:3081").catch(() => null);
        if (res) break;
      }
      
      try {
        expect(res).toBeTruthy();
      } finally {
        devProc.kill();
        dummyServer.stop();
      }
    }, 15000);

    test("Should prevent directory traversal attacks (403)", async () => {
      await writeFile(join(tempDir, "chapter.md"), "test");
      await mkdir(join(tempDir, "out"), { recursive: true });
      await writeFile(join(tempDir, "out", "index.html"), "<h1>Hello</h1>");
      await writeFile(join(tempDir, "secret.txt"), "shhh");

      const devProc = Bun.spawn(["bun", "run", CLI_PATH, "dev", "."], {
        cwd: tempDir,
        env: { ...process.env, PORT: "4000" }
      });

      let res;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500));
        try {
          res = await fetch("http://localhost:4000/..%2fsecret.txt");
          break;
        } catch (e) {
          // ignore ConnectionRefused
        }
      }
      
      try {
        expect(res?.status).toBe(403);
      } finally {
        devProc.kill();
      }
    }, 15000);

    test("Should return 404 for missing files", async () => {
      await writeFile(join(tempDir, "chapter.md"), "test");
      await mkdir(join(tempDir, "out"), { recursive: true });
      
      const devProc = Bun.spawn(["bun", "run", CLI_PATH, "dev", "."], {
        cwd: tempDir,
        env: { ...process.env, PORT: "4005" }
      });

      let res;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500));
        try {
          res = await fetch("http://localhost:4005/non-existent-file.css");
          break;
        } catch (e) {
          // ignore ConnectionRefused
        }
      }

      try {
        expect(res?.status).toBe(404);
      } finally {
        devProc.kill();
      }
    }, 15000);
  });
});
