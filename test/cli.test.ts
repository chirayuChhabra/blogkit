import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { $ } from "bun";

const CLI_PATH = join(process.cwd(), "dist", "cli.js");

describe("CLI Deep Tests", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "mr-md-cli-test-"));
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  describe("init command", () => {
    test("Should respect --yes flag and use defaults", async () => {
      const { exitCode } = await $`bun run ${CLI_PATH} init -y`.cwd(tempDir);
      expect(exitCode).toBe(0);

      const pkg = JSON.parse(readFileSync(join(tempDir, "package.json"), "utf-8"));
      expect(pkg.name).toBe("my-md-project");
      
      const chapterPath = join(tempDir, "chapters", "01-first-chapter", "chapter.ts");
      expect(existsSync(chapterPath)).toBe(true);
      const chapterContent = readFileSync(chapterPath, "utf-8");
      expect(chapterContent).toContain("First Chapter");

      const lessonPath = join(tempDir, "chapters", "01-first-chapter", "lessons", "01-first-lesson", "lesson.ts");
      expect(existsSync(lessonPath)).toBe(true);
      const lessonContent = readFileSync(lessonPath, "utf-8");
      expect(lessonContent).toContain("First Lesson");

      const tsconfigPath = join(tempDir, "tsconfig.json");
      expect(existsSync(tsconfigPath)).toBe(true);
      const tsconfigContent = readFileSync(tsconfigPath, "utf-8");
      expect(tsconfigContent).toContain('"moduleResolution": "bundler"');
    });

    test("Should update existing package.json instead of overwriting", async () => {
      await writeFile(
        join(tempDir, "package.json"),
        JSON.stringify({ name: "existing-pkg", scripts: { test: "echo test" } })
      );

      const { exitCode } = await $`bun run ${CLI_PATH} init -y`.cwd(tempDir);
      expect(exitCode).toBe(0);

      const pkg = JSON.parse(readFileSync(join(tempDir, "package.json"), "utf-8"));
      expect(pkg.name).toBe("existing-pkg");
      expect(pkg.scripts.test).toBe("echo test");
      expect(pkg.scripts.build).toBeDefined();
    });
  });

  describe("generate command", () => {
    test("Should error on missing arguments", async () => {
      const { exitCode, stderr } = await $`bun run ${CLI_PATH} g`.cwd(tempDir).nothrow();
      expect(exitCode).not.toBe(0);
      expect(stderr.toString()).toContain("Usage: md g <ch|le|qu|chapter|lesson|quiz> <name>");
    });

    test("Should error on invalid type", async () => {
      const { exitCode, stderr } = await $`bun run ${CLI_PATH} g invalidtype myname`.cwd(tempDir).nothrow();
      expect(stderr.toString()).toContain("Unknown generator type: invalidtype");
      expect(existsSync(join(tempDir, "chapters"))).toBe(false);
    });

    describe("Chapter Generation", () => {
      test("Should generate chapter and auto-increment prefix", async () => {
        const { exitCode: code1 } = await $`bun run ${CLI_PATH} g ch physics`.cwd(tempDir);
        expect(code1).toBe(0);
        expect(existsSync(join(tempDir, "chapters", "01-physics", "chapter.ts"))).toBe(true);

        const { exitCode: code2 } = await $`bun run ${CLI_PATH} g ch math`.cwd(tempDir);
        expect(code2).toBe(0);
        expect(existsSync(join(tempDir, "chapters", "02-math", "chapter.ts"))).toBe(true);
      });

      test("Should sanitize chapter names", async () => {
        await $`bun run ${CLI_PATH} g ch "Hello World!!! @ 123"`.cwd(tempDir);
        expect(existsSync(join(tempDir, "chapters", "01-hello-world-123", "chapter.ts"))).toBe(true);
        const content = readFileSync(join(tempDir, "chapters", "01-hello-world-123", "chapter.ts"), "utf-8");
        expect(content).toContain("chapter(\"Hello World!!! @ 123\"");
      });
    });

    describe("Lesson Generation", () => {
      test("Should generate lesson and auto-import into chapter.ts", async () => {
        await $`bun run ${CLI_PATH} g ch science`.cwd(tempDir);
        const chapterDir = join(tempDir, "chapters", "01-science");

        const { exitCode, stdout } = await $`bun run ${CLI_PATH} g le intro`.cwd(chapterDir);
        expect(exitCode).toBe(0);

        const lessonTsPath = join(chapterDir, "lessons", "01-intro", "lesson.ts");
        expect(existsSync(lessonTsPath)).toBe(true);

        const chapterTsPath = join(chapterDir, "chapter.ts");
        const chapterContent = readFileSync(chapterTsPath, "utf-8");
        
        expect(chapterContent).toContain("import { introLesson } from \"./lessons/01-intro/lesson.js\"");
        expect(chapterContent).toContain("ctx.lesson(introLesson);");
        expect(stdout.toString()).toContain("Auto-imported introLesson into chapter.ts");
      });

      test("Should handle malformed chapter.ts gracefully", async () => {
        await $`bun run ${CLI_PATH} g ch art`.cwd(tempDir);
        const chapterDir = join(tempDir, "chapters", "01-art");
        
        writeFileSync(join(chapterDir, "chapter.ts"), "export const nothing = 1;");

        const { stdout, stderr } = await $`bun run ${CLI_PATH} g le colors`.cwd(chapterDir);
        expect(existsSync(join(chapterDir, "lessons", "01-colors", "lesson.ts"))).toBe(true);
        const out = stdout.toString() + stderr.toString();
        expect(out).toContain("Could not auto-import: could not find chapter() call.");
      });
    });

    describe("Quiz Generation", () => {
      test("Should generate quiz and auto-import into lesson.ts", async () => {
        await mkdir(join(tempDir, "lessons", "01-test"), { recursive: true });
        const lessonDir = join(tempDir, "lessons", "01-test");
        writeFileSync(join(lessonDir, "lesson.ts"), `import { lesson } from "mr-md";\nexport const testLesson = lesson("Test", { contentBase: import.meta.dir }, ctx => {\n});`);

        const { exitCode, stdout } = await $`bun run ${CLI_PATH} g qu my-quiz`.cwd(lessonDir);
        expect(exitCode).toBe(0);

        expect(existsSync(join(lessonDir, "quizzes", "my-quiz.json"))).toBe(true);
        
        const lessonContent = readFileSync(join(lessonDir, "lesson.ts"), "utf-8");
        expect(lessonContent).toContain('ctx.quiz("quizzes/my-quiz.json");');
        expect(stdout.toString()).toContain("Auto-added quiz to lesson.ts");
      });
    });
  });

  describe("dev command", () => {
    test("Should fall back to a different port if port 3080 is occupied", async () => {
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
