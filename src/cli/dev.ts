import type { Server, ServerWebSocket } from "bun";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";

export async function runDev(args: string[]) {
	const dir = args[0] || ".";
	const outDir = path.resolve(process.cwd(), dir, "out");

	console.log(`Starting dev server for directory: ${dir}`);

	let server: Server<unknown>;

	const rebuild = () => {
		console.log("Rebuilding...");
		const entryPoints = ["chapter.ts", "index.ts", "lesson.ts"];
		for (const entry of entryPoints) {
			const entryPath = path.join(dir, entry);
			if (fs.existsSync(entryPath)) {
				exec(
					`NODE_ENV=development bun ${entryPath}`,
					(err, _stdout, stderr) => {
						if (err) console.error("Build failed:", stderr);
						else {
							console.log("Build successful.");
							server?.publish("livereload", "reload");
						}
					},
				);
				return;
			}
		}
		console.log("No chapter.ts or lesson.ts found to build automatically.");
	};

	rebuild();

	if (fs.existsSync(dir)) {
		let timeout: NodeJS.Timeout;
		fs.watch(dir, { recursive: true }, (_eventType, filename) => {
			if (!filename || filename.includes("out/") || filename.includes(".git/"))
				return;

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
		async fetch(req: Request, srv: Server<unknown>) {
			if (srv.upgrade(req, { data: "livereload" })) return new Response(null);

			const url = new URL(req.url);
			let filePath = path.join(outDir, url.pathname);

			if (filePath.endsWith("/")) {
				const files = fs.existsSync(outDir) ? fs.readdirSync(outDir) : [];
				const htmlFiles = files.filter((f) => f.endsWith(".html"));
				if (htmlFiles.includes("index.html")) {
					filePath = path.join(outDir, "index.html");
				} else {
					const chapterFile = htmlFiles.find((f) => f.includes("chapter"));
					if (chapterFile) {
						filePath = path.join(outDir, chapterFile);
					} else if (htmlFiles.length > 0) {
						filePath = path.join(outDir, htmlFiles[0]);
					} else {
						filePath += "index.html";
					}
				}
			}

			if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
				if (filePath.endsWith(".html")) {
					const file = Bun.file(filePath);
					let text = await file.text();
					text = text.replace(
						"</body>",
						`<script>
						const ws = new WebSocket("ws://localhost:3000/");
						ws.onmessage = (e) => { if (e.data === "reload") location.reload(); };
					</script></body>`,
					);
					return new Response(text, {
						headers: { "Content-Type": "text/html" },
					});
				}
				return new Response(Bun.file(filePath));
			}

			const srcPath = path.join(process.cwd(), dir, url.pathname);
			if (fs.existsSync(srcPath) && fs.statSync(srcPath).isFile()) {
				return new Response(Bun.file(srcPath));
			}

			return new Response("Not found", { status: 404 });
		},
		websocket: {
			message() {},
			open(ws: ServerWebSocket<unknown>) {
				ws.subscribe("livereload");
			},
		},
	});

	console.log(`Dev server listening on http://localhost:3000`);
}
