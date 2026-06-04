import * as fs from "fs";
import * as path from "path";
import { watch } from "fs";
import { exec } from "child_process";

declare const Bun: any;

export async function runDev(args: string[]) {
	const dir = args[0] || ".";
	const outDir = path.resolve(process.cwd(), dir, "out");
	
	console.log(`Starting dev server for directory: ${dir}`);

	const rebuild = () => {
		console.log("Rebuilding...");
		const entryPoints = ["chapter.ts", "index.ts", "lesson.ts"];
		for (const entry of entryPoints) {
			const entryPath = path.join(dir, entry);
			if (fs.existsSync(entryPath)) {
				exec(`bun ${entryPath}`, (err, stdout, stderr) => {
					if (err) console.error("Build failed:", stderr);
					else console.log("Build successful.");
				});
				return;
			}
		}
		console.log("No chapter.ts or lesson.ts found to build automatically.");
	};

	rebuild();

	if (fs.existsSync(dir)) {
		let timeout: NodeJS.Timeout;
		fs.watch(dir, { recursive: true }, (eventType, filename) => {
			if (!filename || filename.includes("out/") || filename.includes(".git/")) return;
			
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				console.log(`File changed: ${filename}`);
				rebuild();
			}, 200);
		});
		console.log(`Watching ${dir} for changes...`);
	}

	Bun.serve({
		port: 3000,
		fetch(req: any) {
			const url = new URL(req.url);
			let filePath = path.join(outDir, url.pathname);
			
			if (filePath.endsWith("/")) {
				filePath += "index.html";
			}

			if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
				return new Response(Bun.file(filePath));
			}

			const srcPath = path.join(process.cwd(), dir, url.pathname);
			if (fs.existsSync(srcPath) && fs.statSync(srcPath).isFile()) {
				return new Response(Bun.file(srcPath));
			}

			if (url.pathname === "/" || url.pathname.endsWith(".html")) {
				const files = fs.existsSync(outDir) ? fs.readdirSync(outDir) : [];
				const htmlFiles = files.filter(f => f.endsWith(".html"));
				if (htmlFiles.length > 0) {
					return new Response(Bun.file(path.join(outDir, htmlFiles[0])));
				}
			}

			return new Response("Not found", { status: 404 });
		},
	});

	console.log(`Dev server listening on http://localhost:3000`);
}
