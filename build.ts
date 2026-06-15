import { rmSync, cpSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

console.log("Building SDK...");
if (existsSync("dist")) {
  rmSync("dist", { recursive: true, force: true });
}
mkdirSync("dist");
await $`bunx tsc`;
cpSync("src/styles", "dist/styles", { recursive: true });
cpSync("src/client", "dist/client", { recursive: true });
console.log("Build complete.");
