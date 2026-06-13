import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

declare const Bun: any;

export async function runDev(args: string[]) {
	const dir = args[0] || ".";
	const outDir = path.resolve(process.cwd(), dir, "out");
	
	console.log(`Starting dev server for directory: ${dir}`);

	let server: any;

	const rebuild = () => {
		console.log("Rebuilding...");
		const entryPoints = ["chapter.ts", "index.ts", "lesson.ts"];
		for (const entry of entryPoints) {
			const entryPath = path.join(dir, entry);
			if (fs.existsSync(entryPath)) {
				exec(`NODE_ENV=development bun "${entryPath}"`, (err, stdout, stderr) => {
					if (err) console.error("Build failed:", stderr);
					else {
						console.log("Build successful.");
						server?.publish("livereload", "reload");
					}
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

	server = Bun.serve({
		port: 3000,
		async fetch(req: any, srv: any) {
			if (srv.upgrade(req)) return;

			const url = new URL(req.url);
			const decodedPath = decodeURIComponent(url.pathname);
			let filePath = path.resolve(outDir, "." + decodedPath);
			
			if (filePath.endsWith(path.sep)) {
				const files = fs.existsSync(outDir) ? fs.readdirSync(outDir) : [];
				const htmlFiles = files.filter(f => f.endsWith(".html"));
				if (htmlFiles.includes("index.html")) {
					filePath = path.join(outDir, "index.html");
				} else {
					const chapterFile = htmlFiles.find(f => f.includes("chapter"));
					if (chapterFile) {
						filePath = path.join(outDir, chapterFile);
					} else if (htmlFiles.length > 0) {
						filePath = path.join(outDir, htmlFiles[0]);
					} else {
						filePath = path.join(outDir, "index.html");
					}
				}
			}

			if (!filePath.startsWith(outDir + path.sep) && filePath !== outDir) {
				return new Response("Forbidden", { status: 403 });
			}

			if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
				if (filePath.endsWith(".html")) {
					const file = Bun.file(filePath);
					let text = await file.text();
					const lastBodyIndex = text.lastIndexOf("</body>");
					if (lastBodyIndex !== -1) {
						text = text.slice(0, lastBodyIndex) + `<script>
						const ws = new WebSocket("ws://localhost:3000/");
						ws.onmessage = (e) => { if (e.data === "reload") location.reload(); };
					</script></body>` + text.slice(lastBodyIndex + 7);
					}
					return new Response(text, { headers: { "Content-Type": "text/html" } });
				}
				return new Response(Bun.file(filePath));
			}

			const baseDir = path.resolve(process.cwd(), dir);
			const srcPath = path.resolve(baseDir, "." + decodedPath);
			if (srcPath.startsWith(baseDir + path.sep) && fs.existsSync(srcPath) && fs.statSync(srcPath).isFile()) {
				return new Response(Bun.file(srcPath));
			}

			return new Response("Not found", { status: 404 });
		},
		websocket: {
			message() {},
			open(ws: any) { ws.subscribe("livereload"); }
		}
	});

	console.log(`Dev server listening on http://localhost:3000`);
}
